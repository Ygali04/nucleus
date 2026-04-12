"""ElevenLabs TTS and voice-cloning provider for Nucleus."""

from __future__ import annotations

import io
import os
from uuid import uuid4

from nucleus.providers._types import AudioProvider, AudioResult

__all__ = ["AudioProvider", "AudioResult", "ElevenLabsProvider"]


class ElevenLabsProvider:
    """ElevenLabs TTS provider (Flash/Turbo tier by default)."""

    name: str = "elevenlabs"
    cost_per_1k_chars: float = 0.06  # Flash / Turbo tier

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key: str = api_key or os.environ.get("ELEVENLABS_API_KEY", "")
        self.mock: bool = (
            os.environ.get("NUCLEUS_MOCK_PROVIDERS", "false").lower() == "true"
        )
        self._client: object | None = None

    def _get_client(self):  # noqa: ANN202
        """Return a cached ElevenLabs SDK client (created once)."""
        if self._client is None:
            from elevenlabs import ElevenLabs  # type: ignore[import-untyped]

            self._client = ElevenLabs(api_key=self.api_key)
        return self._client

    async def generate_speech(
        self,
        text: str,
        voice_id: str,
        language: str = "en",
    ) -> AudioResult:
        """Generate speech audio from *text* using the given *voice_id*."""
        cost = self.estimate_cost(len(text))

        if self.mock:
            return AudioResult(
                audio_url="s3://mock/speech.mp3",
                duration_s=len(text) / 15.0,
                cost_usd=cost,
                provider=self.name,
            )

        client = self._get_client()
        audio_iter = client.text_to_speech.convert(
            text=text,
            voice_id=voice_id,
            model_id="eleven_flash_v2_5",
            language_code=language,
            output_format="mp3_44100_128",
        )

        buf = io.BytesIO()
        for chunk in audio_iter:
            buf.write(chunk)
        audio_bytes = buf.getvalue()

        # Rough duration estimate: MP3 at 128 kbps -> bytes / 16000 ~ seconds.
        duration_s = max(len(audio_bytes) / 16_000, 0.1)

        # TODO: upload audio_bytes to object storage and return real URL.
        return AudioResult(
            audio_url="s3://nucleus/speech.mp3",
            duration_s=duration_s,
            cost_usd=cost,
            provider=self.name,
        )

    async def clone_voice(self, name: str, audio_url: str) -> str:
        """Clone a voice from *audio_url* and return the new voice_id."""
        if self.mock:
            return f"mock-voice-{uuid4().hex[:8]}"

        import httpx

        async with httpx.AsyncClient() as http:
            resp = await http.get(audio_url)
            resp.raise_for_status()
            sample_bytes = resp.content

        client = self._get_client()
        voice = client.clone(
            name=name,
            files=[io.BytesIO(sample_bytes)],
        )
        return str(voice.voice_id)

    def estimate_cost(self, char_count: int) -> float:
        """Return estimated USD cost for *char_count* characters."""
        return (char_count / 1000) * self.cost_per_1k_chars
