"""Shared types for audio and music providers (self-contained, no cross-WU imports)."""

from __future__ import annotations

from typing import Protocol, runtime_checkable

from pydantic import BaseModel


class AudioResult(BaseModel):
    """Outcome of a speech or music generation call."""

    audio_url: str
    duration_s: float
    cost_usd: float
    provider: str


@runtime_checkable
class AudioProvider(Protocol):
    """Protocol that every speech / TTS provider must satisfy."""

    name: str

    async def generate_speech(
        self, text: str, voice_id: str, language: str = "en"
    ) -> AudioResult: ...

    def estimate_cost(self, char_count: int) -> float: ...


@runtime_checkable
class MusicProvider(Protocol):
    """Protocol that every music-generation provider must satisfy."""

    name: str

    async def generate_music(
        self, prompt: str, duration_s: float, mood: str = "neutral"
    ) -> AudioResult: ...

    def estimate_cost(self, duration_s: float) -> float: ...
