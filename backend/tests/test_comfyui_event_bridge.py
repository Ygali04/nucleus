"""Tests for the ComfyUI → Nucleus event bridge."""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

import pytest

from nucleus import events
from nucleus.providers.comfyui_event_bridge import (
    ComfyUIExecutionError,
    fanout_comfyui_events,
)


class ScriptedClient:
    """Stub ComfyUIClient that yields a predetermined event sequence."""

    def __init__(self, script: list[dict[str, Any]]) -> None:
        self._script = script

    async def stream_progress(self, prompt_id: str) -> AsyncIterator[dict[str, Any]]:
        for event in self._script:
            yield event


PROMPT_ID = "prompt-abc"
JOB_ID = "job-1"
CAND_ID = "cand-1"
NODE_ID = "nucleus-node-1"


def _ctx_fields(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "job_id": payload.get("job_id"),
        "candidate_id": payload.get("candidate_id"),
        "nucleus_node_id": payload.get("nucleus_node_id"),
    }


@pytest.fixture(autouse=True)
def _clean_events():
    events.reset()
    yield
    events.reset()


async def _run(script: list[dict[str, Any]], **kwargs: Any):
    return await fanout_comfyui_events(
        ScriptedClient(script),
        prompt_id=PROMPT_ID,
        job_id=JOB_ID,
        candidate_id=CAND_ID,
        node_id=NODE_ID,
        **kwargs,
    )


@pytest.mark.asyncio
async def test_executing_node_publishes_node_started():
    await _run(
        [
            {"type": "executing", "data": {"node": "3", "prompt_id": PROMPT_ID}},
            {"type": "executing", "data": {"node": None, "prompt_id": PROMPT_ID}},
        ]
    )
    log = events.get_events(JOB_ID)
    types = [e["event_type"] for e in log]
    assert types == ["tool.comfyui.node_started"]
    assert log[0]["comfyui_node"] == "3"
    assert _ctx_fields(log[0]) == {
        "job_id": JOB_ID,
        "candidate_id": CAND_ID,
        "nucleus_node_id": NODE_ID,
    }


@pytest.mark.asyncio
async def test_progress_event_percent_calculation():
    await _run(
        [
            {"type": "progress", "data": {"value": 5, "max": 20, "node": "7"}},
            {"type": "executing", "data": {"node": None, "prompt_id": PROMPT_ID}},
        ]
    )
    (evt,) = events.get_events(JOB_ID)
    assert evt["event_type"] == "tool.comfyui.progress"
    assert evt["percent"] == pytest.approx(25.0)
    assert evt["value"] == 5 and evt["max"] == 20
    assert evt["comfyui_node"] == "7"


@pytest.mark.asyncio
async def test_progress_with_zero_max_does_not_divide_by_zero():
    await _run(
        [
            {"type": "progress", "data": {"value": 0, "max": 0}},
            {"type": "executing", "data": {"node": None, "prompt_id": PROMPT_ID}},
        ]
    )
    (evt,) = events.get_events(JOB_ID)
    assert evt["percent"] == 0.0


@pytest.mark.asyncio
async def test_executed_flattens_outputs_by_kind():
    await _run(
        [
            {
                "type": "executed",
                "data": {
                    "node": "9",
                    "output": {
                        "images": [{"filename": "a.png", "subfolder": "", "type": "output"}],
                        "gifs": [{"filename": "b.gif", "subfolder": "", "type": "output"}],
                    },
                },
            },
            {"type": "executing", "data": {"node": None, "prompt_id": PROMPT_ID}},
        ]
    )
    (evt,) = events.get_events(JOB_ID)
    assert evt["event_type"] == "tool.comfyui.node_complete"
    assert evt["comfyui_node"] == "9"
    kinds = sorted(o["kind"] for o in evt["outputs"])
    assert kinds == ["gifs", "images"]


@pytest.mark.asyncio
async def test_execution_cached_publishes_cached_event():
    await _run(
        [
            {"type": "execution_cached", "data": {"nodes": ["1", "2", "3"]}},
            {"type": "executing", "data": {"node": None, "prompt_id": PROMPT_ID}},
        ]
    )
    log = events.get_events(JOB_ID)
    assert log[0]["event_type"] == "tool.comfyui.cached"
    assert log[0]["comfyui_nodes"] == ["1", "2", "3"]


@pytest.mark.asyncio
async def test_execution_error_raises_and_publishes_failed():
    with pytest.raises(ComfyUIExecutionError) as excinfo:
        await _run(
            [
                {
                    "type": "execution_error",
                    "data": {
                        "node_id": "5",
                        "exception_message": "CUDA OOM",
                        "prompt_id": PROMPT_ID,
                    },
                },
            ]
        )
    assert "CUDA OOM" in str(excinfo.value)
    (evt,) = events.get_events(JOB_ID)
    assert evt["event_type"] == "tool.comfyui.failed"
    assert evt["error_message"] == "CUDA OOM"
    assert _ctx_fields(evt)["job_id"] == JOB_ID


@pytest.mark.asyncio
async def test_loop_terminates_on_executing_null_node():
    trailing = {"type": "progress", "data": {"value": 99, "max": 100}}
    seen = await _run(
        [
            {"type": "executing", "data": {"node": "1", "prompt_id": PROMPT_ID}},
            {"type": "executing", "data": {"node": None, "prompt_id": PROMPT_ID}},
            trailing,  # should NOT be consumed
        ]
    )
    # Bridge should stop before the trailing progress event.
    assert trailing not in seen
    # And the event log reflects that no progress was published.
    types = [e["event_type"] for e in events.get_events(JOB_ID)]
    assert "tool.comfyui.progress" not in types


@pytest.mark.asyncio
async def test_full_sequence_publishes_expected_types_in_order():
    script = [
        {"type": "execution_cached", "data": {"nodes": ["2"]}},
        {"type": "executing", "data": {"node": "3", "prompt_id": PROMPT_ID}},
        {"type": "progress", "data": {"value": 1, "max": 2, "node": "3"}},
        {"type": "progress", "data": {"value": 2, "max": 2, "node": "3"}},
        {
            "type": "executed",
            "data": {
                "node": "3",
                "output": {"videos": [{"filename": "out.mp4", "subfolder": "", "type": "output"}]},
            },
        },
        {"type": "executing", "data": {"node": None, "prompt_id": PROMPT_ID}},
    ]
    await _run(script)
    types = [e["event_type"] for e in events.get_events(JOB_ID)]
    assert types == [
        "tool.comfyui.cached",
        "tool.comfyui.node_started",
        "tool.comfyui.progress",
        "tool.comfyui.progress",
        "tool.comfyui.node_complete",
    ]


@pytest.mark.asyncio
async def test_context_fields_propagate_to_every_event():
    script = [
        {"type": "execution_cached", "data": {"nodes": ["1"]}},
        {"type": "executing", "data": {"node": "1", "prompt_id": PROMPT_ID}},
        {"type": "progress", "data": {"value": 1, "max": 4}},
        {
            "type": "executed",
            "data": {"node": "1", "output": {"images": [{"filename": "x.png"}]}},
        },
        {"type": "executing", "data": {"node": None, "prompt_id": PROMPT_ID}},
    ]
    await _run(script)
    for evt in events.get_events(JOB_ID):
        assert evt["job_id"] == JOB_ID
        assert evt["candidate_id"] == CAND_ID
        assert evt["nucleus_node_id"] == NODE_ID


@pytest.mark.asyncio
async def test_on_event_callback_fires_for_every_frame():
    captured: list[str] = []

    def _cb(event: dict[str, Any]) -> None:
        captured.append(event.get("type", ""))

    script = [
        {"type": "executing", "data": {"node": "1", "prompt_id": PROMPT_ID}},
        {"type": "progress", "data": {"value": 1, "max": 2}},
        {"type": "executing", "data": {"node": None, "prompt_id": PROMPT_ID}},
    ]
    await _run(script, on_event=_cb)
    assert captured == ["executing", "progress", "executing"]


@pytest.mark.asyncio
async def test_async_on_event_callback_is_awaited():
    captured: list[str] = []

    async def _cb(event: dict[str, Any]) -> None:
        captured.append(event["type"])

    script = [
        {"type": "executing", "data": {"node": "1", "prompt_id": PROMPT_ID}},
        {"type": "executing", "data": {"node": None, "prompt_id": PROMPT_ID}},
    ]
    await _run(script, on_event=_cb)
    assert captured == ["executing", "executing"]
