"""FastAPI TestClient coverage for the /api/v1/campaigns router."""

from __future__ import annotations

import random

import pytest
from fastapi.testclient import TestClient

from nucleus import events, store
from nucleus.app import app
from nucleus.worker import celery_app


@pytest.fixture(autouse=True)
def _reset_state(monkeypatch):
    store.reset()
    events.reset()
    random.seed(7)
    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = True
    monkeypatch.setenv("NUCLEUS_NO_REDIS", "1")
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")
    yield
    store.reset()
    events.reset()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def _sample_graph() -> dict:
    return {
        "nodes": [
            {"id": "b1", "type": "brand_kb", "data": {"brand_id": "acme", "source_url": "s3://acme/src.mp4"}},
            {"id": "i1", "type": "icp", "data": {"icp": "founder"}},
            {"id": "a1", "type": "archetype", "data": {"archetype": "testimonial"}},
        ],
        "edges": [
            {"id": "e1", "source": "b1", "target": "i1"},
            {"id": "e2", "source": "i1", "target": "a1"},
        ],
    }


def _create_payload(**overrides) -> dict:
    payload = {
        "archetype": "testimonial",
        "brand_name": "Acme",
        "graph": _sample_graph(),
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

def test_create_campaign_returns_full_object(client):
    res = client.post("/api/v1/campaigns", json=_create_payload())
    assert res.status_code == 201
    body = res.json()
    assert body["archetype"] == "testimonial"
    assert body["brand_name"] == "Acme"
    assert body["status"] == "idle"
    assert body["id"]
    assert body["graph"]["nodes"]


def test_list_campaigns_includes_new_rows(client):
    client.post("/api/v1/campaigns", json=_create_payload(brand_name="A"))
    client.post("/api/v1/campaigns", json=_create_payload(brand_name="B"))
    res = client.get("/api/v1/campaigns")
    assert res.status_code == 200
    names = {c["brand_name"] for c in res.json()}
    assert {"A", "B"} <= names


def test_get_campaign_by_id(client):
    created = client.post("/api/v1/campaigns", json=_create_payload()).json()
    res = client.get(f"/api/v1/campaigns/{created['id']}")
    assert res.status_code == 200
    assert res.json()["id"] == created["id"]


def test_get_missing_campaign_returns_404(client):
    res = client.get("/api/v1/campaigns/does-not-exist")
    assert res.status_code == 404


def test_patch_campaign_updates_fields(client):
    created = client.post("/api/v1/campaigns", json=_create_payload()).json()
    res = client.patch(
        f"/api/v1/campaigns/{created['id']}",
        json={"status": "draft", "brand_name": "Renamed"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "draft"
    assert body["brand_name"] == "Renamed"


def test_patch_missing_campaign_returns_404(client):
    res = client.patch("/api/v1/campaigns/missing", json={"status": "x"})
    assert res.status_code == 404


def test_delete_campaign_removes_it(client):
    created = client.post("/api/v1/campaigns", json=_create_payload()).json()
    res = client.delete(f"/api/v1/campaigns/{created['id']}")
    assert res.status_code == 204
    assert client.get(f"/api/v1/campaigns/{created['id']}").status_code == 404


def test_delete_missing_campaign_returns_404(client):
    assert client.delete("/api/v1/campaigns/missing").status_code == 404


# ---------------------------------------------------------------------------
# Execution
# ---------------------------------------------------------------------------

def test_execute_campaign_returns_job_and_ws_url(client):
    created = client.post("/api/v1/campaigns", json=_create_payload()).json()
    res = client.post(f"/api/v1/campaigns/{created['id']}/execute")
    assert res.status_code == 200
    body = res.json()
    assert body["job_id"]
    assert body["websocket_url"] == f"/ws/job/{body['job_id']}"

    # Campaign should now be linked to the job.
    refreshed = client.get(f"/api/v1/campaigns/{created['id']}").json()
    assert refreshed["last_job_id"] == body["job_id"]
    assert refreshed["last_executed_at"] is not None


def test_execute_missing_campaign_returns_404(client):
    res = client.post("/api/v1/campaigns/missing/execute")
    assert res.status_code == 404


def test_execute_uses_brief_overrides_when_graph_sparse(client):
    payload = _create_payload(
        graph={"nodes": [], "edges": []},
        brief={
            "brand_id": "override-brand",
            "source_url": "s3://override/src.mp4",
            "languages": ["en", "es"],
            "platforms": ["tiktok"],
            "max_iterations": 2,
        },
    )
    created = client.post("/api/v1/campaigns", json=payload).json()
    res = client.post(f"/api/v1/campaigns/{created['id']}/execute")
    assert res.status_code == 200


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------

def test_reports_empty_before_execute(client):
    created = client.post("/api/v1/campaigns", json=_create_payload()).json()
    res = client.get(f"/api/v1/campaigns/{created['id']}/reports")
    assert res.status_code == 200
    assert res.json() == []


def test_reports_populated_after_mock_execute(client):
    created = client.post(
        "/api/v1/campaigns",
        json=_create_payload(
            brief={"max_iterations": 1, "score_threshold": 10.0},
        ),
    ).json()
    exec_res = client.post(f"/api/v1/campaigns/{created['id']}/execute")
    assert exec_res.status_code == 200

    res = client.get(f"/api/v1/campaigns/{created['id']}/reports")
    assert res.status_code == 200
    reports = res.json()
    assert len(reports) >= 1
    first = reports[0]
    assert "analysis_result" in first
    assert "neural_score" in first["analysis_result"]


def test_reports_missing_campaign_returns_404(client):
    res = client.get("/api/v1/campaigns/missing/reports")
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# Deliverables (GTM + SOP persistence)
# ---------------------------------------------------------------------------

def test_patch_campaign_deliverables_persists(client):
    created = client.post("/api/v1/campaigns", json=_create_payload()).json()
    patch_body = {
        "deliverables": {
            "gtm_guide": "# GTM\n- launch on TikTok first",
            "sop_doc": "# SOP\n- brand voice: warm",
            "strategy_summary": "ship v1 first",
            "generated_at": "2026-04-14T12:00:00+00:00",
        }
    }
    res = client.patch(f"/api/v1/campaigns/{created['id']}", json=patch_body)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["deliverables"] is not None
    assert "GTM" in body["deliverables"]["gtm_guide"]
    assert "SOP" in body["deliverables"]["sop_doc"]
    assert body["deliverables"]["strategy_summary"] == "ship v1 first"

    # Refetch to confirm the value round-tripped through the store layer.
    fetched = client.get(f"/api/v1/campaigns/{created['id']}").json()
    assert fetched["deliverables"]["gtm_guide"].startswith("# GTM")
    assert fetched["deliverables"]["sop_doc"].startswith("# SOP")
