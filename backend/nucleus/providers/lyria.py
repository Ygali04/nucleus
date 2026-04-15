"""Google Lyria (via Vertex AI) music generation provider for Nucleus."""

from __future__ import annotations

from nucleus.config import google_cloud_project, is_mock_music as is_mock
from nucleus.providers._types import AudioResult, MusicProvider

__all__ = ["AudioResult", "LyriaProvider", "MusicProvider"]


class LyriaProvider:
    """Google Lyria music-generation provider accessed through Vertex AI."""

    name: str = "lyria"
    cost_per_second: float = 0.002  # ~$0.06 per 30-second clip

    def __init__(
        self,
        project_id: str | None = None,
        location: str = "us-central1",
    ) -> None:
        self.project_id: str = (
            project_id if project_id is not None else google_cloud_project()
        )
        self.location: str = location
        self.mock: bool = is_mock()
        self._ai_initialized: bool = False

    def _ensure_ai_platform(self) -> None:
        """Initialize Vertex AI SDK once on first real API call."""
        if not self._ai_initialized:
            from google.cloud import aiplatform  # type: ignore[import-untyped]

            aiplatform.init(project=self.project_id, location=self.location)
            self._ai_initialized = True

    async def generate_music(
        self,
        prompt: str,
        duration_s: float,
        mood: str = "neutral",
    ) -> AudioResult:
        """Generate a music clip matching *prompt* and *mood*."""
        cost = self.estimate_cost(duration_s)

        if self.mock:
            return AudioResult(
                audio_url="s3://mock/music.mp3",
                duration_s=duration_s,
                cost_usd=cost,
                provider=self.name,
            )

        from google.cloud import aiplatform  # type: ignore[import-untyped]

        self._ensure_ai_platform()

        endpoint = aiplatform.Endpoint(
            endpoint_name=(
                f"projects/{self.project_id}/locations/{self.location}"
                "/publishers/google/models/lyria"
            ),
        )
        response = endpoint.predict(
            instances=[
                {
                    "prompt": f"{prompt}. Mood: {mood}",
                    "duration_seconds": duration_s,
                }
            ],
        )
        audio_url: str = response.predictions[0]["audio_uri"]

        return AudioResult(
            audio_url=audio_url,
            duration_s=duration_s,
            cost_usd=cost,
            provider=self.name,
        )

    def estimate_cost(self, duration_s: float) -> float:
        """Return estimated USD cost for *duration_s* seconds of music."""
        return duration_s * self.cost_per_second
