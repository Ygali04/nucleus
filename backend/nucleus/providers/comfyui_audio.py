"""ComfyUI-backed audio provider.

Dispatches by *subtype*:

- ``musicgen`` → Meta's MusicGen via community ComfyUI node (music generation)
- ``whisper``  → Whisper transcription (returns the transcript S3 URI)
"""

from __future__ import annotations

from typing import Literal

from nucleus.config import is_mock
from nucleus.providers._comfyui_runtime import (
    cost_per_second_from_env,
    run_and_upload,
)
from nucleus.providers._types import AudioResult
from nucleus.providers.comfyui_client import ComfyUIClientProtocol, default_client
from nucleus.providers.comfyui_workflows import (
    translate_fal_audio,
    translate_musicgen,
    translate_whisper,
)

AudioSubtype = Literal["musicgen", "whisper", "elevenlabs", "stable_audio"]

_FIXTURE_PREFIX = "s3://nucleus-media/fixtures/comfyui-"

_MOCK_URIS: dict[str, str] = {
    "musicgen": f"{_FIXTURE_PREFIX}musicgen.mp3",
    "whisper": f"{_FIXTURE_PREFIX}whisper.txt",
    "elevenlabs": f"{_FIXTURE_PREFIX}elevenlabs.mp3",
    "stable_audio": f"{_FIXTURE_PREFIX}stable-audio.mp3",
}

_COST_ENV: dict[str, str] = {
    "musicgen": "COMFYUI_MUSICGEN_COST_PER_SECOND",
    "whisper": "COMFYUI_WHISPER_COST_PER_SECOND",
    "elevenlabs": "COMFYUI_ELEVENLABS_COST_PER_SECOND",
    "stable_audio": "COMFYUI_STABLE_AUDIO_COST_PER_SECOND",
}

_CONTENT_TYPE: dict[str, str] = {
    "musicgen": "audio/mpeg",
    "whisper": "text/plain",
    "elevenlabs": "audio/mpeg",
    "stable_audio": "audio/mpeg",
}
_EXT: dict[str, str] = {
    "musicgen": "mp3",
    "whisper": "txt",
    "elevenlabs": "mp3",
    "stable_audio": "mp3",
}


class ComfyUIAudioProvider:
    """MusicProvider/AudioProvider backed by ComfyUI.

    Exposes both ``generate_music`` (for MusicGen) and ``transcribe`` (for
    Whisper) so the same class can satisfy either provider Protocol
    depending on *subtype*.
    """

    def __init__(
        self,
        subtype: AudioSubtype = "musicgen",
        client: ComfyUIClientProtocol | None = None,
        job_id: str | None = None,
    ) -> None:
        if subtype not in _MOCK_URIS:
            raise ValueError(f"Unknown ComfyUI audio subtype: {subtype!r}")
        self.subtype = subtype
        self.name = f"comfyui-{subtype}"
        self._cost_per_second = cost_per_second_from_env(_COST_ENV[subtype])
        self._client = client
        self._job_id = job_id

    def _resolve_client(self) -> ComfyUIClientProtocol:
        if self._client is None:
            self._client = default_client()
        return self._client

    async def _submit(self, workflow: dict) -> str:
        """Run *workflow* and return the resulting ``s3://`` URI."""
        uri, _prompt_id, _filename = await run_and_upload(
            self._resolve_client(),
            workflow,
            job_id=self._job_id or "",
            extension=_EXT[self.subtype],
            content_type=_CONTENT_TYPE[self.subtype],
        )
        return uri

    # ------------------------------------------------------------------
    # MusicProvider interface
    # ------------------------------------------------------------------

    async def generate_music(
        self,
        prompt: str,
        duration_s: float,
        mood: str = "neutral",
        genre: str = "",
        energy: float = 0.5,
    ) -> AudioResult:
        if self.subtype not in ("musicgen", "stable_audio"):
            raise RuntimeError(
                f"generate_music() requires a music subtype, got {self.subtype!r}"
            )
        if is_mock():
            return AudioResult(
                audio_url=_MOCK_URIS[self.subtype],
                duration_s=duration_s,
                cost_usd=0.0,
                provider=self.name,
            )
        if self.subtype == "stable_audio":
            workflow = translate_fal_audio(
                self.subtype, prompt=prompt or mood, duration_s=duration_s
            )
        else:
            # ``prompt`` acts as a free-form override when callers don't pass
            # structured mood; feed it through the composer for determinism.
            workflow = translate_musicgen(
                mood=mood or prompt,
                genre=genre,
                duration_s=duration_s,
                energy=energy,
            )
        uri = await self._submit(workflow)
        return AudioResult(
            audio_url=uri,
            duration_s=duration_s,
            cost_usd=self.estimate_cost(duration_s),
            provider=self.name,
        )

    # ------------------------------------------------------------------
    # AudioProvider interface (TTS via fal-API ElevenLabs)
    # ------------------------------------------------------------------

    async def generate_speech(
        self, text: str, voice_id: str = "", language: str = "en"
    ) -> AudioResult:
        if self.subtype not in ("elevenlabs",):
            raise RuntimeError(
                f"generate_speech() requires subtype='elevenlabs', got {self.subtype!r}"
            )
        # Approximate duration from character count (used for mock + cost est.).
        approx_duration = max(1.0, len(text) / 15.0)
        if is_mock():
            return AudioResult(
                audio_url=_MOCK_URIS[self.subtype],
                duration_s=approx_duration,
                cost_usd=0.0,
                provider=self.name,
            )
        workflow = translate_fal_audio(self.subtype, prompt=text, duration_s=approx_duration)
        uri = await self._submit(workflow)
        return AudioResult(
            audio_url=uri,
            duration_s=approx_duration,
            cost_usd=self.estimate_cost(approx_duration),
            provider=self.name,
        )

    # ------------------------------------------------------------------
    # Whisper
    # ------------------------------------------------------------------

    async def transcribe(self, audio_url: str) -> AudioResult:
        if self.subtype != "whisper":
            raise RuntimeError(
                f"transcribe() requires subtype='whisper', got {self.subtype!r}"
            )
        if is_mock():
            return AudioResult(
                audio_url=_MOCK_URIS["whisper"],
                duration_s=0.0,
                cost_usd=0.0,
                provider=self.name,
            )
        uri = await self._submit(translate_whisper(audio_url))
        return AudioResult(
            audio_url=uri, duration_s=0.0, cost_usd=0.0, provider=self.name
        )

    def estimate_cost(self, duration_s: float) -> float:
        return round(duration_s * self._cost_per_second, 4)


__all__ = ["AudioSubtype", "ComfyUIAudioProvider"]
