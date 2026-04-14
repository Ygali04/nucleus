"""Nucleus provider abstraction layer.

Quick start::

    from nucleus.providers import get_provider

    video = get_provider("video", "kling")
    result = await video.generate("A cat riding a skateboard", duration_s=5.0)

When ``NUCLEUS_MOCK_PROVIDERS=true`` every lookup resolves to the matching
mock provider regardless of ``subtype``.
"""

from __future__ import annotations

from typing import Literal

from nucleus.config import is_mock
from nucleus.providers._types import AudioProvider, AudioResult, MusicProvider
from nucleus.providers.base import VideoProvider
from nucleus.providers.comfyui_audio import ComfyUIAudioProvider
from nucleus.providers.comfyui_video import ComfyUIVideoProvider
from nucleus.providers.elevenlabs_provider import ElevenLabsProvider
from nucleus.providers.lyria import LyriaProvider
from nucleus.providers.magihuman import MagiHumanProvider
from nucleus.providers.registry import ProviderRegistry, get_registry
from nucleus.providers.seedance import SeedanceProvider
from nucleus.providers.types import GenerationResult, JobStatus, ProviderJobStatus

ProviderKind = Literal["video", "audio", "music"]


def get_provider(
    kind: ProviderKind,
    subtype: str | None = None,
) -> VideoProvider | AudioProvider | MusicProvider:
    """Return the provider instance matching *kind* + *subtype*.

    - ``kind`` is one of ``"video"``, ``"audio"``, ``"music"``.
    - ``subtype`` names the concrete backend (``"kling"``, ``"seedance"``,
      ``"magihuman"``, ``"elevenlabs"``, ``"lyria"``, ``"mock"``).  Unknown
      subtypes fall back to the mock provider.
    - When ``NUCLEUS_MOCK_PROVIDERS=true`` every call returns the mock
      provider for the requested kind, ignoring *subtype*.
    """
    registry = get_registry()
    if is_mock():
        name = "mock"
    elif subtype is None:
        name = "default"
    elif ":" in subtype:
        # Fully-qualified key like "video:svd" — use as-is.
        name = subtype
    else:
        name = subtype

    if kind == "video":
        return registry.get_video_provider(name)
    if kind == "audio":
        return registry.get_audio_provider(name)
    if kind == "music":
        return registry.get_music_provider(name)
    raise ValueError(f"Unknown provider kind: {kind!r}")


def verify_provider_registry() -> dict[str, list[str]]:
    """Instantiate the registry at app startup to catch import-time errors.

    Called from ``nucleus.app`` lifespan so a typo in a provider class name
    or a broken import surfaces immediately instead of crashing the first
    request that happens to reach that provider.

    Returns a summary dict of ``{"video": [...], "audio": [...], "music": [...]}``
    listing the registered keys — useful for debugging / health checks.
    """
    import logging

    logger = logging.getLogger(__name__)

    registry = get_registry()
    summary = {
        "video": sorted(registry._video_providers.keys()),
        "audio": sorted(registry._audio_providers.keys()),
        "music": sorted(registry._music_providers.keys()),
    }
    logger.info("Provider registry verified: %s", summary)
    return summary


__all__ = [
    "AudioProvider",
    "AudioResult",
    "ComfyUIAudioProvider",
    "ComfyUIVideoProvider",
    "ElevenLabsProvider",
    "GenerationResult",
    "JobStatus",
    "LyriaProvider",
    "MagiHumanProvider",
    "MusicProvider",
    "ProviderJobStatus",
    "ProviderRegistry",
    "SeedanceProvider",
    "VideoProvider",
    "get_provider",
    "get_registry",
    "verify_provider_registry",
]
