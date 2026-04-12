"""Score evaluation and stop-condition logic."""

from __future__ import annotations

from nucleus.models import StopDecision


def evaluate(
    score: float,
    threshold: float,
    iteration: int,
    max_iters: int,
    score_history: list[float],
    cost_so_far: float,
    cost_ceiling: float | None,
) -> StopDecision:
    """Decide whether the candidate loop should continue or stop.

    The order of checks mirrors priority: passing threshold is the
    happiest path, then hard limits, then heuristic bail-outs.
    """
    if score >= threshold:
        return StopDecision.PASSED_THRESHOLD
    if iteration >= max_iters:
        return StopDecision.MAX_ITERATIONS
    if len(score_history) >= 2 and score_history[-1] <= score_history[-2]:
        return StopDecision.MONOTONE_FAILURE
    if cost_ceiling is not None and cost_so_far >= cost_ceiling:
        return StopDecision.COST_CEILING
    return StopDecision.CONTINUE
