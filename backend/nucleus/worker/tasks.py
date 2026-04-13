"""Celery task definitions for the Nucleus orchestrator.

Celery tasks are synchronous; the orchestrator is async.  We bridge the two
with :func:`asyncio.run` inside each task body.
"""

from __future__ import annotations

import asyncio
import os
import threading
from typing import Any, Coroutine

from celery import Celery

from nucleus.events import publish_event
from nucleus.models import JobState
from nucleus.orchestrator.loop import run_candidate_loop, run_job
from nucleus.store import get_job, list_candidates_for_job, save_job

# ---------------------------------------------------------------------------
# Celery app
# ---------------------------------------------------------------------------
# The app lives in this module (not celery_config) so ``celery -A
# nucleus.worker.tasks`` can register tasks without a circular import.

REDIS_URL = os.getenv(
    "CELERY_BROKER_URL",
    os.getenv("REDIS_URL", "redis://localhost:6379/0"),
)
RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL)

celery_app = Celery(
    "nucleus",
    broker=REDIS_URL,
    backend=RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    worker_prefetch_multiplier=1,
)


def _run_sync(coro: Coroutine[Any, Any, Any]) -> Any:
    """Run an async coroutine from sync Celery code.

    In a real worker process there is no running loop, so ``asyncio.run``
    works directly.  Under ``task_always_eager`` (tests) the task may be
    invoked from within an already-running loop; ``asyncio.run`` rejects
    that, so we spin up a short-lived thread with its own loop instead.
    """
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)

    result: dict[str, Any] = {}

    def _runner() -> None:
        try:
            result["value"] = asyncio.run(coro)
        except BaseException as exc:  # noqa: BLE001
            result["error"] = exc

    thread = threading.Thread(target=_runner, daemon=True)
    thread.start()
    thread.join()
    if "error" in result:
        raise result["error"]
    return result.get("value")


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

@celery_app.task(bind=True, name="nucleus.run_job")
def run_job_task(self, job_id: str) -> dict:  # noqa: ARG001 — self required for bind=True
    """Run the full orchestrator loop for a job.

    Fetches candidates from the store, runs the candidate loop for each,
    and publishes progress events.  Intended to be invoked via
    ``run_job_task.delay(job_id)`` from the brief submission endpoint.
    """
    return _run_sync(_run_job_async(job_id))


async def _run_job_async(job_id: str) -> dict:
    mock = os.getenv("NUCLEUS_MOCK_PROVIDERS", "true").lower() == "true"

    candidates = await list_candidates_for_job(job_id)
    candidate_ids = [c.id for c in candidates]

    await publish_event(job_id, "job.started", {"candidate_count": len(candidate_ids)})

    await run_job(job_id, candidate_ids, mock=mock)

    job = await get_job(job_id)
    job.state = JobState.COMPLETE
    await save_job(job)

    await publish_event(job_id, "job.complete", {"job_id": job_id})

    return {"job_id": job_id, "candidate_count": len(candidate_ids), "status": "complete"}


@celery_app.task(bind=True, name="nucleus.run_candidate")
def run_candidate_task(self, candidate_id: str, *, mock: bool = True) -> dict:  # noqa: ARG001
    """Run a single candidate loop (useful for fan-out patterns / retries)."""
    _run_sync(run_candidate_loop(candidate_id, mock=mock))
    return {"candidate_id": candidate_id, "status": "complete"}
