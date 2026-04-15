"""ComfyUI-backed video provider.

Dispatches by *subtype* to the right workflow translator:

- ``svd``         → Stable Video Diffusion image-to-video
- ``animatediff`` → AnimateDiff-Evolved text-to-video
- ``ltxv``        → LTX-Video text-to-video

Honours ``NUCLEUS_MOCK_PROVIDERS=true`` by short-circuiting to a fixture
URI without touching the injected client or storage layer.
"""

from __future__ import annotations

import uuid
from typing import Literal

from nucleus.config import is_mock_video as is_mock
from nucleus.providers._comfyui_runtime import (
    cost_per_second_from_env,
    extract_output_filename,
    run_and_upload,
)
from nucleus.providers.comfyui_client import ComfyUIClientProtocol, default_client
from nucleus.providers.comfyui_workflows import (
    translate_animatediff_text_to_video,
    translate_fal_video,
    translate_ltx_video,
    translate_svd_image_to_video,
)
from nucleus.providers.types import GenerationResult, ProviderJobStatus

VideoSubtype = Literal[
    "svd",
    "animatediff",
    "ltxv",
    "kling",
    "seedance",
    "veo",
    "runway",
    "luma",
    "hailuo",
]

_FIXTURE_PREFIX = "s3://nucleus-media/fixtures/comfyui-"

_MOCK_URIS: dict[str, str] = {
    "svd": f"{_FIXTURE_PREFIX}svd.mp4",
    "animatediff": f"{_FIXTURE_PREFIX}animatediff.mp4",
    "ltxv": f"{_FIXTURE_PREFIX}ltxv.mp4",
    "kling": f"{_FIXTURE_PREFIX}kling.mp4",
    "seedance": f"{_FIXTURE_PREFIX}seedance.mp4",
    "veo": f"{_FIXTURE_PREFIX}veo.mp4",
    "runway": f"{_FIXTURE_PREFIX}runway.mp4",
    "luma": f"{_FIXTURE_PREFIX}luma.mp4",
    "hailuo": f"{_FIXTURE_PREFIX}hailuo.mp4",
}

_COST_ENV: dict[str, str] = {
    "svd": "COMFYUI_SVD_COST_PER_SECOND",
    "animatediff": "COMFYUI_ANIMATEDIFF_COST_PER_SECOND",
    "ltxv": "COMFYUI_LTXV_COST_PER_SECOND",
    "kling": "COMFYUI_KLING_COST_PER_SECOND",
    "seedance": "COMFYUI_SEEDANCE_COST_PER_SECOND",
    "veo": "COMFYUI_VEO_COST_PER_SECOND",
    "runway": "COMFYUI_RUNWAY_COST_PER_SECOND",
    "luma": "COMFYUI_LUMA_COST_PER_SECOND",
    "hailuo": "COMFYUI_HAILUO_COST_PER_SECOND",
}

# Default per-second pricing for fal-hosted models (when env override unset).
_DEFAULT_FAL_COST: dict[str, float] = {
    "kling": 0.084,
    "seedance": 0.05,
    "veo": 0.20,
    "runway": 0.10,
    "luma": 0.08,
    "hailuo": 0.05,
}


def _build_workflow(
    subtype: str,
    prompt: str,
    duration_s: float,
    reference_image: str | None,
    aspect_ratio: str = "16:9",
) -> dict:
    if subtype == "svd":
        return translate_svd_image_to_video(
            prompt=prompt,
            reference_image_url=reference_image or "",
            duration_s=duration_s,
        )
    if subtype == "animatediff":
        return translate_animatediff_text_to_video(prompt, duration_s)
    if subtype == "ltxv":
        return translate_ltx_video(prompt, duration_s)
    if subtype in _DEFAULT_FAL_COST:
        return translate_fal_video(
            subtype=subtype,
            prompt=prompt,
            duration_s=duration_s,
            aspect_ratio=aspect_ratio,
            reference_image=reference_image,
        )
    raise ValueError(f"Unknown ComfyUI video subtype: {subtype!r}")


class ComfyUIVideoProvider:
    """Video provider that executes workflows on a ComfyUI backend."""

    cost_per_second: float = 0.0

    def __init__(
        self,
        subtype: VideoSubtype = "svd",
        client: ComfyUIClientProtocol | None = None,
        job_id: str | None = None,
    ) -> None:
        if subtype not in _MOCK_URIS:
            raise ValueError(f"Unknown ComfyUI video subtype: {subtype!r}")
        self.subtype = subtype
        self.name = f"comfyui-{subtype}"
        env_cost = cost_per_second_from_env(_COST_ENV[subtype])
        self.cost_per_second = env_cost or _DEFAULT_FAL_COST.get(subtype, 0.0)
        self._client = client
        self._job_id = job_id

    def _resolve_client(self) -> ComfyUIClientProtocol:
        if self._client is None:
            self._client = default_client()
        return self._client

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
        if is_mock():
            return GenerationResult(
                provider_job_id=f"mock-{uuid.uuid4().hex[:12]}",
                video_url=_MOCK_URIS[self.subtype],
                duration_s=duration_s,
                cost_usd=0.0,
                provider=self.name,
                metadata={"prompt": prompt, "subtype": self.subtype, "mock": True},
            )

        workflow = _build_workflow(
            self.subtype, prompt, duration_s, reference_image, aspect_ratio
        )
        uri, prompt_id, filename = await run_and_upload(
            self._resolve_client(),
            workflow,
            job_id=self._job_id or "",
            extension="mp4",
            content_type="video/mp4",
        )

        return GenerationResult(
            provider_job_id=prompt_id,
            video_url=uri,
            duration_s=duration_s,
            cost_usd=self.estimate_cost(duration_s),
            provider=self.name,
            metadata={
                "prompt": prompt,
                "subtype": self.subtype,
                "aspect_ratio": aspect_ratio,
                "comfyui_filename": filename,
            },
        )

    async def check_status(self, provider_job_id: str) -> ProviderJobStatus:
        if is_mock():
            return ProviderJobStatus(
                provider_job_id=provider_job_id, status="completed", progress=1.0
            )
        client = self._resolve_client()
        history = await client.get_history(provider_job_id)
        done = bool(history.get(provider_job_id, {}).get("outputs"))
        return ProviderJobStatus(
            provider_job_id=provider_job_id,
            status="completed" if done else "running",
            progress=1.0 if done else 0.0,
        )

    async def get_result(self, provider_job_id: str) -> str:
        client = self._resolve_client()
        history = await client.get_history(provider_job_id)
        filename, subfolder = extract_output_filename(history, provider_job_id)
        return f"comfyui://{subfolder}/{filename}" if subfolder else f"comfyui://{filename}"

    def estimate_cost(self, duration_s: float) -> float:
        return round(duration_s * self.cost_per_second, 4)


__all__ = ["ComfyUIVideoProvider", "VideoSubtype"]
