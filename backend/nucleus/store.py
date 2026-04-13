"""Postgres-backed store for jobs, candidates, iterations, and scores.

The public interface (a collection of ``async`` free functions) is unchanged
from the previous in-memory implementation — routes and the orchestrator see
Pydantic models on both sides, and the ORM lives entirely inside this module.
"""

from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from nucleus.db import (
    AsyncSessionLocal,
    CandidateRow,
    EventRow,
    IterationRow,
    JobRow,
    ScoreRow,
)
from nucleus.models import (
    BriefRequest,
    CandidateSpec,
    EditType,
    Iteration,
    Job,
    JobState,
    ScoreBreakdown,
)


# ---------------------------------------------------------------------------
# Row <-> Pydantic conversion
# ---------------------------------------------------------------------------

def _job_to_row(job: Job) -> dict:
    b = job.brief
    return dict(
        id=job.id,
        state=job.state.value,
        brand_id=b.brand_id,
        source_url=b.source_url,
        icps=list(b.icps),
        languages=list(b.languages),
        platforms=list(b.platforms),
        archetypes=list(b.archetypes),
        variants_per_cell=b.variants_per_cell,
        score_threshold=b.score_threshold,
        max_iterations=b.max_iterations,
        cost_ceiling=b.cost_ceiling,
    )


def _row_to_job(row: JobRow) -> Job:
    brief = BriefRequest(
        brand_id=row.brand_id,
        source_url=row.source_url,
        icps=list(row.icps),
        languages=list(row.languages),
        platforms=list(row.platforms),
        archetypes=list(row.archetypes),
        variants_per_cell=row.variants_per_cell,
        score_threshold=row.score_threshold,
        max_iterations=row.max_iterations,
        cost_ceiling=row.cost_ceiling,
    )
    return Job(
        id=row.id,
        state=JobState(row.state),
        brief=brief,
        created_at=row.created_at,
    )


def _candidate_to_row(c: CandidateSpec) -> dict:
    return dict(
        id=c.id,
        job_id=c.job_id,
        icp=c.icp,
        language=c.language,
        platform=c.platform,
        archetype=c.archetype,
        variant_index=c.variant_index,
        score_threshold=c.score_threshold,
        max_iterations=c.max_iterations,
        cost_ceiling=c.cost_ceiling,
        state=c.state.value,
        source_url=c.source_url,
    )


def _row_to_candidate(row: CandidateRow) -> CandidateSpec:
    return CandidateSpec(
        id=row.id,
        job_id=row.job_id,
        icp=row.icp,
        language=row.language,
        platform=row.platform,
        archetype=row.archetype,
        variant_index=row.variant_index,
        score_threshold=row.score_threshold,
        max_iterations=row.max_iterations,
        cost_ceiling=row.cost_ceiling,
        state=JobState(row.state),
        source_url=row.source_url,
    )


def _score_to_dict(score: ScoreBreakdown) -> dict:
    return dict(
        neural_score=score.neural_score,
        hook_score=score.hook_score,
        sustained_attention=score.sustained_attention,
        emotional_resonance=score.emotional_resonance,
        cognitive_accessibility=score.cognitive_accessibility,
        memory_encoding=score.memory_encoding,
        aesthetic_quality=score.aesthetic_quality,
        attention_curve=list(score.attention_curve),
    )


def _row_to_score(row: ScoreRow | None) -> ScoreBreakdown | None:
    if row is None:
        return None
    return ScoreBreakdown(
        neural_score=row.neural_score,
        hook_score=row.hook_score,
        sustained_attention=row.sustained_attention,
        emotional_resonance=row.emotional_resonance,
        cognitive_accessibility=row.cognitive_accessibility,
        memory_encoding=row.memory_encoding,
        aesthetic_quality=row.aesthetic_quality,
        attention_curve=list(row.attention_curve or []),
    )


def _row_to_iteration(row: IterationRow) -> Iteration:
    return Iteration(
        id=row.id,
        candidate_id=row.candidate_id,
        index=row.index,
        video_url=row.video_url,
        score=_row_to_score(row.score),
        edit_type=EditType(row.edit_type) if row.edit_type else None,
        cost=row.cost,
    )


# ---------------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------------

async def save_job(job: Job) -> Job:
    """Upsert a job row (keyed by ``job.id``)."""
    async with AsyncSessionLocal() as session:
        await session.merge(JobRow(**_job_to_row(job)))
        await session.commit()
    return job


async def get_job(job_id: str) -> Job:
    async with AsyncSessionLocal() as session:
        row = await session.get(JobRow, job_id)
        if row is None:
            raise KeyError(job_id)
        return _row_to_job(row)


# ---------------------------------------------------------------------------
# Candidates
# ---------------------------------------------------------------------------

async def save_candidate(c: CandidateSpec) -> CandidateSpec:
    """Upsert a candidate row (keyed by ``c.id``)."""
    async with AsyncSessionLocal() as session:
        await session.merge(CandidateRow(**_candidate_to_row(c)))
        await session.commit()
    return c


async def get_candidate(candidate_id: str) -> CandidateSpec:
    async with AsyncSessionLocal() as session:
        row = await session.get(CandidateRow, candidate_id)
        if row is None:
            raise KeyError(candidate_id)
        return _row_to_candidate(row)


async def list_candidates_for_job(job_id: str) -> list[CandidateSpec]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(CandidateRow)
            .where(CandidateRow.job_id == job_id)
            .order_by(CandidateRow.created_at, CandidateRow.id)
        )
        return [_row_to_candidate(r) for r in result.scalars().all()]


# ---------------------------------------------------------------------------
# Iterations
# ---------------------------------------------------------------------------

async def create_iteration(
    candidate_id: str,
    index: int,
    video_url: str,
    edit_type: EditType | None = None,
) -> Iteration:
    """Insert a new iteration row and return it as a Pydantic ``Iteration``.

    ``edit_type`` is accepted as an optional arg so callers can set it
    atomically at creation time (the orchestrator mutates the returned object
    after creation — we persist that mutation via :func:`update_iteration_edit_type`).
    """
    iteration = Iteration(
        candidate_id=candidate_id,
        index=index,
        video_url=video_url,
        edit_type=edit_type,
    )
    async with AsyncSessionLocal() as session:
        session.add(
            IterationRow(
                id=iteration.id,
                candidate_id=candidate_id,
                index=index,
                video_url=video_url,
                edit_type=edit_type.value if edit_type else None,
                cost=0.0,
            )
        )
        await session.commit()
    return iteration


async def update_iteration_score(iteration_id: str, score: ScoreBreakdown) -> None:
    """Upsert the 1:1 score row for an iteration.

    Unknown iterations are silently ignored to match the previous in-memory
    behaviour; the orchestrator relies on that when evaluating partial runs.
    """
    data = _score_to_dict(score)
    async with AsyncSessionLocal() as session:
        iteration = await session.get(
            IterationRow, iteration_id, options=[selectinload(IterationRow.score)]
        )
        if iteration is None:
            return
        if iteration.score is None:
            session.add(ScoreRow(iteration_id=iteration_id, **data))
        else:
            for k, v in data.items():
                setattr(iteration.score, k, v)
        await session.commit()


async def list_iterations(candidate_id: str) -> list[Iteration]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(IterationRow)
            .where(IterationRow.candidate_id == candidate_id)
            .options(selectinload(IterationRow.score))
            .order_by(IterationRow.index, IterationRow.created_at)
        )
        return [_row_to_iteration(r) for r in result.scalars().all()]


# ---------------------------------------------------------------------------
# Admin / test helpers
# ---------------------------------------------------------------------------

async def _reset_async() -> None:
    """Delete every row from every Nucleus table.

    Executed as one transaction so tests see a consistent empty state. Ordered
    child -> parent to keep foreign keys happy on databases without
    ``ON DELETE CASCADE`` enforcement (e.g. SQLite without foreign_keys PRAGMA).
    """
    async with AsyncSessionLocal() as session:
        await session.execute(delete(EventRow))
        await session.execute(delete(ScoreRow))
        await session.execute(delete(IterationRow))
        await session.execute(delete(CandidateRow))
        await session.execute(delete(JobRow))
        await session.commit()


def reset() -> None:
    """Sync-callable wrapper around :func:`_reset_async`.

    The original in-memory ``reset`` was synchronous and call sites (notably
    the pytest autouse fixture in ``tests/test_e2e_loop.py``) still invoke it
    that way. If we're already inside a running event loop the caller should
    ``await _reset_async()`` directly; otherwise we spin up a loop.
    """
    import asyncio

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop is None:
        asyncio.run(_reset_async())
    else:
        # Running inside an event loop — schedule and wait synchronously by
        # running on a fresh loop in a helper thread (rare in practice).
        import threading

        exc: list[BaseException] = []

        def _runner() -> None:
            try:
                asyncio.run(_reset_async())
            except BaseException as e:  # noqa: BLE001
                exc.append(e)

        t = threading.Thread(target=_runner)
        t.start()
        t.join()
        if exc:
            raise exc[0]
