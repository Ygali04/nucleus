"""FastAPI router exposing all 7 agent tools as POST endpoints.

Each endpoint is invoked by the Ruflo orchestrator during the closed loop.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from nucleus.tools.clip_ffmpeg import clip_ffmpeg
from nucleus.tools.compose_remotion import compose_remotion
from nucleus.tools.edit_variant import edit_variant
from nucleus.tools.generate_audio import generate_audio
from nucleus.tools.generate_music import generate_music
from nucleus.tools.generate_video import generate_video
from nucleus.tools.run_comfyui_workflow import run_comfyui_workflow
from nucleus.tools.schemas import (
    ClipFFmpegRequest,
    ClipFFmpegResponse,
    ComposeRemotionRequest,
    ComposeRemotionResponse,
    EditVariantRequest,
    EditVariantResponse,
    GenerateAudioRequest,
    GenerateAudioResponse,
    GenerateMusicRequest,
    GenerateMusicResponse,
    GenerateVideoRequest,
    GenerateVideoResponse,
    RunComfyUIWorkflowRequest,
    RunComfyUIWorkflowResponse,
    ScoreNeuroPeerRequest,
    ScoreNeuroPeerResponse,
)
from nucleus.tools.score_neuropeer import score_neuropeer

router = APIRouter(prefix="/api/v1/tools", tags=["tools"])


@router.post("/generate_video", response_model=GenerateVideoResponse)
async def tool_generate_video(req: GenerateVideoRequest) -> GenerateVideoResponse:
    return await generate_video(req)


@router.post("/generate_audio", response_model=GenerateAudioResponse)
async def tool_generate_audio(req: GenerateAudioRequest) -> GenerateAudioResponse:
    return await generate_audio(req)


@router.post("/generate_music", response_model=GenerateMusicResponse)
async def tool_generate_music(req: GenerateMusicRequest) -> GenerateMusicResponse:
    return await generate_music(req)


@router.post("/compose_remotion", response_model=ComposeRemotionResponse)
async def tool_compose_remotion(req: ComposeRemotionRequest) -> ComposeRemotionResponse:
    return await compose_remotion(req)


@router.post("/clip_ffmpeg", response_model=ClipFFmpegResponse)
async def tool_clip_ffmpeg(req: ClipFFmpegRequest) -> ClipFFmpegResponse:
    try:
        return await clip_ffmpeg(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/score_neuropeer", response_model=ScoreNeuroPeerResponse)
async def tool_score_neuropeer(req: ScoreNeuroPeerRequest) -> ScoreNeuroPeerResponse:
    return await score_neuropeer(req)


@router.post("/edit_variant", response_model=EditVariantResponse)
async def tool_edit_variant(req: EditVariantRequest) -> EditVariantResponse:
    try:
        return await edit_variant(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/run_comfyui_workflow", response_model=RunComfyUIWorkflowResponse)
async def tool_run_comfyui_workflow(
    req: RunComfyUIWorkflowRequest,
) -> RunComfyUIWorkflowResponse:
    return await run_comfyui_workflow(req)
