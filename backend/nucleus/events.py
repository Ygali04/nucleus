"""Event publishing for WebSocket / Redis pubsub.

In production this publishes JSON to ``nucleus:job:{job_id}`` on Redis.
For tests the module exposes an in-process event log that can be inspected
without Redis running.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any
from uuid import uuid4

# ---------------------------------------------------------------------------
# In-process event bus (swap for Redis pubsub in production)
# ---------------------------------------------------------------------------

_event_log: list[dict[str, Any]] = []

# job_id -> {subscriber_id: callback}
_subscribers: dict[str, dict[str, Callable[[dict[str, Any]], None]]] = {}


def reset() -> None:
    _event_log.clear()
    _subscribers.clear()


def get_events(job_id: str | None = None) -> list[dict[str, Any]]:
    if job_id is None:
        return list(_event_log)
    return [e for e in _event_log if e.get("job_id") == job_id]


async def publish_event(job_id: str, event_type: str, data: dict[str, Any]) -> None:
    """Publish an event to the ``nucleus:job:{job_id}`` channel."""
    payload = {"job_id": job_id, "event_type": event_type, **data}
    _event_log.append(payload)
    for cb in _subscribers.get(job_id, {}).values():
        try:
            cb(payload)
        except Exception:  # noqa: BLE001 — subscribers shouldn't break publishers
            pass
    # In production: await redis.publish(f"nucleus:job:{job_id}", json.dumps(payload))


def subscribe(
    job_id: str, callback: Callable[[dict[str, Any]], None]
) -> Callable[[], None]:
    """Subscribe to events for a job. Returns an unsubscribe function."""
    sub_id = uuid4().hex
    _subscribers.setdefault(job_id, {})[sub_id] = callback

    def _unsubscribe() -> None:
        subs = _subscribers.get(job_id, {})
        subs.pop(sub_id, None)

    return _unsubscribe
