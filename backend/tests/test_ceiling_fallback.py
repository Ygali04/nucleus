"""Tests for the ceiling-fallback path.

When a candidate hits ``max_iterations`` without clearing the score threshold,
the orchestrator must:

  * Emit ``candidate.delivered`` with ``decision: "ceiling"`` (not
    ``"max_iterations"`` or ``"continue"``).
  * Emit a ``chat.assistant_message`` explaining what was tried, top score,
    and that it's being forwarded to delivery with a GTM note.

Both the mock-loop path (Python-driven) and the Ruflo-bridge path (emulated
here with httpx.MockTransport) are covered.
"""

from __future__ import annotations

import json
import random
from typing import Any

import httpx
import pytest

from nucleus import events, store
from nucleus.models import BriefRequest, Job
from nucleus.orchestrator.loop import run_candidate_loop
from nucleus.orchestrator.planner import expand_brief


@pytest.fixture(autouse=True)
def _reset_state(monkeypatch):
    store.reset()
    events.reset()
    random.seed(1)
    monkeypatch.delenv("NUCLEUS_MOCK_PROVIDERS", raising=False)
    yield
    store.reset()
    events.reset()


def _brief(**overrides) -> BriefRequest:
    defaults = dict(
        brand_id="ceil-brand",
        source_url="s3://ceil/in.mp4",
        icps=["founder"],
        languages=["en"],
        platforms=["tiktok"],
        archetypes=["testimonial"],
        variants_per_cell=1,
        score_threshold=99.0,  # unreachable by mock progressive score
        max_iterations=2,
    )
    defaults.update(overrides)
    return BriefRequest(**defaults)


class TestMockCeiling:
    @pytest.mark.asyncio
    async def test_emits_chat_assistant_message_and_ceiling_decision(self):
        brief = _brief()
        job = Job(brief=brief)
        await store.save_job(job)
        candidate = expand_brief(brief, job.id)[0]
        await store.save_candidate(candidate)

        await run_candidate_loop(candidate.id, mock=True)

        types = [e["event_type"] for e in events.get_events(job.id)]
        assert "candidate.delivered" in types
        assert "chat.assistant_message" in types

        delivered = [
            e for e in events.get_events(job.id)
            if e["event_type"] == "candidate.delivered"
        ][-1]
        assert delivered["decision"] == "ceiling"

        chat = [
            e for e in events.get_events(job.id)
            if e["event_type"] == "chat.assistant_message"
        ][-1]
        assert chat.get("ceiling_hit") is True
        assert "ceiling" in chat["content"].lower() or "ceiling" in chat["message"].lower()

    @pytest.mark.asyncio
    async def test_no_ceiling_chat_when_threshold_met(self):
        # Low threshold — mock progressive_score starts around 45 and improves,
        # so we pass quickly; ceiling should NOT be emitted.
        brief = _brief(score_threshold=30.0, max_iterations=3)
        job = Job(brief=brief)
        await store.save_job(job)
        candidate = expand_brief(brief, job.id)[0]
        await store.save_candidate(candidate)

        await run_candidate_loop(candidate.id, mock=True)

        chat = [
            e for e in events.get_events(job.id)
            if e["event_type"] == "chat.assistant_message"
            and e.get("ceiling_hit") is True
        ]
        assert chat == [], "passed-threshold runs must not emit ceiling chat"

    @pytest.mark.asyncio
    async def test_candidate_generating_not_off_by_one(self):
        """max_iterations=3 -> exactly 3 candidate.generating events, not 4."""
        brief = _brief(score_threshold=99.0, max_iterations=3)
        job = Job(brief=brief)
        await store.save_job(job)
        candidate = expand_brief(brief, job.id)[0]
        await store.save_candidate(candidate)

        await run_candidate_loop(candidate.id, mock=True)
        generating = [
            e for e in events.get_events(job.id)
            if e["event_type"] == "candidate.generating"
        ]
        assert len(generating) == 3, (
            f"expected 3 candidate.generating events, got {len(generating)}: "
            f"{generating}"
        )


# ---------------------------------------------------------------------------
# Ruflo-bridge path: ensure ceiling decision on delivered event is translated
# into a chat.assistant_message too.
# ---------------------------------------------------------------------------

def _sse(events_: list[dict[str, Any]]) -> bytes:
    parts = [f"data: {json.dumps(e)}\n\n" for e in events_]
    return "".join(parts).encode("utf-8")


class TestRufloCeiling:
    @pytest.mark.asyncio
    async def test_bridge_ceiling_delivered_triggers_chat(self, monkeypatch):
        monkeypatch.setenv("RUFLO_BRIDGE_URL", "http://bridge.test")
        monkeypatch.setenv("NUCLEUS_API_URL", "http://api.test")

        brief = _brief(max_iterations=2)
        job = Job(brief=brief)
        await store.save_job(job)
        candidate = expand_brief(brief, job.id)[0]
        await store.save_candidate(candidate)

        # Two failing scores + delivered with ceiling.
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
            {"event_type": "candidate.delivered", "job_id": job.id,
             "candidate_id": candidate.id, "score": 40.0,
             "iterations": 1, "decision": "ceiling",
             "final_video_url": "s3://v0.mp4", "cost_usd": 0.1},
        ]

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(
                200,
                headers={"content-type": "text/event-stream"},
                content=_sse(bridge_events),
            )

        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        try:
            await run_candidate_loop(candidate.id, mock=False, client=client)
        finally:
            await client.aclose()

        types = [e["event_type"] for e in events.get_events(job.id)]
        assert "chat.assistant_message" in types
        chat = [
            e for e in events.get_events(job.id)
            if e["event_type"] == "chat.assistant_message"
        ][-1]
        assert chat.get("ceiling_hit") is True
