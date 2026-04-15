"""Kling 3.0 video provider via fal.ai."""

from __future__ import annotations

import fal_client

from nucleus.config import fal_key
from nucleus.providers.types import GenerationResult, ProviderJobStatus

# fal.ai model endpoint for Kling v3 Pro text-to-video
_MODEL_TEXT_TO_VIDEO = "fal-ai/kling-video/v3/pro/text-to-video"
_MODEL_IMAGE_TO_VIDEO = "fal-ai/kling-video/v3/pro/image-to-video"

_COST_PER_SECOND = 0.084


class KlingVideoProvider:
    """Kling 3.0 video generation via the fal.ai platform.

    Supports both text-to-video and image-to-video (when *reference_image*
    is supplied).  Uses the fal_client async submit/status/result pattern.
    """

    name: str = "kling-v3"
    cost_per_second: float = _COST_PER_SECOND

    def __init__(self) -> None:
        # fal_client reads FAL_KEY from the environment automatically.
        # Validate early so callers get a clear error.
        if not fal_key():
            raise EnvironmentError(
                "FAL_KEY environment variable is required for the Kling provider"
            )

    # ------------------------------------------------------------------
    # VideoProvider interface
    # ------------------------------------------------------------------

    async def generate(
        self,
        prompt: str,
        duration_s: float,
        aspect_ratio: str = "16:9",
        reference_image: str | None = None,
        seed: int | None = None,
    ) -> GenerationResult:
        model = _MODEL_IMAGE_TO_VIDEO if reference_image else _MODEL_TEXT_TO_VIDEO

        # Kling expects an integer-seconds string in {"3"..."15"}. Clamp + round.
        clamped = max(3, min(15, round(duration_s)))
        arguments: dict = {
            "prompt": prompt,
            "duration": str(clamped),
            "aspect_ratio": aspect_ratio,
        }
        if reference_image:
            arguments["image_url"] = reference_image
        if seed is not None:
            arguments["seed"] = seed

        # fal_client.submit returns a request handle we can poll.
        handle = await fal_client.submit_async(model, arguments=arguments)
        request_id = handle.request_id

        # Block until the job finishes (fal_client handles polling).
        result = await fal_client.result_async(model, request_id)

        video_url: str = result["video"]["url"]

        return GenerationResult(
            provider_job_id=request_id,
            video_url=video_url,
            duration_s=duration_s,
            cost_usd=self.estimate_cost(duration_s),
            provider=self.name,
            metadata={
                "model": model,
                "prompt": prompt,
                "aspect_ratio": aspect_ratio,
            },
        )

    async def check_status(self, provider_job_id: str) -> ProviderJobStatus:
        model = _MODEL_TEXT_TO_VIDEO  # status endpoint is model-agnostic on fal
        status = await fal_client.status_async(
            model, provider_job_id, with_logs=False
        )

        # fal status objects have a `.status` attribute
        fal_status = getattr(status, "status", None) or "pending"

        # Normalise to our enum values
        status_map = {
            "IN_QUEUE": "pending",
            "IN_PROGRESS": "running",
            "COMPLETED": "completed",
            "FAILED": "failed",
        }
        normalised = status_map.get(fal_status.upper(), "pending")

        return ProviderJobStatus(
            provider_job_id=provider_job_id,
            status=normalised,
            progress=1.0 if normalised == "completed" else 0.0,
        )

    async def get_result(self, provider_job_id: str) -> str:
        model = _MODEL_TEXT_TO_VIDEO
        result = await fal_client.result_async(model, provider_job_id)
        return result["video"]["url"]

    def estimate_cost(self, duration_s: float) -> float:
        return round(duration_s * _COST_PER_SECOND, 4)
