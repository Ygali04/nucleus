"""FastAPI application for the Nucleus engine."""

from __future__ import annotations

from fastapi import FastAPI

from nucleus.routes.briefs import router as briefs_router
from nucleus.routes.candidates import router as candidates_router

app = FastAPI(title="Nucleus Engine", version="0.1.0")
app.include_router(briefs_router)
app.include_router(candidates_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
