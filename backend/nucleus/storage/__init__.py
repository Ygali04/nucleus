"""Shared async storage layer for Nucleus.

Example::

    from nucleus.storage import upload_bytes, make_key

    key = make_key(job_id, "raw", "clip.mp4")
    uri = await upload_bytes(key, data, content_type="video/mp4")

``ensure_bucket()`` should be called once during FastAPI lifespan startup
rather than on every storage operation.
"""

from __future__ import annotations

from typing import Literal

from nucleus.storage.s3 import (
    StorageError,
    delete,
    download_to_path,
    ensure_bucket,
    exists,
    parse_s3_uri,
    presign_get,
    presign_put,
    to_uri,
    upload_bytes,
    upload_file,
)

Kind = Literal["raw", "composed", "edited", "delivered", "audio", "music"]
_VALID_KINDS: frozenset[str] = frozenset(
    {"raw", "composed", "edited", "delivered", "audio", "music"}
)


def make_key(job_id: str, kind: Kind | str, filename: str) -> str:
    """Build the canonical object key ``jobs/{job_id}/{kind}/{filename}``."""
    if not job_id:
        raise ValueError("job_id is required")
    if kind not in _VALID_KINDS:
        raise ValueError(f"invalid kind {kind!r}; expected one of {sorted(_VALID_KINDS)}")
    if not filename or "/" in filename:
        raise ValueError(f"invalid filename {filename!r}")
    return f"jobs/{job_id}/{kind}/{filename}"


__all__ = [
    "StorageError",
    "delete",
    "download_to_path",
    "ensure_bucket",
    "exists",
    "make_key",
    "parse_s3_uri",
    "presign_get",
    "presign_put",
    "to_uri",
    "upload_bytes",
    "upload_file",
]
