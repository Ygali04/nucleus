"""run_comfyui_workflow tool — execute an open-weights ComfyUI graph.

Submits a workflow to ComfyUI, streams progress into the Nucleus event bus
via :func:`nucleus.providers.comfyui_event_bridge.fanout_comfyui_events`,
fetches the terminal output, and uploads it to S3/MinIO. The resulting
``s3://`` URI is returned to the caller (Ruflo tool invocation).

Honors ``NUCLEUS_MOCK_PROVIDERS=true`` by scripting a short event sequence
so the UI can test its progress display without a running ComfyUI.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any
from uuid import uuid4

from nucleus import events
from nucleus.config import is_mock
from nucleus.providers.comfyui_event_bridge import fanout_comfyui_events
from nucleus.tools.schemas import (
    RunComfyUIWorkflowRequest,
    RunComfyUIWorkflowResponse,
)

logger = logging.getLogger(__name__)


_EXT_BY_KIND = {"video": "mp4", "audio": "wav", "image": "png"}
_CONTENT_TYPE_BY_KIND = {
    "video": "video/mp4",
    "audio": "audio/wav",
    "image": "image/png",
}


def _pick_output_from_history(
    history: dict[str, Any], prompt_id: str, expected_kind: str
) -> dict[str, Any]:
    """Extract ``{filename, subfolder, type}`` from the ComfyUI history blob."""
    entry = history.get(prompt_id) or {}
    outputs = entry.get("outputs") or {}
    # Group keys ComfyUI uses for each modality.
    group_keys = {
        "video": ("videos", "gifs", "images"),
        "audio": ("audio", "audios"),
        "image": ("images",),
    }[expected_kind]

    for _node_id, node_output in outputs.items():
        for key in group_keys:
            items = node_output.get(key) if isinstance(node_output, dict) else None
            if items:
                item = items[0]
                return {
                    "filename": item.get("filename"),
                    "subfolder": item.get("subfolder", ""),
                    "type": item.get("type", "output"),
                }
    raise RuntimeError(
        f"ComfyUI history for prompt {prompt_id} has no {expected_kind} output"
    )


async def _run_mock(req: RunComfyUIWorkflowRequest) -> RunComfyUIWorkflowResponse:
    """Scripted 5-event sequence over ~1s for UI progress testing."""
    base_ctx = {
        "job_id": req.job_id,
        "candidate_id": req.candidate_id,
        "nucleus_node_id": req.node_id,
    }
    start = time.perf_counter()

    await events.publish_event(
        req.job_id, "tool.comfyui.node_started", {**base_ctx, "comfyui_node": "1"}
    )
    for pct in (25.0, 50.0, 75.0, 100.0):
        await asyncio.sleep(0.2)
        await events.publish_event(
            req.job_id,
            "tool.comfyui.progress",
            {**base_ctx, "percent": pct, "value": int(pct), "max": 100, "comfyui_node": "1"},
        )
    await events.publish_event(
        req.job_id,
        "tool.comfyui.node_complete",
        {**base_ctx, "comfyui_node": "1", "outputs": []},
    )

    ext = _EXT_BY_KIND[req.expected_output_kind]
    uri = f"s3://nucleus-mock/comfyui-{req.expected_output_kind}-{uuid4().hex[:8]}.{ext}"
    return RunComfyUIWorkflowResponse(
        output_url=uri,
        cost_usd=0.0,
        duration_s=round(time.perf_counter() - start, 3),
    )


async def run_comfyui_workflow(
    req: RunComfyUIWorkflowRequest,
) -> RunComfyUIWorkflowResponse:
    if is_mock():
        return await _run_mock(req)

    # Lazy imports: only pay the httpx/websockets/aioboto3 cost when we
    # actually need them (mock path stays cheap for tests).
    from nucleus.clients.comfyui import ComfyUIClient
    from nucleus.storage import s3

    start = time.perf_counter()
    async with ComfyUIClient() as client:
        prompt_id = await client.submit_workflow(req.workflow)
        await fanout_comfyui_events(
            client,
            prompt_id=prompt_id,
            job_id=req.job_id,
            candidate_id=req.candidate_id,
            node_id=req.node_id,
        )
        history = await client.get_history(prompt_id)
        ref = _pick_output_from_history(history, prompt_id, req.expected_output_kind)
        raw = await client.fetch_output(
            filename=ref["filename"],
            subfolder=ref["subfolder"],
            type_=ref["type"],
        )

    ext = _EXT_BY_KIND[req.expected_output_kind]
    content_type = _CONTENT_TYPE_BY_KIND[req.expected_output_kind]
    key = f"comfyui/{req.job_id}/{req.candidate_id}/{uuid4().hex}.{ext}"
    uri = await s3.upload_bytes(key, raw, content_type=content_type)

    return RunComfyUIWorkflowResponse(
        output_url=uri,
        cost_usd=0.0,  # self-hosted; provider may override later
        duration_s=round(time.perf_counter() - start, 3),
    )


__all__ = ["run_comfyui_workflow"]
