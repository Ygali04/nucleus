"""Post-run finalization — drive the strategist to emit GTM + SOP.

Runs after :func:`nucleus.orchestrator.loop.run_job` completes for a
campaign. Collects best iterations per candidate, hands them off to the
strategist tools, and persists the resulting deliverables on the
Campaign row.

Used by both the eager (HTTP) and Celery-worker execution paths so the
strategist fires regardless of how the campaign was launched.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from nucleus.events import publish_event
from nucleus.models import CampaignDeliverables
from nucleus.store import (
    get_campaign,
    list_candidates_for_job,
    list_iterations,
    update_campaign,
)
from nucleus.tools.generate_gtm_strategy import generate_gtm_strategy
from nucleus.tools.generate_sop import generate_sop
from nucleus.tools.schemas import (
    GenerateGtmStrategyRequest,
    GenerateSopRequest,
    StrategyVariant,
)

logger = logging.getLogger(__name__)


async def finalize_campaign(job_id: str, campaign_id: str) -> None:
    """Collect variants, run the strategist, persist deliverables.

    Idempotent-ish: re-running for the same campaign overwrites the
    previously-persisted deliverables.
    """
    candidates = await list_candidates_for_job(job_id)

    variants: list[StrategyVariant] = []
    iterations_log: list[dict[str, Any]] = []
    for cand in candidates:
        iters = await list_iterations(cand.id)
        if not iters:
            continue
        best = max(
            iters,
            key=lambda it: (it.score.neural_score if it.score else 0.0),
        )
        if best.score is None:
            continue
        variants.append(StrategyVariant(
            video_url=best.video_url,
            score=best.score.neural_score,
            report=best.analysis_result or {},
            cost_usd=sum(it.cost for it in iters),
            iteration_count=len(iters),
            icp=cand.icp,
            platform=cand.platform,
            archetype=cand.archetype,
            language=cand.language,
        ))
        iterations_log.append({
            "candidate_id": cand.id,
            "icp": cand.icp,
            "platform": cand.platform,
            "iterations": len(iters),
            "best_score": best.score.neural_score,
        })

    try:
        campaign = await get_campaign(campaign_id)
    except KeyError:
        logger.warning("finalize_campaign: campaign %s missing", campaign_id)
        return

    brand_name = campaign.brand_name
    brand_kb = (campaign.brief or {}).get("brand_kb") or {"name": brand_name}
    icp = (campaign.brief or {}).get("icp") or {}

    try:
        gtm = await generate_gtm_strategy(GenerateGtmStrategyRequest(
            campaign_id=campaign_id,
            variants=variants,
            brand_name=brand_name,
        ))
        sop = await generate_sop(GenerateSopRequest(
            campaign_id=campaign_id,
            variants=variants,
            brand_kb=brand_kb,
            icp=icp,
            iterations_log=iterations_log,
            brand_name=brand_name,
        ))
        deliverables = CampaignDeliverables(
            gtm_guide=gtm.gtm_guide,
            sop_doc=sop.sop_doc,
            strategy_summary=gtm.strategy_summary,
            generated_at=datetime.now(timezone.utc),
        )
        await update_campaign(campaign_id, {
            "status": "complete",
            "deliverables": deliverables,
        })
        await publish_event(job_id, "campaign.delivered", {
            "campaign_id": campaign_id,
            "variants": len(variants),
            "summary": gtm.strategy_summary[:200],
        })
    except Exception as exc:  # noqa: BLE001
        logger.exception("strategist failed for campaign %s", campaign_id)
        await publish_event(job_id, "strategist.failed", {"error": str(exc)})


async def get_campaign_by_last_job_id(job_id: str) -> str | None:
    """Resolve the campaign_id for a job_id by scanning campaigns.

    Uses ``mark_campaign_executed`` which stamps ``last_job_id`` on the
    campaign row before the worker fires, so a plain list scan is enough.
    """
    from nucleus.store import list_campaigns

    for c in await list_campaigns():
        if c.last_job_id == job_id:
            return c.id
    return None


__all__ = ["finalize_campaign", "get_campaign_by_last_job_id"]
