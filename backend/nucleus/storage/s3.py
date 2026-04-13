"""Async S3 / MinIO client used across Nucleus tools.

Thin wrapper over ``aioboto3``:

* reads all configuration from :mod:`nucleus.config`,
* speaks ``s3://bucket/key`` URIs at the public API boundary,
* uses SigV4 so it stays compatible with MinIO.
"""

from __future__ import annotations

from collections.abc import Iterable
from pathlib import Path

import aioboto3
from boto3.session import Config
from botocore.exceptions import ClientError

from nucleus import config as _config


class StorageError(RuntimeError):
    """Raised when an S3 operation fails."""


# ---------------------------------------------------------------------------
# URI helpers
# ---------------------------------------------------------------------------


def parse_s3_uri(uri_or_key: str) -> tuple[str, str]:
    """Split ``s3://bucket/key`` or a bare ``key`` into ``(bucket, key)``.

    A bare key falls back to the configured default bucket.
    """
    if not uri_or_key:
        raise StorageError("Empty S3 URI/key")

    if uri_or_key.startswith("s3://"):
        bucket, _, key = uri_or_key.removeprefix("s3://").partition("/")
        if not bucket or not key:
            raise StorageError(f"Malformed S3 URI: {uri_or_key!r}")
        return bucket, key

    return _config.settings.s3_bucket, uri_or_key.lstrip("/")


def to_uri(bucket: str, key: str) -> str:
    return f"s3://{bucket}/{key}"


# ---------------------------------------------------------------------------
# Client plumbing
# ---------------------------------------------------------------------------


def _client_ctx():
    """Async context manager yielding a configured S3 client."""
    s = _config.settings
    session = aioboto3.Session(
        aws_access_key_id=s.aws_access_key_id,
        aws_secret_access_key=s.aws_secret_access_key,
        region_name=s.effective_region,
    )
    return session.client(
        "s3",
        endpoint_url=s.s3_endpoint_url,
        config=Config(signature_version="s3v4"),
    )


def _client_error_code(exc: ClientError) -> str:
    return exc.response.get("Error", {}).get("Code", "")


def _wrap(op: str, bucket: str, key: str, exc: ClientError) -> StorageError:
    return StorageError(f"{op}({bucket}/{key}) failed: {exc}")


# ---------------------------------------------------------------------------
# Operations
# ---------------------------------------------------------------------------


async def ensure_bucket() -> None:
    """Create the configured bucket if it doesn't exist.

    Idempotent. Call once at FastAPI lifespan startup — not on every op.
    """
    bucket = _config.settings.s3_bucket
    _missing: Iterable[str] = ("404", "NoSuchBucket", "NotFound")
    _already: Iterable[str] = ("BucketAlreadyOwnedByYou", "BucketAlreadyExists")

    async with _client_ctx() as client:
        try:
            await client.head_bucket(Bucket=bucket)
            return
        except ClientError as exc:
            if _client_error_code(exc) not in _missing:
                raise _wrap("head_bucket", bucket, "", exc) from exc
        try:
            await client.create_bucket(Bucket=bucket)
        except ClientError as exc:
            if _client_error_code(exc) in _already:
                return
            raise _wrap("create_bucket", bucket, "", exc) from exc


async def upload_bytes(
    key: str,
    data: bytes,
    content_type: str = "application/octet-stream",
) -> str:
    """Upload ``data`` and return the ``s3://`` URI."""
    bucket, key = parse_s3_uri(key)
    async with _client_ctx() as client:
        try:
            await client.put_object(
                Bucket=bucket,
                Key=key,
                Body=data,
                ContentType=content_type,
            )
        except ClientError as exc:
            raise _wrap("upload_bytes", bucket, key, exc) from exc
    return to_uri(bucket, key)


async def upload_file(key: str, local_path: str | Path) -> str:
    """Upload a file from disk and return the ``s3://`` URI."""
    bucket, key = parse_s3_uri(key)
    path = Path(local_path)
    # Pre-check: distinguishes "local file missing" from S3-side errors for callers.
    if not path.is_file():
        raise StorageError(f"upload_file: local path not found: {path}")
    async with _client_ctx() as client:
        try:
            await client.upload_file(str(path), bucket, key)
        except ClientError as exc:
            raise _wrap("upload_file", bucket, key, exc) from exc
    return to_uri(bucket, key)


async def download_to_path(key: str, local_path: str | Path) -> None:
    """Download an object to ``local_path`` (parents created as needed)."""
    bucket, key = parse_s3_uri(key)
    path = Path(local_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    async with _client_ctx() as client:
        try:
            await client.download_file(bucket, key, str(path))
        except ClientError as exc:
            raise _wrap("download_to_path", bucket, key, exc) from exc


async def presign_get(key: str, expires: int = 3600) -> str:
    bucket, key = parse_s3_uri(key)
    async with _client_ctx() as client:
        try:
            return await client.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket, "Key": key},
                ExpiresIn=expires,
            )
        except ClientError as exc:
            raise _wrap("presign_get", bucket, key, exc) from exc


async def presign_put(key: str, expires: int = 3600) -> str:
    bucket, key = parse_s3_uri(key)
    async with _client_ctx() as client:
        try:
            return await client.generate_presigned_url(
                "put_object",
                Params={"Bucket": bucket, "Key": key},
                ExpiresIn=expires,
            )
        except ClientError as exc:
            raise _wrap("presign_put", bucket, key, exc) from exc


async def exists(key: str) -> bool:
    bucket, key = parse_s3_uri(key)
    async with _client_ctx() as client:
        try:
            await client.head_object(Bucket=bucket, Key=key)
            return True
        except ClientError as exc:
            if _client_error_code(exc) in {"404", "NoSuchKey", "NotFound"}:
                return False
            raise _wrap("exists", bucket, key, exc) from exc


async def delete(key: str) -> None:
    bucket, key = parse_s3_uri(key)
    async with _client_ctx() as client:
        try:
            await client.delete_object(Bucket=bucket, Key=key)
        except ClientError as exc:
            raise _wrap("delete", bucket, key, exc) from exc


__all__ = [
    "StorageError",
    "parse_s3_uri",
    "to_uri",
    "ensure_bucket",
    "upload_bytes",
    "upload_file",
    "download_to_path",
    "presign_get",
    "presign_put",
    "exists",
    "delete",
]
