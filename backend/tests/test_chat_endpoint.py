"""Coverage for POST /api/v1/campaigns/{id}/chat — Ruflo canvas chat."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from nucleus import events, store
from nucleus.app import app


@pytest.fixture(autouse=True)
def _reset_state(monkeypatch):
    store.reset()
    events.reset()
    monkeypatch.setenv("NUCLEUS_NO_REDIS", "1")
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")
    yield
    store.reset()
    events.reset()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def _create_campaign(client: TestClient) -> str:
    payload = {
        "archetype": "testimonial",
        "brand_name": "Acme",
        "graph": {"nodes": [], "edges": []},
    }
    return client.post("/api/v1/campaigns", json=payload).json()["id"]


def test_chat_appends_to_campaign_history(client):
    cid = _create_campaign(client)
    res = client.post(f"/api/v1/campaigns/{cid}/chat", json={"content": "hello ruflo"})
    assert res.status_code == 200

    refreshed = client.get(f"/api/v1/campaigns/{cid}").json()
    history = (refreshed.get("brief") or {}).get("chat_history") or []
    assert len(history) == 1
    assert history[0]["role"] == "user"
    assert history[0]["content"] == "hello ruflo"
    assert history[0]["id"]
    assert history[0]["timestamp"]


def test_chat_publishes_user_message_event(client):
    cid = _create_campaign(client)
    captured: list[tuple[str, str, dict]] = []

    async def fake_publish(job_id, event_type, data):
        captured.append((job_id, event_type, data))

    from nucleus.routes import campaigns as campaigns_route

    orig = campaigns_route.publish_event
    campaigns_route.publish_event = fake_publish  # type: ignore[assignment]
    try:
        res = client.post(f"/api/v1/campaigns/{cid}/chat", json={"content": "hi"})
        assert res.status_code == 200
    finally:
        campaigns_route.publish_event = orig  # type: ignore[assignment]

    assert any(evt == "chat.user_message" and jid == cid for jid, evt, _ in captured)
    _, _, payload = next(c for c in captured if c[1] == "chat.user_message")
    assert payload["message"]["content"] == "hi"


def test_chat_missing_campaign_returns_404(client):
    res = client.post("/api/v1/campaigns/does-not-exist/chat", json={"content": "hi"})
    assert res.status_code == 404


def test_chat_empty_content_returns_400(client):
    cid = _create_campaign(client)
    res = client.post(f"/api/v1/campaigns/{cid}/chat", json={"content": "   "})
    assert res.status_code == 400


def test_chat_returns_queued_status(client):
    cid = _create_campaign(client)
    res = client.post(f"/api/v1/campaigns/{cid}/chat", json={"content": "hi"})
    assert res.status_code == 200
    assert res.json() == {"status": "queued"}
