"""REST endpoints for archetype-graph campaigns.

A *campaign* is the UI-facing artefact: an archetype graph built in the canvas
plus a brand name and an optional brief. Executing a campaign synthesises a
``BriefRequest`` from the graph's ``brand_kb`` / ``icp`` / ``archetype`` nodes
and hands it off to the existing Celery worker.
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from nucleus.events import publish_event
from nucleus.tools.schemas import ChatRequest, ChatResponse
from nucleus.models import (
    BriefRequest,
    Campaign,
    CampaignCreate,
    CampaignExecuteResponse,
    CampaignReport,
    CampaignUpdate,
    Job,
    JobState,
)
from nucleus.orchestrator.finalize import finalize_campaign
from nucleus.orchestrator.planner import expand_brief
from nucleus.orchestrator.suggestions import resolve_suggestion
from nucleus.store import (
    delete_campaign,
    get_campaign,
    list_campaigns,
    list_candidates_for_job,
    list_iterations,
    mark_campaign_executed,
    save_campaign,
    save_candidate,
    save_job,
    update_campaign,
)
from nucleus.worker import run_job_task

router = APIRouter(prefix="/api/v1", tags=["campaigns"])


# ---------------------------------------------------------------------------
# Graph -> Brief synthesis
# ---------------------------------------------------------------------------

def _collect_nodes(graph: dict[str, Any], node_type: str) -> list[dict[str, Any]]:
    nodes = graph.get("nodes") or []
    return [n for n in nodes if isinstance(n, dict) and n.get("type") == node_type]


def _node_value(node: dict[str, Any], *keys: str, default: str = "") -> str:
    data = node.get("data") or {}
    for key in keys:
        if key in data and data[key]:
            return str(data[key])
        if key in node and node[key]:
            return str(node[key])
    return default


def _brief_from_campaign(campaign: Campaign) -> BriefRequest:
    graph = campaign.graph or {}
    brief_overrides = campaign.brief or {}

    brand_nodes = _collect_nodes(graph, "brand_kb")
    icp_nodes = _collect_nodes(graph, "icp")
    archetype_nodes = _collect_nodes(graph, "archetype")

    brand_id = (
        brief_overrides.get("brand_id")
        or (_node_value(brand_nodes[0], "brand_id", "name") if brand_nodes else None)
        or campaign.brand_name
    )
    source_url = (
        brief_overrides.get("source_url")
        or (_node_value(brand_nodes[0], "source_url", "url") if brand_nodes else "")
        or "s3://nucleus/placeholder.mp4"
    )

    icps = brief_overrides.get("icps") or [
        _node_value(n, "icp", "name", "label", default="general") for n in icp_nodes
    ]
    if not icps:
        icps = ["general"]

    archetypes = brief_overrides.get("archetypes") or [
        _node_value(n, "archetype", "name", "label", default=campaign.archetype)
        for n in archetype_nodes
    ]
    if not archetypes:
        archetypes = [campaign.archetype]

    return BriefRequest(
        brand_id=str(brand_id),
        source_url=str(source_url),
        icps=icps,
        languages=list(brief_overrides.get("languages") or ["en"]),
        platforms=list(brief_overrides.get("platforms") or ["tiktok"]),
        archetypes=archetypes,
        variants_per_cell=int(brief_overrides.get("variants_per_cell") or 1),
        score_threshold=float(brief_overrides.get("score_threshold") or 60.0),
        max_iterations=int(brief_overrides.get("max_iterations") or 5),
        cost_ceiling=brief_overrides.get("cost_ceiling"),
    )


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

@router.post("/campaigns", response_model=Campaign, status_code=201)
async def create_campaign(body: CampaignCreate) -> Campaign:
    campaign = Campaign(
        archetype=body.archetype,
        brand_name=body.brand_name,
        graph=body.graph,
        brief=body.brief,
    )
    return await save_campaign(campaign)


@router.get("/campaigns", response_model=list[Campaign])
async def list_all_campaigns() -> list[Campaign]:
    return await list_campaigns()


@router.get("/campaigns/{campaign_id}", response_model=Campaign)
async def read_campaign(campaign_id: str) -> Campaign:
    try:
        return await get_campaign(campaign_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Campaign not found")


@router.patch("/campaigns/{campaign_id}", response_model=Campaign)
async def patch_campaign(campaign_id: str, body: CampaignUpdate) -> Campaign:
    patch = body.model_dump(exclude_unset=True)
    try:
        return await update_campaign(campaign_id, patch)
    except KeyError:
        raise HTTPException(status_code=404, detail="Campaign not found")


@router.delete("/campaigns/{campaign_id}", status_code=204)
async def remove_campaign(campaign_id: str) -> None:
    removed = await delete_campaign(campaign_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Campaign not found")


# ---------------------------------------------------------------------------
# Execution + reports
# ---------------------------------------------------------------------------

@router.post("/campaigns/{campaign_id}/execute", response_model=CampaignExecuteResponse)
async def execute_campaign(campaign_id: str) -> CampaignExecuteResponse:
    try:
        campaign = await get_campaign(campaign_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Campaign not found")

    brief = _brief_from_campaign(campaign)
    job = Job(brief=brief, state=JobState.PLANNING)
    await save_job(job)
    await publish_event(job.id, "job.planning", {"job_id": job.id})

    candidates = expand_brief(brief, job.id)
    for c in candidates:
        await save_candidate(c)

    job.state = JobState.BRIEFED
    await save_job(job)
    await publish_event(job.id, "job.queued", {"job_id": job.id, "campaign_id": campaign.id})

    await mark_campaign_executed(campaign.id, job.id)

    # In eager mode (local dev/smoke), .delay() blocks the request and every
    # event fires before a WS client can subscribe. Defer execution so the
    # HTTP response returns first and the UI has time to connect.
    import os
    if os.getenv("NUCLEUS_EAGER_TASKS", "").strip().lower() in ("1", "true", "yes"):
        import asyncio
        async def _deferred() -> None:
            # Small delay lets the caller connect the WS before events fire.
            await asyncio.sleep(0.5)
            await _run_and_finalize(job.id, campaign.id)
        asyncio.create_task(_deferred())
    else:
        run_job_task.delay(job.id)

    return CampaignExecuteResponse(job_id=job.id, websocket_url=f"/ws/job/{job.id}")


async def _run_and_finalize(job_id: str, campaign_id: str) -> None:
    """Eager-mode driver: run the orchestrator, then generate deliverables.

    Thin wrapper around :func:`run_job` + :func:`finalize_campaign` so both
    the eager and Celery paths produce deliverables. The standalone
    ``finalize_campaign`` lives in ``nucleus.orchestrator.finalize``.
    """
    import os
    from nucleus.orchestrator.loop import run_job

    mock = os.getenv("NUCLEUS_MOCK_PROVIDERS", "").lower() in ("1", "true", "yes")
    candidates = await list_candidates_for_job(job_id)
    candidate_ids = [c.id for c in candidates]
    await publish_event(job_id, "job.started", {"candidate_count": len(candidate_ids)})
    try:
        await run_job(job_id, candidate_ids, mock=mock)
    except Exception as exc:  # noqa: BLE001
        await publish_event(job_id, "job.failed", {"error": str(exc)})
        return

    await finalize_campaign(job_id, campaign_id)
    await publish_event(job_id, "job.complete", {"job_id": job_id})


@router.post("/campaigns/{campaign_id}/chat", response_model=ChatResponse)
async def send_chat(campaign_id: str, req: ChatRequest) -> ChatResponse:
    """User sends a message -> forwarded to Ruflo. Ruflo replies via event bus."""
    content = req.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="content must not be empty")

    try:
        campaign = await get_campaign(campaign_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Campaign not found")

    message = {
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    brief = dict(campaign.brief or {})
    history = list(brief.get("chat_history") or [])
    history.append(message)
    brief["chat_history"] = history
    await update_campaign(campaign_id, {"brief": brief})

    await publish_event(
        campaign_id,
        "chat.user_message",
        {"campaign_id": campaign_id, "message": message},
    )
    return ChatResponse(status="queued")


class SuggestionRejectBody(BaseModel):
    feedback: str | None = None


@router.post("/campaigns/{campaign_id}/suggestions/{suggestion_id}/approve")
async def approve_suggestion(campaign_id: str, suggestion_id: str) -> dict[str, str]:
    """Approve a pending ``canvas.node_suggested`` proposal.

    Publishes ``canvas.node_approved`` so the Ruflo bridge (subscribed via
    the event bus) commits the node and the orchestrator can resume.
    """
    handle = await resolve_suggestion(suggestion_id, approved=True)
    if handle is None:
        # Not yet registered — still publish so a late-arriving subscriber
        # can react, but flag it for the caller.
        await publish_event(campaign_id, "canvas.node_approved", {
            "campaign_id": campaign_id,
            "suggestion_id": suggestion_id,
            "status": "approved",
            "note": "no_pending_handle",
        })
        return {"status": "approved", "suggestion_id": suggestion_id, "known": "false"}
    await publish_event(campaign_id, "canvas.node_approved", {
        "campaign_id": campaign_id,
        "suggestion_id": suggestion_id,
        "status": "approved",
    })
    return {"status": "approved", "suggestion_id": suggestion_id, "known": "true"}


@router.post("/campaigns/{campaign_id}/suggestions/{suggestion_id}/reject")
async def reject_suggestion(
    campaign_id: str,
    suggestion_id: str,
    body: SuggestionRejectBody | None = None,
) -> dict[str, str]:
    """Reject a pending suggestion; Ruflo will pick a different proposal."""
    feedback = body.feedback if body else None
    handle = await resolve_suggestion(
        suggestion_id, approved=False, feedback=feedback
    )
    payload: dict[str, Any] = {
        "campaign_id": campaign_id,
        "suggestion_id": suggestion_id,
        "status": "rejected",
    }
    if feedback:
        payload["feedback"] = feedback
    if handle is None:
        payload["note"] = "no_pending_handle"
    await publish_event(campaign_id, "canvas.node_rejected", payload)
    return {"status": "rejected", "suggestion_id": suggestion_id,
            "known": "true" if handle is not None else "false"}


@router.get("/campaigns/{campaign_id}/reports", response_model=list[CampaignReport])
async def campaign_reports(campaign_id: str) -> list[CampaignReport]:
    try:
        campaign = await get_campaign(campaign_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if not campaign.last_job_id:
        return []

    reports: list[CampaignReport] = []
    for candidate in await list_candidates_for_job(campaign.last_job_id):
        for iteration in await list_iterations(candidate.id):
            analysis = iteration.analysis_result
            if not analysis:
                continue
            reports.append(
                CampaignReport(
                    iteration_id=iteration.id,
                    candidate_id=candidate.id,
                    iteration_index=iteration.index,
                    analysis_result=analysis,
                )
            )
    return reports
