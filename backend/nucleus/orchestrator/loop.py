"""Core recursive loop state machine.

Drives each candidate through: generate -> score -> evaluate -> (edit -> re-score | deliver).
"""

from __future__ import annotations

import asyncio
import random

from nucleus.events import publish_event
from nucleus.models import (
    CandidateSpec,
    EditType,
    JobState,
    ScoreBreakdown,
    StopDecision,
)
from nucleus.orchestrator.editor import pick_edit
from nucleus.orchestrator.evaluator import evaluate
from nucleus.store import (
    create_iteration,
    get_candidate,
    save_candidate,
    update_iteration_score,
)


# ---------------------------------------------------------------------------
# Mock tool implementations (return fixture data)
# ---------------------------------------------------------------------------

async def mock_generate_video(candidate: CandidateSpec) -> str:
    """Simulate video generation; returns a fake S3 URL."""
    await asyncio.sleep(0)  # yield to event loop
    return (
        f"s3://nucleus/jobs/{candidate.job_id}/"
        f"{candidate.id}-v0.mp4"
    )


async def mock_edit_variant(
    candidate: CandidateSpec,
    edit_type: EditType,
    iteration_index: int,
) -> str:
    """Simulate applying an edit; returns a new fake S3 URL."""
    await asyncio.sleep(0)
    return (
        f"s3://nucleus/jobs/{candidate.job_id}/"
        f"{candidate.id}-v{iteration_index}.mp4"
    )


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def _mock_sub_scores(base: float) -> dict[str, float]:
    """Generate plausible sub-scores centred around *base*."""
    def _jitter() -> float:
        return _clamp(base + random.uniform(-8, 8))
    return {
        "hook_score": _jitter(),
        "sustained_attention": _jitter(),
        "emotional_resonance": _jitter(),
        "cognitive_accessibility": _jitter(),
        "memory_encoding": _jitter(),
        "aesthetic_quality": _jitter(),
    }


async def mock_score_neuropeer(
    video_url: str,
    iteration_index: int,
) -> ScoreBreakdown:
    """Return a score that trends upward by ~8-12 per iteration.

    Starts around 45, so a threshold of 60 is typically crossed at
    iteration 2 or 3.
    """
    await asyncio.sleep(0)
    base = 45.0 + iteration_index * random.uniform(8.0, 12.0)
    base = min(base, 95.0)
    subs = _mock_sub_scores(base)
    curve_len = 10
    attention_curve = [
        _clamp(base + random.uniform(-5, 5))
        for _ in range(curve_len)
    ]
    return ScoreBreakdown(
        neural_score=round(base, 1),
        attention_curve=attention_curve,
        **subs,
    )


# ---------------------------------------------------------------------------
# Candidate loop
# ---------------------------------------------------------------------------

async def run_candidate_loop(candidate_id: str, *, mock: bool = True) -> None:
    """Run the recursive generate -> score -> edit loop for one candidate."""
    candidate = await get_candidate(candidate_id)
    job_id = candidate.job_id
    score_history: list[float] = []
    cost_so_far = 0.0
    last_score: ScoreBreakdown | None = None
    decision = StopDecision.CONTINUE

    # Step 1: Generate initial variant --------------------------------
    candidate.state = JobState.GENERATING
    await save_candidate(candidate)
    await publish_event(job_id, "candidate.generating", {
        "candidate_id": candidate_id, "iteration": 0,
    })

    video_url = await mock_generate_video(candidate) if mock else ""
    iteration = await create_iteration(candidate_id, 0, video_url)
    cost_so_far += 0.10  # mock generation cost

    # Recursive loop --------------------------------------------------
    for i in range(candidate.max_iterations):
        # Step 2: Score
        candidate.state = JobState.SCORING
        await save_candidate(candidate)

        score_result = (
            await mock_score_neuropeer(iteration.video_url, i)
            if mock
            else ScoreBreakdown(neural_score=0)
        )
        await update_iteration_score(iteration.id, score_result)
        score_history.append(score_result.neural_score)
        cost_so_far += 0.08  # mock scoring cost

        await publish_event(job_id, "candidate.scored", {
            "candidate_id": candidate_id,
            "score": score_result.neural_score,
            "iteration": i,
        })

        # Step 3: Evaluate
        candidate.state = JobState.EVALUATING
        await save_candidate(candidate)

        decision = evaluate(
            score=score_result.neural_score,
            threshold=candidate.score_threshold,
            iteration=i,
            max_iters=candidate.max_iterations,
            score_history=score_history,
            cost_so_far=cost_so_far,
            cost_ceiling=candidate.cost_ceiling,
        )

        await publish_event(job_id, "iteration.evaluated", {
            "candidate_id": candidate_id,
            "decision": decision.value,
            "score": score_result.neural_score,
            "iteration": i,
        })

        last_score = score_result

        if decision != StopDecision.CONTINUE:
            break

        # Step 4: Edit
        edit_type = pick_edit(score_result)
        candidate.state = JobState.EDITING
        await save_candidate(candidate)

        await publish_event(job_id, "candidate.editing", {
            "candidate_id": candidate_id,
            "edit_type": edit_type.value,
            "iteration": i + 1,
        })

        video_url = (
            await mock_edit_variant(candidate, edit_type, i + 1)
            if mock
            else ""
        )
        iteration = await create_iteration(
            candidate_id, i + 1, video_url, edit_type=edit_type
        )
        cost_so_far += 0.05  # mock edit cost

        # Mark generating for the re-render implied by the edit
        candidate.state = JobState.GENERATING
        await save_candidate(candidate)
        await publish_event(job_id, "candidate.generating", {
            "candidate_id": candidate_id, "iteration": i + 1,
        })

    # Step 5: Deliver -------------------------------------------------
    await _finalize_candidate(candidate, decision, last_score, score_history)


async def _finalize_candidate(
    candidate: CandidateSpec,
    decision: StopDecision,
    last_score: ScoreBreakdown | None,
    score_history: list[float],
) -> None:
    candidate.state = JobState.DELIVERING
    await save_candidate(candidate)

    await publish_event(candidate.job_id, "candidate.delivering", {
        "candidate_id": candidate.id,
    })

    # In production: generate neural report + GTM guide here.

    candidate.state = JobState.COMPLETE
    await save_candidate(candidate)

    await publish_event(candidate.job_id, "candidate.delivered", {
        "candidate_id": candidate.id,
        "score": last_score.neural_score if last_score else 0,
        "iterations": len(score_history),
        "decision": decision.value,
    })


# ---------------------------------------------------------------------------
# Job-level orchestrator
# ---------------------------------------------------------------------------

async def run_job(job_id: str, candidate_ids: list[str], *, mock: bool = True) -> None:
    """Run all candidate loops for a job in parallel."""
    tasks = [
        asyncio.create_task(run_candidate_loop(cid, mock=mock))
        for cid in candidate_ids
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    for cid, result in zip(candidate_ids, results):
        if isinstance(result, Exception):
            c = await get_candidate(cid)
            c.state = JobState.FAILED
            await save_candidate(c)
            await publish_event(job_id, "candidate.failed", {
                "candidate_id": cid,
                "error": str(result),
            })
