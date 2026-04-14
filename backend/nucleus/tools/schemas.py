"""Pydantic schemas for all 7 agent tools."""

from __future__ import annotations

from typing import Literal

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
    # Per-operation parameters, keyed by operation name. Examples:
    #   {"concat": {"additional_urls": ["s3://..."]}}
    #   {"overlay_text": {"text": "Hi", "start_s": 0, "end_s": 2,
    #                      "position": "bottom"}}
    #   {"adjust_speed": {"speed_factor": 1.5}}
    #   {"add_music_bed": {"music_url": "s3://...", "volume_db": -10.0}}
    params: dict = Field(default_factory=dict)


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


# --- run_comfyui_workflow ---

class RunComfyUIWorkflowRequest(BaseModel):
    workflow: dict
    job_id: str
    candidate_id: str
    node_id: str
    expected_output_kind: Literal["video", "audio", "image"]


class RunComfyUIWorkflowResponse(BaseModel):
    output_url: str
    cost_usd: float
    duration_s: float


# --- build_workflow (Ruflo workflow translator endpoint) ---


class BuildWorkflowRequest(BaseModel):
    """Parameters for constructing a ComfyUI workflow JSON.

    Ruflo calls this when it decides "I need to run subtype X" — the backend
    returns a graph it can hand straight to ``run_comfyui_workflow``.
    """

    kind: Literal["video", "audio", "music", "edit"]
    subtype: str  # kling|seedance|veo|runway|luma|hailuo | elevenlabs|stable_audio | svd|animatediff|ltxv | musicgen | edit_type
    prompt: str | None = None
    duration_s: float = 5.0
    aspect_ratio: str = "16:9"
    reference_image_url: str | None = None
    # Music-specific
    mood: str = "neutral"
    genre: str = ""
    energy: float = 0.5
    # Edit-specific
    edit_type: str | None = None
    source_video_url: str | None = None
    source_audio_url: str | None = None
    target_start_s: float | None = None
    target_end_s: float | None = None


class BuildWorkflowResponse(BaseModel):
    kind: Literal["video", "audio", "music", "edit"]
    subtype: str
    workflow: dict
