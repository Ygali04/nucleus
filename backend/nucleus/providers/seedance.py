"""Seedance 2.0 video provider — cheapest batch video generation.

Uses the Atlas Cloud / BytePlus REST API for Seedance 2.0 Pro/Lite models.
Supports up to 15-second clips at 720p/1080p with multi-shot character consistency.
"""

from __future__ import annotations

from ._protocol import BaseVideoProvider, GenerationResult, ProviderJobStatus

_DEFAULT_RESOLUTION = "1080p"


class SeedanceProvider(BaseVideoProvider):
    """Seedance 2.0 via Atlas Cloud REST API."""

    name = "seedance-2.0"
    cost_per_second = 0.022  # Atlas Cloud Fast tier
    max_duration_s = 15.0
    poll_interval_s = 2.0
    mock_video_url = "s3://mock/seedance.mp4"
    _env_key_name = "ATLAS_CLOUD_API_KEY"

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str = "https://api.atlascloud.ai",
        model: str = "seedance-2.0-pro",
    ) -> None:
        super().__init__(api_key=api_key, base_url=base_url)
        self.model = model

    async def generate(
        self,
        prompt: str,
        duration_s: float,
        aspect_ratio: str = "16:9",
        reference_image: str | None = None,
        seed: int | None = None,
    ) -> GenerationResult:
        duration_s = self._clamp_duration(duration_s)

        if self.mock:
            return self._mock_generation_result(
                duration_s, extra_metadata={"model": self.model}
            )

        payload: dict = {
            "model": self.model,
            "prompt": prompt,
            "duration_s": duration_s,
            "aspect_ratio": aspect_ratio,
            "resolution": _DEFAULT_RESOLUTION,
        }
        if reference_image:
            payload["reference_image_url"] = reference_image
        if seed is not None:
            payload["seed"] = seed

        data = await self._api_post("/v1/video/generate", payload)
        job_id: str = data["task_id"]
        video_url = await self._poll_until_done(job_id)

        return GenerationResult(
            provider_job_id=job_id,
            video_url=video_url,
            duration_s=duration_s,
            cost_usd=self.estimate_cost(duration_s),
            provider=self.name,
            metadata={"model": self.model, "aspect_ratio": aspect_ratio},
        )

    async def check_status(self, provider_job_id: str) -> ProviderJobStatus:
        if self.mock:
            return ProviderJobStatus(
                provider_job_id=provider_job_id,
                status="completed",
                progress=1.0,
            )

        data = await self._api_get(f"/v1/video/status/{provider_job_id}")
        return ProviderJobStatus(
            provider_job_id=provider_job_id,
            status=data.get("status", "unknown"),
            progress=float(data.get("progress", 0)),
            error=data.get("error"),
        )

    async def get_result(self, provider_job_id: str) -> str:
        if self.mock:
            return self.mock_video_url

        data = await self._api_get(f"/v1/video/result/{provider_job_id}")
        return data["video_url"]
