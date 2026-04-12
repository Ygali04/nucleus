"""Event publishing for WebSocket / Redis pubsub.

In production this publishes JSON to ``nucleus:job:{job_id}`` on Redis.
For tests the module exposes an in-process event log that can be inspected
without Redis running.
"""

from __future__ import annotations

from typing import Any

# ---------------------------------------------------------------------------
# In-process event bus (swap for Redis pubsub in production)
# ---------------------------------------------------------------------------

_event_log: list[dict[str, Any]] = []


def reset() -> None:
    _event_log.clear()


def get_events(job_id: str | None = None) -> list[dict[str, Any]]:
    if job_id is None:
        return list(_event_log)
    return [e for e in _event_log if e.get("job_id") == job_id]


async def publish_event(job_id: str, event_type: str, data: dict[str, Any]) -> None:
    """Publish an event to the ``nucleus:job:{job_id}`` channel."""
    payload = {"job_id": job_id, "type": event_type, **data}
    _event_log.append(payload)
    # In production: await redis.publish(f"nucleus:job:{job_id}", json.dumps(payload))
