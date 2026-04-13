"""REST endpoints for archetype-graph campaigns.

A *campaign* is the UI-facing artefact: an archetype graph built in the canvas
plus a brand name and an optional brief. Executing a campaign synthesises a
``BriefRequest`` from the graph's ``brand_kb`` / ``icp`` / ``archetype`` nodes
and hands it off to the existing Celery worker.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from nucleus.events import publish_event
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
from nucleus.orchestrator.planner import expand_brief
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
    run_job_task.delay(job.id)

    return CampaignExecuteResponse(job_id=job.id, websocket_url=f"/ws/job/{job.id}")


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
