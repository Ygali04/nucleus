"""GET endpoints for candidate status and iteration history."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from nucleus.models import CandidateStatus, IterationDetail
from nucleus.store import get_candidate, list_candidates_for_job, list_iterations

router = APIRouter(prefix="/api/v1", tags=["candidates"])


@router.get("/jobs/{job_id}/candidates", response_model=list[CandidateStatus])
async def get_job_candidates(job_id: str) -> list[CandidateStatus]:
    candidates = await list_candidates_for_job(job_id)
    if not candidates:
        raise HTTPException(status_code=404, detail="Job not found or no candidates")
    result: list[CandidateStatus] = []
    for c in candidates:
        iters = await list_iterations(c.id)
        latest_score = None
        if iters:
            scored = [it for it in iters if it.score is not None]
            if scored:
                latest_score = scored[-1].score.neural_score
        result.append(
            CandidateStatus(
                candidate_id=c.id,
                state=c.state.value,
                current_score=latest_score,
                iteration_count=len(iters),
                icp=c.icp,
                language=c.language,
                platform=c.platform,
                archetype=c.archetype,
            )
        )
    return result


@router.get("/candidates/{candidate_id}/iterations", response_model=list[IterationDetail])
async def get_candidate_iterations(candidate_id: str) -> list[IterationDetail]:
    try:
        await get_candidate(candidate_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Candidate not found")
    iters = await list_iterations(candidate_id)
    return [
        IterationDetail(
            iteration_index=it.index,
            video_url=it.video_url,
            score=it.score,
            edit_type=it.edit_type.value if it.edit_type else None,
        )
        for it in iters
    ]
