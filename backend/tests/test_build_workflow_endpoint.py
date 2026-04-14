"""Tests for POST /api/v1/tools/build_workflow.

Ruflo calls this endpoint to turn a structured spec
(``kind=video, subtype=kling, prompt=...``) into a concrete ComfyUI
workflow dict it can hand to ``run_comfyui_workflow``.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from nucleus.app import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def _post(client: TestClient, payload: dict):
    return client.post("/api/v1/tools/build_workflow", json=payload)


# ---------------------------------------------------------------------------
# Video subtypes
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "subtype", ["kling", "seedance", "veo", "runway", "luma", "hailuo"]
)
def test_build_workflow_cloud_video(client: TestClient, subtype: str) -> None:
    res = _post(
        client,
        {
            "kind": "video",
            "subtype": subtype,
            "prompt": "a cat riding a surfboard",
            "duration_s": 5.0,
        },
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["kind"] == "video"
    assert body["subtype"] == subtype
    wf = body["workflow"]
    assert isinstance(wf, dict) and wf
    # Every node has class_type + inputs
    for node in wf.values():
        assert "class_type" in node and "inputs" in node
    # The dispatch node should carry the provider tag
    assert any(
        n.get("class_type") == "NucleusCloudVideo"
        and n["inputs"].get("provider") == subtype
        for n in wf.values()
    )


@pytest.mark.parametrize("subtype", ["svd", "animatediff", "ltxv"])
def test_build_workflow_open_weights_video(client: TestClient, subtype: str) -> None:
    res = _post(
        client,
        {
            "kind": "video",
            "subtype": subtype,
            "prompt": "neon cyber city",
            "duration_s": 4.0,
            "reference_image_url": "s3://x/ref.png",
        },
    )
    assert res.status_code == 200, res.text
    wf = res.json()["workflow"]
    assert isinstance(wf, dict) and wf


# ---------------------------------------------------------------------------
# Audio / music
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("subtype", ["elevenlabs", "stable_audio"])
def test_build_workflow_cloud_audio(client: TestClient, subtype: str) -> None:
    res = _post(
        client,
        {
            "kind": "audio",
            "subtype": subtype,
            "prompt": "Welcome to the show!",
            "duration_s": 3.0,
        },
    )
    assert res.status_code == 200, res.text
    wf = res.json()["workflow"]
    assert any(
        n.get("class_type") == "NucleusCloudAudio"
        and n["inputs"].get("provider") == subtype
        for n in wf.values()
    )


def test_build_workflow_music_musicgen(client: TestClient) -> None:
    res = _post(
        client,
        {
            "kind": "music",
            "subtype": "musicgen",
            "duration_s": 8.0,
            "mood": "uplifting",
            "genre": "synthwave",
            "energy": 0.8,
        },
    )
    assert res.status_code == 200, res.text
    wf = res.json()["workflow"]
    assert any(n.get("class_type") == "MusicgenGenerate" for n in wf.values())


# ---------------------------------------------------------------------------
# Edit
# ---------------------------------------------------------------------------


def test_build_workflow_edit(client: TestClient) -> None:
    res = _post(
        client,
        {
            "kind": "edit",
            "subtype": "cut_tightening",  # subtype mirrors edit_type for symmetry
            "edit_type": "cut_tightening",
            "source_video_url": "s3://bucket/src.mp4",
            "target_start_s": 1.5,
            "target_end_s": 3.0,
        },
    )
    assert res.status_code == 200, res.text
    wf = res.json()["workflow"]
    assert any(
        n.get("class_type") == "NucleusEdit"
        and n["inputs"].get("edit_type") == "cut_tightening"
        for n in wf.values()
    )


def test_build_workflow_edit_missing_fields(client: TestClient) -> None:
    res = _post(
        client,
        {"kind": "edit", "subtype": "hook_rewrite"},  # no edit_type/source
    )
    assert res.status_code == 400


# ---------------------------------------------------------------------------
# Unknown subtype
# ---------------------------------------------------------------------------


def test_build_workflow_unknown_video_subtype(client: TestClient) -> None:
    res = _post(
        client,
        {"kind": "video", "subtype": "nonexistent_model", "prompt": "hi"},
    )
    assert res.status_code == 400


def test_build_workflow_unknown_kind(client: TestClient) -> None:
    res = _post(client, {"kind": "hologram", "subtype": "foo"})
    # pydantic literal validation => 422
    assert res.status_code == 422
