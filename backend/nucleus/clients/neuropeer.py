"""Async client for the NeuroPeer neural-analysis API.

Wraps the service at $NEUROPEER_BASE_URL (http://localhost:8001 in dev) so
Nucleus's closed loop can submit videos, stream progress over WebSocket, and
consume the full AnalysisResult as a data packet.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator, Callable
from typing import Any
from uuid import UUID

import httpx
import websockets

from nucleus import config
from nucleus.clients.neuropeer_types import (
    AnalysisResult,
    BrainMapFrame,
    ComparisonResult,
    JobCreated,
    ProgressEvent,
)


class NeuroPeerError(RuntimeError):
    """Raised when a NeuroPeer call fails (HTTP error, WS error, bad payload, timeout)."""


class NeuroPeerClient:
    """Async client for NeuroPeer. Use as a context manager or close explicitly."""

    def __init__(
        self,
        base_url: str | None = None,
        timeout: float | None = None,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.base_url = (base_url or config.neuropeer_base_url()).rstrip("/")
        self.timeout = timeout if timeout is not None else config.neuropeer_timeout_seconds()
        headers: dict[str, str] = {}
        # When NEUROPEER_API_KEY is set, authenticate with the X-API-Key header
        # (and mirror it on the WS URL as ?api_key=... since FastAPI websockets
        # don't expose custom headers to downstream middleware reliably).
        self._api_key = config.neuropeer_api_key()
        if self._api_key:
            headers["X-API-Key"] = self._api_key
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
            headers=headers,
            transport=transport,
        )

    async def __aenter__(self) -> NeuroPeerClient:
        return self

    async def __aexit__(self, *exc: Any) -> None:
        await self.close()

    async def close(self) -> None:
        await self._client.aclose()

    # --- HTTP ---

    async def submit(
        self,
        url: str,
        content_type: str = "custom",
        *,
        content_types: list[str] | None = None,
        label: str | None = None,
        parent_job_id: UUID | str | None = None,
        user_email: str | None = None,
        project_id: UUID | str | None = None,
        campaign_id: UUID | str | None = None,
    ) -> JobCreated:
        """POST /api/v1/analyze — submit a video for neural analysis."""
        payload: dict[str, Any] = {"url": url, "content_type": content_type}
        if content_types:
            payload["content_types"] = content_types
        if label:
            payload["label"] = label
        if parent_job_id:
            payload["parent_job_id"] = str(parent_job_id)
        if user_email:
            payload["user_email"] = user_email
        if project_id:
            payload["project_id"] = str(project_id)
        if campaign_id:
            payload["campaign_id"] = str(campaign_id)

        try:
            resp = await self._client.post("/api/v1/analyze", json=payload)
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise NeuroPeerError(f"submit failed: {exc}") from exc
        try:
            return JobCreated.model_validate(resp.json())
        except Exception as exc:  # noqa: BLE001 — reshape any parse error
            raise NeuroPeerError(f"submit returned unparseable body: {exc}") from exc

    async def get_results(self, job_id: UUID | str) -> AnalysisResult:
        """GET /api/v1/results/{job_id} — full neural report data packet."""
        try:
            resp = await self._client.get(f"/api/v1/results/{job_id}")
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise NeuroPeerError(f"get_results({job_id}) failed: {exc}") from exc
        try:
            return AnalysisResult.model_validate(resp.json())
        except Exception as exc:  # noqa: BLE001
            raise NeuroPeerError(f"get_results({job_id}) unparseable: {exc}") from exc

    async def get_status(self, job_id: UUID | str) -> dict[str, Any]:
        """GET /api/v1/results/{job_id}/status — quick status check."""
        try:
            resp = await self._client.get(f"/api/v1/results/{job_id}/status")
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise NeuroPeerError(f"get_status({job_id}) failed: {exc}") from exc
        return resp.json()

    async def get_timeseries(self, job_id: UUID | str) -> dict[str, Any]:
        """GET /api/v1/results/{job_id}/timeseries — attention/emotional/cognitive curves."""
        try:
            resp = await self._client.get(f"/api/v1/results/{job_id}/timeseries")
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise NeuroPeerError(f"get_timeseries({job_id}) failed: {exc}") from exc
        return resp.json()

    async def get_brain_map(
        self, job_id: UUID | str, timestamp: float = 0.0
    ) -> BrainMapFrame:
        try:
            resp = await self._client.get(
                f"/api/v1/results/{job_id}/brain-map",
                params={"timestamp": timestamp},
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise NeuroPeerError(f"get_brain_map({job_id}) failed: {exc}") from exc
        try:
            return BrainMapFrame.model_validate(resp.json())
        except Exception as exc:  # noqa: BLE001
            raise NeuroPeerError(f"get_brain_map({job_id}) unparseable: {exc}") from exc

    async def compare(self, job_ids: list[UUID | str]) -> ComparisonResult:
        try:
            resp = await self._client.post(
                "/api/v1/compare",
                json={"job_ids": [str(j) for j in job_ids]},
            )
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            raise NeuroPeerError(f"compare failed: {exc}") from exc
        try:
            return ComparisonResult.model_validate(resp.json())
        except Exception as exc:  # noqa: BLE001
            raise NeuroPeerError(f"compare unparseable: {exc}") from exc

    # --- WebSocket ---

    def _ws_uri(self, job_id: UUID | str, websocket_url: str | None = None) -> str:
        """Compose the websocket URI. Prefers the server-supplied path.

        NeuroPeer's `/api/v1/analyze` response carries `websocket_url` as a
        relative path like `/ws/job/{id}`. We join it to our base URL (swapped
        to ws/wss). If the caller passes an absolute ws:// URL we use it as-is.
        """
        if websocket_url and websocket_url.startswith(("ws://", "wss://")):
            uri = websocket_url
        else:
            ws_base = self.base_url.replace("https://", "wss://").replace("http://", "ws://")
            path = websocket_url or f"/ws/job/{job_id}"
            if not path.startswith("/"):
                path = "/" + path
            uri = f"{ws_base}{path}"
        if self._api_key:
            sep = "&" if "?" in uri else "?"
            uri = f"{uri}{sep}api_key={self._api_key}"
        return uri

    async def stream_progress(
        self,
        job_id: UUID | str,
        websocket_url: str | None = None,
    ) -> AsyncGenerator[ProgressEvent, None]:
        """Yield ProgressEvents until the job reaches `complete` or `error`."""
        uri = self._ws_uri(job_id, websocket_url)
        try:
            async with websockets.connect(uri) as ws:
                async for message in ws:
                    raw = (
                        message if isinstance(message, str) else message.decode("utf-8")
                    )
                    try:
                        event = ProgressEvent.model_validate_json(raw)
                    except Exception as exc:  # noqa: BLE001
                        raise NeuroPeerError(
                            f"progress event unparseable: {exc}"
                        ) from exc
                    yield event
                    if event.status in ("complete", "error"):
                        break
        except websockets.WebSocketException as exc:
            raise NeuroPeerError(f"websocket stream failed: {exc}") from exc

    async def submit_and_wait(
        self,
        url: str,
        content_type: str = "custom",
        *,
        on_progress: Callable[[ProgressEvent], None] | None = None,
        **submit_kwargs: Any,
    ) -> AnalysisResult:
        """Submit → stream progress → return final results.

        Raises NeuroPeerError if the job terminates in `error` state or the
        websocket closes without a terminal event.
        """
        job = await self.submit(url, content_type=content_type, **submit_kwargs)
        terminal: ProgressEvent | None = None
        async for event in self.stream_progress(job.job_id, job.websocket_url):
            if on_progress is not None:
                on_progress(event)
            if event.status in ("complete", "error"):
                terminal = event
                break
        if terminal is None:
            raise NeuroPeerError(
                f"job {job.job_id} websocket closed without terminal event"
            )
        if terminal.status == "error":
            raise NeuroPeerError(
                f"NeuroPeer job {job.job_id} failed: {terminal.message}"
            )
        return await self.get_results(job.job_id)
