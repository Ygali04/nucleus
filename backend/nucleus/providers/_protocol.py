"""VideoProvider protocol, shared models, and base class for Nucleus providers.

Self-contained protocol definition (WU-4 does not import from WU-3).
"""

from __future__ import annotations

import asyncio
import os
from typing import Protocol, runtime_checkable
from uuid import uuid4

import httpx
from pydantic import BaseModel


class GenerationResult(BaseModel):
    """Result returned after a video generation job completes."""

    provider_job_id: str
    video_url: str
    duration_s: float
    cost_usd: float
    provider: str
    metadata: dict = {}


class ProviderJobStatus(BaseModel):
    """Status of an in-flight provider job."""

    provider_job_id: str
    status: str  # "pending" | "running" | "completed" | "failed"
    progress: float = 0.0
    error: str | None = None


@runtime_checkable
class VideoProvider(Protocol):
    name: str
    cost_per_second: float

    async def generate(
        self,
        prompt: str,
        duration_s: float,
        aspect_ratio: str = "16:9",
        reference_image: str | None = None,
        seed: int | None = None,
    ) -> GenerationResult: ...

    async def check_status(self, provider_job_id: str) -> ProviderJobStatus: ...

    async def get_result(self, provider_job_id: str) -> str: ...

    def estimate_cost(self, duration_s: float) -> float: ...


class BaseVideoProvider:
    """Shared plumbing for REST-based video providers.

    Subclasses set class-level ``name``, ``cost_per_second``,
    ``max_duration_s``, ``poll_interval_s``, ``mock_video_url``,
    and ``_env_key_name``.
    """

    name: str
    cost_per_second: float
    max_duration_s: float
    poll_interval_s: float = 2.0
    mock_video_url: str = "s3://mock/video.mp4"
    _env_key_name: str  # e.g. "ATLAS_CLOUD_API_KEY"

    def __init__(self, api_key: str | None = None, base_url: str = "") -> None:
        from nucleus.config import is_mock

        self.api_key = api_key or os.environ.get(self._env_key_name, "")
        self.base_url = base_url.rstrip("/")
        self.mock = is_mock()
        self._client: httpx.AsyncClient | None = None

    # ------------------------------------------------------------------
    # Shared helpers
    # ------------------------------------------------------------------

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _clamp_duration(self, duration_s: float) -> float:
        return min(duration_s, self.max_duration_s)

    def estimate_cost(self, duration_s: float) -> float:
        return round(self._clamp_duration(duration_s) * self.cost_per_second, 4)

    async def _get_client(self) -> httpx.AsyncClient:
        """Return a reusable HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=30)
        return self._client

    async def _api_post(self, path: str, payload: dict) -> dict:
        client = await self._get_client()
        resp = await client.post(
            f"{self.base_url}{path}",
            json=payload,
            headers=self._headers(),
        )
        resp.raise_for_status()
        return resp.json()

    async def _api_get(self, path: str) -> dict:
        client = await self._get_client()
        resp = await client.get(
            f"{self.base_url}{path}",
            headers=self._headers(),
        )
        resp.raise_for_status()
        return resp.json()

    async def _poll_until_done(self, job_id: str) -> str:
        """Poll the status endpoint until the job completes or fails."""
        while True:
            status = await self.check_status(job_id)
            if status.status == "completed":
                return await self.get_result(job_id)
            if status.status == "failed":
                raise RuntimeError(
                    f"{self.name} job {job_id} failed: {status.error}"
                )
            await asyncio.sleep(self.poll_interval_s)

    def _mock_generation_result(
        self,
        duration_s: float,
        extra_metadata: dict | None = None,
    ) -> GenerationResult:
        return GenerationResult(
            provider_job_id=str(uuid4()),
            video_url=self.mock_video_url,
            duration_s=duration_s,
            cost_usd=self.estimate_cost(duration_s),
            provider=self.name,
            metadata={"mock": True, **(extra_metadata or {})},
        )
