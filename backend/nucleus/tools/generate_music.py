"""generate_music tool — Lyria via Vertex AI (or mock)."""

from __future__ import annotations

from nucleus.config import is_mock_music
from nucleus.providers import get_provider
from nucleus.tools.mock_fixtures import mock_audio_url
from nucleus.tools.schemas import GenerateMusicRequest, GenerateMusicResponse


async def generate_music(req: GenerateMusicRequest) -> GenerateMusicResponse:
    if is_mock_music():
        return GenerateMusicResponse(
            audio_url=mock_audio_url("music"),
            cost_usd=0.0,
        )

    provider = get_provider("music", "lyria")
    result = await provider.generate_music(
        prompt=req.prompt,
        duration_s=req.duration_s,
        mood=req.mood,
    )
    return GenerateMusicResponse(
        audio_url=result.audio_url,
        cost_usd=result.cost_usd,
    )
