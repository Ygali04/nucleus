"""score_neuropeer tool — submits a variant to NeuroPeer for neural scoring."""

from __future__ import annotations

from uuid import uuid4

from nucleus.clients.neuropeer import NeuroPeerClient
from nucleus.clients.neuropeer_types import AnalysisResult
from nucleus.tools.mock_fixtures import (
    is_mock,
    mock_attention_curve,
    mock_key_moments,
    mock_metrics,
    progressive_score,
)
from nucleus.tools.schemas import ScoreNeuroPeerRequest, ScoreNeuroPeerResponse


def _analysis_to_response(result: AnalysisResult) -> ScoreNeuroPeerResponse:
    """Flatten a NeuroPeer AnalysisResult into the Nucleus tool response shape."""
    neural = result.neural_score
    return ScoreNeuroPeerResponse(
        job_id=str(result.job_id),
        neural_score=neural.total,
        breakdown=neural.model_dump(exclude_none=True),
        metrics=[m.model_dump() for m in result.metrics],
        key_moments=[km.model_dump() for km in result.key_moments],
        attention_curve=list(result.attention_curve),
        ai_summary=result.ai_summary or result.overarching_summary,
        ai_action_items=result.ai_action_items,
    )


async def score_neuropeer(req: ScoreNeuroPeerRequest) -> ScoreNeuroPeerResponse:
    # Key mock scores by parent_job_id (or video_url) so repeated scoring of the same
    # candidate family produces progressively higher scores — simulating loop improvement.
    if is_mock():
        candidate_key = req.parent_job_id or req.video_url
        score = progressive_score(candidate_key)
        return ScoreNeuroPeerResponse(
            job_id=str(uuid4()),
            neural_score=score,
            breakdown={
                "total": score,
                "hook_score": score - 5,
                "sustained_attention": score + 2,
                "emotional_resonance": score - 1,
                "memory_encoding": score,
                "aesthetic_quality": score + 3,
                "cognitive_accessibility": score - 2,
            },
            metrics=mock_metrics(),
            key_moments=mock_key_moments(),
            attention_curve=mock_attention_curve(),
            ai_summary=f"Mock neural report. Score: {score:.1f}/100.",
            ai_action_items=[
                "Tighten the opening 3 seconds to improve hook score",
                "Swap music bed for higher arousal",
            ],
        )

    # Real mode: submit the variant, await progress, fetch full results.
    # NeuroPeerClient raises NeuroPeerError for HTTP, WS, and parse failures —
    # let it propagate so the orchestrator can decide whether to retry.
    async with NeuroPeerClient() as client:
        result = await client.submit_and_wait(
            req.video_url,
            content_type=req.content_type,
            parent_job_id=req.parent_job_id,
        )
    return _analysis_to_response(result)
