"""ComfyUI-backed audio provider.

Dispatches by *subtype*:

- ``elevenlabs``   → ElevenLabs text-to-speech via GiusTex/ComfyUI-ElevenLabs
- ``stable_audio`` → fal Stable Audio 2 via gokayfem/ComfyUI-fal-API

ComfyUI is an orchestration layer; these nodes proxy closed-source APIs.
"""

from __future__ import annotations

from typing import Callable, Literal

from nucleus.config import is_mock
from nucleus.providers._comfyui_runtime import (
    cost_per_second_from_env,
    run_and_upload,
)
from nucleus.providers._types import AudioResult
from nucleus.providers.comfyui_client import ComfyUIClientProtocol, default_client
from nucleus.providers.comfyui_workflows import (
    Workflow,
    translate_elevenlabs_speech,
    translate_fal_stable_audio,
)

AudioSubtype = Literal["elevenlabs", "stable_audio"]

_MOCK_URIS: dict[str, str] = {
    "elevenlabs": "s3://nucleus-media/fixtures/comfyui-elevenlabs.mp3",
    "stable_audio": "s3://nucleus-media/fixtures/comfyui-stable-audio.mp3",
}

# ElevenLabs is priced per-character; Stable Audio 2 is per-second.
_DEFAULT_COST: dict[str, float] = {
    "elevenlabs": 0.06 / 1000.0,  # $0.06 per 1k chars
    "stable_audio": 0.02,         # $0.02 per second
}

_COST_ENV: dict[str, str] = {
    "elevenlabs": "COMFYUI_ELEVENLABS_COST_PER_CHAR",
    "stable_audio": "COMFYUI_STABLE_AUDIO_COST_PER_SECOND",
}

SUBTYPE_TO_TRANSLATOR: dict[str, Callable[..., Workflow]] = {
    "elevenlabs": translate_elevenlabs_speech,
    "stable_audio": translate_fal_stable_audio,
}


class ComfyUIAudioProvider:
    """Audio/Music provider backed by ComfyUI.

    Exposes both ``generate_speech`` (for ElevenLabs) and ``generate_music``
    (for Stable Audio 2) so the same class can satisfy either provider
    Protocol depending on *subtype*.
    """

    def __init__(
        self,
        subtype: AudioSubtype = "elevenlabs",
        client: ComfyUIClientProtocol | None = None,
        job_id: str | None = None,
    ) -> None:
        if subtype not in _MOCK_URIS:
            raise ValueError(f"Unknown ComfyUI audio subtype: {subtype!r}")
        self.subtype = subtype
        self.name = f"comfyui-{subtype}"
        self._cost_rate = cost_per_second_from_env(
            _COST_ENV[subtype], default=_DEFAULT_COST[subtype]
        )
        self._client = client
        self._job_id = job_id

    def _resolve_client(self) -> ComfyUIClientProtocol:
        if self._client is None:
            self._client = default_client()
        return self._client

    async def _submit(self, workflow: Workflow) -> str:
        uri, _prompt_id, _filename = await run_and_upload(
            self._resolve_client(),
            workflow,
            job_id=self._job_id or "",
            extension="mp3",
            content_type="audio/mpeg",
        )
        return uri

    # ------------------------------------------------------------------
    # AudioProvider (speech) interface
    # ------------------------------------------------------------------

    async def generate_speech(
        self,
        text: str,
        voice_id: str,
        language: str = "en",
    ) -> AudioResult:
        if self.subtype != "elevenlabs":
            raise RuntimeError(
                f"generate_speech() requires subtype='elevenlabs', got {self.subtype!r}"
            )
        if is_mock():
            return AudioResult(
                audio_url=_MOCK_URIS["elevenlabs"],
                duration_s=0.0,
                cost_usd=0.0,
                provider=self.name,
            )
        workflow = translate_elevenlabs_speech(text=text, voice_id=voice_id)
        uri = await self._submit(workflow)
        return AudioResult(
            audio_url=uri,
            duration_s=0.0,
            cost_usd=self.estimate_cost(len(text)),
            provider=self.name,
        )

    # ------------------------------------------------------------------
    # MusicProvider interface
    # ------------------------------------------------------------------

    async def generate_music(
        self,
        prompt: str,
        duration_s: float,
        mood: str = "neutral",
    ) -> AudioResult:
        if self.subtype != "stable_audio":
            raise RuntimeError(
                f"generate_music() requires subtype='stable_audio', got {self.subtype!r}"
            )
        if is_mock():
            return AudioResult(
                audio_url=_MOCK_URIS["stable_audio"],
                duration_s=duration_s,
                cost_usd=0.0,
                provider=self.name,
            )
        full_prompt = f"{mood}, {prompt}" if mood and mood != "neutral" else prompt
        workflow = translate_fal_stable_audio(
            prompt=full_prompt, duration_s=duration_s
        )
        uri = await self._submit(workflow)
        return AudioResult(
            audio_url=uri,
            duration_s=duration_s,
            cost_usd=self.estimate_cost(duration_s),
            provider=self.name,
        )

    def estimate_cost(self, amount: float) -> float:
        """Estimate cost.

        For ``elevenlabs``, *amount* is character count.
        For ``stable_audio``, *amount* is duration in seconds.
        """
        return round(amount * self._cost_rate, 6)


__all__ = ["AudioSubtype", "ComfyUIAudioProvider", "SUBTYPE_TO_TRANSLATOR"]
