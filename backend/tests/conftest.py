"""Shared pytest fixtures.

Default: each test session runs against an ephemeral SQLite file using
``aiosqlite`` — no Postgres needed. Set ``TEST_DATABASE_URL`` to point at a
real Postgres instance to exercise the asyncpg driver.

Schema is created once per session via :func:`nucleus.db.migrate.upgrade_head`;
individual tests are responsible for cleaning up (via ``store.reset()`` or
their own fixtures).
"""

from __future__ import annotations

import asyncio
import os
import tempfile
from pathlib import Path

import pytest


def _install_test_database_url() -> tuple[str, Path | None]:
    """Pick a test DB URL and set ``DATABASE_URL`` before anything imports it."""
    explicit = os.environ.get("TEST_DATABASE_URL")
    if explicit:
        os.environ["DATABASE_URL"] = explicit
        return explicit, None

    tmpdir = Path(tempfile.mkdtemp(prefix="nucleus-test-"))
    db_path = tmpdir / "nucleus.db"
    url = f"sqlite+aiosqlite:///{db_path}"
    os.environ["DATABASE_URL"] = url
    return url, db_path


_TEST_URL, _TEST_DB_PATH = _install_test_database_url()


@pytest.fixture(scope="session", autouse=True)
def _migrate_schema():
    """Create all tables once at session start via Alembic."""
    from nucleus.db.migrate import upgrade_head

    upgrade_head()
    yield

    # Best-effort cleanup of the SQLite file — harmless if it's gone.
    from nucleus.db.engine import dispose_engine

    try:
        asyncio.run(dispose_engine())
    except RuntimeError:
        pass

    if _TEST_DB_PATH is not None and _TEST_DB_PATH.exists():
        try:
            _TEST_DB_PATH.unlink()
        except OSError:
            pass
