"""Mock providers for testing -- returns fixture data with zero cost."""

from __future__ import annotations

import uuid

from nucleus.providers.types import AudioResult, GenerationResult, ProviderJobStatus

_MOCK_VIDEO_URL = "https://mock.nucleus.dev/fixtures/sample_video.mp4"
_MOCK_AUDIO_URL = "https://mock.nucleus.dev/fixtures/sample_audio.mp3"


class MockVideoProvider:
    """Returns canned GenerationResult objects for tests."""

    name: str = "mock-video"
    cost_per_second: float = 0.0

    async def generate(
        self,
        prompt: str,
        duration_s: float,
        aspect_ratio: str = "16:9",
        reference_image: str | None = None,
        seed: int | None = None,
    ) -> GenerationResult:
        job_id = f"mock-{uuid.uuid4().hex[:12]}"
        return GenerationResult(
            provider_job_id=job_id,
            video_url=_MOCK_VIDEO_URL,
            duration_s=duration_s,
            cost_usd=0.0,
            provider=self.name,
            metadata={"prompt": prompt, "aspect_ratio": aspect_ratio},
        )

    async def check_status(self, provider_job_id: str) -> ProviderJobStatus:
        return ProviderJobStatus(
            provider_job_id=provider_job_id,
            status="completed",
            progress=1.0,
        )

    async def get_result(self, provider_job_id: str) -> str:
        return _MOCK_VIDEO_URL

    def estimate_cost(self, duration_s: float) -> float:
        return 0.0


class MockAudioProvider:
    """Returns canned AudioResult objects for tests."""

    name: str = "mock-audio"

    async def generate_speech(
        self,
        text: str,
        voice_id: str,
        language: str = "en",
    ) -> AudioResult:
        return AudioResult(
            audio_url=_MOCK_AUDIO_URL,
            duration_s=len(text) * 0.06,  # rough estimate
            cost_usd=0.0,
            provider=self.name,
        )

    def estimate_cost(self, char_count: int) -> float:
        return 0.0


class MockMusicProvider:
    """Returns canned AudioResult objects for tests."""

    name: str = "mock-music"

    async def generate_music(
        self,
        prompt: str,
        duration_s: float,
        mood: str = "neutral",
    ) -> AudioResult:
        return AudioResult(
            audio_url=_MOCK_AUDIO_URL,
            duration_s=duration_s,
            cost_usd=0.0,
            provider=self.name,
        )

    def estimate_cost(self, duration_s: float) -> float:
        return 0.0
