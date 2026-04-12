"""Pydantic schemas for all 7 agent tools."""

from __future__ import annotations

from pydantic import BaseModel, Field


# --- generate_video ---

class GenerateVideoRequest(BaseModel):
    prompt: str
    duration_s: float = Field(gt=0, le=60)
    provider: str = "mock"
    aspect_ratio: str = "16:9"
    reference_image: str | None = None


class GenerateVideoResponse(BaseModel):
    video_url: str
    cost_usd: float
    provider_job_id: str
    duration_s: float
    provider: str


# --- generate_audio ---

class GenerateAudioRequest(BaseModel):
    text: str
    voice_id: str = "default"
    language: str = "en"


class GenerateAudioResponse(BaseModel):
    audio_url: str
    cost_usd: float
    duration_s: float


# --- generate_music ---

class GenerateMusicRequest(BaseModel):
    prompt: str
    duration_s: float = Field(gt=0, le=300)
    mood: str = "neutral"


class GenerateMusicResponse(BaseModel):
    audio_url: str
    cost_usd: float


# --- compose_remotion ---

class ComposeRemotionRequest(BaseModel):
    scene_manifest: dict
    template_id: str


class ComposeRemotionResponse(BaseModel):
    video_url: str
    cost_usd: float
    duration_s: float


# --- clip_ffmpeg ---

class ClipFFmpegRequest(BaseModel):
    input_url: str
    start_s: float = 0.0
    end_s: float = 0.0
    operations: list[str] = Field(default_factory=list)


class ClipFFmpegResponse(BaseModel):
    video_url: str


# --- score_neuropeer ---

class ScoreNeuroPeerRequest(BaseModel):
    video_url: str
    content_type: str = "custom"
    parent_job_id: str | None = None
    slice_start: float | None = None
    slice_end: float | None = None


class ScoreNeuroPeerResponse(BaseModel):
    job_id: str
    neural_score: float
    breakdown: dict
    metrics: list[dict]
    key_moments: list[dict]
    attention_curve: list[float]
    ai_summary: str | None = None
    ai_action_items: list[str] | None = None


# --- edit_variant ---

class EditVariantRequest(BaseModel):
    candidate_id: str
    edit_type: str
    edit_params: dict = Field(default_factory=dict)


class EditVariantResponse(BaseModel):
    new_iteration_id: str
    video_url: str
    cost_usd: float
    edit_applied: str
