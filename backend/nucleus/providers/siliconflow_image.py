"""SiliconFlow-backed ImageProvider (FLUX.1-Kontext-dev).

Honors ``NUCLEUS_MOCK_PROVIDERS=true`` by returning a fixture URL with zero
cost, matching the pattern used by the video/audio mock providers.
"""

from __future__ import annotations

import os

from nucleus.clients.siliconflow import DEFAULT_MODEL, SiliconFlowClient
from nucleus.config import is_mock_image as is_mock
from nucleus.providers._image_protocol import ImageProvider, ImageResult

_MOCK_IMAGE_URL = "https://mock.nucleus.dev/fixtures/sample_image.png"


def _cost(env_var: str, default: float) -> float:
    raw = os.environ.get(env_var)
    if raw:
        try:
            return float(raw)
        except ValueError:
            pass
    return default


def flux_t2i_cost() -> float:
    return _cost("FLUX_T2I_COST_PER_IMAGE", 0.02)


def flux_i2i_cost() -> float:
    return _cost("FLUX_I2I_COST_PER_IMAGE", 0.03)


class SiliconFlowImageProvider:
    """FLUX.1-Kontext-dev via SiliconFlow."""

    name: str = "flux_kontext_dev"

    def __init__(
        self,
        *,
        model: str = DEFAULT_MODEL,
        client: SiliconFlowClient | None = None,
    ) -> None:
        self.model = model
        self._client = client

    def _get_client(self) -> SiliconFlowClient:
        if self._client is None:
            self._client = SiliconFlowClient()
        return self._client

    async def text_to_image(
        self,
        prompt: str,
        *,
        width: int = 1024,
        height: int = 1024,
    ) -> ImageResult:
        if is_mock():
            return ImageResult(
                image_url=_MOCK_IMAGE_URL,
                cost_usd=0.0,
                provider=self.name,
            )
        client = self._get_client()
        urls = await client.text_to_image(
            prompt=prompt, model=self.model, width=width, height=height, num_images=1
        )
        return ImageResult(
            image_url=urls[0],
            cost_usd=flux_t2i_cost(),
            provider=self.name,
        )

    async def image_to_image(
        self,
        prompt: str,
        reference_image_url: str,
        *,
        strength: float = 0.7,
    ) -> ImageResult:
        if is_mock():
            return ImageResult(
                image_url=_MOCK_IMAGE_URL,
                cost_usd=0.0,
                provider=self.name,
            )
        client = self._get_client()
        url = await client.image_to_image(
            prompt=prompt,
            reference_image_url=reference_image_url,
            model=self.model,
            strength=strength,
        )
        return ImageResult(
            image_url=url,
            cost_usd=flux_i2i_cost(),
            provider=self.name,
        )

    def estimate_cost(self, *, mode: str = "t2i") -> float:
        return flux_i2i_cost() if mode == "i2i" else flux_t2i_cost()


__all__ = [
    "SiliconFlowImageProvider",
    "flux_t2i_cost",
    "flux_i2i_cost",
]
