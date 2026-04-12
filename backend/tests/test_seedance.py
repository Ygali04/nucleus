"""Tests for the Seedance 2.0 video provider."""

from __future__ import annotations

import pytest

from nucleus.providers.seedance import SeedanceProvider
from nucleus.providers._protocol import VideoProvider


@pytest.fixture(autouse=True)
def _enable_mock(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")


# ------------------------------------------------------------------
# Mock-mode tests
# ------------------------------------------------------------------


@pytest.mark.asyncio
async def test_seedance_mock_generate() -> None:
    provider = SeedanceProvider()
    result = await provider.generate("A product demo video", 5.0)
    assert result.provider == "seedance-2.0"
    assert result.cost_usd == pytest.approx(0.11, abs=0.01)
    assert result.video_url.startswith("s3://")
    assert result.duration_s == 5.0
    assert result.provider_job_id  # non-empty


@pytest.mark.asyncio
async def test_seedance_mock_with_reference_image() -> None:
    provider = SeedanceProvider()
    result = await provider.generate(
        "Product shot",
        10.0,
        reference_image="https://example.com/ref.jpg",
    )
    assert result.provider == "seedance-2.0"
    assert result.duration_s == 10.0
    assert result.cost_usd == pytest.approx(0.22, abs=0.01)


@pytest.mark.asyncio
async def test_seedance_duration_clamped() -> None:
    """Duration must be clamped to 15 s max."""
    provider = SeedanceProvider()
    result = await provider.generate("Long video", 30.0)
    assert result.duration_s == 15.0
    assert result.cost_usd == pytest.approx(0.33, abs=0.01)


@pytest.mark.asyncio
async def test_seedance_check_status_mock() -> None:
    provider = SeedanceProvider()
    status = await provider.check_status("fake-job-id")
    assert status.status == "completed"
    assert status.progress == 1.0


@pytest.mark.asyncio
async def test_seedance_get_result_mock() -> None:
    provider = SeedanceProvider()
    url = await provider.get_result("fake-job-id")
    assert url == "s3://mock/seedance.mp4"


def test_seedance_estimate_cost() -> None:
    provider = SeedanceProvider()
    assert provider.estimate_cost(5.0) == pytest.approx(0.11, abs=0.01)
    assert provider.estimate_cost(15.0) == pytest.approx(0.33, abs=0.01)
    # Clamped to 15 s
    assert provider.estimate_cost(20.0) == pytest.approx(0.33, abs=0.01)


def test_seedance_satisfies_protocol() -> None:
    assert isinstance(SeedanceProvider(), VideoProvider)
