"""POST /api/v1/briefs — accept a brief and kick off the orchestrator."""

from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks

from nucleus.events import publish_event
from nucleus.models import BriefRequest, BriefResponse, Job, JobState
from nucleus.orchestrator.loop import run_job
from nucleus.orchestrator.planner import expand_brief
from nucleus.store import get_job, save_candidate, save_job

router = APIRouter(prefix="/api/v1", tags=["briefs"])


@router.post("/briefs", response_model=BriefResponse)
async def create_brief(
    brief: BriefRequest,
    background_tasks: BackgroundTasks,
) -> BriefResponse:
    # 1. Create job
    job = Job(brief=brief)
    await save_job(job)

    # 2. Plan: expand brief into candidates
    job.state = JobState.PLANNING
    await save_job(job)
    await publish_event(job.id, "job.planning", {"job_id": job.id})

    candidates = expand_brief(brief, job.id)
    candidate_ids: list[str] = []
    for c in candidates:
        await save_candidate(c)
        candidate_ids.append(c.id)

    # 3. Kick off the orchestrator in the background
    background_tasks.add_task(
        _run_job_async, job.id, candidate_ids,
    )

    return BriefResponse(
        job_id=job.id,
        websocket_url=f"ws://localhost:8000/ws/jobs/{job.id}",
        candidate_count=len(candidates),
    )


async def _run_job_async(job_id: str, candidate_ids: list[str]) -> None:
    await run_job(job_id, candidate_ids, mock=True)
    job = await get_job(job_id)
    job.state = JobState.COMPLETE
    await save_job(job)
    await publish_event(job_id, "job.complete", {"job_id": job_id})
