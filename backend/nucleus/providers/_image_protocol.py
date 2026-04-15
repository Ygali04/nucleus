"""Minimal Protocol for image-generation providers."""

from __future__ import annotations

from typing import Protocol, runtime_checkable

from pydantic import BaseModel


class ImageResult(BaseModel):
    """Outcome of a single image generation call."""

    image_url: str
    cost_usd: float
    provider: str


@runtime_checkable
class ImageProvider(Protocol):
    """Protocol every image provider must satisfy."""

    name: str

    async def text_to_image(
        self,
        prompt: str,
        *,
        width: int = 1024,
        height: int = 1024,
    ) -> ImageResult: ...

    async def image_to_image(
        self,
        prompt: str,
        reference_image_url: str,
        *,
        strength: float = 0.7,
    ) -> ImageResult: ...

    def estimate_cost(self, *, mode: str = "t2i") -> float: ...
