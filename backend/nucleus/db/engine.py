"""Async SQLAlchemy engine + session factory.

The engine is built lazily from the ``DATABASE_URL`` env var so tests can point
at an ephemeral SQLite file by setting the env var before import-time of the
store. ``AsyncSessionLocal`` is a module-level proxy that resolves to the
current session factory on every call, so tests that switch databases between
cases don't need to re-import the module.
"""

from __future__ import annotations

import os
from typing import Any

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase


DEFAULT_DATABASE_URL = "sqlite+aiosqlite:///./nucleus.db"


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None
_cached_url: str | None = None


def _database_url() -> str:
    return os.environ.get("DATABASE_URL", DEFAULT_DATABASE_URL)


def get_engine() -> AsyncEngine:
    """Return the process-wide async engine, creating it on first use."""
    global _engine, _cached_url
    url = _database_url()
    if _engine is None or _cached_url != url:
        # URL changed (e.g. tests swapping DBs) — rebuild.
        _engine = create_async_engine(url, future=True)
        _cached_url = url
        global _session_factory
        _session_factory = None
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Return (and memoise) the async session factory bound to ``get_engine()``."""
    global _session_factory
    if _session_factory is None or _cached_url != _database_url():
        engine = get_engine()
        _session_factory = async_sessionmaker(
            engine, expire_on_commit=False, class_=AsyncSession
        )
    return _session_factory


async def dispose_engine() -> None:
    """Dispose the cached engine (used by tests)."""
    global _engine, _session_factory, _cached_url
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _session_factory = None
    _cached_url = None


class _SessionFactoryProxy:
    """Callable proxy that resolves the current session factory lazily."""

    def __call__(self, *args: Any, **kwargs: Any) -> AsyncSession:
        return get_session_factory()(*args, **kwargs)


AsyncSessionLocal = _SessionFactoryProxy()
