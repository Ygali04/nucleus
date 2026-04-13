"""Config-driven provider registry.

Reads provider selection from environment variables and falls back to
mock providers when ``NUCLEUS_MOCK_PROVIDERS=true``.
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import TypeVar

from nucleus.config import is_mock as _use_mocks
from nucleus.providers.base import AudioProvider, MusicProvider, VideoProvider
from nucleus.providers.mock import MockAudioProvider, MockMusicProvider, MockVideoProvider

_T = TypeVar("_T")


class ProviderRegistry:
    """Central registry that hands out concrete provider instances."""

    def __init__(self) -> None:
        self._video_providers: dict[str, VideoProvider] = {}
        self._audio_providers: dict[str, AudioProvider] = {}
        self._music_providers: dict[str, MusicProvider] = {}

        self._bootstrap()

    # ------------------------------------------------------------------
    # Internal setup
    # ------------------------------------------------------------------

    def _bootstrap(self) -> None:
        """Register providers based on environment configuration."""
        # Always register mocks so they're available for testing
        self._video_providers["mock"] = MockVideoProvider()
        self._audio_providers["mock"] = MockAudioProvider()
        self._music_providers["mock"] = MockMusicProvider()

        if _use_mocks():
            # In mock mode every name routes to the mock provider.
            return

        self._register_real_providers()

    def _register_real_providers(self) -> None:
        # --- video ---
        try:
            from nucleus.providers.kling import KlingVideoProvider

            self._video_providers["kling"] = KlingVideoProvider()
        except EnvironmentError:
            pass

        # Seedance + MagiHuman don't raise on construction even without keys;
        # they just fail at generate() time.  Safe to register eagerly.
        from nucleus.providers.magihuman import MagiHumanProvider
        from nucleus.providers.seedance import SeedanceProvider

        self._video_providers["seedance"] = SeedanceProvider()
        self._video_providers["magihuman"] = MagiHumanProvider()

        video_backend = os.environ.get("NUCLEUS_VIDEO_PROVIDER", "kling")
        if video_backend in self._video_providers:
            self._video_providers["default"] = self._video_providers[video_backend]

        # --- audio / music ---
        from nucleus.providers.elevenlabs_provider import ElevenLabsProvider
        from nucleus.providers.lyria import LyriaProvider

        self._audio_providers["elevenlabs"] = ElevenLabsProvider()
        self._audio_providers["default"] = self._audio_providers["elevenlabs"]

        self._music_providers["lyria"] = LyriaProvider()
        self._music_providers["default"] = self._music_providers["lyria"]

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    @staticmethod
    def _resolve(registry: dict[str, _T], name: str, kind: str) -> _T:
        """Look up a provider by *name*, falling back to ``"mock"``."""
        # Re-check the toggle on every lookup so flipping it at runtime
        # (e.g. between tests) immediately routes to the mock provider.
        if _use_mocks():
            name = "mock"
        provider = registry.get(name) or registry.get("mock")
        if provider is None:
            raise LookupError(f"No {kind} provider registered for '{name}'")
        return provider

    def get_video_provider(self, name: str = "default") -> VideoProvider:
        return self._resolve(self._video_providers, name, "video")

    def get_audio_provider(self, name: str = "default") -> AudioProvider:
        return self._resolve(self._audio_providers, name, "audio")

    def get_music_provider(self, name: str = "default") -> MusicProvider:
        return self._resolve(self._music_providers, name, "music")


@lru_cache(maxsize=1)
def get_registry() -> ProviderRegistry:
    """Module-level singleton for the provider registry."""
    return ProviderRegistry()
