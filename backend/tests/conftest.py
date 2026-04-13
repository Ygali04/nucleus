"""Shared test configuration.

Forces the event bus into in-process-only mode by default so tests never
hit a real Redis server.  Individual tests that want to exercise the Redis
publish path opt in by monkeypatching ``nucleus.events`` (see
``test_worker.py``).
"""

from __future__ import annotations

import os

os.environ.setdefault("NUCLEUS_NO_REDIS", "1")
os.environ.setdefault("NUCLEUS_MOCK_PROVIDERS", "true")
