"""Shared result types for all providers."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

JobStatus = Literal["pending", "running", "completed", "failed"]


class GenerationResult(BaseModel):
    """Result of a video generation request."""

    provider_job_id: str
    video_url: str
    duration_s: float
    cost_usd: float
    provider: str
    metadata: dict = Field(default_factory=dict)


class AudioResult(BaseModel):
    """Result of an audio/speech/music generation request."""

    audio_url: str
    duration_s: float
    cost_usd: float
    provider: str


class ProviderJobStatus(BaseModel):
    """Status of an in-progress provider job."""

    provider_job_id: str
    status: JobStatus
    progress: float = 0.0
    error: str | None = None
