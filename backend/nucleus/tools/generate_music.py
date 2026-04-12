"""generate_music tool — Lyria via Vertex AI (or mock)."""

from __future__ import annotations

from nucleus.tools.mock_fixtures import is_mock, mock_audio_url
from nucleus.tools.schemas import GenerateMusicRequest, GenerateMusicResponse

LYRIA_COST_PER_SECOND = 0.002


async def generate_music(req: GenerateMusicRequest) -> GenerateMusicResponse:
    cost = req.duration_s * LYRIA_COST_PER_SECOND
    return GenerateMusicResponse(
        audio_url=mock_audio_url("music"),
        cost_usd=0.0 if is_mock() else cost,
    )
