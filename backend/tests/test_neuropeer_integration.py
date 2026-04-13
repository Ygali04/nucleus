"""Integration tests for the NeuroPeer client + score_neuropeer tool.

The real NeuroPeer server is NOT started here. Instead we:
  * drive the HTTP layer through `httpx.MockTransport`
  * drive the WebSocket layer by monkey-patching `websockets.connect` with a
    small async iterator that replays canned progress events.

If these tests pass, the client's request shape, URL wiring, schema parsing,
terminal-event logic, and the AnalysisResult → Nucleus response flattening are
all proven end-to-end without requiring the server to be live.
"""

from __future__ import annotations

import json
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

import httpx
import pytest

from nucleus.clients.neuropeer import NeuroPeerClient, NeuroPeerError
from nucleus.clients.neuropeer_types import AnalysisResult, JobCreated, ProgressEvent
from nucleus.tools.schemas import ScoreNeuroPeerRequest


# ---------------------------------------------------------------------------
# Fixture data matching the real NeuroPeer schemas
# ---------------------------------------------------------------------------


def _job_id() -> str:
    return str(uuid.uuid4())


def _fake_analysis_result(job_id: str, url: str) -> dict[str, Any]:
    return {
        "job_id": job_id,
        "url": url,
        "content_type": "custom",
        "duration_seconds": 30.0,
        "neural_score": {
            "total": 73.4,
            "hook_score": 70.1,
            "sustained_attention": 75.2,
            "emotional_resonance": 72.0,
            "memory_encoding": 74.5,
            "aesthetic_quality": 76.8,
            "cognitive_accessibility": 71.0,
        },
        "metrics": [
            {
                "name": "Hook Score",
                "score": 70.1,
                "raw_value": 0.7,
                "description": "NAcc response to opening frames",
                "brain_region": "NAcc",
                "gtm_proxy": "3s retention",
            }
        ],
        "attention_curve": [0.5, 0.6, 0.7],
        "emotional_arousal_curve": [0.4, 0.5, 0.6],
        "cognitive_load_curve": [0.2, 0.3, 0.25],
        "key_moments": [
            {
                "timestamp": 1.5,
                "type": "best_hook",
                "label": "NAcc spike",
                "score": 78.0,
            }
        ],
        "modality_breakdown": [
            {"timestamp": 0.0, "visual": 0.5, "audio": 0.3, "text": 0.2}
        ],
        "ai_summary": "Strong hook, pacing slows at 18s.",
        "ai_action_items": ["Trim 15–22s", "Boost music at 25s"],
    }


# ---------------------------------------------------------------------------
# Fake WebSocket plumbing
# ---------------------------------------------------------------------------


class _FakeWebSocket:
    """Replays canned text messages. One instance == one connection."""

    def __init__(self, messages: list[str]) -> None:
        self._messages = list(messages)

    async def __aenter__(self) -> _FakeWebSocket:
        return self

    async def __aexit__(self, *exc: Any) -> None:
        return None

    def __aiter__(self) -> _FakeWebSocket:
        return self

    async def __anext__(self) -> str:
        if not self._messages:
            raise StopAsyncIteration
        return self._messages.pop(0)


@asynccontextmanager
async def _fake_ws_factory(messages: list[str], captured_uris: list[str], uri: str):
    """Async context manager matching websockets.connect's shape."""
    captured_uris.append(uri)
    ws = _FakeWebSocket(messages)
    try:
        yield ws
    finally:
        pass


def _progress_events(job_id: str, terminal: str = "complete") -> list[str]:
    statuses = [
        ("queued", 0.0, "queued"),
        ("downloading", 0.2, "downloading"),
        ("inferring", 0.6, "inferring"),
        ("scoring", 0.9, "scoring"),
        (terminal, 1.0, "done" if terminal == "complete" else "boom"),
    ]
    return [
        json.dumps({"job_id": job_id, "status": status, "progress": p, "message": msg})
        for status, p, msg in statuses
    ]


# ---------------------------------------------------------------------------
# HTTP MockTransport helper
# ---------------------------------------------------------------------------


def _make_http_handler(
    job_id: str,
    *,
    captured_requests: list[httpx.Request],
    analysis_payload: dict[str, Any],
    websocket_url: str = None,
):
    ws_url = websocket_url if websocket_url is not None else f"/ws/job/{job_id}"

    def handler(request: httpx.Request) -> httpx.Response:
        captured_requests.append(request)
        path = request.url.path
        if request.method == "POST" and path == "/api/v1/analyze":
            return httpx.Response(
                200,
                json={
                    "job_id": job_id,
                    "websocket_url": ws_url,
                    "status": "queued",
                    "parent_job_id": None,
                    "content_group_id": None,
                },
            )
        if request.method == "GET" and path == f"/api/v1/results/{job_id}":
            return httpx.Response(200, json=analysis_payload)
        if request.method == "GET" and path == f"/api/v1/results/{job_id}/status":
            return httpx.Response(
                200,
                json={"status": "complete", "progress": 1.0, "message": "done"},
            )
        return httpx.Response(404, json={"detail": f"unmatched {request.method} {path}"})

    return handler


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_submit_posts_correct_body() -> None:
    job_id = _job_id()
    captured: list[httpx.Request] = []
    transport = httpx.MockTransport(
        _make_http_handler(
            job_id,
            captured_requests=captured,
            analysis_payload=_fake_analysis_result(job_id, "https://cdn/x.mp4"),
        )
    )
    async with NeuroPeerClient(
        base_url="http://neuropeer.test", transport=transport
    ) as client:
        job = await client.submit(
            "https://cdn/x.mp4",
            content_type="tiktok",
            label="variant-1",
            parent_job_id=job_id,
        )

    assert isinstance(job, JobCreated)
    assert str(job.job_id) == job_id
    assert job.websocket_url == f"/ws/job/{job_id}"

    # Inspect the one POST we made.
    post = next(r for r in captured if r.method == "POST")
    assert post.url.path == "/api/v1/analyze"
    body = json.loads(post.content.decode())
    assert body == {
        "url": "https://cdn/x.mp4",
        "content_type": "tiktok",
        "label": "variant-1",
        "parent_job_id": job_id,
    }


@pytest.mark.asyncio
async def test_get_results_hits_correct_path() -> None:
    job_id = _job_id()
    captured: list[httpx.Request] = []
    payload = _fake_analysis_result(job_id, "https://cdn/x.mp4")
    transport = httpx.MockTransport(
        _make_http_handler(
            job_id, captured_requests=captured, analysis_payload=payload
        )
    )
    async with NeuroPeerClient(
        base_url="http://neuropeer.test", transport=transport
    ) as client:
        result = await client.get_results(job_id)

    assert isinstance(result, AnalysisResult)
    assert result.neural_score.total == pytest.approx(73.4)
    get = next(r for r in captured if r.method == "GET")
    assert get.url.path == f"/api/v1/results/{job_id}"


@pytest.mark.asyncio
async def test_submit_and_wait_drives_progress_to_complete(monkeypatch) -> None:
    job_id = _job_id()
    captured_requests: list[httpx.Request] = []
    captured_ws_uris: list[str] = []

    transport = httpx.MockTransport(
        _make_http_handler(
            job_id,
            captured_requests=captured_requests,
            analysis_payload=_fake_analysis_result(job_id, "https://cdn/x.mp4"),
        )
    )

    messages = _progress_events(job_id, terminal="complete")

    def fake_connect(uri: str, *_, **__):
        return _fake_ws_factory(messages, captured_ws_uris, uri)

    monkeypatch.setattr("nucleus.clients.neuropeer.websockets.connect", fake_connect)

    seen: list[ProgressEvent] = []
    async with NeuroPeerClient(
        base_url="http://neuropeer.test", transport=transport
    ) as client:
        result = await client.submit_and_wait(
            "https://cdn/x.mp4",
            content_type="custom",
            on_progress=seen.append,
        )

    assert isinstance(result, AnalysisResult)
    assert seen[-1].status == "complete"
    assert [e.status for e in seen] == [
        "queued",
        "downloading",
        "inferring",
        "scoring",
        "complete",
    ]
    # WS URI should come from the server-supplied relative path and our base URL.
    assert captured_ws_uris == [f"ws://neuropeer.test/ws/job/{job_id}"]


@pytest.mark.asyncio
async def test_submit_and_wait_raises_on_error_status(monkeypatch) -> None:
    job_id = _job_id()
    transport = httpx.MockTransport(
        _make_http_handler(
            job_id,
            captured_requests=[],
            analysis_payload=_fake_analysis_result(job_id, "https://cdn/x.mp4"),
        )
    )

    messages = _progress_events(job_id, terminal="error")

    def fake_connect(uri: str, *_, **__):
        return _fake_ws_factory(messages, [], uri)

    monkeypatch.setattr("nucleus.clients.neuropeer.websockets.connect", fake_connect)

    async with NeuroPeerClient(
        base_url="http://neuropeer.test", transport=transport
    ) as client:
        with pytest.raises(NeuroPeerError, match="failed: boom"):
            await client.submit_and_wait("https://cdn/x.mp4")


@pytest.mark.asyncio
async def test_submit_and_wait_raises_if_ws_closes_without_terminal(monkeypatch) -> None:
    job_id = _job_id()
    transport = httpx.MockTransport(
        _make_http_handler(
            job_id,
            captured_requests=[],
            analysis_payload=_fake_analysis_result(job_id, "https://cdn/x.mp4"),
        )
    )
    # Only non-terminal events, then EOF.
    messages = [
        json.dumps({"job_id": job_id, "status": "queued", "progress": 0.0, "message": "q"}),
        json.dumps(
            {"job_id": job_id, "status": "inferring", "progress": 0.5, "message": "i"}
        ),
    ]

    def fake_connect(uri: str, *_, **__):
        return _fake_ws_factory(messages, [], uri)

    monkeypatch.setattr("nucleus.clients.neuropeer.websockets.connect", fake_connect)

    async with NeuroPeerClient(
        base_url="http://neuropeer.test", transport=transport
    ) as client:
        with pytest.raises(NeuroPeerError, match="without terminal event"):
            await client.submit_and_wait("https://cdn/x.mp4")


@pytest.mark.asyncio
async def test_http_error_wrapped_as_neuropeer_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"detail": "down"})

    async with NeuroPeerClient(
        base_url="http://neuropeer.test", transport=httpx.MockTransport(handler)
    ) as client:
        with pytest.raises(NeuroPeerError):
            await client.submit("https://cdn/x.mp4")


@pytest.mark.asyncio
async def test_ws_uri_prefers_absolute_server_url(monkeypatch) -> None:
    job_id = _job_id()
    captured_requests: list[httpx.Request] = []
    captured_ws_uris: list[str] = []

    transport = httpx.MockTransport(
        _make_http_handler(
            job_id,
            captured_requests=captured_requests,
            analysis_payload=_fake_analysis_result(job_id, "https://cdn/x.mp4"),
            websocket_url=f"wss://override.example/ws/job/{job_id}",
        )
    )

    def fake_connect(uri: str, *_, **__):
        return _fake_ws_factory(
            _progress_events(job_id, terminal="complete"), captured_ws_uris, uri
        )

    monkeypatch.setattr("nucleus.clients.neuropeer.websockets.connect", fake_connect)

    async with NeuroPeerClient(
        base_url="http://neuropeer.test", transport=transport
    ) as client:
        await client.submit_and_wait("https://cdn/x.mp4")

    assert captured_ws_uris == [f"wss://override.example/ws/job/{job_id}"]


# ---------------------------------------------------------------------------
# End-to-end through the score_neuropeer tool
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_score_neuropeer_real_mode_flattens_analysis_result(monkeypatch) -> None:
    """AnalysisResult → Nucleus ScoreNeuroPeerResponse is lossless on the fields
    Nucleus actually consumes."""
    # Another test module (test_providers) force-sets mock mode at import time;
    # guarantee real-mode here so the tool takes the HTTP path.
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
    job_id = _job_id()
    payload = _fake_analysis_result(job_id, "https://cdn/x.mp4")

    captured: list[httpx.Request] = []
    transport = httpx.MockTransport(
        _make_http_handler(
            job_id, captured_requests=captured, analysis_payload=payload
        )
    )

    # Patch NeuroPeerClient so the tool uses our transport + ws stub.
    import nucleus.tools.score_neuropeer as tool_mod

    original_cls = tool_mod.NeuroPeerClient

    def make_client() -> NeuroPeerClient:
        return original_cls(base_url="http://neuropeer.test", transport=transport)

    monkeypatch.setattr(tool_mod, "NeuroPeerClient", make_client)

    def fake_connect(uri: str, *_, **__):
        return _fake_ws_factory(
            _progress_events(job_id, terminal="complete"), [], uri
        )

    monkeypatch.setattr("nucleus.clients.neuropeer.websockets.connect", fake_connect)

    req = ScoreNeuroPeerRequest(
        video_url="https://cdn/x.mp4",
        content_type="custom",
        parent_job_id=None,
    )
    resp = await tool_mod.score_neuropeer(req)

    assert resp.job_id == job_id
    assert resp.neural_score == pytest.approx(payload["neural_score"]["total"])
    assert resp.breakdown["hook_score"] == pytest.approx(
        payload["neural_score"]["hook_score"]
    )
    assert resp.metrics[0]["brain_region"] == "NAcc"
    assert resp.key_moments[0]["type"] == "best_hook"
    assert resp.attention_curve == payload["attention_curve"]
    assert resp.ai_summary == payload["ai_summary"]
    assert resp.ai_action_items == payload["ai_action_items"]


@pytest.mark.asyncio
async def test_score_neuropeer_mock_mode_skips_http(monkeypatch) -> None:
    """Even in a file that forces real mode globally, per-call mock toggle works."""
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")
    req = ScoreNeuroPeerRequest(
        video_url="https://cdn/x.mp4", content_type="custom", parent_job_id="seed-1"
    )
    import nucleus.tools.score_neuropeer as tool_mod

    resp = await tool_mod.score_neuropeer(req)
    assert 0.0 <= resp.neural_score <= 100.0
    assert resp.breakdown["total"] == pytest.approx(resp.neural_score)
    assert resp.ai_summary.startswith("Mock neural report")
