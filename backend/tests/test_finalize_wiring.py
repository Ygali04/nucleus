"""Verify finalize_campaign runs on both eager and Celery execution paths.

Historically the strategist only ran on the eager (in-process) path —
the Celery worker task just marked the job complete. This test locks in
the fix: `_run_job_async` resolves the campaign by last_job_id and
invokes `finalize_campaign` too.
"""

from __future__ import annotations

import random

import pytest

from nucleus import events, store
from nucleus.models import Campaign, Job, BriefRequest
from nucleus.orchestrator.finalize import (
    finalize_campaign,
    get_campaign_by_last_job_id,
)
from nucleus.orchestrator.planner import expand_brief
from nucleus.store import (
    mark_campaign_executed,
    save_campaign,
    save_candidate,
    save_job,
)


@pytest.fixture(autouse=True)
def _reset_state(monkeypatch):
    store.reset()
    events.reset()
    random.seed(7)
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")
    monkeypatch.setenv("NUCLEUS_NO_REDIS", "1")
    yield
    store.reset()
    events.reset()


def _graph(brand_name: str) -> dict:
    return {
        "nodes": [
            {"id": "brand", "type": "brand_kb", "data": {"name": brand_name}},
            {"id": "icp", "type": "icp", "data": {"name": "founder"}},
            {"id": "arch", "type": "archetype", "data": {"name": "testimonial"}},
        ],
        "edges": [],
    }


async def _seed_campaign_and_run(job_id_stamp: bool) -> tuple[str, str]:
    """Create a campaign, run its loop via the mock orchestrator.

    If ``job_id_stamp`` is True, we use ``mark_campaign_executed`` so
    ``get_campaign_by_last_job_id`` resolves (simulating the Celery path).
    """
    campaign = Campaign(
        archetype="marketing",
        brand_name="Finalize Co",
        graph=_graph("Finalize Co"),
        brief={},
    )
    saved = await save_campaign(campaign)

    brief = BriefRequest(
        brand_id="Finalize Co",
        source_url="s3://x/y.mp4",
        icps=["founder"],
        languages=["en"],
        platforms=["tiktok"],
        archetypes=["testimonial"],
        variants_per_cell=1,
        score_threshold=40.0,
        max_iterations=2,
    )
    job = Job(brief=brief)
    await save_job(job)

    candidates = expand_brief(brief, job.id)
    for c in candidates:
        await save_candidate(c)

    from nucleus.orchestrator.loop import run_job
    candidate_ids = [c.id for c in candidates]
    await run_job(job.id, candidate_ids, mock=True)

    if job_id_stamp:
        await mark_campaign_executed(saved.id, job.id)

    return saved.id, job.id


class TestFinalizeWiring:
    @pytest.mark.asyncio
    async def test_finalize_persists_deliverables_directly(self):
        campaign_id, job_id = await _seed_campaign_and_run(job_id_stamp=False)

        await finalize_campaign(job_id, campaign_id)

        refreshed = await store.get_campaign(campaign_id)
        assert refreshed.deliverables is not None
        assert refreshed.deliverables.gtm_guide
        assert refreshed.deliverables.sop_doc
        assert refreshed.status == "complete"

    @pytest.mark.asyncio
    async def test_celery_path_resolves_campaign_by_last_job_id(self):
        campaign_id, job_id = await _seed_campaign_and_run(job_id_stamp=True)

        resolved = await get_campaign_by_last_job_id(job_id)
        assert resolved == campaign_id

        # Simulating the worker: call finalize via the resolver.
        await finalize_campaign(job_id, resolved)

        refreshed = await store.get_campaign(campaign_id)
        assert refreshed.deliverables is not None

    @pytest.mark.asyncio
    async def test_celery_worker_task_finalizes(self):
        """_run_job_async in the worker must call finalize_campaign."""
        campaign = Campaign(
            archetype="marketing",
            brand_name="WorkerCo",
            graph=_graph("WorkerCo"),
            brief={},
        )
        saved = await save_campaign(campaign)

        brief = BriefRequest(
            brand_id="WorkerCo",
            source_url="s3://w/in.mp4",
            icps=["founder"],
            languages=["en"],
            platforms=["tiktok"],
            archetypes=["testimonial"],
            variants_per_cell=1,
            score_threshold=40.0,
            max_iterations=2,
        )
        job = Job(brief=brief)
        await save_job(job)
        for c in expand_brief(brief, job.id):
            await save_candidate(c)

        # Stamp before firing the worker (mirrors what routes/campaigns.py does).
        await mark_campaign_executed(saved.id, job.id)

        from nucleus.worker.tasks import _run_job_async
        await _run_job_async(job.id)

        refreshed = await store.get_campaign(saved.id)
        assert refreshed.deliverables is not None
        assert refreshed.status == "complete"
