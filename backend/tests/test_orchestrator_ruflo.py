"""Tests for the Ruflo-backed orchestrator loop.

The Ruflo bridge (Node service) is mocked with ``httpx.MockTransport`` so
these tests stay hermetic — we verify the Python loop sends the correct
request and correctly applies streamed SSE events to the store.
"""

from __future__ import annotations

import json
import os
import random
from typing import Any

import httpx
import pytest

from nucleus import events, store
from nucleus.models import BriefRequest, Job, JobState
from nucleus.orchestrator.loop import run_candidate_loop, run_job
from nucleus.orchestrator.planner import expand_brief


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def _reset_state(monkeypatch):
    store.reset()
    events.reset()
    random.seed(42)
    # Ensure mock-providers env var doesn't leak between tests.
    monkeypatch.delenv("NUCLEUS_MOCK_PROVIDERS", raising=False)
    yield
    store.reset()
    events.reset()


def _minimal_brief(**overrides) -> BriefRequest:
    defaults = dict(
        brand_id="brand-test",
        source_url="s3://source/test.mp4",
        icps=["sme-founder"],
        languages=["en"],
        platforms=["tiktok"],
        archetypes=["testimonial"],
        variants_per_cell=1,
        score_threshold=60.0,
        max_iterations=5,
    )
    defaults.update(overrides)
    return BriefRequest(**defaults)


# ---------------------------------------------------------------------------
# SSE response helpers
# ---------------------------------------------------------------------------

def _sse(events_: list[dict[str, Any]]) -> bytes:
    parts = [f"data: {json.dumps(e)}\n\n" for e in events_]
    return "".join(parts).encode("utf-8")


def _build_transport(
    events_: list[dict[str, Any]],
    *,
    capture: list[httpx.Request] | None = None,
) -> httpx.MockTransport:
    body = _sse(events_)

    def handler(request: httpx.Request) -> httpx.Response:
        if capture is not None:
            capture.append(request)
        if request.url.path.endswith("/api/v1/swarm/run"):
            return httpx.Response(
                200,
                headers={"content-type": "text/event-stream"},
                content=body,
            )
        return httpx.Response(404)

    return httpx.MockTransport(handler)


def _converging_events(job_id: str, candidate_id: str) -> list[dict[str, Any]]:
    """Fixture stream: swarm converges on iteration 1 with score=72."""
    return [
        {
            "event_type": "swarm.started",
            "job_id": job_id,
            "candidate_id": candidate_id,
            "agents": ["orchestrator", "generator", "editor", "scorer", "strategist"],
        },
        {
            "event_type": "candidate.generating",
            "job_id": job_id,
            "candidate_id": candidate_id,
            "iteration": 0,
        },
        {
            "event_type": "candidate.scored",
            "job_id": job_id,
            "candidate_id": candidate_id,
            "iteration": 0,
            "score": 48.0,
            "video_url": "s3://nucleus/v0.mp4",
            "breakdown": {
                "hook_score": 30.0,
                "sustained_attention": 50.0,
                "emotional_resonance": 55.0,
                "cognitive_accessibility": 60.0,
                "memory_encoding": 50.0,
                "aesthetic_quality": 55.0,
            },
            "attention_curve": [55, 50, 48, 45, 42, 40, 38, 36, 34, 32],
        },
        {
            "event_type": "iteration.evaluated",
            "job_id": job_id,
            "candidate_id": candidate_id,
            "iteration": 0,
            "score": 48.0,
            "decision": "continue",
        },
        {
            "event_type": "candidate.edited",
            "job_id": job_id,
            "candidate_id": candidate_id,
            "iteration": 1,
            "edit_type": "hook_rewrite",
            "video_url": "s3://nucleus/v1.mp4",
        },
        {
            "event_type": "candidate.generating",
            "job_id": job_id,
            "candidate_id": candidate_id,
            "iteration": 1,
        },
        {
            "event_type": "candidate.scored",
            "job_id": job_id,
            "candidate_id": candidate_id,
            "iteration": 1,
            "score": 72.0,
            "video_url": "s3://nucleus/v1.mp4",
            "breakdown": {
                "hook_score": 75.0,
                "sustained_attention": 70.0,
                "emotional_resonance": 72.0,
                "cognitive_accessibility": 72.0,
                "memory_encoding": 71.0,
                "aesthetic_quality": 72.0,
            },
            "attention_curve": [72] * 10,
        },
        {
            "event_type": "iteration.evaluated",
            "job_id": job_id,
            "candidate_id": candidate_id,
            "iteration": 1,
            "score": 72.0,
            "decision": "passed_threshold",
        },
        {
            "event_type": "candidate.delivered",
            "job_id": job_id,
            "candidate_id": candidate_id,
            "score": 72.0,
            "iterations": 2,
            "decision": "passed_threshold",
            "final_video_url": "s3://nucleus/v1.mp4",
            "cost_usd": 0.23,
        },
    ]


# ---------------------------------------------------------------------------
# Request shape
# ---------------------------------------------------------------------------

class TestRequestShape:
    @pytest.mark.asyncio
    async def test_posts_correct_body(self, monkeypatch):
        monkeypatch.setenv("RUFLO_BRIDGE_URL", "http://bridge.test")
        monkeypatch.setenv("NUCLEUS_API_URL", "http://api.test")

        brief = _minimal_brief()
        job = Job(brief=brief)
        await store.save_job(job)
        candidate = expand_brief(brief, job.id)[0]
        await store.save_candidate(candidate)

        captured: list[httpx.Request] = []
        transport = _build_transport(
            _converging_events(job.id, candidate.id), capture=captured
        )
        client = httpx.AsyncClient(transport=transport)
        try:
            await run_candidate_loop(candidate.id, mock=False, client=client)
        finally:
            await client.aclose()

        assert len(captured) == 1
        req = captured[0]
        assert req.method == "POST"
        assert str(req.url) == "http://bridge.test/api/v1/swarm/run"
        body = json.loads(req.content)
        assert body["job_id"] == job.id
        assert body["tools_base_url"] == "http://api.test"
        assert body["candidate_spec"]["id"] == candidate.id
        assert body["candidate_spec"]["icp"] == "sme-founder"
        assert body["candidate_spec"]["score_threshold"] == 60.0


# ---------------------------------------------------------------------------
# Event application
# ---------------------------------------------------------------------------

class TestEventApplication:
    @pytest.mark.asyncio
    async def test_events_write_iterations_and_scores(self):
        brief = _minimal_brief()
        job = Job(brief=brief)
        await store.save_job(job)
        candidate = expand_brief(brief, job.id)[0]
        await store.save_candidate(candidate)

        transport = _build_transport(_converging_events(job.id, candidate.id))
        client = httpx.AsyncClient(transport=transport)
        try:
            await run_candidate_loop(candidate.id, mock=False, client=client)
        finally:
            await client.aclose()

        # Candidate reached COMPLETE
        c = await store.get_candidate(candidate.id)
        assert c.state == JobState.COMPLETE

        # Two iterations written, with scores
        iters = await store.list_iterations(candidate.id)
        assert len(iters) == 2
        assert iters[0].score is not None and iters[0].score.neural_score == 48.0
        assert iters[1].score is not None and iters[1].score.neural_score == 72.0

        # Iteration 1 picked up the edit_type from the candidate.edited event
        assert iters[1].edit_type is not None
        assert iters[1].edit_type.value == "hook_rewrite"

        # Video URLs propagated
        assert iters[0].video_url == "s3://nucleus/v0.mp4"
        assert iters[1].video_url == "s3://nucleus/v1.mp4"

    @pytest.mark.asyncio
    async def test_events_republished_on_bus(self):
        brief = _minimal_brief()
        job = Job(brief=brief)
        await store.save_job(job)
        candidate = expand_brief(brief, job.id)[0]
        await store.save_candidate(candidate)

        transport = _build_transport(_converging_events(job.id, candidate.id))
        client = httpx.AsyncClient(transport=transport)
        try:
            await run_candidate_loop(candidate.id, mock=False, client=client)
        finally:
            await client.aclose()

        types = [e["event_type"] for e in events.get_events(job.id)]
        assert "candidate.generating" in types
        assert "candidate.scored" in types
        assert "iteration.evaluated" in types
        assert "candidate.edited" in types
        assert "candidate.delivered" in types


# ---------------------------------------------------------------------------
# Stop conditions (the orchestrator agent emits these; Python just records)
# ---------------------------------------------------------------------------

class TestStopConditions:
    @pytest.mark.asyncio
    async def test_passed_threshold_recorded(self):
        brief = _minimal_brief()
        job = Job(brief=brief)
        await store.save_job(job)
        candidate = expand_brief(brief, job.id)[0]
        await store.save_candidate(candidate)

        transport = _build_transport(_converging_events(job.id, candidate.id))
        client = httpx.AsyncClient(transport=transport)
        try:
            await run_candidate_loop(candidate.id, mock=False, client=client)
        finally:
            await client.aclose()

        evaluated = [
            e for e in events.get_events(job.id)
            if e["event_type"] == "iteration.evaluated"
        ]
        assert evaluated[-1]["decision"] == "passed_threshold"

    @pytest.mark.asyncio
    async def test_max_iterations_recorded(self):
        brief = _minimal_brief(max_iterations=2)
        job = Job(brief=brief)
        await store.save_job(job)
        candidate = expand_brief(brief, job.id)[0]
        await store.save_candidate(candidate)

        # Bridge emits two failing iterations, then max_iterations.
        bridge_events = [
            {"event_type": "candidate.generating", "job_id": job.id,
             "candidate_id": candidate.id, "iteration": 0},
            {"event_type": "candidate.scored", "job_id": job.id,
             "candidate_id": candidate.id, "iteration": 0,
             "score": 40.0, "video_url": "s3://v0.mp4",
             "breakdown": {}, "attention_curve": []},
            {"event_type": "iteration.evaluated", "job_id": job.id,
             "candidate_id": candidate.id, "iteration": 0,
             "score": 40.0, "decision": "continue"},
            {"event_type": "candidate.edited", "job_id": job.id,
             "candidate_id": candidate.id, "iteration": 1,
             "edit_type": "hook_rewrite", "video_url": "s3://v1.mp4"},
            {"event_type": "candidate.scored", "job_id": job.id,
             "candidate_id": candidate.id, "iteration": 1,
             "score": 42.0, "video_url": "s3://v1.mp4",
             "breakdown": {}, "attention_curve": []},
            {"event_type": "iteration.evaluated", "job_id": job.id,
             "candidate_id": candidate.id, "iteration": 1,
             "score": 42.0, "decision": "max_iterations"},
            {"event_type": "candidate.delivered", "job_id": job.id,
             "candidate_id": candidate.id, "score": 42.0,
             "iterations": 2, "decision": "max_iterations",
             "final_video_url": "s3://v1.mp4", "cost_usd": 0.3},
        ]
        transport = _build_transport(bridge_events)
        client = httpx.AsyncClient(transport=transport)
        try:
            await run_candidate_loop(candidate.id, mock=False, client=client)
        finally:
            await client.aclose()

        evaluated = [
            e for e in events.get_events(job.id)
            if e["event_type"] == "iteration.evaluated"
        ]
        assert evaluated[-1]["decision"] == "max_iterations"
        c = await store.get_candidate(candidate.id)
        assert c.state == JobState.COMPLETE

    @pytest.mark.asyncio
    async def test_cost_ceiling_recorded(self):
        brief = _minimal_brief(cost_ceiling=0.2)
        job = Job(brief=brief)
        await store.save_job(job)
        candidate = expand_brief(brief, job.id)[0]
        await store.save_candidate(candidate)

        bridge_events = [
            {"event_type": "candidate.generating", "job_id": job.id,
             "candidate_id": candidate.id, "iteration": 0},
            {"event_type": "candidate.scored", "job_id": job.id,
             "candidate_id": candidate.id, "iteration": 0,
             "score": 30.0, "video_url": "s3://v0.mp4",
             "breakdown": {}, "attention_curve": []},
            {"event_type": "iteration.evaluated", "job_id": job.id,
             "candidate_id": candidate.id, "iteration": 0,
             "score": 30.0, "decision": "cost_ceiling"},
            {"event_type": "candidate.delivered", "job_id": job.id,
             "candidate_id": candidate.id, "score": 30.0,
             "iterations": 1, "decision": "cost_ceiling",
             "final_video_url": "s3://v0.mp4", "cost_usd": 0.25},
        ]
        transport = _build_transport(bridge_events)
        client = httpx.AsyncClient(transport=transport)
        try:
            await run_candidate_loop(candidate.id, mock=False, client=client)
        finally:
            await client.aclose()

        evaluated = [
            e for e in events.get_events(job.id)
            if e["event_type"] == "iteration.evaluated"
        ]
        assert evaluated[-1]["decision"] == "cost_ceiling"


# ---------------------------------------------------------------------------
# Mock bypass path
# ---------------------------------------------------------------------------

class TestMockBypass:
    @pytest.mark.asyncio
    async def test_env_var_bypasses_ruflo(self, monkeypatch):
        """NUCLEUS_MOCK_PROVIDERS=true must skip the bridge entirely."""
        monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")

        brief = _minimal_brief()
        job = Job(brief=brief)
        await store.save_job(job)
        candidate = expand_brief(brief, job.id)[0]
        await store.save_candidate(candidate)

        # Transport that would fail if invoked
        def _fail(request: httpx.Request) -> httpx.Response:
            raise AssertionError("Ruflo bridge should not be hit in mock mode")

        client = httpx.AsyncClient(transport=httpx.MockTransport(_fail))
        try:
            await run_candidate_loop(candidate.id, client=client)
        finally:
            await client.aclose()

        c = await store.get_candidate(candidate.id)
        assert c.state == JobState.COMPLETE

        iters = await store.list_iterations(candidate.id)
        assert len(iters) >= 2
        scored = [it for it in iters if it.score is not None]
        scores = [it.score.neural_score for it in scored]
        assert scores[-1] > scores[0], f"Mock scores should improve: {scores}"

    @pytest.mark.asyncio
    async def test_explicit_mock_flag_wins(self):
        """mock=True overrides missing env var."""
        brief = _minimal_brief()
        job = Job(brief=brief)
        await store.save_job(job)
        candidate = expand_brief(brief, job.id)[0]
        await store.save_candidate(candidate)

        await run_candidate_loop(candidate.id, mock=True)
        c = await store.get_candidate(candidate.id)
        assert c.state == JobState.COMPLETE


# ---------------------------------------------------------------------------
# Multi-candidate job
# ---------------------------------------------------------------------------

class TestRufloJob:
    @pytest.mark.asyncio
    async def test_multi_candidate_via_bridge(self):
        brief = _minimal_brief(icps=["founder", "cmo"], variants_per_cell=1)
        job = Job(brief=brief)
        await store.save_job(job)
        specs = expand_brief(brief, job.id)
        cids: list[str] = []
        for c in specs:
            await store.save_candidate(c)
            cids.append(c.id)

        def handler(request: httpx.Request) -> httpx.Response:
            body = json.loads(request.content)
            cid = body["candidate_spec"]["id"]
            return httpx.Response(
                200,
                headers={"content-type": "text/event-stream"},
                content=_sse(_converging_events(job.id, cid)),
            )

        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        try:
            await run_job(job.id, cids, mock=False, client=client)
        finally:
            await client.aclose()

        for cid in cids:
            c = await store.get_candidate(cid)
            assert c.state == JobState.COMPLETE

        delivered = [
            e for e in events.get_events(job.id)
            if e["event_type"] == "candidate.delivered"
        ]
        assert len(delivered) == 2
