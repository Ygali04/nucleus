"""CLI entry point: ``python -m nucleus.db.migrate``.

Runs ``alembic upgrade head`` against ``DATABASE_URL``. Intended for container
startup scripts and local dev, not for production — use the ``alembic`` CLI
directly when you need fine-grained control.
"""

from __future__ import annotations

import sys
from pathlib import Path

from alembic import command
from alembic.config import Config


def _alembic_config() -> Config:
    backend_dir = Path(__file__).resolve().parents[2]
    ini_path = backend_dir / "alembic.ini"
    cfg = Config(str(ini_path))
    cfg.set_main_option("script_location", str(backend_dir / "alembic"))
    return cfg


def upgrade_head() -> None:
    command.upgrade(_alembic_config(), "head")


def main(argv: list[str] | None = None) -> int:
    argv = argv or sys.argv[1:]
    target = argv[0] if argv else "head"
    command.upgrade(_alembic_config(), target)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
