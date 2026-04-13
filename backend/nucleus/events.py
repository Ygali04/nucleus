"""Event publishing for WebSocket / Redis pubsub.

Events are dual-published: to an in-process bus (for same-process subscribers
and tests) and to Redis pubsub channel ``nucleus:job:{job_id}`` (so a
WebSocket handler in the API process can receive events emitted by a Celery
worker in a different process).

Set ``NUCLEUS_NO_REDIS=1`` to skip the Redis publish entirely (used by the
test suite).
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from collections.abc import Callable
from typing import Any
from uuid import uuid4

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-process event bus
# ---------------------------------------------------------------------------

_event_log: list[dict[str, Any]] = []

# job_id -> {subscriber_id: callback}
_subscribers: dict[str, dict[str, Callable[[dict[str, Any]], None]]] = {}


def reset() -> None:
    _event_log.clear()
    _subscribers.clear()
    _reset_redis_client()


def get_events(job_id: str | None = None) -> list[dict[str, Any]]:
    if job_id is None:
        return list(_event_log)
    return [e for e in _event_log if e.get("job_id") == job_id]


# ---------------------------------------------------------------------------
# Redis pubsub (lazy + configurable)
# ---------------------------------------------------------------------------

_redis_client: Any = None
_redis_client_lock = asyncio.Lock()


def _reset_redis_client() -> None:
    """Drop the cached Redis client (test teardown / reconfigure)."""
    global _redis_client
    _redis_client = None


def channel_for(job_id: str) -> str:
    return f"nucleus:job:{job_id}"


async def get_redis_client() -> Any | None:
    """Return a lazily-constructed async Redis client, or ``None`` if disabled.

    Disabled when ``NUCLEUS_NO_REDIS=1`` or when the redis library is missing.
    """
    if os.getenv("NUCLEUS_NO_REDIS") == "1":
        return None

    global _redis_client
    if _redis_client is not None:
        return _redis_client

    async with _redis_client_lock:
        if _redis_client is not None:
            return _redis_client
        try:
            from redis import asyncio as aioredis  # type: ignore
        except ImportError:
            logger.debug("redis library not installed; skipping pubsub publish")
            return None

        url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        _redis_client = aioredis.from_url(url, decode_responses=True)
        return _redis_client


async def publish_event(job_id: str, event_type: str, data: dict[str, Any]) -> None:
    """Publish an event to in-process subscribers and Redis pubsub."""
    payload = {"job_id": job_id, "event_type": event_type, **data}
    _event_log.append(payload)
    for cb in _subscribers.get(job_id, {}).values():
        try:
            cb(payload)
        except Exception:  # noqa: BLE001 — subscribers shouldn't break publishers
            logger.exception("in-process subscriber raised")

    client = await get_redis_client()
    if client is None:
        return
    try:
        await client.publish(channel_for(job_id), json.dumps(payload))
    except Exception:  # noqa: BLE001 — redis outage shouldn't break the loop
        logger.exception("redis publish failed for %s", channel_for(job_id))


def subscribe(
    job_id: str, callback: Callable[[dict[str, Any]], None]
) -> Callable[[], None]:
    """Subscribe to in-process events for a job. Returns an unsubscribe function."""
    sub_id = uuid4().hex
    _subscribers.setdefault(job_id, {})[sub_id] = callback

    def _unsubscribe() -> None:
        subs = _subscribers.get(job_id, {})
        subs.pop(sub_id, None)

    return _unsubscribe
