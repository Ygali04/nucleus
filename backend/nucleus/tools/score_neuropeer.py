"""score_neuropeer tool — submits a variant to NeuroPeer for neural scoring."""

from __future__ import annotations

from uuid import uuid4

from nucleus.tools.mock_fixtures import (
    is_mock,
    mock_attention_curve,
    mock_key_moments,
    mock_metrics,
    progressive_score,
)
from nucleus.tools.schemas import ScoreNeuroPeerRequest, ScoreNeuroPeerResponse


async def score_neuropeer(req: ScoreNeuroPeerRequest) -> ScoreNeuroPeerResponse:
    # Key mock scores by parent_job_id (or video_url) so repeated scoring of the same
    # candidate family produces progressively higher scores — simulating loop improvement.
    candidate_key = req.parent_job_id or req.video_url
    score = progressive_score(candidate_key)

    if is_mock():
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

    # Real mode would call NeuroPeerClient here.
    raise NotImplementedError("Real NeuroPeer integration not wired yet")
