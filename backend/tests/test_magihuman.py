"""Tests for the MagiHuman / daVinci-MagiHuman video provider."""

from __future__ import annotations

import pytest

from nucleus.providers.magihuman import MagiHumanProvider
from nucleus.providers._protocol import VideoProvider


@pytest.fixture(autouse=True)
def _enable_mock(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")


# ------------------------------------------------------------------
# Mock-mode tests
# ------------------------------------------------------------------


@pytest.mark.asyncio
async def test_magihuman_mock_generate() -> None:
    provider = MagiHumanProvider()
    result = await provider.generate(
        "Professional presenter",
        5.0,
        reference_image="https://example.com/face.jpg",
    )
    assert result.provider == "magihuman"
    assert result.cost_usd > 0
    assert result.cost_usd == pytest.approx(0.175, abs=0.01)
    assert result.video_url.startswith("s3://")
    assert result.duration_s == 5.0
    assert result.metadata["has_reference_image"] is True


@pytest.mark.asyncio
async def test_magihuman_mock_without_reference() -> None:
    provider = MagiHumanProvider()
    result = await provider.generate("Talking head video", 8.0)
    assert result.provider == "magihuman"
    assert result.metadata["has_reference_image"] is False


@pytest.mark.asyncio
async def test_magihuman_duration_clamped() -> None:
    """Duration must be clamped to 60 s max."""
    provider = MagiHumanProvider()
    result = await provider.generate("Long avatar clip", 90.0)
    assert result.duration_s == 60.0
    assert result.cost_usd == pytest.approx(2.10, abs=0.01)


@pytest.mark.asyncio
async def test_magihuman_check_status_mock() -> None:
    provider = MagiHumanProvider()
    status = await provider.check_status("fake-job-id")
    assert status.status == "completed"
    assert status.progress == 1.0


@pytest.mark.asyncio
async def test_magihuman_get_result_mock() -> None:
    provider = MagiHumanProvider()
    url = await provider.get_result("fake-job-id")
    assert url == "s3://mock/magihuman.mp4"


def test_magihuman_estimate_cost() -> None:
    provider = MagiHumanProvider()
    assert provider.estimate_cost(5.0) == pytest.approx(0.175, abs=0.01)
    assert provider.estimate_cost(60.0) == pytest.approx(2.10, abs=0.01)
    # Clamped to 60 s
    assert provider.estimate_cost(100.0) == pytest.approx(2.10, abs=0.01)


def test_magihuman_satisfies_protocol() -> None:
    assert isinstance(MagiHumanProvider(), VideoProvider)
