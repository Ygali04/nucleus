"""Nucleus provider abstraction layer.

Quick start::

    from nucleus.providers.registry import get_registry

    registry = get_registry()
    video = registry.get_video_provider()
    result = await video.generate("A cat riding a skateboard", duration_s=5.0)
"""

from nucleus.providers._types import AudioProvider, AudioResult, MusicProvider
from nucleus.providers.base import VideoProvider
from nucleus.providers.elevenlabs_provider import ElevenLabsProvider
from nucleus.providers.lyria import LyriaProvider
from nucleus.providers.registry import ProviderRegistry, get_registry
from nucleus.providers.types import GenerationResult, JobStatus, ProviderJobStatus

__all__ = [
    "AudioProvider",
    "AudioResult",
    "ElevenLabsProvider",
    "GenerationResult",
    "JobStatus",
    "LyriaProvider",
    "MusicProvider",
    "ProviderJobStatus",
    "ProviderRegistry",
    "VideoProvider",
    "get_registry",
]
