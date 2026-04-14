"""Async client for a ComfyUI execution service.

ComfyUI exposes an HTTP + WebSocket API we drive to run open-weights
diffusion / audio workflows. This module wraps the subset Nucleus needs:

  * ``submit_workflow`` — POST a graph, get back a ``prompt_id``
  * ``stream_progress`` — WebSocket stream of node-level progress events,
    terminating on ``{"type": "executing", "data": {"node": null, ...}}``
  * ``get_history`` — final outputs + status for a prompt
  * ``fetch_output`` — raw bytes for a generated file
  * ``queue_status`` / ``object_info`` — health & node-schema introspection

The server is currently unauthenticated; a ``COMFYUI_API_KEY`` hook is left
in place for when we front it with an auth proxy.
"""

from __future__ import annotations

import json
import os
import uuid
from collections.abc import AsyncIterator
from typing import Any

import httpx
import websockets

from nucleus import config


class ComfyUIError(RuntimeError):
    """Raised when a ComfyUI call fails. Carries url/status/body context."""

    def __init__(
        self,
        message: str,
        *,
        url: str | None = None,
        status: int | None = None,
        body: str | None = None,
    ) -> None:
        super().__init__(message)
        self.url = url
        self.status = status
        self.body = body

    def __str__(self) -> str:  # pragma: no cover — trivial
        base = super().__str__()
        bits = [base]
        if self.url:
            bits.append(f"url={self.url}")
        if self.status is not None:
            bits.append(f"status={self.status}")
        if self.body:
            bits.append(f"body={self.body[:200]}")
        return " ".join(bits)


class ComfyUIClient:
    """Async client for ComfyUI. Use as a context manager or close explicitly."""

    DEFAULT_TIMEOUT = 30.0

    def __init__(
        self,
        base_url: str | None = None,
        *,
        client_id: str | None = None,
        timeout: float | None = DEFAULT_TIMEOUT,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.base_url = (base_url or config.comfyui_base_url()).rstrip("/")
        self.client_id = client_id or uuid.uuid4().hex
        self.timeout = timeout

        headers: dict[str, str] = {}
        # Auth hook: ComfyUI is unauthenticated today. When we front it with
        # a proxy, read ``COMFYUI_API_KEY`` here and send it as a bearer.
        api_key = os.environ.get("COMFYUI_API_KEY")
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=timeout,
            headers=headers,
            transport=transport,
        )

    async def __aenter__(self) -> ComfyUIClient:
        return self

    async def __aexit__(self, *exc: Any) -> None:
        await self.close()

    async def close(self) -> None:
        await self._client.aclose()

    # --- HTTP --------------------------------------------------------------

    async def submit_workflow(self, workflow: dict[str, Any]) -> str:
        """POST /prompt. Returns the ``prompt_id`` assigned by ComfyUI."""
        payload = {"prompt": workflow, "client_id": self.client_id}
        data = await self._post_json("/prompt", payload)
        prompt_id = data.get("prompt_id")
        if not isinstance(prompt_id, str):
            raise ComfyUIError(
                "submit_workflow response missing prompt_id",
                url=f"{self.base_url}/prompt",
                body=json.dumps(data)[:200],
            )
        return prompt_id

    async def get_history(self, prompt_id: str) -> dict[str, Any]:
        """GET /history/{prompt_id}. Contains outputs + final status."""
        return await self._get_json(f"/history/{prompt_id}")

    async def fetch_output(
        self,
        filename: str,
        subfolder: str = "",
        type_: str = "output",
    ) -> bytes:
        """GET /view?filename=...&subfolder=...&type=... — raw bytes."""
        params = {"filename": filename, "subfolder": subfolder, "type": type_}
        url = "/view"
        try:
            resp = await self._client.get(url, params=params)
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise ComfyUIError(
                f"fetch_output({filename}) failed: {exc}",
                url=str(exc.request.url),
                status=exc.response.status_code,
                body=exc.response.text,
            ) from exc
        except httpx.HTTPError as exc:
            raise ComfyUIError(
                f"fetch_output({filename}) failed: {exc}",
                url=f"{self.base_url}{url}",
            ) from exc
        return resp.content

    async def queue_status(self) -> dict[str, Any]:
        """GET /queue — running/pending jobs."""
        return await self._get_json("/queue")

    async def object_info(self) -> dict[str, Any]:
        """GET /object_info — node schema registry (verify custom nodes loaded)."""
        return await self._get_json("/object_info")

    # --- WebSocket --------------------------------------------------------

    def _ws_uri(self) -> str:
        ws_base = self.base_url.replace("https://", "wss://").replace(
            "http://", "ws://"
        )
        return f"{ws_base}/ws?clientId={self.client_id}"

    async def stream_progress(
        self, prompt_id: str
    ) -> AsyncIterator[dict[str, Any]]:
        """Yield ComfyUI WS events for ``prompt_id`` until the terminal signal.

        Terminal event: ``{"type": "executing", "data": {"node": null,
        "prompt_id": <id>}}``. We yield that event then stop.

        Only events whose ``data.prompt_id`` matches are yielded (other
        clients' events are filtered out). Binary frames (preview images)
        are ignored — callers can override by subclassing if needed.
        """
        uri = self._ws_uri()
        try:
            async with websockets.connect(uri) as ws:
                async for message in ws:
                    if not isinstance(message, (str, bytes)):
                        continue
                    if isinstance(message, bytes):
                        # Binary frames are live-preview image blobs; skip.
                        continue
                    try:
                        event = json.loads(message)
                    except json.JSONDecodeError as exc:
                        raise ComfyUIError(
                            f"progress event unparseable: {exc}",
                            url=uri,
                            body=message[:200],
                        ) from exc

                    data = event.get("data") or {}
                    # Filter to this prompt (execution_error / status frames
                    # may omit prompt_id — let those through).
                    event_prompt_id = data.get("prompt_id")
                    if event_prompt_id and event_prompt_id != prompt_id:
                        continue

                    yield event

                    if (
                        event.get("type") == "executing"
                        and data.get("node") is None
                        and event_prompt_id == prompt_id
                    ):
                        return
                    if event.get("type") == "execution_error":
                        return
        except websockets.WebSocketException as exc:
            raise ComfyUIError(
                f"websocket stream failed: {exc}", url=uri
            ) from exc

    # --- helpers ----------------------------------------------------------

    async def _get_json(self, path: str) -> dict[str, Any]:
        try:
            resp = await self._client.get(path)
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise ComfyUIError(
                f"GET {path} failed: {exc}",
                url=str(exc.request.url),
                status=exc.response.status_code,
                body=exc.response.text,
            ) from exc
        except httpx.HTTPError as exc:
            raise ComfyUIError(
                f"GET {path} failed: {exc}", url=f"{self.base_url}{path}"
            ) from exc
        try:
            return resp.json()
        except ValueError as exc:
            raise ComfyUIError(
                f"GET {path} returned non-JSON body",
                url=f"{self.base_url}{path}",
                body=resp.text[:200],
            ) from exc

    async def _post_json(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        try:
            resp = await self._client.post(path, json=payload)
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise ComfyUIError(
                f"POST {path} failed: {exc}",
                url=str(exc.request.url),
                status=exc.response.status_code,
                body=exc.response.text,
            ) from exc
        except httpx.HTTPError as exc:
            raise ComfyUIError(
                f"POST {path} failed: {exc}", url=f"{self.base_url}{path}"
            ) from exc
        try:
            return resp.json()
        except ValueError as exc:
            raise ComfyUIError(
                f"POST {path} returned non-JSON body",
                url=f"{self.base_url}{path}",
                body=resp.text[:200],
            ) from exc


__all__ = ["ComfyUIClient", "ComfyUIError"]
