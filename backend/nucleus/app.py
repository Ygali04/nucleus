"""FastAPI application for the Nucleus engine."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from nucleus.config import settings
from nucleus.routes.briefs import router as briefs_router
from nucleus.routes.candidates import router as candidates_router
from nucleus.routes.tools import router as tools_router
from nucleus.routes.ws import router as ws_router
from nucleus.storage import ensure_bucket

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Run once-per-process startup tasks.

    ``ensure_bucket()`` is idempotent but performs a network round-trip, so
    we call it here instead of from every storage operation.
    """
    if settings.s3_endpoint_url or settings.aws_access_key_id:
        try:
            await ensure_bucket()
        except Exception as exc:  # pragma: no cover - best-effort startup
            logger.warning("ensure_bucket() failed at startup: %s", exc)
    yield


app = FastAPI(title="Nucleus Engine", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(briefs_router)
app.include_router(candidates_router)
app.include_router(tools_router)
app.include_router(ws_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "version": "0.1.0"}
