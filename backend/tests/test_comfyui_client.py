"""Unit tests for ComfyUIClient.

HTTP is driven through ``httpx.MockTransport``. The WebSocket path is
driven by monkey-patching ``websockets.connect`` with a tiny async iterator
that replays canned JSON messages. The real ComfyUI server is never spun up.
"""

from __future__ import annotations

import json
from contextlib import asynccontextmanager
from typing import Any

import httpx
import pytest

from nucleus.clients.comfyui import ComfyUIClient, ComfyUIError


# ---------------------------------------------------------------------------
# Fake WebSocket plumbing
# ---------------------------------------------------------------------------


class _FakeWebSocket:
    """Replays canned text (and optional binary) frames. One per connection."""

    def __init__(self, messages: list[str | bytes]) -> None:
        self._messages = list(messages)

    async def __aenter__(self) -> _FakeWebSocket:
        return self

    async def __aexit__(self, *exc: Any) -> None:
        return None

    def __aiter__(self) -> _FakeWebSocket:
        return self

    async def __anext__(self) -> str | bytes:
        if not self._messages:
            raise StopAsyncIteration
        return self._messages.pop(0)


def _install_fake_ws(monkeypatch: pytest.MonkeyPatch, messages: list[str | bytes]):
    captured: dict[str, Any] = {}

    def fake_connect(uri: str, **_: Any) -> _FakeWebSocket:
        captured["uri"] = uri
        return _FakeWebSocket(messages)

    monkeypatch.setattr("nucleus.clients.comfyui.websockets.connect", fake_connect)
    return captured


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _client_with(handler) -> ComfyUIClient:
    transport = httpx.MockTransport(handler)
    return ComfyUIClient(
        base_url="http://comfy.test:8188",
        client_id="test-client",
        transport=transport,
    )


# ---------------------------------------------------------------------------
# submit_workflow
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_submit_workflow_posts_correct_body() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["method"] = request.method
        captured["url"] = str(request.url)
        captured["body"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"prompt_id": "abc-123", "number": 1})

    client = _client_with(handler)
    try:
        prompt_id = await client.submit_workflow({"1": {"class_type": "KSampler"}})
    finally:
        await client.close()

    assert prompt_id == "abc-123"
    assert captured["method"] == "POST"
    assert captured["url"] == "http://comfy.test:8188/prompt"
    assert captured["body"] == {
        "prompt": {"1": {"class_type": "KSampler"}},
        "client_id": "test-client",
    }


@pytest.mark.asyncio
async def test_submit_workflow_missing_prompt_id_raises() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"oops": True})

    client = _client_with(handler)
    try:
        with pytest.raises(ComfyUIError, match="missing prompt_id"):
            await client.submit_workflow({})
    finally:
        await client.close()


@pytest.mark.asyncio
async def test_submit_workflow_http_error_raises_with_context() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="boom")

    client = _client_with(handler)
    try:
        with pytest.raises(ComfyUIError) as excinfo:
            await client.submit_workflow({"1": {}})
    finally:
        await client.close()

    err = excinfo.value
    assert err.status == 500
    assert err.body == "boom"
    assert "prompt" in (err.url or "")


# ---------------------------------------------------------------------------
# stream_progress
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_stream_progress_yields_events_and_terminates(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    prompt_id = "abc-123"
    messages = [
        json.dumps(
            {"type": "execution_start", "data": {"prompt_id": prompt_id}}
        ),
        json.dumps(
            {
                "type": "executing",
                "data": {"node": "3", "prompt_id": prompt_id},
            }
        ),
        json.dumps(
            {
                "type": "progress",
                "data": {"value": 5, "max": 20, "prompt_id": prompt_id},
            }
        ),
        # Event for a DIFFERENT prompt — must be filtered out.
        json.dumps(
            {
                "type": "executing",
                "data": {"node": "2", "prompt_id": "other-xyz"},
            }
        ),
        json.dumps(
            {
                "type": "executed",
                "data": {
                    "node": "3",
                    "prompt_id": prompt_id,
                    "output": {"images": [{"filename": "out.png"}]},
                },
            }
        ),
        # Terminal frame.
        json.dumps(
            {"type": "executing", "data": {"node": None, "prompt_id": prompt_id}}
        ),
        # Should never be consumed.
        json.dumps({"type": "sentinel", "data": {"prompt_id": prompt_id}}),
    ]
    captured = _install_fake_ws(monkeypatch, messages)

    client = ComfyUIClient(
        base_url="http://comfy.test:8188",
        client_id="test-client",
        transport=httpx.MockTransport(lambda r: httpx.Response(200, json={})),
    )
    try:
        events = [evt async for evt in client.stream_progress(prompt_id)]
    finally:
        await client.close()

    assert captured["uri"] == "ws://comfy.test:8188/ws?clientId=test-client"
    # 5 yielded: start, executing(3), progress, executed, terminal.
    types = [e["type"] for e in events]
    assert types == [
        "execution_start",
        "executing",
        "progress",
        "executed",
        "executing",
    ]
    # Terminal frame is last, and had node=None.
    assert events[-1]["data"]["node"] is None
    # Sentinel not yielded (we stopped).
    assert "sentinel" not in types


@pytest.mark.asyncio
async def test_stream_progress_stops_on_execution_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    prompt_id = "err-1"
    messages = [
        json.dumps(
            {
                "type": "execution_error",
                "data": {"prompt_id": prompt_id, "exception_message": "nope"},
            }
        ),
        json.dumps({"type": "sentinel", "data": {"prompt_id": prompt_id}}),
    ]
    _install_fake_ws(monkeypatch, messages)

    client = ComfyUIClient(
        base_url="http://comfy.test:8188",
        client_id="test-client",
        transport=httpx.MockTransport(lambda r: httpx.Response(200, json={})),
    )
    try:
        events = [evt async for evt in client.stream_progress(prompt_id)]
    finally:
        await client.close()

    assert [e["type"] for e in events] == ["execution_error"]


@pytest.mark.asyncio
async def test_stream_progress_ignores_binary_frames(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    prompt_id = "bin-1"
    messages = [
        b"\x00\x01\x02binary-preview",
        json.dumps(
            {"type": "executing", "data": {"node": None, "prompt_id": prompt_id}}
        ),
    ]
    _install_fake_ws(monkeypatch, messages)

    client = ComfyUIClient(
        base_url="http://comfy.test:8188",
        client_id="test-client",
        transport=httpx.MockTransport(lambda r: httpx.Response(200, json={})),
    )
    try:
        events = [evt async for evt in client.stream_progress(prompt_id)]
    finally:
        await client.close()

    assert len(events) == 1
    assert events[0]["data"]["node"] is None


# ---------------------------------------------------------------------------
# get_history / fetch_output / queue_status / object_info
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_history_hits_correct_url() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        return httpx.Response(
            200,
            json={"abc-123": {"status": {"completed": True}, "outputs": {}}},
        )

    client = _client_with(handler)
    try:
        result = await client.get_history("abc-123")
    finally:
        await client.close()

    assert captured["url"] == "http://comfy.test:8188/history/abc-123"
    assert "abc-123" in result


@pytest.mark.asyncio
async def test_fetch_output_hits_view_with_query_params() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, content=b"RAWBYTES")

    client = _client_with(handler)
    try:
        data = await client.fetch_output("out.png", subfolder="sub", type_="output")
    finally:
        await client.close()

    assert data == b"RAWBYTES"
    assert captured["url"].startswith("http://comfy.test:8188/view")
    assert captured["params"] == {
        "filename": "out.png",
        "subfolder": "sub",
        "type": "output",
    }


@pytest.mark.asyncio
async def test_fetch_output_error_carries_context() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404, text="not found")

    client = _client_with(handler)
    try:
        with pytest.raises(ComfyUIError) as excinfo:
            await client.fetch_output("missing.png")
    finally:
        await client.close()

    assert excinfo.value.status == 404
    assert excinfo.value.body == "not found"


@pytest.mark.asyncio
async def test_queue_status_and_object_info() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        path = request.url.path
        if path == "/queue":
            return httpx.Response(200, json={"queue_running": [], "queue_pending": []})
        if path == "/object_info":
            return httpx.Response(
                200,
                json={"KSampler": {"input": {}}, "VHS_VideoCombine": {}},
            )
        return httpx.Response(404)

    client = _client_with(handler)
    try:
        queue = await client.queue_status()
        info = await client.object_info()
    finally:
        await client.close()

    assert queue == {"queue_running": [], "queue_pending": []}
    assert "KSampler" in info
    assert "VHS_VideoCombine" in info  # custom node loaded


# ---------------------------------------------------------------------------
# Config plumbing
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_default_base_url_comes_from_env(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("COMFYUI_BASE_URL", "http://override.test:9999/")
    client = ComfyUIClient(
        transport=httpx.MockTransport(lambda r: httpx.Response(200, json={}))
    )
    try:
        # Trailing slash stripped.
        assert client.base_url == "http://override.test:9999"
    finally:
        await client.close()
