"""Tests for generate_image tool — covers every ImageOperation."""

from __future__ import annotations

import pytest

from nucleus.providers._image_protocol import ImageResult
from nucleus.tools.generate_image import generate_image
from nucleus.tools.schemas import GenerateImageRequest, GenerateImageResponse


class _RecordingProvider:
    name = "flux_kontext_dev"

    def __init__(self) -> None:
        self.t2i_calls: list[tuple[str, int, int]] = []
        self.i2i_calls: list[tuple[str, str, float]] = []

    async def text_to_image(
        self, prompt: str, *, width: int = 1024, height: int = 1024
    ) -> ImageResult:
        self.t2i_calls.append((prompt, width, height))
        return ImageResult(
            image_url="https://img/t2i.png", cost_usd=0.02, provider=self.name
        )

    async def image_to_image(
        self,
        prompt: str,
        reference_image_url: str,
        *,
        strength: float = 0.7,
    ) -> ImageResult:
        self.i2i_calls.append((prompt, reference_image_url, strength))
        return ImageResult(
            image_url="https://img/i2i.png", cost_usd=0.03, provider=self.name
        )

    def estimate_cost(self, *, mode: str = "t2i") -> float:
        return 0.02 if mode == "t2i" else 0.03


async def test_text_to_image_operation(monkeypatch):
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
    provider = _RecordingProvider()
    req = GenerateImageRequest(prompt="hero", operation="text_to_image")
    resp = await generate_image(req, provider=provider)
    assert isinstance(resp, GenerateImageResponse)
    assert resp.image_url == "https://img/t2i.png"
    assert resp.cost_usd == 0.02
    assert provider.i2i_calls == []
    assert provider.t2i_calls == [("hero", 1024, 1024)]
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")


async def test_upscale_uses_low_strength_default(monkeypatch):
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
    provider = _RecordingProvider()
    req = GenerateImageRequest(
        prompt="sharpen", operation="upscale", reference_image_url="https://ref"
    )
    await generate_image(req, provider=provider)
    assert provider.i2i_calls == [("sharpen", "https://ref", 0.3)]
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")


async def test_theme_transition_uses_medium_strength(monkeypatch):
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
    provider = _RecordingProvider()
    req = GenerateImageRequest(
        prompt="to winter",
        operation="theme_transition",
        reference_image_url="https://ref",
    )
    await generate_image(req, provider=provider)
    assert provider.i2i_calls[0][2] == 0.6
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")


async def test_style_transfer_uses_high_strength(monkeypatch):
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
    provider = _RecordingProvider()
    req = GenerateImageRequest(
        prompt="anime",
        operation="style_transfer",
        reference_image_url="https://ref",
    )
    await generate_image(req, provider=provider)
    assert provider.i2i_calls[0][2] == 0.75
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")


async def test_explicit_strength_overrides_operation_default(monkeypatch):
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
    provider = _RecordingProvider()
    req = GenerateImageRequest(
        prompt="x",
        operation="upscale",
        reference_image_url="https://ref",
        strength=0.9,
    )
    await generate_image(req, provider=provider)
    assert provider.i2i_calls[0][2] == 0.9
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")


async def test_missing_reference_raises(monkeypatch):
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
    provider = _RecordingProvider()
    req = GenerateImageRequest(prompt="x", operation="style_transfer")
    with pytest.raises(ValueError):
        await generate_image(req, provider=provider)
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")
