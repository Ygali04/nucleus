"""Tests for the generate_storyboard tool."""

from __future__ import annotations

import os

import pytest

from nucleus.providers._image_protocol import ImageResult
from nucleus.tools.generate_storyboard import (
    expand_shots,
    generate_storyboard,
)
from nucleus.tools.schemas import (
    GenerateStoryboardRequest,
    GenerateStoryboardResponse,
)


class _RecordingProvider:
    name = "flux_kontext_dev"

    def __init__(self, cost: float = 0.02) -> None:
        self.cost = cost
        self.calls: list[tuple[str, int, int]] = []

    async def text_to_image(
        self, prompt: str, *, width: int = 1024, height: int = 1024
    ) -> ImageResult:
        self.calls.append((prompt, width, height))
        return ImageResult(
            image_url=f"https://img/{len(self.calls)}.png",
            cost_usd=self.cost,
            provider=self.name,
        )

    async def image_to_image(self, *a, **kw) -> ImageResult:  # pragma: no cover
        raise AssertionError("unexpected i2i call")

    def estimate_cost(self, *, mode: str = "t2i") -> float:
        return self.cost


async def test_mock_mode_returns_fixture_urls(monkeypatch):
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")
    req = GenerateStoryboardRequest(prompt="brand hero ad", frame_count=3)
    resp = await generate_storyboard(req)
    assert isinstance(resp, GenerateStoryboardResponse)
    assert len(resp.image_urls) == 3
    assert resp.cost_usd == 0.0
    assert resp.provider == "flux_kontext_dev"


async def test_real_mode_calls_provider_per_frame(monkeypatch):
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
    provider = _RecordingProvider(cost=0.02)
    req = GenerateStoryboardRequest(prompt="brand ad", frame_count=4)
    resp = await generate_storyboard(req, provider=provider)

    assert len(provider.calls) == 4
    assert len(resp.image_urls) == 4
    assert resp.cost_usd == pytest.approx(0.08)
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")


async def test_response_conforms_to_schema(monkeypatch):
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
    provider = _RecordingProvider()
    req = GenerateStoryboardRequest(prompt="x", frame_count=2)
    resp = await generate_storyboard(req, provider=provider)
    # Round-trip via model_validate ensures the schema matches.
    GenerateStoryboardResponse.model_validate(resp.model_dump())
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")


async def test_aspect_ratio_maps_to_dimensions(monkeypatch):
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
    provider = _RecordingProvider()
    req = GenerateStoryboardRequest(
        prompt="x", frame_count=1, aspect_ratio="9:16"
    )
    await generate_storyboard(req, provider=provider)
    _, w, h = provider.calls[0]
    assert (w, h) == (576, 1024)
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")


def test_expand_shots_templates_prompt():
    shots = expand_shots("hero brand", 3, style_hints="cinematic, teal")
    assert len(shots) == 3
    assert "Shot 1" in shots[0]
    assert "hero brand" in shots[0]
    assert "cinematic, teal" in shots[0]


def test_expand_shots_cycles_templates():
    shots = expand_shots("x", 6)
    # 4 templates — 5th and 6th should cycle back.
    assert "Shot 5" in shots[4]
    assert "Shot 6" in shots[5]
