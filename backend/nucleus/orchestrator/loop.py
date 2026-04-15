"""Core recursive loop — drives each candidate via the Ruflo swarm bridge.

The Ruflo bridge (a Node service at ``RUFLO_BRIDGE_URL``) owns the Queen-Worker
agent loop and the edit-decision logic. This module:

  * Issues ``POST /api/v1/swarm/run`` to the bridge for each candidate.
  * Consumes the SSE event stream.
  * Applies each event to the in-memory store and re-publishes it on
    ``nucleus.events`` so WebSocket subscribers see the same stream.

Execution paths:

  * **Ruflo path** (default) — real agent swarm via the Node bridge. With the
    new per-provider mock toggles (``NUCLEUS_MOCK_VIDEO``, ``NUCLEUS_MOCK_SCORE``,
    etc.) individual tool endpoints still return fixture data when flagged, so
    the Ruflo-driven loop works even in dev/test without real provider keys.
  * **Test fixture path** (``mock=True``) — deterministic in-process path used
    by the Python test-suite to verify the closed-loop iteration, scoring, and
    ceiling semantics *without* standing up the Ruflo bridge. Emits the same
    event shapes the Ruflo bridge would emit so consumers don't branch.
"""

from __future__ import annotations

import asyncio
import os
import random
from typing import Any

import httpx

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
from nucleus.orchestrator.ruflo_client import run_swarm
from nucleus.store import (
    create_iteration,
    get_candidate,
    list_iterations,
    save_candidate,
    update_iteration_analysis_result,
    update_iteration_edit_type,
    update_iteration_score,
    update_iteration_video_url,
)


# ---------------------------------------------------------------------------
# Public entry points
# ---------------------------------------------------------------------------

def _mock_mode(explicit: bool | None = None) -> bool:
    """Resolve whether to use the mock path.

    Explicit arg wins; otherwise falls back to NUCLEUS_MOCK_PROVIDERS.
    """
    if explicit is not None:
        return explicit
    return os.environ.get("NUCLEUS_MOCK_PROVIDERS", "").lower() in {"1", "true", "yes"}


async def run_candidate_loop(
    candidate_id: str,
    *,
    mock: bool | None = None,
    client: httpx.AsyncClient | None = None,
) -> None:
    """Run the recursive generate -> score -> edit loop for one candidate."""
    candidate = await get_candidate(candidate_id)
    if _mock_mode(mock):
        await _run_candidate_loop_mock(candidate)
    else:
        await _run_candidate_loop_ruflo(candidate, client=client)


async def run_job(
    job_id: str,
    candidate_ids: list[str],
    *,
    mock: bool | None = None,
    client: httpx.AsyncClient | None = None,
) -> None:
    """Run all candidate loops for a job in parallel."""
    tasks = [
        asyncio.create_task(run_candidate_loop(cid, mock=mock, client=client))
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


# ---------------------------------------------------------------------------
# Ruflo-backed loop
# ---------------------------------------------------------------------------

async def _run_candidate_loop_ruflo(
    candidate: CandidateSpec,
    *,
    client: httpx.AsyncClient | None = None,
) -> None:
    """Drive the candidate through the Ruflo swarm via SSE."""
    job_id = candidate.job_id
    candidate.state = JobState.GENERATING
    await save_candidate(candidate)

    current_iteration: int = -1
    score_history: list[float] = []

    try:
        async for event in run_swarm(candidate, client=client):
            handled_iteration = await _apply_ruflo_event(
                candidate, event, current_iteration
            )
            if handled_iteration is not None:
                current_iteration = handled_iteration
            if event.get("event_type") == "candidate.scored":
                try:
                    score_history.append(float(event.get("score") or 0))
                except (TypeError, ValueError):
                    pass
            # Re-publish every event to the in-process bus so WS clients see it.
            data = {k: v for k, v in event.items() if k not in {"event_type", "job_id"}}
            await publish_event(job_id, str(event["event_type"]), data)

            # When the bridge signals ceiling on delivery, surface a chat
            # message so the UI explains why we're stopping.
            if event.get("event_type") == "candidate.delivered":
                decision = str(event.get("decision") or "")
                if decision in {"ceiling", "max_iterations"} and not event.get(
                    "_chat_emitted"
                ):
                    score = float(event.get("score") or 0)
                    threshold = candidate.score_threshold
                    if score < threshold:
                        top = max(score_history) if score_history else score
                        msg = (
                            f"Variant {candidate.variant_index} hit the "
                            f"{candidate.max_iterations}-iteration ceiling at score "
                            f"{score:.1f} (threshold: {threshold:.1f}, best: "
                            f"{top:.1f}). Forwarding to delivery with a GTM note."
                        )
                        await publish_event(job_id, "chat.assistant_message", {
                            "campaign_id": job_id,
                            "candidate_id": candidate.id,
                            "role": "assistant",
                            "content": msg,
                            "message": msg,
                            "ceiling_hit": True,
                            "variant_index": candidate.variant_index,
                            "final_score": score,
                            "threshold": threshold,
                        })

            if event.get("event_type") == "candidate.failed":
                candidate.state = JobState.FAILED
                await save_candidate(candidate)
                raise RuntimeError(str(event.get("error", "Ruflo swarm failed")))
    except Exception:
        candidate.state = JobState.FAILED
        await save_candidate(candidate)
        raise

    candidate.state = JobState.COMPLETE
    await save_candidate(candidate)


async def _apply_ruflo_event(
    candidate: CandidateSpec,
    event: dict[str, Any],
    current_iteration: int,
) -> int | None:
    """Apply one SSE event to the store.

    Returns the new iteration index if the event changed it, else None.
    """
    kind = event.get("event_type")

    if kind == "candidate.generating":
        candidate.state = JobState.GENERATING
        await save_candidate(candidate)
        idx = int(event.get("iteration", current_iteration + 1))
        existing = await list_iterations(candidate.id)
        if not any(it.index == idx for it in existing):
            await create_iteration(candidate.id, idx, "")
        return idx

    if kind == "candidate.scored":
        candidate.state = JobState.SCORING
        await save_candidate(candidate)
        idx = int(event.get("iteration", current_iteration))
        iteration = await _ensure_iteration(
            candidate.id, idx, str(event.get("video_url", "") or "")
        )
        score = _score_from_event(event)
        await update_iteration_score(iteration.id, score)
        analysis = event.get("analysis_result") or event.get("report")
        if isinstance(analysis, dict):
            await update_iteration_analysis_result(iteration.id, analysis)
        return idx

    if kind == "iteration.evaluated":
        candidate.state = JobState.EVALUATING
        await save_candidate(candidate)
        return None

    if kind == "candidate.edited":
        candidate.state = JobState.EDITING
        await save_candidate(candidate)
        idx = int(event.get("iteration", current_iteration + 1))
        iteration = await _ensure_iteration(
            candidate.id, idx, str(event.get("video_url", "") or "")
        )
        raw_edit = event.get("edit_type")
        if isinstance(raw_edit, str):
            try:
                edit = EditType(raw_edit)
            except ValueError:
                edit = None
            if edit is not None:
                iteration.edit_type = edit
                await update_iteration_edit_type(iteration.id, edit)
        return idx

    if kind == "candidate.delivered":
        candidate.state = JobState.DELIVERING
        await save_candidate(candidate)
        return None

    return None


async def _ensure_iteration(candidate_id: str, index: int, video_url: str):
    existing = await list_iterations(candidate_id)
    for it in existing:
        if it.index == index:
            if video_url and not it.video_url:
                it.video_url = video_url
                await update_iteration_video_url(it.id, video_url)
            return it
    return await create_iteration(candidate_id, index, video_url)


def _score_from_event(event: dict[str, Any]) -> ScoreBreakdown:
    breakdown = event.get("breakdown") or {}
    curve = event.get("attention_curve") or []
    return ScoreBreakdown(
        neural_score=float(event.get("score", 0) or 0),
        hook_score=float(breakdown.get("hook_score", 0) or 0),
        sustained_attention=float(breakdown.get("sustained_attention", 0) or 0),
        emotional_resonance=float(breakdown.get("emotional_resonance", 0) or 0),
        cognitive_accessibility=float(breakdown.get("cognitive_accessibility", 0) or 0),
        memory_encoding=float(breakdown.get("memory_encoding", 0) or 0),
        aesthetic_quality=float(breakdown.get("aesthetic_quality", 0) or 0),
        attention_curve=[float(x) for x in curve],
    )


# ---------------------------------------------------------------------------
# Mock path — progressive scores, bypasses the Ruflo bridge.
# Used by tests and local development (NUCLEUS_MOCK_PROVIDERS=true).
# ---------------------------------------------------------------------------

def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def _mock_sub_scores(base: float) -> dict[str, float]:
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


async def _mock_generate_video(candidate: CandidateSpec) -> str:
    await asyncio.sleep(0)
    return f"s3://nucleus/jobs/{candidate.job_id}/{candidate.id}-v0.mp4"


async def _mock_edit_variant(
    candidate: CandidateSpec,
    edit_type: EditType,
    iteration_index: int,
) -> str:
    await asyncio.sleep(0)
    return f"s3://nucleus/jobs/{candidate.job_id}/{candidate.id}-v{iteration_index}.mp4"


def _mock_analysis_result(
    candidate: CandidateSpec,
    iteration: Any,
    score: ScoreBreakdown,
) -> dict[str, Any]:
    """Fabricate a NeuroPeer-shaped report for the mock scoring path."""
    return {
        "job_id": candidate.job_id,
        "url": iteration.video_url,
        "content_type": "video",
        "duration_seconds": 15.0,
        "neural_score": {
            "total": score.neural_score,
            "hook_score": score.hook_score,
            "sustained_attention": score.sustained_attention,
            "emotional_resonance": score.emotional_resonance,
            "memory_encoding": score.memory_encoding,
            "aesthetic_quality": score.aesthetic_quality,
            "cognitive_accessibility": score.cognitive_accessibility,
        },
        "attention_curve": list(score.attention_curve),
        "emotional_arousal_curve": [],
        "cognitive_load_curve": [],
        "key_moments": [],
        "modality_breakdown": [],
        "metrics": [],
    }


async def _mock_score(iteration_index: int) -> ScoreBreakdown:
    await asyncio.sleep(0)
    base = min(95.0, 45.0 + iteration_index * random.uniform(8.0, 12.0))
    subs = _mock_sub_scores(base)
    curve = [_clamp(base + random.uniform(-5, 5)) for _ in range(10)]
    return ScoreBreakdown(
        neural_score=round(base, 1),
        attention_curve=curve,
        **subs,
    )


async def _run_candidate_loop_mock(candidate: CandidateSpec) -> None:
    """Deterministic test-fixture driver mirroring the Ruflo event schema.

    Emits exactly one ``candidate.generating`` per iteration (no off-by-one)
    and mirrors the ceiling-fallback behavior of the Ruflo bridge: a
    ``chat.assistant_message`` with ``ceiling_hit: true`` is published when
    max_iterations is exhausted without clearing the threshold.
    """
    job_id = candidate.job_id
    score_history: list[float] = []
    cost_so_far = 0.0
    last_score: ScoreBreakdown | None = None
    decision = StopDecision.CONTINUE

    candidate.state = JobState.GENERATING
    await save_candidate(candidate)

    # Initial generation — emit one candidate.generating for iteration 0.
    await publish_event(job_id, "candidate.generating", {
        "candidate_id": candidate.id, "iteration": 0,
    })
    video_url = await _mock_generate_video(candidate)
    iteration = await create_iteration(candidate.id, 0, video_url)
    cost_so_far += 0.10

    for i in range(candidate.max_iterations):
        candidate.state = JobState.SCORING
        await save_candidate(candidate)

        score_result = await _mock_score(i)
        await update_iteration_score(iteration.id, score_result)
        await update_iteration_analysis_result(
            iteration.id, _mock_analysis_result(candidate, iteration, score_result)
        )
        score_history.append(score_result.neural_score)
        cost_so_far += 0.08

        await publish_event(job_id, "candidate.scored", {
            "candidate_id": candidate.id,
            "score": score_result.neural_score,
            "iteration": i,
        })

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
            "candidate_id": candidate.id,
            "decision": decision.value,
            "score": score_result.neural_score,
            "iteration": i,
        })

        last_score = score_result
        if decision != StopDecision.CONTINUE:
            break

        # Produce the next variant via an edit. This is a new iteration;
        # emit candidate.editing + candidate.generating exactly once each.
        edit_type = pick_edit(score_result)
        candidate.state = JobState.EDITING
        await save_candidate(candidate)

        await publish_event(job_id, "candidate.editing", {
            "candidate_id": candidate.id,
            "edit_type": edit_type.value,
            "iteration": i + 1,
        })

        video_url = await _mock_edit_variant(candidate, edit_type, i + 1)
        iteration = await create_iteration(
            candidate.id, i + 1, video_url, edit_type=edit_type
        )
        cost_so_far += 0.05

        candidate.state = JobState.GENERATING
        await save_candidate(candidate)
        # Only emit candidate.generating for iterations that will actually run
        # scoring — i.e. when we're about to loop again (i+1 < max_iterations).
        if i + 1 < candidate.max_iterations:
            await publish_event(job_id, "candidate.generating", {
                "candidate_id": candidate.id, "iteration": i + 1,
            })

    await _finalize_mock(candidate, decision, last_score, score_history)


async def _finalize_mock(
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

    candidate.state = JobState.COMPLETE
    await save_candidate(candidate)

    # Normalize decision for delivery events — the spec requires ceiling-hit
    # runs to surface ``decision: "ceiling"`` (friendlier than the internal
    # "max_iterations" StopDecision) and a chat.assistant_message explaining
    # why the loop stopped. We also treat "exited the range(max_iterations)
    # loop with decision=CONTINUE and score < threshold" as a ceiling hit —
    # that's the practical case where iteration count is exhausted without
    # the evaluator formally emitting MAX_ITERATIONS.
    exhausted_without_threshold = (
        decision in (StopDecision.MAX_ITERATIONS, StopDecision.CONTINUE,
                     StopDecision.MONOTONE_FAILURE)
        and last_score is not None
        and last_score.neural_score < candidate.score_threshold
        and len(score_history) >= candidate.max_iterations
    )
    ceiling_hit = (
        decision == StopDecision.MAX_ITERATIONS
        and (last_score is None or last_score.neural_score < candidate.score_threshold)
    ) or exhausted_without_threshold
    delivered_decision = "ceiling" if ceiling_hit else decision.value
    final_score = last_score.neural_score if last_score else 0.0

    await publish_event(candidate.job_id, "candidate.delivered", {
        "candidate_id": candidate.id,
        "score": final_score,
        "iterations": len(score_history),
        "decision": delivered_decision,
    })

    if ceiling_hit:
        score_fmt = f"{final_score:.1f}" if isinstance(final_score, (int, float)) else "n/a"
        thr_fmt = f"{candidate.score_threshold:.1f}"
        top_score = max(score_history) if score_history else final_score
        msg = (
            f"Variant {candidate.variant_index} hit the "
            f"{candidate.max_iterations}-iteration ceiling at score {score_fmt} "
            f"(threshold: {thr_fmt}, best across iterations: {top_score:.1f}). "
            f"I'm forwarding it to delivery with a GTM note describing what was "
            f"tried and what's still weak."
        )
        await publish_event(candidate.job_id, "chat.assistant_message", {
            "campaign_id": candidate.job_id,
            "candidate_id": candidate.id,
            "role": "assistant",
            "content": msg,
            "message": msg,  # backward-compat with existing UI key
            "ceiling_hit": True,
            "variant_index": candidate.variant_index,
            "final_score": final_score,
            "threshold": candidate.score_threshold,
        })
