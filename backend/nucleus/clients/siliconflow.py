"""Async client for SiliconFlow (https://api.siliconflow.com).

SiliconFlow hosts the ``black-forest-labs/FLUX.1-Kontext-dev`` text-to-image
and image-editing endpoints we use for storyboard generation.

Two endpoints are wrapped:

* ``POST /v1/images/generations`` — text-to-image. Returns image URLs.
* ``POST /v1/images/edits``       — reference-conditioned image-to-image.

Both accept ``{data: [{url}]}`` *or* ``{images: [{url}]}`` shaped payloads in
the wild — we accept both and extract the first URL.
"""

from __future__ import annotations

import os
from typing import Any

import httpx

DEFAULT_BASE_URL = "https://api.siliconflow.com/v1"
DEFAULT_MODEL = "black-forest-labs/FLUX.1-schnell"


class SiliconFlowError(RuntimeError):
    """Raised when a SiliconFlow call fails (HTTP error, bad payload)."""


class SiliconFlowClient:
    """Async HTTP client for SiliconFlow's image endpoints."""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str = DEFAULT_BASE_URL,
        *,
        timeout: float = 120.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        key = api_key if api_key is not None else os.environ.get("SILICONFLOW_KEY")
        self.api_key = key or ""
        self.base_url = base_url.rstrip("/")
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=timeout,
            headers=headers,
            transport=transport,
        )

    async def __aenter__(self) -> SiliconFlowClient:
        return self

    async def __aexit__(self, *exc: Any) -> None:
        await self.close()

    async def close(self) -> None:
        await self._client.aclose()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def text_to_image(
        self,
        prompt: str,
        model: str = DEFAULT_MODEL,
        width: int = 1024,
        height: int = 1024,
        num_images: int = 1,
    ) -> list[str]:
        """POST /images/generations → list of image URLs."""
        body = {
            "model": model,
            "prompt": prompt,
            "image_size": f"{width}x{height}",
            "batch_size": num_images,
        }
        data = await self._post("/images/generations", body)
        urls = _extract_urls(data)
        if not urls:
            raise SiliconFlowError(f"No image URLs in response: {data!r}")
        return urls

    async def image_to_image(
        self,
        prompt: str,
        reference_image_url: str,
        model: str = DEFAULT_MODEL,
        strength: float = 0.7,
    ) -> str:
        """POST /images/edits → single edited image URL."""
        body = {
            "model": model,
            "prompt": prompt,
            "image": reference_image_url,
            "strength": strength,
        }
        data = await self._post("/images/edits", body)
        urls = _extract_urls(data)
        if not urls:
            raise SiliconFlowError(f"No image URL in edit response: {data!r}")
        return urls[0]

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    async def _post(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        try:
            resp = await self._client.post(path, json=body)
        except httpx.HTTPError as exc:
            raise SiliconFlowError(f"POST {path} transport error: {exc}") from exc
        if resp.status_code >= 400:
            raise SiliconFlowError(
                f"POST {path} returned {resp.status_code}: {resp.text[:500]}"
            )
        try:
            return resp.json()
        except ValueError as exc:
            raise SiliconFlowError(f"POST {path} returned non-JSON: {exc}") from exc


def _extract_urls(data: dict[str, Any]) -> list[str]:
    """Pull image URLs out of either ``{data: [...]}`` or ``{images: [...]}``."""
    items = data.get("data") or data.get("images") or []
    urls: list[str] = []
    for item in items:
        if isinstance(item, dict):
            url = item.get("url") or item.get("image_url")
            if isinstance(url, str):
                urls.append(url)
        elif isinstance(item, str):
            urls.append(item)
    return urls


__all__ = ["SiliconFlowClient", "SiliconFlowError", "DEFAULT_MODEL"]
