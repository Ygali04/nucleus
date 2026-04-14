"""Bridge ComfyUI websocket events → Nucleus event stream.

ComfyUI emits node-level websocket events (``executing``, ``progress``,
``executed``, ``execution_cached``, ``execution_error``). We translate each
into a Nucleus event published via :func:`nucleus.events.publish_event`
tagged with the originating Ruflo job/candidate/node so the UI can attribute
progress to the right swarm node.

The bridge is intentionally agnostic about which provider calls it; any
provider (ComfyUIVideoProvider, ComfyUIAudioProvider, …) can fan out its
execution events by passing in its :class:`ComfyUIClient` plus Ruflo context.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from typing import Any, Protocol

from nucleus import events

logger = logging.getLogger(__name__)


class ComfyUIExecutionError(RuntimeError):
    """Raised when ComfyUI emits an ``execution_error`` frame."""

    def __init__(self, message: str, *, data: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.data = data or {}


class _ClientLike(Protocol):
    """Minimum interface the bridge needs from a ComfyUIClient.

    Declared here (rather than importing the real class) so tests can stub
    a trivial event-emitting fake without pulling httpx/websockets.
    """

    def stream_progress(  # pragma: no cover — structural typing only
        self, prompt_id: str
    ) -> AsyncIterator[dict[str, Any]]:
        ...


OnEventCallback = Callable[[dict[str, Any]], Awaitable[None] | None]


def _outputs_from_executed(data: dict[str, Any]) -> list[dict[str, Any]]:
    """Flatten a ComfyUI ``executed`` event's output dict into a single list.

    ComfyUI groups outputs by kind (``images``, ``gifs``, ``videos``, ``audio``,
    …). We concatenate them, tagging each entry with its ``kind`` so the UI
    can render a thumbnail regardless of modality.
    """
    output = data.get("output") or {}
    flat: list[dict[str, Any]] = []
    for kind, items in output.items():
        if not isinstance(items, list):
            continue
        for item in items:
            if isinstance(item, dict):
                flat.append({**item, "kind": kind})
    return flat


async def _invoke_callback(on_event: OnEventCallback | None, event: dict[str, Any]) -> None:
    if on_event is None:
        return
    try:
        result = on_event(event)
        if hasattr(result, "__await__"):
            await result  # type: ignore[func-returns-value]
    except Exception:  # noqa: BLE001 — UI hook must never break the stream
        logger.exception("on_event callback raised (ignored)")


async def fanout_comfyui_events(
    client: _ClientLike,
    prompt_id: str,
    job_id: str,
    candidate_id: str,
    node_id: str,
    on_event: OnEventCallback | None = None,
) -> list[dict[str, Any]]:
    """Consume ``client.stream_progress(prompt_id)`` → Nucleus events.

    Returns the list of ComfyUI events observed (useful for tests / callers
    that want to inspect the raw trace). Raises :class:`ComfyUIExecutionError`
    if ComfyUI reports ``execution_error``; the failure is also published as
    a ``tool.comfyui.failed`` Nucleus event before re-raising.
    """
    base_ctx = {
        "job_id": job_id,
        "candidate_id": candidate_id,
        "nucleus_node_id": node_id,
    }
    seen: list[dict[str, Any]] = []

    async for event in client.stream_progress(prompt_id):
        seen.append(event)
        etype = event.get("type")
        data = event.get("data") or {}

        if etype == "executing":
            comfy_node = data.get("node")
            if comfy_node is None:
                # terminal signal — stop without publishing a node_started
                await _invoke_callback(on_event, event)
                break
            await events.publish_event(
                job_id,
                "tool.comfyui.node_started",
                {**base_ctx, "comfyui_node": comfy_node},
            )

        elif etype == "progress":
            value = data.get("value", 0) or 0
            maximum = data.get("max", 0) or 0
            percent = (value / maximum * 100.0) if maximum else 0.0
            await events.publish_event(
                job_id,
                "tool.comfyui.progress",
                {
                    **base_ctx,
                    "percent": percent,
                    "value": value,
                    "max": maximum,
                    "comfyui_node": data.get("node"),
                },
            )

        elif etype == "executed":
            await events.publish_event(
                job_id,
                "tool.comfyui.node_complete",
                {
                    **base_ctx,
                    "comfyui_node": data.get("node"),
                    "outputs": _outputs_from_executed(data),
                },
            )

        elif etype == "execution_cached":
            await events.publish_event(
                job_id,
                "tool.comfyui.cached",
                {**base_ctx, "comfyui_nodes": list(data.get("nodes") or [])},
            )

        elif etype == "execution_error":
            error_message = (
                data.get("exception_message")
                or data.get("error")
                or "ComfyUI reported execution_error"
            )
            await events.publish_event(
                job_id,
                "tool.comfyui.failed",
                {**base_ctx, "error_message": error_message, "error_data": data},
            )
            await _invoke_callback(on_event, event)
            raise ComfyUIExecutionError(error_message, data=data)

        await _invoke_callback(on_event, event)

    return seen


__all__ = ["fanout_comfyui_events", "ComfyUIExecutionError"]
