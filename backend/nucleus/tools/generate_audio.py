"""generate_audio tool — TTS via ElevenLabs (or mock)."""

from __future__ import annotations

from nucleus.config import is_mock
from nucleus.providers import get_provider
from nucleus.tools.mock_fixtures import mock_audio_url
from nucleus.tools.schemas import GenerateAudioRequest, GenerateAudioResponse


async def generate_audio(req: GenerateAudioRequest) -> GenerateAudioResponse:
    if is_mock():
        char_count = len(req.text)
        return GenerateAudioResponse(
            audio_url=mock_audio_url("speech"),
            cost_usd=0.0,
            duration_s=char_count / 15.0,
        )

    provider = get_provider("audio", "elevenlabs")
    result = await provider.generate_speech(
        text=req.text,
        voice_id=req.voice_id,
        language=req.language,
    )
    return GenerateAudioResponse(
        audio_url=result.audio_url,
        cost_usd=result.cost_usd,
        duration_s=result.duration_s,
    )
