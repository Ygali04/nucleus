"""In-memory store for jobs, candidates, and iterations.

Swap for Postgres in production. The interface is intentionally async so
the production version can use asyncpg without changing call sites.
"""

from __future__ import annotations

from nucleus.models import CandidateSpec, Iteration, Job, ScoreBreakdown

# ---------------------------------------------------------------------------
# In-memory tables
# ---------------------------------------------------------------------------

_jobs: dict[str, Job] = {}
_candidates: dict[str, CandidateSpec] = {}
_iterations: dict[str, list[Iteration]] = {}  # candidate_id -> [Iteration]
_iteration_index: dict[str, Iteration] = {}  # iteration_id -> Iteration


def reset() -> None:
    """Clear all tables (useful for tests)."""
    _jobs.clear()
    _candidates.clear()
    _iterations.clear()
    _iteration_index.clear()


# ---------------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------------

async def save_job(job: Job) -> Job:
    _jobs[job.id] = job
    return job


async def get_job(job_id: str) -> Job:
    return _jobs[job_id]


# ---------------------------------------------------------------------------
# Candidates
# ---------------------------------------------------------------------------

async def save_candidate(c: CandidateSpec) -> CandidateSpec:
    _candidates[c.id] = c
    return c


async def get_candidate(candidate_id: str) -> CandidateSpec:
    return _candidates[candidate_id]


async def list_candidates_for_job(job_id: str) -> list[CandidateSpec]:
    return [c for c in _candidates.values() if c.job_id == job_id]


# ---------------------------------------------------------------------------
# Iterations
# ---------------------------------------------------------------------------

async def create_iteration(candidate_id: str, index: int, video_url: str) -> Iteration:
    it = Iteration(candidate_id=candidate_id, index=index, video_url=video_url)
    _iterations.setdefault(candidate_id, []).append(it)
    _iteration_index[it.id] = it
    return it


async def update_iteration_score(iteration_id: str, score: ScoreBreakdown) -> None:
    it = _iteration_index.get(iteration_id)
    if it is not None:
        it.score = score


async def list_iterations(candidate_id: str) -> list[Iteration]:
    return _iterations.get(candidate_id, [])
