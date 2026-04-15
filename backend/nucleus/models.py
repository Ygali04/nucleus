"""Pydantic models shared across the Nucleus orchestrator."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class JobState(str, Enum):
    BRIEFED = "briefed"
    PLANNING = "planning"
    GENERATING = "generating"
    SCORING = "scoring"
    EVALUATING = "evaluating"
    EDITING = "editing"
    DELIVERING = "delivering"
    COMPLETE = "complete"
    FAILED = "failed"


class StopDecision(str, Enum):
    CONTINUE = "continue"
    PASSED_THRESHOLD = "passed_threshold"
    MAX_ITERATIONS = "max_iterations"
    MONOTONE_FAILURE = "monotone_failure"
    COST_CEILING = "cost_ceiling"


class EditType(str, Enum):
    HOOK_REWRITE = "hook_rewrite"
    CUT_TIGHTENING = "cut_tightening"
    MUSIC_SWAP = "music_swap"
    PACING_CHANGE = "pacing_change"
    CAPTION_EMPHASIS = "caption_emphasis"
    VISUAL_SUBSTITUTION = "visual_substitution"


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------

class BriefRequest(BaseModel):
    brand_id: str
    source_url: str
    icps: list[str] = Field(min_length=1)
    languages: list[str] = Field(min_length=1)
    platforms: list[str] = Field(min_length=1)
    archetypes: list[str] = Field(min_length=1)
    variants_per_cell: int = Field(default=1, ge=1)
    score_threshold: float = Field(default=60.0, ge=0, le=100)
    max_iterations: int = Field(default=5, ge=1)
    cost_ceiling: float | None = None


class BriefResponse(BaseModel):
    job_id: str
    websocket_url: str
    candidate_count: int


# ---------------------------------------------------------------------------
# Internal domain objects
# ---------------------------------------------------------------------------

def _new_id() -> str:
    return uuid.uuid4().hex[:12]


class Job(BaseModel):
    id: str = Field(default_factory=_new_id)
    state: JobState = JobState.BRIEFED
    brief: BriefRequest
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CandidateSpec(BaseModel):
    id: str = Field(default_factory=_new_id)
    job_id: str
    icp: str
    language: str
    platform: str
    archetype: str
    variant_index: int
    score_threshold: float
    max_iterations: int
    cost_ceiling: float | None = None
    state: JobState = JobState.GENERATING
    source_url: str = ""


class ScoreBreakdown(BaseModel):
    neural_score: float
    hook_score: float = 0.0
    sustained_attention: float = 0.0
    emotional_resonance: float = 0.0
    cognitive_accessibility: float = 0.0
    memory_encoding: float = 0.0
    aesthetic_quality: float = 0.0
    attention_curve: list[float] = Field(default_factory=list)


class Iteration(BaseModel):
    id: str = Field(default_factory=_new_id)
    candidate_id: str
    index: int
    video_url: str = ""
    score: ScoreBreakdown | None = None
    edit_type: EditType | None = None
    cost: float = 0.0
    analysis_result: dict | None = None


class CandidateStatus(BaseModel):
    candidate_id: str
    state: str
    current_score: float | None = None
    iteration_count: int = 0
    icp: str = ""
    language: str = ""
    platform: str = ""
    archetype: str = ""


class IterationDetail(BaseModel):
    iteration_index: int
    video_url: str
    score: ScoreBreakdown | None = None
    edit_type: str | None = None


# ---------------------------------------------------------------------------
# Campaigns — a UI-facing archetype graph that can be executed as a Brief.
# ---------------------------------------------------------------------------

class CampaignDeliverables(BaseModel):
    """GTM + SOP docs produced by the strategist on the Delivery node."""

    gtm_guide: str | None = None  # markdown
    sop_doc: str | None = None  # markdown
    strategy_summary: str | None = None
    generated_at: datetime | None = None


class Campaign(BaseModel):
    id: str = Field(default_factory=_new_id)
    archetype: str
    brand_name: str
    graph: dict = Field(default_factory=dict)
    brief: dict | None = None
    status: str = "idle"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_executed_at: datetime | None = None
    last_job_id: str | None = None
    deliverables: CampaignDeliverables | None = None


class CampaignCreate(BaseModel):
    archetype: str
    brand_name: str
    graph: dict = Field(default_factory=dict)
    brief: dict | None = None


class CampaignUpdate(BaseModel):
    archetype: str | None = None
    brand_name: str | None = None
    graph: dict | None = None
    brief: dict | None = None
    status: str | None = None
    deliverables: CampaignDeliverables | None = None


class CampaignExecuteResponse(BaseModel):
    job_id: str
    websocket_url: str


class CampaignReport(BaseModel):
    iteration_id: str
    candidate_id: str
    iteration_index: int
    analysis_result: dict
