"""Tests for ``nucleus.storage``.

We use ``moto`` in standalone server mode (``ThreadedMotoServer``) so that
``aioboto3``'s async client — which talks HTTP via ``aiobotocore`` — hits a
real endpoint instead of moto's in-process botocore patches (which only
intercept sync calls).
"""

from __future__ import annotations

import os
from collections.abc import Iterator

import pytest
from moto.server import ThreadedMotoServer

from nucleus import config as config_module
from nucleus import storage
from nucleus.storage import StorageError, make_key, parse_s3_uri


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="module")
def moto_server() -> Iterator[str]:
    """Spin up a moto HTTP server on an ephemeral port for the module."""
    server = ThreadedMotoServer(port=0)
    server.start()
    host, port = server.get_host_and_port()
    endpoint = f"http://{host}:{port}"
    try:
        yield endpoint
    finally:
        server.stop()


@pytest.fixture(autouse=True)
def _configure_storage(moto_server: str, monkeypatch: pytest.MonkeyPatch) -> None:
    """Point the storage client at the moto server and rebuild settings."""
    monkeypatch.setenv("S3_ENDPOINT_URL", moto_server)
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "testing")
    monkeypatch.setenv("S3_BUCKET", "nucleus-test")
    monkeypatch.setenv("S3_REGION", "us-east-1")
    monkeypatch.delenv("AWS_REGION", raising=False)

    config_module.reload_settings()


@pytest.fixture(autouse=True)
async def _bucket(_configure_storage: None) -> None:
    await storage.ensure_bucket()


# ---------------------------------------------------------------------------
# Pure helpers
# ---------------------------------------------------------------------------


class TestKeyHelpers:
    def test_make_key_canonical(self) -> None:
        assert make_key("job-1", "raw", "clip.mp4") == "jobs/job-1/raw/clip.mp4"

    def test_make_key_rejects_bad_kind(self) -> None:
        with pytest.raises(ValueError):
            make_key("job-1", "bogus", "clip.mp4")  # type: ignore[arg-type]

    def test_make_key_rejects_nested_filename(self) -> None:
        with pytest.raises(ValueError):
            make_key("job-1", "raw", "nested/clip.mp4")

    def test_parse_s3_uri_full(self) -> None:
        assert parse_s3_uri("s3://my-bucket/path/to/obj") == ("my-bucket", "path/to/obj")

    def test_parse_s3_uri_bare_key_uses_default_bucket(self) -> None:
        bucket, key = parse_s3_uri("jobs/abc/raw/x.mp4")
        assert bucket == "nucleus-test"
        assert key == "jobs/abc/raw/x.mp4"

    def test_parse_s3_uri_malformed(self) -> None:
        with pytest.raises(StorageError):
            parse_s3_uri("s3://only-bucket")


# ---------------------------------------------------------------------------
# Round-trip operations against moto
# ---------------------------------------------------------------------------


class TestStorageRoundTrip:
    async def test_upload_bytes_returns_uri_and_creates_object(self) -> None:
        key = make_key("job-1", "raw", "clip.mp4")
        uri = await storage.upload_bytes(key, b"hello", content_type="video/mp4")

        assert uri == "s3://nucleus-test/jobs/job-1/raw/clip.mp4"
        assert await storage.exists(key) is True

    async def test_upload_bytes_accepts_s3_uri_input(self) -> None:
        uri_in = "s3://nucleus-test/jobs/job-2/audio/voice.wav"
        uri_out = await storage.upload_bytes(uri_in, b"abc", content_type="audio/wav")
        assert uri_in == uri_out
        assert await storage.exists(uri_in) is True

    async def test_upload_file_and_download_to_path(self, tmp_path) -> None:
        src = tmp_path / "src.bin"
        src.write_bytes(b"payload-bytes")
        key = make_key("job-3", "composed", "out.bin")

        uri = await storage.upload_file(key, src)
        assert uri.endswith("/jobs/job-3/composed/out.bin")

        dst = tmp_path / "nested" / "dst.bin"
        await storage.download_to_path(key, dst)

        assert dst.read_bytes() == b"payload-bytes"

    async def test_upload_file_missing_local_path_raises(self, tmp_path) -> None:
        with pytest.raises(StorageError):
            await storage.upload_file(
                make_key("job-x", "raw", "missing.bin"),
                tmp_path / "does-not-exist",
            )

    async def test_presign_get_contains_bucket_and_key(self) -> None:
        key = make_key("job-4", "delivered", "final.mp4")
        await storage.upload_bytes(key, b"final", content_type="video/mp4")

        url = await storage.presign_get(key, expires=600)
        assert key in url
        assert "nucleus-test" in url
        # SigV4 presigned URLs always carry these query params.
        assert "X-Amz-Signature" in url
        assert "X-Amz-Expires=600" in url

    async def test_presign_put_contains_key(self) -> None:
        key = make_key("job-5", "edited", "v2.mp4")
        url = await storage.presign_put(key, expires=120)
        assert key in url
        assert "X-Amz-Signature" in url

    async def test_exists_false_for_missing_object(self) -> None:
        assert await storage.exists(make_key("job-6", "raw", "nope.mp4")) is False

    async def test_delete_removes_object(self) -> None:
        key = make_key("job-7", "music", "track.mp3")
        await storage.upload_bytes(key, b"mp3", content_type="audio/mpeg")
        assert await storage.exists(key) is True

        await storage.delete(key)
        assert await storage.exists(key) is False

    async def test_ensure_bucket_is_idempotent(self) -> None:
        await storage.ensure_bucket()
        await storage.ensure_bucket()  # second call must not raise


# ---------------------------------------------------------------------------
# Sanity: env plumbing
# ---------------------------------------------------------------------------


def test_settings_reads_s3_env() -> None:
    s = config_module.settings
    assert s.s3_bucket == "nucleus-test"
    assert s.s3_endpoint_url == os.environ["S3_ENDPOINT_URL"]
    assert s.effective_region == "us-east-1"
