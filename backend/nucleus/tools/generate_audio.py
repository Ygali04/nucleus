"""generate_audio tool — TTS via ElevenLabs (or mock)."""

from __future__ import annotations

from nucleus.tools.mock_fixtures import is_mock, mock_audio_url
from nucleus.tools.schemas import GenerateAudioRequest, GenerateAudioResponse

ELEVENLABS_COST_PER_1K_CHARS = 0.06


async def generate_audio(req: GenerateAudioRequest) -> GenerateAudioResponse:
    char_count = len(req.text)
    cost = (char_count / 1000.0) * ELEVENLABS_COST_PER_1K_CHARS
    duration_s = char_count / 15.0  # ~15 chars per second of speech

    if is_mock():
        return GenerateAudioResponse(
            audio_url=mock_audio_url("speech"),
            cost_usd=0.0,
            duration_s=duration_s,
        )

    return GenerateAudioResponse(
        audio_url=mock_audio_url("elevenlabs"),
        cost_usd=cost,
        duration_s=duration_s,
    )
