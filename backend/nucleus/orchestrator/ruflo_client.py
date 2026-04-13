"""Async HTTP client for the Ruflo bridge Node service.

Streams SSE events from ``POST {RUFLO_BRIDGE_URL}/api/v1/swarm/run`` and
yields each event as a parsed dict. The Python orchestrator consumes the
stream and applies the events to its in-memory store.

Keeping this as a tiny module (not a class) so tests can pass a custom
``httpx.AsyncClient`` (e.g. with ``MockTransport``) without patching.
"""

from __future__ import annotations

import json
import os
from collections.abc import AsyncIterator
from typing import Any

import httpx

from nucleus.models import CandidateSpec

# Ruflo swarms can take 10+ minutes — 20 minute timeout per task spec.
DEFAULT_TIMEOUT = httpx.Timeout(20 * 60, connect=10.0)


def default_bridge_url() -> str:
    return os.environ.get("RUFLO_BRIDGE_URL", "http://localhost:9100")


def default_tools_base_url() -> str:
    return os.environ.get("NUCLEUS_API_URL", "http://localhost:8000")


async def run_swarm(
    candidate: CandidateSpec,
    *,
    bridge_url: str | None = None,
    tools_base_url: str | None = None,
    client: httpx.AsyncClient | None = None,
) -> AsyncIterator[dict[str, Any]]:
    """Run a Ruflo swarm for one candidate and stream SSE events.

    Args:
        candidate: The candidate spec to run.
        bridge_url: Override for the Ruflo bridge base URL.
        tools_base_url: Override for the tools base URL passed to the bridge.
        client: Optional pre-built httpx AsyncClient (for tests).

    Yields:
        Parsed event dicts. Each has at least ``event_type`` and ``job_id``.
    """
    bridge = (bridge_url or default_bridge_url()).rstrip("/")
    tools = tools_base_url or default_tools_base_url()

    payload = {
        "job_id": candidate.job_id,
        "candidate_spec": candidate.model_dump(mode="json"),
        "tools_base_url": tools,
    }

    owns_client = client is None
    if client is None:
        client = httpx.AsyncClient(timeout=DEFAULT_TIMEOUT)

    try:
        async with client.stream(
            "POST",
            f"{bridge}/api/v1/swarm/run",
            json=payload,
        ) as response:
            response.raise_for_status()
            async for event in _parse_sse(response):
                yield event
    finally:
        if owns_client:
            await client.aclose()


async def _parse_sse(response: httpx.Response) -> AsyncIterator[dict[str, Any]]:
    """Parse a text/event-stream response into event dicts.

    Only ``data:`` lines are consumed; ``event:`` / ``id:`` / ``retry:`` are
    ignored because the Ruflo bridge carries the event type inside the JSON
    payload.
    """
    buffer = ""
    async for chunk in response.aiter_text():
        buffer += chunk
        while "\n\n" in buffer:
            raw, buffer = buffer.split("\n\n", 1)
            data_parts: list[str] = []
            for line in raw.splitlines():
                if line.startswith("data:"):
                    data_parts.append(line[len("data:"):].lstrip())
            if not data_parts:
                continue
            try:
                yield json.loads("\n".join(data_parts))
            except json.JSONDecodeError:
                continue
