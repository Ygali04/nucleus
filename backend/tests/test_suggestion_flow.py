"""Tests for the canvas.node_suggested approve/reject HTTP endpoints."""

from __future__ import annotations

import asyncio

import pytest
from fastapi.testclient import TestClient

from nucleus import events, store
from nucleus.app import app
from nucleus.models import Campaign
from nucleus.orchestrator.suggestions import (
    _reset_for_tests,
    get_pending,
    register_pending_suggestion,
)


@pytest.fixture(autouse=True)
def _reset_state():
    store.reset()
    events.reset()
    _reset_for_tests()
    yield
    store.reset()
    events.reset()
    _reset_for_tests()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.mark.asyncio
async def test_approve_resolves_pending_event(client):
    handle = await register_pending_suggestion("sug-approve-1", "camp-1")

    # Kick off a background waiter to simulate the orchestrator pausing on it.
    waiter = asyncio.create_task(asyncio.wait_for(handle.event.wait(), timeout=5.0))

    res = client.post("/api/v1/campaigns/camp-1/suggestions/sug-approve-1/approve")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "approved"
    assert body["suggestion_id"] == "sug-approve-1"
    assert body["known"] == "true"

    # Waiter should now unblock.
    await waiter

    resolved = await get_pending("sug-approve-1")
    assert resolved is not None and resolved.status == "approved"

    types = [e["event_type"] for e in events.get_events("camp-1")]
    assert "canvas.node_approved" in types


@pytest.mark.asyncio
async def test_reject_carries_feedback(client):
    handle = await register_pending_suggestion("sug-reject-1", "camp-1")
    waiter = asyncio.create_task(asyncio.wait_for(handle.event.wait(), timeout=5.0))

    res = client.post(
        "/api/v1/campaigns/camp-1/suggestions/sug-reject-1/reject",
        json={"feedback": "wrong kind of node"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "rejected"

    await waiter

    resolved = await get_pending("sug-reject-1")
    assert resolved is not None
    assert resolved.status == "rejected"
    assert resolved.feedback == "wrong kind of node"

    rejected_events = [
        e for e in events.get_events("camp-1")
        if e["event_type"] == "canvas.node_rejected"
    ]
    assert rejected_events
    assert rejected_events[-1].get("feedback") == "wrong kind of node"


def test_unknown_suggestion_still_publishes_event(client):
    res = client.post(
        "/api/v1/campaigns/camp-1/suggestions/nope/approve"
    )
    assert res.status_code == 200
    body = res.json()
    assert body["known"] == "false"
    types = [e["event_type"] for e in events.get_events("camp-1")]
    assert "canvas.node_approved" in types
