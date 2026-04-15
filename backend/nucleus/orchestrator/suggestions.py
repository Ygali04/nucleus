"""Pending suggestion registry.

When Ruflo proposes a new node mid-run, it emits ``canvas.node_suggested``
with a ``suggestion_id``. The orchestrator awaits an ``asyncio.Event`` keyed
by that id; the HTTP approve/reject endpoints (in ``routes/campaigns.py``)
resolve the event so the loop continues.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Any


@dataclass
class PendingSuggestion:
    """One-shot handle: ``event`` flips on approve/reject."""

    suggestion_id: str
    campaign_id: str
    event: asyncio.Event = field(default_factory=asyncio.Event)
    status: str = "pending"  # "pending" | "approved" | "rejected"
    feedback: str | None = None
    payload: dict[str, Any] = field(default_factory=dict)


# Module-level registry, guarded by a single lock. Keys are suggestion_ids.
_PENDING: dict[str, PendingSuggestion] = {}
_LOCK = asyncio.Lock()


async def register_pending_suggestion(
    suggestion_id: str, campaign_id: str, payload: dict[str, Any] | None = None
) -> PendingSuggestion:
    async with _LOCK:
        handle = PendingSuggestion(
            suggestion_id=suggestion_id,
            campaign_id=campaign_id,
            payload=payload or {},
        )
        _PENDING[suggestion_id] = handle
        return handle


async def resolve_suggestion(
    suggestion_id: str, *, approved: bool, feedback: str | None = None
) -> PendingSuggestion | None:
    """Flip a pending suggestion's event. Returns the handle or ``None``."""
    async with _LOCK:
        handle = _PENDING.get(suggestion_id)
        if handle is None:
            return None
        handle.status = "approved" if approved else "rejected"
        handle.feedback = feedback
    handle.event.set()
    return handle


async def get_pending(suggestion_id: str) -> PendingSuggestion | None:
    async with _LOCK:
        return _PENDING.get(suggestion_id)


async def drop_pending(suggestion_id: str) -> None:
    async with _LOCK:
        _PENDING.pop(suggestion_id, None)


def _reset_for_tests() -> None:
    """Clear the registry (test hook)."""
    _PENDING.clear()


__all__ = [
    "PendingSuggestion",
    "register_pending_suggestion",
    "resolve_suggestion",
    "get_pending",
    "drop_pending",
]
