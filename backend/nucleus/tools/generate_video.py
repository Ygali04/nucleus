"""generate_video tool — produces a video clip from a text prompt."""

from __future__ import annotations

from uuid import uuid4

from nucleus.tools.mock_fixtures import is_mock, mock_video_url
from nucleus.tools.schemas import GenerateVideoRequest, GenerateVideoResponse

# Cost per second for each provider (from research).
PROVIDER_COST: dict[str, float] = {
    "mock": 0.0,
    "kling": 0.084,
    "seedance": 0.022,
    "magihuman": 0.035,
    "veo": 0.40,
}


async def generate_video(req: GenerateVideoRequest) -> GenerateVideoResponse:
    if is_mock() or req.provider == "mock":
        return GenerateVideoResponse(
            video_url=mock_video_url("gen"),
            cost_usd=0.0,
            provider_job_id=str(uuid4()),
            duration_s=req.duration_s,
            provider="mock",
        )

    # Real provider routing would happen here (nucleus.providers.registry).
    # For now, use per-provider pricing to simulate cost while still returning a mock URL.
    cost = req.duration_s * PROVIDER_COST.get(req.provider, 0.084)
    return GenerateVideoResponse(
        video_url=mock_video_url(req.provider),
        cost_usd=cost,
        provider_job_id=str(uuid4()),
        duration_s=req.duration_s,
        provider=req.provider,
    )
