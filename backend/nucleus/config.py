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
def is_mock() -> bool:
    """Return True when every provider should return canned fixtures.

    Reads live so tests that ``monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", ...)``
    see the change without rebuilding the settings singleton.
    """
    raw = os.environ.get("NUCLEUS_MOCK_PROVIDERS")
    if raw is not None:
        return raw.strip().lower() in ("1", "true", "yes", "on")
    return bool(settings.nucleus_mock_providers)


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
    "fal_key",
    "elevenlabs_api_key",
    "google_cloud_project",
    "wavespeed_api_key",
    "atlas_cloud_api_key",
    "neuropeer_base_url",
    "neuropeer_timeout_seconds",
    "neuropeer_api_key",
    "comfyui_base_url",
]
