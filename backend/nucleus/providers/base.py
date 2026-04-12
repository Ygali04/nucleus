"""Abstract provider protocols for video, audio, and music generation."""

from __future__ import annotations

from typing import Protocol, runtime_checkable

from nucleus.providers.types import AudioResult, GenerationResult, ProviderJobStatus


@runtime_checkable
class VideoProvider(Protocol):
    """Protocol for video generation providers (e.g. Kling, Runway)."""

    name: str
    cost_per_second: float

    async def generate(
        self,
        prompt: str,
        duration_s: float,
        aspect_ratio: str = "16:9",
        reference_image: str | None = None,
        seed: int | None = None,
    ) -> GenerationResult: ...

    async def check_status(self, provider_job_id: str) -> ProviderJobStatus: ...

    async def get_result(self, provider_job_id: str) -> str: ...

    def estimate_cost(self, duration_s: float) -> float: ...


@runtime_checkable
class AudioProvider(Protocol):
    """Protocol for speech synthesis providers."""

    name: str

    async def generate_speech(
        self,
        text: str,
        voice_id: str,
        language: str = "en",
    ) -> AudioResult: ...

    def estimate_cost(self, char_count: int) -> float: ...


@runtime_checkable
class MusicProvider(Protocol):
    """Protocol for background music generation providers."""

    name: str

    async def generate_music(
        self,
        prompt: str,
        duration_s: float,
        mood: str = "neutral",
    ) -> AudioResult: ...

    def estimate_cost(self, duration_s: float) -> float: ...
