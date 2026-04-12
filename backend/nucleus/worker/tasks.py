"""Celery task wrappers for the orchestrator.

These are thin shims that bridge the async orchestrator code into Celery's
synchronous task model.  In production, ``celery_app`` is configured against
a real Redis broker; for tests the functions can be called directly.
"""

from __future__ import annotations

import asyncio

from nucleus.orchestrator.loop import run_candidate_loop, run_job

# ---------------------------------------------------------------------------
# Celery app stub (avoids a hard Redis dependency at import time)
# ---------------------------------------------------------------------------

try:
    from celery import Celery

    celery_app = Celery(
        "nucleus",
        broker="redis://localhost:6379/0",
        backend="redis://localhost:6379/0",
    )
except ImportError:  # Celery not installed — tests still work
    celery_app = None  # type: ignore[assignment]


def _run(coro):  # noqa: ANN001, ANN202
    """Run an async coroutine from synchronous Celery context."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

def process_candidate(candidate_id: str, *, mock: bool = True) -> None:
    """Run the full candidate loop (Celery task entry-point)."""
    _run(run_candidate_loop(candidate_id, mock=mock))


def process_job(job_id: str, candidate_ids: list[str], *, mock: bool = True) -> None:
    """Run all candidate loops for a job (Celery task entry-point)."""
    _run(run_job(job_id, candidate_ids, mock=mock))


# Register with Celery when available
if celery_app is not None:
    process_candidate = celery_app.task(name="nucleus.process_candidate")(process_candidate)
    process_job = celery_app.task(name="nucleus.process_job")(process_job)
