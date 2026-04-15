"""Coverage for the strategist agent's GTM + SOP tool endpoints."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from nucleus import events, store
from nucleus.app import app
from nucleus.tools.schemas import (
    GenerateGtmStrategyRequest,
    GenerateGtmStrategyResponse,
    GenerateSopRequest,
    GenerateSopResponse,
    StrategyVariant,
)
from nucleus.tools.generate_gtm_strategy import generate_gtm_strategy
from nucleus.tools.generate_sop import generate_sop


@pytest.fixture(autouse=True)
def _mock_mode(monkeypatch):
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")
    monkeypatch.delenv("GLM_API_KEY", raising=False)
    store.reset()
    events.reset()
    yield
    store.reset()
    events.reset()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def _sample_variants() -> list[StrategyVariant]:
    return [
        StrategyVariant(
            video_url="s3://nucleus-mock/v1.mp4",
            score=81.5,
            report={"breakdown": {"hook_score": 78.0, "emotional_resonance": 74.2}},
            cost_usd=0.21,
            iteration_count=2,
            icp="founder",
            platform="tiktok",
            archetype="testimonial",
            language="en",
        ),
        StrategyVariant(
            video_url="s3://nucleus-mock/v2.mp4",
            score=72.3,
            report={"breakdown": {"hook_score": 65.0, "emotional_resonance": 70.1}},
            cost_usd=0.18,
            iteration_count=3,
            icp="operator",
        ),
    ]


@pytest.mark.asyncio
async def test_generate_gtm_strategy_mock_produces_markdown():
    req = GenerateGtmStrategyRequest(
        campaign_id="camp-xyz",
        variants=_sample_variants(),
        brand_name="Acme",
    )
    res = await generate_gtm_strategy(req)

    assert isinstance(res, GenerateGtmStrategyResponse)
    assert "GTM Strategy Guide" in res.gtm_guide
    assert "Acme" in res.gtm_guide
    assert "Variant 1" in res.gtm_guide
    assert "81.5" in res.gtm_guide
    assert res.strategy_summary  # non-empty


@pytest.mark.asyncio
async def test_generate_gtm_strategy_handles_empty_variants():
    req = GenerateGtmStrategyRequest(campaign_id="camp-empty", variants=[])
    res = await generate_gtm_strategy(req)
    assert "No passing variants" in res.gtm_guide
    assert res.strategy_summary


@pytest.mark.asyncio
async def test_generate_sop_mock_produces_markdown():
    req = GenerateSopRequest(
        campaign_id="camp-xyz",
        variants=_sample_variants(),
        brand_kb={"name": "Acme", "voice_tone": ["confident", "warm"]},
        icp={"persona": "Founder, 35, B2B SaaS", "pain_point": "slow rollout"},
        iterations_log=[
            {"edit_type": "hook_rewrite", "score": 65.4},
            {"edit_type": "music_swap", "score": 81.5},
        ],
        brand_name="Acme",
    )
    res = await generate_sop(req)
    assert isinstance(res, GenerateSopResponse)
    assert "Campaign SOP" in res.sop_doc
    assert "Acme" in res.sop_doc
    assert "Founder" in res.sop_doc
    assert "hook_rewrite" in res.sop_doc
    assert "music_swap" in res.sop_doc


def test_gtm_endpoint_shape(client):
    payload = {
        "campaign_id": "c1",
        "variants": [
            {
                "video_url": "s3://x/1.mp4",
                "score": 77.7,
                "report": {"breakdown": {"hook_score": 70.0}},
                "cost_usd": 0.15,
                "iteration_count": 1,
            }
        ],
        "brand_name": "Acme",
    }
    res = client.post("/api/v1/tools/generate_gtm_strategy", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert "gtm_guide" in body and "strategy_summary" in body
    assert "77.7" in body["gtm_guide"]


def test_sop_endpoint_shape(client):
    payload = {
        "campaign_id": "c1",
        "variants": [
            {
                "video_url": "s3://x/1.mp4",
                "score": 77.7,
                "report": {"breakdown": {"hook_score": 70.0}},
            }
        ],
        "brand_kb": {"name": "Acme"},
        "icp": {"persona": "Founder"},
        "iterations_log": [{"edit_type": "hook_rewrite", "score": 77.7}],
    }
    res = client.post("/api/v1/tools/generate_sop", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert "sop_doc" in body
    assert "Campaign SOP" in body["sop_doc"]
