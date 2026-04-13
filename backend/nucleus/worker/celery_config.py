"""Celery configuration re-export.

The actual Celery app is instantiated in :mod:`nucleus.worker.tasks` so the
``-A`` target for the worker process (``celery -A nucleus.worker.tasks``) and
the app share one instance.  This module is kept for callers that want to
import the app by its conventional name.
"""

from __future__ import annotations

from nucleus.worker.tasks import celery_app, run_candidate_task, run_job_task

__all__ = ["celery_app", "run_job_task", "run_candidate_task"]
