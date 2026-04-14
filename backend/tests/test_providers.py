"""Tests for the Nucleus provider abstraction layer.

All tests use mock providers by default (NUCLEUS_MOCK_PROVIDERS=true).
"""

from __future__ import annotations

import os

import pytest

# Force mock mode for the entire test suite
os.environ["NUCLEUS_MOCK_PROVIDERS"] = "true"

from nucleus.providers.base import AudioProvider, MusicProvider, VideoProvider
from nucleus.providers.mock import MockAudioProvider, MockMusicProvider, MockVideoProvider
from nucleus.providers.registry import ProviderRegistry
from nucleus.providers.types import AudioResult, GenerationResult, ProviderJobStatus


# ------------------------------------------------------------------
# Protocol conformance
# ------------------------------------------------------------------


class TestProtocolConformance:
    def test_mock_video_implements_protocol(self) -> None:
        provider = MockVideoProvider()
        assert isinstance(provider, VideoProvider)

    def test_mock_audio_implements_protocol(self) -> None:
        provider = MockAudioProvider()
        assert isinstance(provider, AudioProvider)

    def test_mock_music_implements_protocol(self) -> None:
        provider = MockMusicProvider()
        assert isinstance(provider, MusicProvider)


# ------------------------------------------------------------------
# Mock video provider
# ------------------------------------------------------------------


class TestMockVideoProvider:
    async def test_generate_returns_result(self) -> None:
        provider = MockVideoProvider()
        result = await provider.generate("A sunset over the ocean", duration_s=5.0)

        assert isinstance(result, GenerationResult)
        assert result.provider == "mock-video"
        assert result.duration_s == 5.0
        assert result.cost_usd == 0.0
        assert result.video_url.startswith("https://")
        assert result.provider_job_id.startswith("mock-")

    async def test_generate_with_all_params(self) -> None:
        provider = MockVideoProvider()
        result = await provider.generate(
            "A cat on a skateboard",
            duration_s=10.0,
            aspect_ratio="9:16",
            reference_image="https://example.com/cat.jpg",
            seed=42,
        )
        assert result.duration_s == 10.0
        assert result.metadata["aspect_ratio"] == "9:16"

    async def test_check_status_always_completed(self) -> None:
        provider = MockVideoProvider()
        status = await provider.check_status("mock-abc123")

        assert isinstance(status, ProviderJobStatus)
        assert status.status == "completed"
        assert status.progress == 1.0

    async def test_get_result_returns_url(self) -> None:
        provider = MockVideoProvider()
        url = await provider.get_result("mock-abc123")
        assert url.startswith("https://")

    def test_estimate_cost_is_zero(self) -> None:
        provider = MockVideoProvider()
        assert provider.estimate_cost(60.0) == 0.0


# ------------------------------------------------------------------
# Mock audio provider
# ------------------------------------------------------------------


class TestMockAudioProvider:
    async def test_generate_speech(self) -> None:
        provider = MockAudioProvider()
        result = await provider.generate_speech(
            "Hello, world!", voice_id="alloy"
        )

        assert isinstance(result, AudioResult)
        assert result.provider == "mock-audio"
        assert result.cost_usd == 0.0
        assert result.audio_url.startswith("https://")

    def test_estimate_cost_is_zero(self) -> None:
        provider = MockAudioProvider()
        assert provider.estimate_cost(500) == 0.0


# ------------------------------------------------------------------
# Mock music provider
# ------------------------------------------------------------------


class TestMockMusicProvider:
    async def test_generate_music(self) -> None:
        provider = MockMusicProvider()
        result = await provider.generate_music(
            "Upbeat corporate track", duration_s=30.0, mood="happy"
        )

        assert isinstance(result, AudioResult)
        assert result.provider == "mock-music"
        assert result.duration_s == 30.0

    def test_estimate_cost_is_zero(self) -> None:
        provider = MockMusicProvider()
        assert provider.estimate_cost(30.0) == 0.0


# ------------------------------------------------------------------
# Provider registry
# ------------------------------------------------------------------


class TestProviderRegistry:
    def test_registry_returns_mock_video_in_mock_mode(self) -> None:
        registry = ProviderRegistry()
        provider = registry.get_video_provider()
        assert provider.name == "mock-video"

    def test_registry_returns_mock_audio_in_mock_mode(self) -> None:
        registry = ProviderRegistry()
        provider = registry.get_audio_provider()
        assert provider.name == "mock-audio"

    def test_registry_returns_mock_music_in_mock_mode(self) -> None:
        registry = ProviderRegistry()
        provider = registry.get_music_provider()
        assert provider.name == "mock-music"

    def test_registry_explicit_mock_name(self) -> None:
        registry = ProviderRegistry()
        provider = registry.get_video_provider("mock")
        assert provider.name == "mock-video"

    def test_registry_unknown_falls_back_to_mock(self) -> None:
        registry = ProviderRegistry()
        provider = registry.get_video_provider("nonexistent")
        assert provider.name == "mock-video"


# ------------------------------------------------------------------
# Kling provider unit-level (import + cost estimation only)
# ------------------------------------------------------------------


class TestKlingProvider:
    def test_kling_requires_fal_key(self) -> None:
        """KlingVideoProvider should raise if FAL_KEY is missing."""
        original = os.environ.pop("FAL_KEY", None)
        try:
            from nucleus.providers.kling import KlingVideoProvider

            with pytest.raises(EnvironmentError, match="FAL_KEY"):
                KlingVideoProvider()
        finally:
            if original is not None:
                os.environ["FAL_KEY"] = original

    def test_kling_cost_estimation(self) -> None:
        """Verify the per-second pricing math without calling fal."""
        original = os.environ.get("FAL_KEY")
        os.environ["FAL_KEY"] = "test-key"
        try:
            from nucleus.providers.kling import KlingVideoProvider

            provider = KlingVideoProvider()
            assert provider.estimate_cost(10.0) == pytest.approx(0.84, abs=0.001)
            assert provider.estimate_cost(5.0) == pytest.approx(0.42, abs=0.001)
            assert provider.name == "kling-v3"
        finally:
            if original is None:
                del os.environ["FAL_KEY"]
            else:
                os.environ["FAL_KEY"] = original


# ------------------------------------------------------------------
# Default routing: kling / seedance / elevenlabs → ComfyUI
# ------------------------------------------------------------------


class TestDefaultRoutingToComfyUI:
    """Without NUCLEUS_USE_DIRECT_SDK, bare provider names route through ComfyUI."""

    def _clear_env(self, monkeypatch: pytest.MonkeyPatch) -> None:
        # Override the module-level ``NUCLEUS_MOCK_PROVIDERS=true`` so the
        # registry uses real (ComfyUI-backed) providers for these tests.
        monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
        monkeypatch.delenv("NUCLEUS_USE_DIRECT_SDK", raising=False)
        monkeypatch.setenv("FAL_KEY", "test-key")

    def test_get_provider_kling_returns_comfyui_by_default(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        self._clear_env(monkeypatch)
        from nucleus.providers import get_provider
        from nucleus.providers.comfyui_video import ComfyUIVideoProvider

        provider = get_provider("video", "kling")
        assert isinstance(provider, ComfyUIVideoProvider)
        assert provider.subtype == "kling"

    def test_get_provider_seedance_returns_comfyui_by_default(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        self._clear_env(monkeypatch)
        from nucleus.providers import get_provider
        from nucleus.providers.comfyui_video import ComfyUIVideoProvider

        provider = get_provider("video", "seedance")
        assert isinstance(provider, ComfyUIVideoProvider)
        assert provider.subtype == "seedance"

    def test_direct_sdk_opt_in_returns_kling_direct(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        self._clear_env(monkeypatch)
        monkeypatch.setenv("NUCLEUS_USE_DIRECT_SDK", "true")
        from nucleus.providers import get_provider
        from nucleus.providers.kling import KlingVideoProvider

        provider = get_provider("video", "kling")
        assert isinstance(provider, KlingVideoProvider)

    def test_video_kling_fully_qualified_always_comfyui(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Even with direct-SDK mode on, ``video:kling`` stays on ComfyUI."""
        self._clear_env(monkeypatch)
        monkeypatch.setenv("NUCLEUS_USE_DIRECT_SDK", "true")
        from nucleus.providers import get_provider
        from nucleus.providers.comfyui_video import ComfyUIVideoProvider

        provider = get_provider("video", "video:kling")
        assert isinstance(provider, ComfyUIVideoProvider)

    def test_elevenlabs_routes_to_comfyui_by_default(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        self._clear_env(monkeypatch)
        from nucleus.providers import get_provider
        from nucleus.providers.comfyui_audio import ComfyUIAudioProvider

        provider = get_provider("audio", "elevenlabs")
        assert isinstance(provider, ComfyUIAudioProvider)
        assert provider.subtype == "elevenlabs"

    def test_stable_audio_routes_to_comfyui_by_default(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        self._clear_env(monkeypatch)
        from nucleus.providers import get_provider
        from nucleus.providers.comfyui_audio import ComfyUIAudioProvider

        provider = get_provider("music", "stable_audio")
        assert isinstance(provider, ComfyUIAudioProvider)
        assert provider.subtype == "stable_audio"


# ------------------------------------------------------------------
# Result type validation
# ------------------------------------------------------------------


class TestResultTypes:
    def test_generation_result_defaults(self) -> None:
        r = GenerationResult(
            provider_job_id="j1",
            video_url="https://example.com/v.mp4",
            duration_s=5.0,
            cost_usd=0.42,
            provider="test",
        )
        assert r.metadata == {}

    def test_provider_job_status_defaults(self) -> None:
        s = ProviderJobStatus(provider_job_id="j1", status="pending")
        assert s.progress == 0.0
        assert s.error is None

    def test_audio_result_serialisation(self) -> None:
        a = AudioResult(
            audio_url="https://example.com/a.mp3",
            duration_s=3.0,
            cost_usd=0.01,
            provider="test",
        )
        data = a.model_dump()
        assert data["audio_url"] == "https://example.com/a.mp3"
