"""Nucleus provider abstraction layer.

Quick start::

    from nucleus.providers.registry import get_registry

    registry = get_registry()
    video = registry.get_video_provider()
    result = await video.generate("A cat riding a skateboard", duration_s=5.0)
"""

from nucleus.providers.base import AudioProvider, MusicProvider, VideoProvider
from nucleus.providers.registry import ProviderRegistry, get_registry
from nucleus.providers.types import AudioResult, GenerationResult, JobStatus, ProviderJobStatus

__all__ = [
    "AudioProvider",
    "AudioResult",
    "GenerationResult",
    "JobStatus",
    "MusicProvider",
    "ProviderJobStatus",
    "ProviderRegistry",
    "VideoProvider",
    "get_registry",
]
