"""Config-driven provider registry.

Reads provider selection from environment variables and falls back to
mock providers when ``NUCLEUS_MOCK_PROVIDERS=true``.
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import TypeVar

from nucleus.config import is_mock as _use_mocks
from nucleus.providers._image_protocol import ImageProvider
from nucleus.providers.base import AudioProvider, MusicProvider, VideoProvider
from nucleus.providers.mock import MockAudioProvider, MockMusicProvider, MockVideoProvider
from nucleus.providers.siliconflow_image import SiliconFlowImageProvider

_T = TypeVar("_T")


def _use_direct_sdk() -> bool:
    """Opt-in flag to route bare provider names to direct-SDK providers.

    Default (unset/false) routes to ComfyUI-backed providers via the fal-API
    custom node.  Set ``NUCLEUS_USE_DIRECT_SDK=true`` to restore the previous
    direct-fal_client path.

    Read live so tests can flip the flag without rebuilding the registry.
    """
    raw = os.environ.get("NUCLEUS_USE_DIRECT_SDK")
    if raw is None:
        return False
    return raw.strip().lower() in ("1", "true", "yes", "on")


# Video subtypes where the ComfyUI fal-API custom node is the default path.
_COMFYUI_DEFAULT_VIDEO = ("kling", "seedance", "veo", "runway", "luma", "hailuo")
# Audio/music subtypes with a ComfyUI fal-API default.
_COMFYUI_DEFAULT_AUDIO = ("elevenlabs",)
_COMFYUI_DEFAULT_MUSIC = ("stable_audio",)


class ProviderRegistry:
    """Central registry that hands out concrete provider instances."""

    def __init__(self) -> None:
        self._video_providers: dict[str, VideoProvider] = {}
        self._audio_providers: dict[str, AudioProvider] = {}
        self._music_providers: dict[str, MusicProvider] = {}
        self._image_providers: dict[str, ImageProvider] = {}
        self._direct_sdk_mode: bool | None = None

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
        self._register_image_providers()

        if _use_mocks():
            # In mock mode every name routes to the mock provider.
            self._direct_sdk_mode = None
            return

        self._register_real_providers()
        self._direct_sdk_mode = _use_direct_sdk()

    def _register_real_providers(self) -> None:
        # Always register the ComfyUI-backed providers (both fully-qualified
        # ``video:kling`` keys and the bare ``kling`` default path when the
        # direct-SDK opt-in is not set).
        self._register_comfyui_providers()

        # Direct-SDK providers live under dedicated ``*_direct`` keys so they
        # stay reachable for tests, and under the bare name only when
        # ``NUCLEUS_USE_DIRECT_SDK=true``.
        self._register_direct_sdk_providers()

        # Pick the default video provider after both layers are registered.
        video_backend = os.environ.get("NUCLEUS_VIDEO_PROVIDER", "kling")
        if video_backend in self._video_providers:
            self._video_providers["default"] = self._video_providers[video_backend]

        if "elevenlabs" in self._audio_providers:
            self._audio_providers["default"] = self._audio_providers["elevenlabs"]
        if "lyria" in self._music_providers:
            self._music_providers["default"] = self._music_providers["lyria"]
        elif "stable_audio" in self._music_providers:
            self._music_providers["default"] = self._music_providers["stable_audio"]

    def _register_comfyui_providers(self) -> None:
        """Register ComfyUI-backed providers.

        Fully-qualified ``{kind}:{subtype}`` keys always point at ComfyUI so
        explicit opt-in (``get_provider("video", "video:kling")``) never flips.

        Bare subtype keys (``"kling"``) route to ComfyUI by default.  They are
        overwritten below when ``NUCLEUS_USE_DIRECT_SDK=true``.
        """
        from nucleus.providers.comfyui_audio import ComfyUIAudioProvider
        from nucleus.providers.comfyui_video import ComfyUIVideoProvider

        # Local ComfyUI-native video workflows.
        for sub in ("svd", "animatediff", "ltxv"):
            self._video_providers[f"video:{sub}"] = ComfyUIVideoProvider(subtype=sub)

        # fal-API-backed video (Kling, Seedance, Veo, Runway, Luma, Hailuo).
        for sub in _COMFYUI_DEFAULT_VIDEO:
            provider = ComfyUIVideoProvider(subtype=sub)
            self._video_providers[f"video:{sub}"] = provider
            self._video_providers[sub] = provider

        # Audio: local (whisper) + fal-API (elevenlabs).
        self._audio_providers["audio:whisper"] = ComfyUIAudioProvider(subtype="whisper")
        for sub in _COMFYUI_DEFAULT_AUDIO:
            provider_a = ComfyUIAudioProvider(subtype=sub)
            self._audio_providers[f"audio:{sub}"] = provider_a
            self._audio_providers[sub] = provider_a

        # Music: local (musicgen) + fal-API (stable_audio).
        self._music_providers["audio:musicgen"] = ComfyUIAudioProvider(subtype="musicgen")
        for sub in _COMFYUI_DEFAULT_MUSIC:
            provider_m = ComfyUIAudioProvider(subtype=sub)
            self._music_providers[f"music:{sub}"] = provider_m
            self._music_providers[sub] = provider_m

    def _register_direct_sdk_providers(self) -> None:
        """Register direct-SDK providers as fallback / opt-in targets.

        They always live under dedicated ``_direct`` keys.  When
        ``NUCLEUS_USE_DIRECT_SDK=true`` they additionally overwrite the bare
        subtype name so ``get_provider("video", "kling")`` returns the direct
        provider.

        Note: MagiHuman stays on direct-SDK permanently — there is no
        ComfyUI-fal-API node for it as of 2026-04-12, so the direct SDK
        fallback is the only path.
        """
        use_direct = _use_direct_sdk()

        try:
            from nucleus.providers.kling import KlingVideoProvider

            kling = KlingVideoProvider()
            self._video_providers["kling_direct"] = kling
            if use_direct:
                self._video_providers["kling"] = kling
        except EnvironmentError:
            pass

        from nucleus.providers.seedance import SeedanceProvider

        seedance = SeedanceProvider()
        self._video_providers["seedance_direct"] = seedance
        if use_direct:
            self._video_providers["seedance"] = seedance

        # MagiHuman: no ComfyUI-fal-API node as of 2026-04-12; direct SDK
        # fallback is the only path.  Kept out of the default registry to
        # avoid advertising a provider we can't route through ComfyUI.
        if use_direct:
            from nucleus.providers.magihuman import MagiHumanProvider

            self._video_providers["magihuman"] = MagiHumanProvider()

        # Audio / music
        from nucleus.providers.elevenlabs_provider import ElevenLabsProvider
        from nucleus.providers.lyria import LyriaProvider

        elevenlabs = ElevenLabsProvider()
        self._audio_providers["elevenlabs_direct"] = elevenlabs
        if use_direct:
            self._audio_providers["elevenlabs"] = elevenlabs

        lyria = LyriaProvider()
        self._music_providers["lyria"] = lyria  # no ComfyUI equivalent

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def _maybe_rebootstrap(self) -> None:
        """Re-run registration if mock / direct-SDK env toggles have changed
        since the last lookup.  Keeps tests that monkeypatch these flags
        consistent without forcing callers to clear the singleton cache.
        """
        if _use_mocks():
            current_direct = None
        else:
            current_direct = _use_direct_sdk()
        if current_direct != self._direct_sdk_mode:
            self._video_providers.clear()
            self._audio_providers.clear()
            self._music_providers.clear()
            self._bootstrap()

    def _resolve(self, registry: dict[str, _T], name: str, kind: str) -> _T:
        """Look up a provider by *name*, falling back to ``"mock"``."""
        self._maybe_rebootstrap()
        # Re-check the toggle on every lookup so flipping it at runtime
        # (e.g. between tests) immediately routes to the mock provider.
        if _use_mocks():
            name = "mock"
        provider = registry.get(name) or registry.get("mock")
        if provider is None:
            raise LookupError(f"No {kind} provider registered for '{name}'")
        return provider

    def _register_image_providers(self) -> None:
        """Register image providers.

        FLUX.1-Kontext-dev via SiliconFlow is the only one for now. It
        handles both text-to-image and image-to-image; two keys map to the
        same instance so callers can request by intent (``flux_t2i`` /
        ``flux_i2i``) while only one provider is instantiated.
        """
        flux = SiliconFlowImageProvider()
        self._image_providers["flux_t2i"] = flux
        self._image_providers["flux_i2i"] = flux
        self._image_providers["image:flux_t2i"] = flux
        self._image_providers["image:flux_i2i"] = flux
        self._image_providers["flux_kontext_dev"] = flux
        self._image_providers["default"] = flux

    def get_image_provider(self, name: str = "default") -> ImageProvider:
        self._maybe_rebootstrap()
        provider = self._image_providers.get(name) or self._image_providers.get(
            "default"
        )
        if provider is None:
            raise LookupError(f"No image provider registered for '{name}'")
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
