"""Tests for the Celery worker wiring and Redis pubsub event forwarding.

Uses ``task_always_eager`` so tasks run in-process without a real broker,
and ``fakeredis`` to verify events reach the ``nucleus:job:{job_id}``
pubsub channel without touching a real Redis server.
"""

from __future__ import annotations

import asyncio
import json
import random

import fakeredis.aioredis
import pytest
from fastapi.testclient import TestClient

from nucleus import events, store
from nucleus.app import app
from nucleus.models import BriefRequest, Job, JobState
from nucleus.orchestrator.planner import expand_brief
from nucleus.worker import celery_app, run_job_task


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def _reset_state(monkeypatch):
    store.reset()
    events.reset()
    random.seed(42)
    # Default: eager execution, in-process only (no redis).
    celery_app.conf.task_always_eager = True
    celery_app.conf.task_eager_propagates = True
    monkeypatch.setenv("NUCLEUS_NO_REDIS", "1")
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")
    yield
    store.reset()
    events.reset()


@pytest.fixture
def fake_redis(monkeypatch):
    """Install a fakeredis client as the event module's Redis client."""
    monkeypatch.delenv("NUCLEUS_NO_REDIS", raising=False)
    client = fakeredis.aioredis.FakeRedis(decode_responses=True)

    async def _get():
        return client

    monkeypatch.setattr(events, "get_redis_client", _get)
    return client


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
# Eager task execution
# ---------------------------------------------------------------------------

class TestTaskEager:
    @pytest.mark.asyncio
    async def test_run_job_task_invokes_orchestrator(self):
        """Submitting a job via the task should drive the orchestrator loop."""
        brief = _minimal_brief()
        job = Job(brief=brief)
        await store.save_job(job)

        for c in expand_brief(brief, job.id):
            await store.save_candidate(c)

        result = run_job_task.delay(job.id).get(timeout=10)

        assert result["job_id"] == job.id
        assert result["candidate_count"] == 1
        assert result["status"] == "complete"

        # Final job state is complete.
        saved = await store.get_job(job.id)
        assert saved.state == JobState.COMPLETE

        # The orchestrator loop published candidate lifecycle events.
        types = [e["event_type"] for e in events.get_events(job.id)]
        assert "candidate.generating" in types
        assert "candidate.scored" in types
        assert "candidate.delivered" in types
        assert "job.complete" in types

    @pytest.mark.asyncio
    async def test_multi_candidate_job(self):
        brief = _minimal_brief(icps=["founder", "cmo"])
        job = Job(brief=brief)
        await store.save_job(job)
        for c in expand_brief(brief, job.id):
            await store.save_candidate(c)

        result = run_job_task.delay(job.id).get(timeout=15)
        assert result["candidate_count"] == 2

        delivered = [
            e for e in events.get_events(job.id)
            if e["event_type"] == "candidate.delivered"
        ]
        assert len(delivered) == 2


# ---------------------------------------------------------------------------
# HTTP endpoint returns immediately and enqueues
# ---------------------------------------------------------------------------

class TestBriefEndpoint:
    def test_post_brief_enqueues_and_returns(self):
        client = TestClient(app)
        payload = _minimal_brief().model_dump()
        resp = client.post("/api/v1/briefs", json=payload)
        assert resp.status_code == 200
        body = resp.json()
        assert "job_id" in body
        assert body["websocket_url"] == f"/ws/job/{body['job_id']}"
        assert body["candidate_count"] == 1


# ---------------------------------------------------------------------------
# Redis pubsub publishing
# ---------------------------------------------------------------------------

class TestRedisPubsub:
    @pytest.mark.asyncio
    async def test_publish_event_reaches_redis_channel(self, fake_redis):
        """Events published via publish_event land on the Redis channel."""
        job_id = "job-abc"
        pubsub = fake_redis.pubsub()
        await pubsub.subscribe(events.channel_for(job_id))

        # Drain the subscribe confirmation.
        await pubsub.get_message(ignore_subscribe_messages=True, timeout=0.1)

        await events.publish_event(job_id, "test.event", {"foo": "bar"})

        # Poll for the published message.
        received = None
        for _ in range(20):
            msg = await pubsub.get_message(
                ignore_subscribe_messages=True, timeout=0.1,
            )
            if msg and msg.get("type") == "message":
                received = msg
                break
            await asyncio.sleep(0.01)

        await pubsub.unsubscribe(events.channel_for(job_id))
        await pubsub.aclose()

        assert received is not None, "no message received on redis channel"
        payload = json.loads(received["data"])
        assert payload == {"job_id": job_id, "event_type": "test.event", "foo": "bar"}

    @pytest.mark.asyncio
    async def test_no_redis_flag_skips_publish(self, monkeypatch):
        """NUCLEUS_NO_REDIS=1 must short-circuit before touching redis."""
        monkeypatch.setenv("NUCLEUS_NO_REDIS", "1")
        # Any cached client must be dropped so the env var is re-read.
        events._reset_redis_client()
        client = await events.get_redis_client()
        assert client is None

    @pytest.mark.asyncio
    async def test_orchestrator_events_reach_redis(self, fake_redis):
        """A full task run publishes its events to the Redis channel."""
        brief = _minimal_brief()
        job = Job(brief=brief)
        await store.save_job(job)
        for c in expand_brief(brief, job.id):
            await store.save_candidate(c)

        pubsub = fake_redis.pubsub()
        await pubsub.subscribe(events.channel_for(job.id))
        await pubsub.get_message(ignore_subscribe_messages=True, timeout=0.1)

        # Run eagerly (in this async task context we call the underlying coroutine).
        from nucleus.worker.tasks import _run_job_async
        await _run_job_async(job.id)

        received: list[dict] = []
        for _ in range(200):
            msg = await pubsub.get_message(
                ignore_subscribe_messages=True, timeout=0.05,
            )
            if msg and msg.get("type") == "message":
                received.append(json.loads(msg["data"]))
            else:
                # No more queued messages.
                break

        await pubsub.unsubscribe(events.channel_for(job.id))
        await pubsub.aclose()

        types = [e["event_type"] for e in received]
        assert "candidate.generating" in types
        assert "job.complete" in types
