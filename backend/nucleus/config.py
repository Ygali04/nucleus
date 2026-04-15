"""Centralized configuration for the Nucleus backend.

All environment variable reads should funnel through the module-level
``settings`` instance so tool/provider modules don't scatter
``os.environ.get`` calls. Pydantic validates types and supplies defaults.

Usage::

    from nucleus.config import settings, is_mock, neuropeer_base_url

    bucket = settings.s3_bucket
    if is_mock():
        ...
"""

from __future__ import annotations

import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration, populated from the process environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Storage (S3 / MinIO) -------------------------------------------------
    s3_endpoint_url: str | None = None
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    s3_bucket: str = "nucleus-media"
    # Accept either ``S3_REGION`` (preferred) or the standard ``AWS_REGION``.
    s3_region: str = "us-east-1"
    aws_region: str | None = None

    # --- Core services --------------------------------------------------------
    database_url: str | None = None
    redis_url: str = "redis://localhost:6379/0"

    # --- Providers ------------------------------------------------------------
    nucleus_mock_providers: bool = False
    nucleus_video_provider: str = "kling"
    fal_key: str | None = None
    elevenlabs_api_key: str | None = None
    google_cloud_project: str | None = None
    wavespeed_api_key: str | None = None
    atlas_cloud_api_key: str | None = None
    siliconflow_key: str | None = None
    glm_key: str | None = None

    # --- NeuroPeer ------------------------------------------------------------
    neuropeer_base_url: str = "http://localhost:8001"
    neuropeer_timeout_seconds: float = 300.0
    neuropeer_api_key: str | None = None

    # --- ComfyUI --------------------------------------------------------------
    comfyui_base_url: str = "http://localhost:8188"

    @property
    def effective_region(self) -> str:
        """Use ``AWS_REGION`` when set (docker-compose convention), else ``S3_REGION``."""
        return self.aws_region or self.s3_region


@lru_cache(maxsize=1)
def _build_settings() -> Settings:
    return Settings()


# Module-level singleton. Re-import ``settings`` anywhere you need config.
settings: Settings = _build_settings()


def reload_settings() -> Settings:
    """Rebuild settings from the current environment (test helper)."""
    _build_settings.cache_clear()
    global settings
    settings = _build_settings()
    return settings


# --- Backward-compat thin wrappers (callers from WU-J and WU-F) -------------
def _bool_env(name: str) -> bool | None:
    """Parse a boolean env var; return None when unset."""
    raw = os.environ.get(name)
    if raw is None:
        return None
    return raw.strip().lower() in ("1", "true", "yes", "on")


def is_mock() -> bool:
    """Return True when every provider should return canned fixtures.

    Reads live so tests that ``monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", ...)``
    see the change without rebuilding the settings singleton.
    """
    parsed = _bool_env("NUCLEUS_MOCK_PROVIDERS")
    if parsed is not None:
        return parsed
    return bool(settings.nucleus_mock_providers)


def _mock_provider(name: str) -> bool:
    """Per-provider mock flag. Defaults to ``is_mock()`` when unset."""
    parsed = _bool_env(name)
    if parsed is not None:
        return parsed
    return is_mock()


def is_mock_video() -> bool:
    """Whether the video tool (Kling/Seedance/Veo) should return mock data."""
    return _mock_provider("NUCLEUS_MOCK_VIDEO")


def is_mock_audio() -> bool:
    """Whether the audio tool (ElevenLabs) should return mock data."""
    return _mock_provider("NUCLEUS_MOCK_AUDIO")


def is_mock_image() -> bool:
    """Whether the image tool (flux/SiliconFlow) should return mock data."""
    return _mock_provider("NUCLEUS_MOCK_IMAGE")


def is_mock_music() -> bool:
    """Whether the music tool (Lyria) should return mock data."""
    return _mock_provider("NUCLEUS_MOCK_MUSIC")


def is_mock_score() -> bool:
    """Whether NeuroPeer scoring should return mock data."""
    return _mock_provider("NUCLEUS_MOCK_SCORE")


def is_mock_ruflo() -> bool:
    """Whether the Ruflo brain (GLM) should be short-circuited."""
    return _mock_provider("NUCLEUS_MOCK_RUFLO")


def is_mock_comfyui() -> bool:
    """Whether the ComfyUI workflow executor should return mock data.

    Treated as "any generation mock is on" — if video, audio, image, or music
    is mocked, we short-circuit the ComfyUI workflow runner too since every
    generator funnels through it.
    """
    parsed = _bool_env("NUCLEUS_MOCK_COMFYUI")
    if parsed is not None:
        return parsed
    return is_mock() or is_mock_video() or is_mock_audio() or is_mock_image() or is_mock_music()


def fal_key() -> str:
    return os.environ.get("FAL_KEY") or settings.fal_key or ""


def elevenlabs_api_key() -> str:
    return os.environ.get("ELEVENLABS_API_KEY") or settings.elevenlabs_api_key or ""


def google_cloud_project() -> str:
    return os.environ.get("GOOGLE_CLOUD_PROJECT") or settings.google_cloud_project or ""


def wavespeed_api_key() -> str:
    return os.environ.get("WAVESPEED_API_KEY") or settings.wavespeed_api_key or ""


def atlas_cloud_api_key() -> str:
    return os.environ.get("ATLAS_CLOUD_API_KEY") or settings.atlas_cloud_api_key or ""


def siliconflow_key() -> str:
    """Return the SiliconFlow API key (env live first, falls back to settings)."""
    return os.environ.get("SILICONFLOW_KEY") or settings.siliconflow_key or ""


def glm_key() -> str:
    """Return the Zhipu GLM API key (env live first, falls back to settings)."""
    return os.environ.get("GLM_KEY") or settings.glm_key or ""


def neuropeer_base_url() -> str:
    """Base URL for NeuroPeer (defaults to local dev on port 8001, not 8000)."""
    # Read live so tests that monkeypatch env see the change.
    return os.environ.get("NEUROPEER_BASE_URL", settings.neuropeer_base_url).rstrip("/")


def neuropeer_timeout_seconds() -> float:
    raw = os.environ.get("NEUROPEER_TIMEOUT_SECONDS")
    if raw:
        try:
            return float(raw)
        except ValueError:
            pass
    return float(settings.neuropeer_timeout_seconds)


def neuropeer_api_key() -> str | None:
    value = os.environ.get("NEUROPEER_API_KEY")
    if value:
        return value
    return settings.neuropeer_api_key


def comfyui_base_url() -> str:
    """Base URL for the ComfyUI execution service.

    Reads live so tests that ``monkeypatch.setenv("COMFYUI_BASE_URL", ...)``
    see the change without rebuilding the settings singleton.
    """
    return os.environ.get("COMFYUI_BASE_URL", settings.comfyui_base_url).rstrip("/")


__all__ = [
    "Settings",
    "settings",
    "reload_settings",
    "is_mock",
    "is_mock_video",
    "is_mock_audio",
    "is_mock_image",
    "is_mock_music",
    "is_mock_score",
    "is_mock_ruflo",
    "is_mock_comfyui",
    "fal_key",
    "elevenlabs_api_key",
    "google_cloud_project",
    "wavespeed_api_key",
    "atlas_cloud_api_key",
    "siliconflow_key",
    "glm_key",
    "neuropeer_base_url",
    "neuropeer_timeout_seconds",
    "neuropeer_api_key",
    "comfyui_base_url",
]
