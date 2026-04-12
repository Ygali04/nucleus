"""FastAPI application for the Nucleus engine."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from nucleus.routes.briefs import router as briefs_router
from nucleus.routes.candidates import router as candidates_router
from nucleus.routes.tools import router as tools_router
from nucleus.routes.ws import router as ws_router

app = FastAPI(title="Nucleus Engine", version="0.1.0")

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
