"""ComfyUI-backed video provider.

Dispatches by *subtype* to the right workflow translator. ComfyUI here is
an orchestration/caching layer in front of ComfyUI-fal-API custom nodes
that proxy closed-source providers:

- ``kling``    → fal Kling v2.1 Master
- ``seedance`` → fal Seedance 1 Pro
- ``veo``      → fal Veo 3
- ``runway``   → fal Runway Gen-4
- ``luma``     → fal Luma Dream Machine
- ``hailuo``   → fal MiniMax Hailuo

Honours ``NUCLEUS_MOCK_PROVIDERS=true`` by short-circuiting to a fixture
URI without touching the injected client or storage layer.
"""

from __future__ import annotations

import uuid
from typing import Callable, Literal

from nucleus.config import is_mock
from nucleus.providers._comfyui_runtime import (
    cost_per_second_from_env,
    extract_output_filename,
    run_and_upload,
)
from nucleus.providers.comfyui_client import ComfyUIClientProtocol, default_client
from nucleus.providers.comfyui_workflows import (
    Workflow,
    translate_fal_hailuo,
    translate_fal_kling_v2,
    translate_fal_luma,
    translate_fal_runway_gen4,
    translate_fal_seedance_pro,
    translate_fal_veo3,
)
from nucleus.providers.types import GenerationResult, ProviderJobStatus

VideoSubtype = Literal["kling", "seedance", "veo", "runway", "luma", "hailuo"]

_MOCK_URIS: dict[str, str] = {
    "kling": "s3://nucleus-media/fixtures/comfyui-kling.mp4",
    "seedance": "s3://nucleus-media/fixtures/comfyui-seedance.mp4",
    "veo": "s3://nucleus-media/fixtures/comfyui-veo.mp4",
    "runway": "s3://nucleus-media/fixtures/comfyui-runway.mp4",
    "luma": "s3://nucleus-media/fixtures/comfyui-luma.mp4",
    "hailuo": "s3://nucleus-media/fixtures/comfyui-hailuo.mp4",
}

# Approximate per-second costs from fal's pricing table (env-overridable).
_DEFAULT_COST: dict[str, float] = {
    "kling": 0.084,
    "seedance": 0.07,
    "veo": 0.30,
    "runway": 0.25,
    "luma": 0.10,
    "hailuo": 0.04,
}

_COST_ENV: dict[str, str] = {
    "kling": "COMFYUI_KLING_COST_PER_SECOND",
    "seedance": "COMFYUI_SEEDANCE_COST_PER_SECOND",
    "veo": "COMFYUI_VEO_COST_PER_SECOND",
    "runway": "COMFYUI_RUNWAY_COST_PER_SECOND",
    "luma": "COMFYUI_LUMA_COST_PER_SECOND",
    "hailuo": "COMFYUI_HAILUO_COST_PER_SECOND",
}


SUBTYPE_TO_TRANSLATOR: dict[str, Callable[..., Workflow]] = {
    "kling": translate_fal_kling_v2,
    "seedance": translate_fal_seedance_pro,
    "veo": translate_fal_veo3,
    "runway": translate_fal_runway_gen4,
    "luma": translate_fal_luma,
    "hailuo": translate_fal_hailuo,
}


def _build_workflow(
    subtype: str,
    prompt: str,
    duration_s: float,
    aspect_ratio: str,
    reference_image: str | None,
) -> Workflow:
    translator = SUBTYPE_TO_TRANSLATOR.get(subtype)
    if translator is None:
        raise ValueError(f"Unknown ComfyUI video subtype: {subtype!r}")
    if subtype == "veo":
        # Veo 3 is text-only; ignore reference_image.
        return translator(
            prompt=prompt, duration_s=duration_s, aspect_ratio=aspect_ratio
        )
    if subtype in {"luma", "hailuo"}:
        return translator(
            prompt=prompt,
            duration_s=duration_s,
            reference_image_url=reference_image,
            aspect_ratio=aspect_ratio,
        )
    return translator(
        prompt=prompt,
        duration_s=duration_s,
        aspect_ratio=aspect_ratio,
        reference_image_url=reference_image,
    )


class ComfyUIVideoProvider:
    """Video provider that executes workflows on a ComfyUI backend."""

    cost_per_second: float = 0.0

    def __init__(
        self,
        subtype: VideoSubtype = "kling",
        client: ComfyUIClientProtocol | None = None,
        job_id: str | None = None,
    ) -> None:
        if subtype not in _MOCK_URIS:
            raise ValueError(f"Unknown ComfyUI video subtype: {subtype!r}")
        self.subtype = subtype
        self.name = f"comfyui-{subtype}"
        self.cost_per_second = cost_per_second_from_env(
            _COST_ENV[subtype], default=_DEFAULT_COST[subtype]
        )
        self._client = client
        self._job_id = job_id

    def _resolve_client(self) -> ComfyUIClientProtocol:
        if self._client is None:
            self._client = default_client()
        return self._client

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
            self.subtype, prompt, duration_s, aspect_ratio, reference_image
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


__all__ = ["ComfyUIVideoProvider", "SUBTYPE_TO_TRANSLATOR", "VideoSubtype"]
