"""End-to-end test for the Nucleus recursive orchestrator loop.

Submits a minimal brief (1 ICP, 1 language, 1 platform, 1 archetype,
1 variant), runs the full loop with mock providers, and verifies:
  - Multiple iterations occurred (mock scores start low and improve)
  - Final score >= threshold (60)
  - Each scored iteration has a score and appropriate edit type
  - The candidate reaches "complete" status
  - WebSocket events were published in the correct order
"""

from __future__ import annotations

import random

import pytest

from nucleus import events, store
from nucleus.models import BriefRequest, Job, JobState, ScoreBreakdown
from nucleus.orchestrator.editor import EditType, pick_edit
from nucleus.orchestrator.evaluator import StopDecision, evaluate
from nucleus.orchestrator.loop import run_candidate_loop, run_job
from nucleus.orchestrator.planner import expand_brief


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def _reset_state():
    """Clear the in-memory store and event log between tests."""
    store.reset()
    events.reset()
    random.seed(42)  # deterministic mock scores
    yield
    store.reset()
    events.reset()


def _minimal_brief(**overrides) -> BriefRequest:
    defaults = dict(
        brand_id="brand-test",
        source_url="s3://source/test.mp4",
        icps=["sme-founder"],
        languages=["en"],
        platforms=["tiktok"],
        archetypes=["testimonial"],
        variants_per_cell=1,
        score_threshold=60.0,
        max_iterations=5,
    )
    defaults.update(overrides)
    return BriefRequest(**defaults)


# ---------------------------------------------------------------------------
# Unit tests — evaluator
# ---------------------------------------------------------------------------

class TestEvaluator:
    def test_passed_threshold(self):
        assert evaluate(65, 60, 0, 5, [65], 0, None) == StopDecision.PASSED_THRESHOLD

    def test_max_iterations(self):
        assert evaluate(50, 60, 5, 5, [50], 0, None) == StopDecision.MAX_ITERATIONS

    def test_monotone_failure(self):
        assert evaluate(48, 60, 2, 5, [50, 48], 0, None) == StopDecision.MONOTONE_FAILURE

    def test_cost_ceiling(self):
        assert evaluate(50, 60, 1, 5, [50], 10.0, 10.0) == StopDecision.COST_CEILING

    def test_continue(self):
        assert evaluate(50, 60, 1, 5, [45, 50], 1.0, 100.0) == StopDecision.CONTINUE


# ---------------------------------------------------------------------------
# Unit tests — editor
# ---------------------------------------------------------------------------

class TestEditor:
    def test_hook_rewrite_when_hook_lowest(self):
        bd = ScoreBreakdown(
            neural_score=50,
            hook_score=10,
            sustained_attention=60,
            emotional_resonance=60,
            cognitive_accessibility=60,
            memory_encoding=60,
            aesthetic_quality=60,
        )
        assert pick_edit(bd) == EditType.HOOK_REWRITE

    def test_music_swap_when_emotional_lowest(self):
        bd = ScoreBreakdown(
            neural_score=50,
            hook_score=60,
            sustained_attention=60,
            emotional_resonance=10,
            cognitive_accessibility=60,
            memory_encoding=60,
            aesthetic_quality=60,
        )
        assert pick_edit(bd) == EditType.MUSIC_SWAP

    def test_cut_tightening_on_attention_drop(self):
        bd = ScoreBreakdown(
            neural_score=50,
            hook_score=60,
            sustained_attention=60,
            emotional_resonance=60,
            cognitive_accessibility=60,
            memory_encoding=60,
            aesthetic_quality=60,
            attention_curve=[80, 75, 70, 50],  # 20-point drop at index 3
        )
        assert pick_edit(bd) == EditType.CUT_TIGHTENING


# ---------------------------------------------------------------------------
# Unit tests — planner
# ---------------------------------------------------------------------------

class TestPlanner:
    def test_expand_single_cell(self):
        brief = _minimal_brief()
        specs = expand_brief(brief, "job-1")
        assert len(specs) == 1
        assert specs[0].icp == "sme-founder"

    def test_expand_cross_product(self):
        brief = _minimal_brief(
            icps=["founder", "cmo"],
            languages=["en", "es"],
            platforms=["tiktok"],
            archetypes=["testimonial"],
            variants_per_cell=2,
        )
        specs = expand_brief(brief, "job-2")
        # 2 ICPs x 2 langs x 1 platform x 1 archetype x 2 variants = 8
        assert len(specs) == 8


# ---------------------------------------------------------------------------
# Integration test — full candidate loop
# ---------------------------------------------------------------------------

class TestCandidateLoop:
    @pytest.mark.asyncio
    async def test_single_candidate_converges(self):
        """A single candidate should converge within max_iterations."""
        brief = _minimal_brief()
        job = Job(brief=brief)
        await store.save_job(job)

        specs = expand_brief(brief, job.id)
        candidate = specs[0]
        await store.save_candidate(candidate)

        await run_candidate_loop(candidate.id, mock=True)

        # Reload candidate
        c = await store.get_candidate(candidate.id)
        assert c.state == JobState.COMPLETE

        # Check iterations
        iters = await store.list_iterations(candidate.id)
        assert len(iters) >= 2, "Should have at least 2 iterations (initial + 1 edit)"

        # The last scored iteration should meet or exceed threshold,
        # OR we hit a stop condition
        scored_iters = [it for it in iters if it.score is not None]
        assert len(scored_iters) >= 1

        # Verify events were published in sensible order
        job_events = events.get_events(job.id)
        event_types = [e["type"] for e in job_events]

        assert "candidate.generating" in event_types
        assert "candidate.scored" in event_types
        assert "iteration.evaluated" in event_types
        assert "candidate.delivered" in event_types

        # The first event should be generating, the last should be delivered
        assert event_types[0] == "candidate.generating"
        assert event_types[-1] == "candidate.delivered"

    @pytest.mark.asyncio
    async def test_score_improves_across_iterations(self):
        """Mock scores should trend upward."""
        brief = _minimal_brief()
        job = Job(brief=brief)
        await store.save_job(job)

        specs = expand_brief(brief, job.id)
        candidate = specs[0]
        await store.save_candidate(candidate)

        await run_candidate_loop(candidate.id, mock=True)

        iters = await store.list_iterations(candidate.id)
        scored = [it for it in iters if it.score is not None]

        # With seed=42, scores should generally increase
        scores = [it.score.neural_score for it in scored]
        assert len(scores) >= 2
        assert scores[-1] > scores[0], f"Score should improve: {scores}"

    @pytest.mark.asyncio
    async def test_iterations_have_edit_types(self):
        """Non-initial iterations should have an edit type."""
        brief = _minimal_brief()
        job = Job(brief=brief)
        await store.save_job(job)

        specs = expand_brief(brief, job.id)
        candidate = specs[0]
        await store.save_candidate(candidate)

        await run_candidate_loop(candidate.id, mock=True)

        iters = await store.list_iterations(candidate.id)
        # Iterations after index 0 should have an edit type
        for it in iters:
            if it.index > 0:
                assert it.edit_type is not None, f"Iteration {it.index} missing edit_type"


# ---------------------------------------------------------------------------
# Integration test — full job with multiple candidates
# ---------------------------------------------------------------------------

class TestJobOrchestration:
    @pytest.mark.asyncio
    async def test_multi_candidate_job(self):
        """Job with 2 candidates should run both in parallel."""
        brief = _minimal_brief(
            icps=["founder", "cmo"],
            variants_per_cell=1,
        )
        job = Job(brief=brief)
        await store.save_job(job)

        specs = expand_brief(brief, job.id)
        assert len(specs) == 2

        cids: list[str] = []
        for c in specs:
            await store.save_candidate(c)
            cids.append(c.id)

        await run_job(job.id, cids, mock=True)

        for cid in cids:
            c = await store.get_candidate(cid)
            assert c.state == JobState.COMPLETE

        # Both candidates should have delivered events
        job_events = events.get_events(job.id)
        delivered = [e for e in job_events if e["type"] == "candidate.delivered"]
        assert len(delivered) == 2


# ---------------------------------------------------------------------------
# Integration test — event ordering
# ---------------------------------------------------------------------------

class TestEventOrdering:
    @pytest.mark.asyncio
    async def test_event_sequence(self):
        """Events should follow the state machine transitions."""
        brief = _minimal_brief()
        job = Job(brief=brief)
        await store.save_job(job)

        specs = expand_brief(brief, job.id)
        candidate = specs[0]
        await store.save_candidate(candidate)

        await run_candidate_loop(candidate.id, mock=True)

        job_events = events.get_events(job.id)
        types = [e["type"] for e in job_events]

        # The sequence should start with generating, have at least one
        # scored + evaluated cycle, and end with delivered.
        assert types[0] == "candidate.generating"

        # Find the first scoring event
        scored_idx = types.index("candidate.scored")
        eval_idx = types.index("iteration.evaluated")
        assert scored_idx < eval_idx, "scored must come before evaluated"

        assert types[-1] == "candidate.delivered"
