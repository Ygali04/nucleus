"""Async client for the NeuroPeer neural-analysis API.

Wraps `/Users/yahvingali/video-brainscore/` so Nucleus's closed loop can submit
videos, stream progress, and consume the full AnalysisResult as a data packet.
"""

from __future__ import annotations

import json
from collections.abc import AsyncGenerator, Callable
from typing import Any
from uuid import UUID

import httpx
import websockets

from nucleus.clients.neuropeer_types import (
    AnalysisResult,
    BrainMapFrame,
    ComparisonResult,
    JobCreated,
    ProgressEvent,
)


class NeuroPeerClient:
    """Async client for NeuroPeer. Use as a context manager or close explicitly."""

    def __init__(
        self,
        base_url: str = "http://localhost:8000",
        timeout: float = 300.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._client = httpx.AsyncClient(base_url=self.base_url, timeout=timeout)

    async def __aenter__(self) -> NeuroPeerClient:
        return self

    async def __aexit__(self, *exc: Any) -> None:
        await self.close()

    async def close(self) -> None:
        await self._client.aclose()

    async def submit(
        self,
        url: str,
        content_type: str = "custom",
        *,
        label: str | None = None,
        parent_job_id: UUID | str | None = None,
        user_email: str | None = None,
        project_id: UUID | str | None = None,
    ) -> JobCreated:
        """POST /api/v1/analyze — submit a video for neural analysis."""
        payload: dict[str, Any] = {"url": url, "content_type": content_type}
        if label:
            payload["label"] = label
        if parent_job_id:
            payload["parent_job_id"] = str(parent_job_id)
        if user_email:
            payload["user_email"] = user_email
        if project_id:
            payload["project_id"] = str(project_id)

        resp = await self._client.post("/api/v1/analyze", json=payload)
        resp.raise_for_status()
        return JobCreated.model_validate(resp.json())

    async def stream_progress(
        self, job_id: UUID | str
    ) -> AsyncGenerator[ProgressEvent, None]:
        """Yield ProgressEvents from the WebSocket /ws/job/{job_id} endpoint."""
        ws_url = self.base_url.replace("http://", "ws://").replace(
            "https://", "wss://"
        )
        uri = f"{ws_url}/ws/job/{job_id}"
        async with websockets.connect(uri) as ws:
            async for message in ws:
                raw = message if isinstance(message, str) else message.decode("utf-8")
                event = ProgressEvent.model_validate_json(raw)
                yield event
                if event.status in ("complete", "error"):
                    break

    async def get_results(self, job_id: UUID | str) -> AnalysisResult:
        """GET /api/v1/results/{job_id} — full neural report data packet."""
        resp = await self._client.get(f"/api/v1/results/{job_id}")
        resp.raise_for_status()
        return AnalysisResult.model_validate(resp.json())

    async def get_status(self, job_id: UUID | str) -> dict[str, Any]:
        """GET /api/v1/results/{job_id}/status — quick status check."""
        resp = await self._client.get(f"/api/v1/results/{job_id}/status")
        resp.raise_for_status()
        return resp.json()

    async def get_brain_map(
        self, job_id: UUID | str, timestamp: float = 0.0
    ) -> BrainMapFrame:
        resp = await self._client.get(
            f"/api/v1/results/{job_id}/brain-map",
            params={"timestamp": timestamp},
        )
        resp.raise_for_status()
        return BrainMapFrame.model_validate(resp.json())

    async def compare(self, job_ids: list[UUID | str]) -> ComparisonResult:
        resp = await self._client.post(
            "/api/v1/compare",
            json={"job_ids": [str(j) for j in job_ids]},
        )
        resp.raise_for_status()
        return ComparisonResult.model_validate(resp.json())

    async def submit_and_wait(
        self,
        url: str,
        content_type: str = "custom",
        on_progress: Callable[[ProgressEvent], None] | None = None,
    ) -> AnalysisResult:
        """Convenience: submit → stream progress → return final results."""
        job = await self.submit(url, content_type=content_type)
        async for event in self.stream_progress(job.job_id):
            if on_progress:
                on_progress(event)
            if event.status == "error":
                raise RuntimeError(f"NeuroPeer job failed: {event.message}")
        return await self.get_results(job.job_id)
