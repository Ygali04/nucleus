"""Pydantic types mirroring the NeuroPeer API schemas.

Source: /Users/yahvingali/video-brainscore/backend/models/schemas.py
"""

from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class MetricScore(BaseModel):
    name: str
    score: float = Field(..., ge=0, le=100)
    raw_value: float
    description: str
    brain_region: str
    gtm_proxy: str


class KeyMoment(BaseModel):
    timestamp: float
    type: Literal[
        "best_hook", "peak_engagement", "emotional_peak", "dropoff_risk", "recovery"
    ]
    label: str
    score: float


class ModalityContribution(BaseModel):
    timestamp: float
    visual: float
    audio: float
    text: float


class NeuralScoreBreakdown(BaseModel):
    total: float = Field(..., ge=0, le=100)
    hook_score: float
    sustained_attention: float
    emotional_resonance: float
    memory_encoding: float
    aesthetic_quality: float
    cognitive_accessibility: float
    full_total: float | None = None
    full_hook_score: float | None = None
    full_sustained_attention: float | None = None
    full_emotional_resonance: float | None = None
    full_memory_encoding: float | None = None
    full_aesthetic_quality: float | None = None
    full_cognitive_accessibility: float | None = None
    content_types: list[str] | None = None
    targeted_dimensions: list[str] | None = None
    metric_relevance: dict[str, float] | None = None


class AnalysisResult(BaseModel):
    """The full neural report — the data packet Nucleus consumes in the closed loop."""

    job_id: UUID
    url: str
    content_type: str
    duration_seconds: float
    neural_score: NeuralScoreBreakdown
    metrics: list[MetricScore]
    attention_curve: list[float]
    emotional_arousal_curve: list[float]
    cognitive_load_curve: list[float]
    key_moments: list[KeyMoment]
    modality_breakdown: list[ModalityContribution]
    overarching_summary: str | None = None
    ai_summary: str | None = None
    ai_report_title: str | None = None
    ai_action_items: list[str] | None = None
    ai_priorities: list[str] | None = None
    ai_category_strategies: dict | None = None
    ai_metric_tips: dict | None = None
    parent_job_id: UUID | None = None
    content_group_id: UUID | None = None


class ComparisonResult(BaseModel):
    job_ids: list[UUID]
    labels: list[str]
    neural_scores: list[NeuralScoreBreakdown]
    winner_job_id: UUID
    recommendation: str
    delta_metrics: dict[str, list[float]]


class ProgressEvent(BaseModel):
    job_id: str
    status: Literal[
        "queued",
        "downloading",
        "transcribing",
        "inferring",
        "aggregating",
        "scoring",
        "complete",
        "error",
    ]
    progress: float = Field(..., ge=0, le=1)
    message: str


class JobCreated(BaseModel):
    job_id: UUID
    websocket_url: str
    status: str = "queued"
    parent_job_id: UUID | None = None
    content_group_id: UUID | None = None


class BrainMapFrame(BaseModel):
    timestamp: float
    vertex_activations: list[float]
