"""POST /api/v1/briefs — accept a brief and enqueue orchestrator work."""

from __future__ import annotations

from fastapi import APIRouter

from nucleus.events import publish_event
from nucleus.models import BriefRequest, BriefResponse, Job, JobState
from nucleus.orchestrator.planner import expand_brief
from nucleus.store import save_candidate, save_job
from nucleus.worker import run_job_task

router = APIRouter(prefix="/api/v1", tags=["briefs"])


@router.post("/briefs", response_model=BriefResponse)
async def create_brief(brief: BriefRequest) -> BriefResponse:
    job = Job(brief=brief, state=JobState.PLANNING)
    await save_job(job)
    await publish_event(job.id, "job.planning", {"job_id": job.id})

    candidates = expand_brief(brief, job.id)
    for c in candidates:
        await save_candidate(c)

    # Hand off to the Celery worker so the HTTP response returns immediately;
    # the client follows progress over the WebSocket.
    job.state = JobState.BRIEFED
    await save_job(job)
    await publish_event(job.id, "job.queued", {"job_id": job.id})
    run_job_task.delay(job.id)

    return BriefResponse(
        job_id=job.id,
        websocket_url=f"/ws/job/{job.id}",
        candidate_count=len(candidates),
    )
