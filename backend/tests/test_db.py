"""Smoke tests for the SQLAlchemy-backed store.

These cover the round-trip between Pydantic and ORM models plus the foreign
key relationships (cascade delete, 1:1 score).
"""

from __future__ import annotations

import pytest
from sqlalchemy import select

from nucleus import store
from nucleus.db import AsyncSessionLocal, CandidateRow, IterationRow, JobRow, ScoreRow
from nucleus.models import (
    BriefRequest,
    CandidateSpec,
    EditType,
    Job,
    JobState,
    ScoreBreakdown,
)


def _brief() -> BriefRequest:
    return BriefRequest(
        brand_id="brand-db",
        source_url="s3://src/db.mp4",
        icps=["founder"],
        languages=["en"],
        platforms=["tiktok"],
        archetypes=["testimonial"],
        variants_per_cell=1,
        score_threshold=60.0,
        max_iterations=3,
    )


@pytest.fixture(autouse=True)
def _reset():
    store.reset()
    yield
    store.reset()


class TestJobRoundTrip:
    @pytest.mark.asyncio
    async def test_save_and_get_job(self):
        job = Job(brief=_brief())
        await store.save_job(job)

        loaded = await store.get_job(job.id)
        assert loaded.id == job.id
        assert loaded.state == JobState.BRIEFED
        assert loaded.brief.brand_id == "brand-db"
        assert loaded.brief.icps == ["founder"]

    @pytest.mark.asyncio
    async def test_save_job_upserts_on_state_change(self):
        job = Job(brief=_brief())
        await store.save_job(job)

        job.state = JobState.PLANNING
        await store.save_job(job)

        loaded = await store.get_job(job.id)
        assert loaded.state == JobState.PLANNING

    @pytest.mark.asyncio
    async def test_get_missing_job_raises(self):
        with pytest.raises(KeyError):
            await store.get_job("does-not-exist")


class TestCandidateRoundTrip:
    @pytest.mark.asyncio
    async def test_save_and_get_candidate(self):
        job = Job(brief=_brief())
        await store.save_job(job)

        c = CandidateSpec(
            job_id=job.id,
            icp="founder",
            language="en",
            platform="tiktok",
            archetype="testimonial",
            variant_index=0,
            score_threshold=60.0,
            max_iterations=3,
        )
        await store.save_candidate(c)

        loaded = await store.get_candidate(c.id)
        assert loaded.job_id == job.id
        assert loaded.icp == "founder"

    @pytest.mark.asyncio
    async def test_list_candidates_for_job(self):
        job = Job(brief=_brief())
        await store.save_job(job)

        for i in range(3):
            await store.save_candidate(
                CandidateSpec(
                    job_id=job.id,
                    icp=f"icp-{i}",
                    language="en",
                    platform="tiktok",
                    archetype="testimonial",
                    variant_index=i,
                    score_threshold=60.0,
                    max_iterations=3,
                )
            )

        listed = await store.list_candidates_for_job(job.id)
        assert len(listed) == 3
        assert {c.icp for c in listed} == {"icp-0", "icp-1", "icp-2"}


class TestIterationsAndScores:
    @pytest.mark.asyncio
    async def test_create_and_score_iteration(self):
        job = Job(brief=_brief())
        await store.save_job(job)
        c = CandidateSpec(
            job_id=job.id,
            icp="founder",
            language="en",
            platform="tiktok",
            archetype="testimonial",
            variant_index=0,
            score_threshold=60.0,
            max_iterations=3,
        )
        await store.save_candidate(c)

        it = await store.create_iteration(c.id, 0, "s3://v0.mp4")
        assert it.score is None

        score = ScoreBreakdown(
            neural_score=72.5,
            hook_score=70,
            sustained_attention=75,
            emotional_resonance=80,
            cognitive_accessibility=65,
            memory_encoding=70,
            aesthetic_quality=72,
            attention_curve=[70.0, 72.0, 75.0],
        )
        await store.update_iteration_score(it.id, score)

        iters = await store.list_iterations(c.id)
        assert len(iters) == 1
        assert iters[0].score is not None
        assert iters[0].score.neural_score == pytest.approx(72.5)
        assert iters[0].score.attention_curve == [70.0, 72.0, 75.0]

    @pytest.mark.asyncio
    async def test_create_iteration_with_edit_type(self):
        job = Job(brief=_brief())
        await store.save_job(job)
        c = CandidateSpec(
            job_id=job.id,
            icp="founder",
            language="en",
            platform="tiktok",
            archetype="testimonial",
            variant_index=0,
            score_threshold=60.0,
            max_iterations=3,
        )
        await store.save_candidate(c)

        it = await store.create_iteration(
            c.id, 1, "s3://v1.mp4", edit_type=EditType.HOOK_REWRITE
        )
        assert it.edit_type == EditType.HOOK_REWRITE

        iters = await store.list_iterations(c.id)
        assert iters[0].edit_type == EditType.HOOK_REWRITE


class TestForeignKeysAndReset:
    @pytest.mark.asyncio
    async def test_reset_clears_everything(self):
        job = Job(brief=_brief())
        await store.save_job(job)
        c = CandidateSpec(
            job_id=job.id,
            icp="founder",
            language="en",
            platform="tiktok",
            archetype="testimonial",
            variant_index=0,
            score_threshold=60.0,
            max_iterations=3,
        )
        await store.save_candidate(c)
        it = await store.create_iteration(c.id, 0, "s3://v0.mp4")
        await store.update_iteration_score(
            it.id, ScoreBreakdown(neural_score=50)
        )

        store.reset()

        async with AsyncSessionLocal() as session:
            for model in (JobRow, CandidateRow, IterationRow, ScoreRow):
                rows = (await session.execute(select(model))).scalars().all()
                assert rows == [], f"{model.__name__} not cleared"

    @pytest.mark.asyncio
    async def test_score_is_one_to_one(self):
        """Re-scoring an iteration updates the existing row, not inserts."""
        job = Job(brief=_brief())
        await store.save_job(job)
        c = CandidateSpec(
            job_id=job.id,
            icp="founder",
            language="en",
            platform="tiktok",
            archetype="testimonial",
            variant_index=0,
            score_threshold=60.0,
            max_iterations=3,
        )
        await store.save_candidate(c)
        it = await store.create_iteration(c.id, 0, "s3://v0.mp4")

        await store.update_iteration_score(it.id, ScoreBreakdown(neural_score=50))
        await store.update_iteration_score(it.id, ScoreBreakdown(neural_score=80))

        async with AsyncSessionLocal() as session:
            rows = (
                await session.execute(
                    select(ScoreRow).where(ScoreRow.iteration_id == it.id)
                )
            ).scalars().all()
            assert len(rows) == 1
            assert rows[0].neural_score == 80
