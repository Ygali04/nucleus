"""generate_video tool — produces a video clip from a text prompt.

Routes to the concrete provider named in ``req.provider`` via the provider
registry.  Honors ``NUCLEUS_MOCK_PROVIDERS=true`` (mock fixture data, zero
cost) regardless of which provider was requested.
"""

from __future__ import annotations

from uuid import uuid4

from nucleus.config import is_mock
from nucleus.providers import get_provider
from nucleus.tools.mock_fixtures import mock_video_url
from nucleus.tools.schemas import GenerateVideoRequest, GenerateVideoResponse


async def generate_video(req: GenerateVideoRequest) -> GenerateVideoResponse:
    if is_mock() or req.provider == "mock":
        return GenerateVideoResponse(
            video_url=mock_video_url("gen"),
            cost_usd=0.0,
            provider_job_id=str(uuid4()),
            duration_s=req.duration_s,
            provider="mock",
        )

    provider = get_provider("video", req.provider)
    result = await provider.generate(
        prompt=req.prompt,
        duration_s=req.duration_s,
        aspect_ratio=req.aspect_ratio,
        reference_image=req.reference_image,
    )
    return GenerateVideoResponse(
        video_url=result.video_url,
        cost_usd=result.cost_usd,
        provider_job_id=result.provider_job_id,
        duration_s=result.duration_s,
        provider=result.provider,
    )
