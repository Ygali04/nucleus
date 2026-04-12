"""MagiHuman / daVinci-MagiHuman video provider — avatar & talking-head generation.

Uses the WaveSpeedAI REST API for the daVinci-MagiHuman 15B model.
Specialises in lip-synced talking-head videos from a reference image + audio.
"""

from __future__ import annotations

from ._protocol import BaseVideoProvider, GenerationResult, ProviderJobStatus

_MODEL = "davinci-magihuman-15b"


class MagiHumanProvider(BaseVideoProvider):
    """daVinci-MagiHuman via WaveSpeedAI REST API."""

    name = "magihuman"
    cost_per_second = 0.035  # WaveSpeedAI average
    max_duration_s = 60.0
    poll_interval_s = 3.0
    mock_video_url = "s3://mock/magihuman.mp4"
    _env_key_name = "WAVESPEED_API_KEY"

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str = "https://api.wavespeed.ai",
    ) -> None:
        super().__init__(api_key=api_key, base_url=base_url)

    async def generate(
        self,
        prompt: str,
        duration_s: float,
        aspect_ratio: str = "9:16",
        reference_image: str | None = None,
        seed: int | None = None,
    ) -> GenerationResult:
        duration_s = self._clamp_duration(duration_s)

        if self.mock:
            return self._mock_generation_result(
                duration_s,
                extra_metadata={
                    "model": _MODEL,
                    "has_reference_image": reference_image is not None,
                },
            )

        payload: dict = {
            "model": _MODEL,
            "prompt": prompt,
            "duration_s": duration_s,
            "aspect_ratio": aspect_ratio,
        }
        if reference_image:
            payload["reference_image_url"] = reference_image
        if seed is not None:
            payload["seed"] = seed

        data = await self._api_post("/v1/avatar/generate", payload)
        job_id: str = data["task_id"]
        video_url = await self._poll_until_done(job_id)

        return GenerationResult(
            provider_job_id=job_id,
            video_url=video_url,
            duration_s=duration_s,
            cost_usd=self.estimate_cost(duration_s),
            provider=self.name,
            metadata={
                "model": _MODEL,
                "aspect_ratio": aspect_ratio,
                "has_reference_image": reference_image is not None,
            },
        )

    async def check_status(self, provider_job_id: str) -> ProviderJobStatus:
        if self.mock:
            return ProviderJobStatus(
                provider_job_id=provider_job_id,
                status="completed",
                progress=1.0,
            )

        data = await self._api_get(f"/v1/avatar/status/{provider_job_id}")
        return ProviderJobStatus(
            provider_job_id=provider_job_id,
            status=data.get("status", "unknown"),
            progress=float(data.get("progress", 0)),
            error=data.get("error"),
        )

    async def get_result(self, provider_job_id: str) -> str:
        if self.mock:
            return self.mock_video_url

        data = await self._api_get(f"/v1/avatar/result/{provider_job_id}")
        return data["video_url"]
