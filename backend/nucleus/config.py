"""Central env configuration for Nucleus.

Every provider / tool that needs an env var should read it via the helpers
here so we have a single place to change behaviour (e.g. flipping the global
``NUCLEUS_MOCK_PROVIDERS`` toggle).
"""

from __future__ import annotations

import os

__all__ = [
    "elevenlabs_api_key",
    "fal_key",
    "google_cloud_project",
    "is_mock",
    "wavespeed_api_key",
    "atlas_cloud_api_key",
]


def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


def is_mock() -> bool:
    """Return True when every provider should return canned fixtures."""
    return _env_bool("NUCLEUS_MOCK_PROVIDERS", default=False)


def fal_key() -> str:
    return os.environ.get("FAL_KEY", "")


def elevenlabs_api_key() -> str:
    return os.environ.get("ELEVENLABS_API_KEY", "")


def google_cloud_project() -> str:
    return os.environ.get("GOOGLE_CLOUD_PROJECT", "")


def wavespeed_api_key() -> str:
    return os.environ.get("WAVESPEED_API_KEY", "")


def atlas_cloud_api_key() -> str:
    return os.environ.get("ATLAS_CLOUD_API_KEY", "")
