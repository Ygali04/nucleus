"""Central runtime settings for Nucleus.

Values are read from environment variables at import time. Keep this module
dependency-free (stdlib only) so any subpackage can import it without pulling
in provider SDKs.
"""

from __future__ import annotations

import os


def _env(key: str, default: str) -> str:
    value = os.environ.get(key)
    return value if value not in (None, "") else default


def _env_float(key: str, default: float) -> float:
    raw = os.environ.get(key)
    if raw is None or raw == "":
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def neuropeer_base_url() -> str:
    """Base URL for the NeuroPeer neural-analysis API.

    Defaults to the local dev server (port 8001) — NOT 8000, which is Nucleus.
    """
    return _env("NEUROPEER_BASE_URL", "http://localhost:8001").rstrip("/")


def neuropeer_timeout_seconds() -> float:
    """HTTP timeout (seconds) for NeuroPeer calls."""
    return _env_float("NEUROPEER_TIMEOUT_SECONDS", 300.0)


def neuropeer_api_key() -> str | None:
    """Optional bearer token — unused today but reserved for when the server
    starts requiring auth. Kept here so callers don't need to duplicate the env
    lookup."""
    value = os.environ.get("NEUROPEER_API_KEY")
    return value if value else None
