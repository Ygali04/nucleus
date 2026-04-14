"""Shared runtime helpers for ComfyUI-backed providers."""

from __future__ import annotations

import logging
import os
import uuid
from typing import Any

from nucleus.providers.comfyui_client import ComfyUIClientProtocol
from nucleus.storage import upload_bytes

logger = logging.getLogger(__name__)


def cost_per_second_from_env(env_var: str) -> float:
    """Read a per-second cost float from *env_var*, defaulting to 0."""
    try:
        return float(os.environ.get(env_var, "0.0"))
    except ValueError:
        return 0.0


def extract_output_filename(history: dict, prompt_id: str) -> tuple[str, str]:
    """Pull the first media output ``(filename, subfolder)`` from a history blob.

    Raises ``RuntimeError`` if no media output is present.
    """
    entry = history.get(prompt_id) or next(iter(history.values()), None)
    if not entry:
        raise RuntimeError(f"ComfyUI history empty for prompt {prompt_id}")

    outputs: dict[str, Any] = entry.get("outputs") or {}
    for node_outputs in outputs.values():
        # VHS_VideoCombine writes under 'gifs' (historical name) or 'videos'.
        for key in ("gifs", "videos", "audio", "images", "text"):
            files = node_outputs.get(key)
            if files:
                first = files[0]
                return first["filename"], first.get("subfolder", "")
    raise RuntimeError(f"No media outputs in ComfyUI history for {prompt_id}")


async def drain_progress(client: ComfyUIClientProtocol, prompt_id: str) -> None:
    """Consume progress events so the server doesn't block, logging each.

    WU-C3 wraps this to rebroadcast as Nucleus events.
    """
    try:
        async for event in client.stream_progress(prompt_id):
            logger.debug("comfyui progress prompt=%s event=%s", prompt_id, event)
    except Exception:  # pragma: no cover - defensive
        logger.exception("comfyui progress stream failed for %s", prompt_id)


async def run_and_upload(
    client: ComfyUIClientProtocol,
    workflow: dict,
    *,
    job_id: str,
    extension: str,
    content_type: str,
) -> tuple[str, str, str]:
    """Submit *workflow*, wait for completion, upload output to MinIO.

    Returns ``(s3_uri, prompt_id, comfyui_filename)``.
    """
    prompt_id = await client.submit_workflow(workflow)
    await drain_progress(client, prompt_id)

    history = await client.get_history(prompt_id)
    filename, subfolder = extract_output_filename(history, prompt_id)
    data = await client.fetch_output(filename, subfolder=subfolder)

    key = f"jobs/{job_id or prompt_id}/raw/{uuid.uuid4().hex}.{extension}"
    uri = await upload_bytes(key, data, content_type=content_type)
    return uri, prompt_id, filename


__all__ = [
    "cost_per_second_from_env",
    "drain_progress",
    "extract_output_filename",
    "run_and_upload",
]
