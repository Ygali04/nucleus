"""Tests for the compose_remotion tool.

Covers both mock mode (fast fixture path) and real mode, which talks to
the Remotion render server over HTTP and uploads the output. We stub the
HTTP call with httpx.MockTransport and monkeypatch the storage upload
helper so the tests never touch the filesystem or network.
"""

from __future__ import annotations

import json
import os

import httpx
import pytest

# Ensure the compose_remotion module imports cleanly even if other tests
# have mutated the env before this one.
os.environ.setdefault("NUCLEUS_MOCK_PROVIDERS", "true")

from nucleus.tools import compose_remotion as compose_remotion_mod
from nucleus.tools.compose_remotion import (
    ARCHETYPE_TO_COMPOSITION_ID,
    compose_remotion,
)
from nucleus.tools.schemas import ComposeRemotionRequest


def _manifest(archetype: str = "marketing") -> dict:
    return {
        "archetype": archetype,
        "scenes": [
            {"id": "s1", "type": "video_clip", "durationInFrames": 60,
             "videoUrl": "https://cdn.fal.ai/kling/abc.mp4"},
            {"id": "s2", "type": "text_overlay", "durationInFrames": 90,
             "text": "Hello"},
        ],
        "brandKit": {
            "primaryColor": "#000",
            "secondaryColor": "#fff",
            "accentColor": "#0ff",
            "fontFamily": "Inter",
            "name": "Test",
        },
        "totalDurationInFrames": 150,
    }


# ---------------------------------------------------------------------------
# Mock mode
# ---------------------------------------------------------------------------


async def test_mock_mode_returns_fixture_url(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")
    req = ComposeRemotionRequest(scene_manifest=_manifest(), template_id="tpl-1")

    resp = await compose_remotion(req)

    assert resp.video_url.startswith("s3://nucleus-mock/")
    assert resp.cost_usd == 0.0
    assert resp.duration_s == pytest.approx(150 / 30.0)


# ---------------------------------------------------------------------------
# Real mode — HTTP round-trip via MockTransport
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "archetype,expected_composition",
    list(ARCHETYPE_TO_COMPOSITION_ID.items()),
)
async def test_real_mode_posts_to_render_endpoint(
    monkeypatch: pytest.MonkeyPatch,
    archetype: str,
    expected_composition: str,
) -> None:
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
    monkeypatch.setenv("REMOTION_API_URL", "http://remotion.test:8089")

    captured: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["method"] = request.method
        captured["body"] = json.loads(request.content.decode())
        return httpx.Response(
            200,
            json={
                "success": True,
                "outputPath": captured["body"]["outputPath"],
                "durationMs": 1234,
            },
        )

    # Short-circuit storage so we never touch the filesystem.
    async def fake_upload(local_path: str, job_id: str, filename: str) -> str:
        captured["upload"] = {"local_path": local_path, "job_id": job_id,
                              "filename": filename}
        return f"s3://nucleus-media/jobs/{job_id}/composed/{filename}"

    monkeypatch.setattr(compose_remotion_mod, "_upload_to_storage", fake_upload)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        req = ComposeRemotionRequest(
            scene_manifest=_manifest(archetype), template_id="job-xyz"
        )
        resp = await compose_remotion(req, http_client=client, job_id="job-xyz")

    # HTTP contract
    assert captured["method"] == "POST"
    assert captured["url"] == "http://remotion.test:8089/render"

    body = captured["body"]
    assert body["compositionId"] == expected_composition
    # SceneManifest props are passed through verbatim
    assert body["props"]["archetype"] == archetype
    assert body["props"]["scenes"][0]["videoUrl"].startswith("https://")
    assert body["props"]["totalDurationInFrames"] == 150
    # Output path is deterministic and includes the composition id
    assert expected_composition in body["outputPath"]
    assert body["outputPath"].endswith(".mp4")

    # Storage upload receives the file the render server produced
    assert captured["upload"]["job_id"] == "job-xyz"
    assert captured["upload"]["filename"].endswith(".mp4")

    # Final response points at the storage URL, not the local render path
    assert resp.video_url == (
        f"s3://nucleus-media/jobs/job-xyz/composed/{captured['upload']['filename']}"
    )
    assert resp.duration_s == pytest.approx(150 / 30.0)
    assert resp.cost_usd > 0


async def test_real_mode_raises_on_render_failure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
    monkeypatch.setenv("REMOTION_API_URL", "http://remotion.test:8089")

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200, json={"success": False, "error": "bundle failed"}
        )

    async def fake_upload(local_path: str, job_id: str, filename: str) -> str:
        raise AssertionError("upload should not be called on failure")

    monkeypatch.setattr(compose_remotion_mod, "_upload_to_storage", fake_upload)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        req = ComposeRemotionRequest(scene_manifest=_manifest(), template_id="t")
        with pytest.raises(RuntimeError, match="bundle failed"):
            await compose_remotion(req, http_client=client, job_id="t")


async def test_real_mode_unknown_archetype_defaults_to_demo(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
    monkeypatch.setenv("REMOTION_API_URL", "http://remotion.test:8089")

    captured: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["body"] = json.loads(request.content.decode())
        return httpx.Response(
            200,
            json={
                "success": True,
                "outputPath": captured["body"]["outputPath"],
                "durationMs": 1,
            },
        )

    async def fake_upload(local_path: str, job_id: str, filename: str) -> str:
        return f"s3://nucleus-media/jobs/{job_id}/composed/{filename}"

    monkeypatch.setattr(compose_remotion_mod, "_upload_to_storage", fake_upload)

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        req = ComposeRemotionRequest(
            scene_manifest=_manifest(archetype="nonsense"), template_id="t"
        )
        await compose_remotion(req, http_client=client, job_id="t")

    assert captured["body"]["compositionId"] == "DemoArchetype"
