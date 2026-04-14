"""Pure ComfyUI workflow builders.

Each function returns a flat ``dict[str, dict]`` keyed by string node ids
(``"1"``, ``"2"``, ...).  The inner dict always has the shape
``{"class_type": str, "inputs": dict[str, Any]}``.

Cross-node references follow the ComfyUI convention: a list of two
``[node_id: str, output_index: int]`` values (serialised as JSON lists, but
ComfyUI accepts them as Python lists / tuples over the wire).

Translators are side-effect free — no network, no env lookups — so they
can be unit tested without any ComfyUI server.
"""

from __future__ import annotations

from typing import Any

# Sensible default reference frame when callers don't supply one.
_DEFAULT_SVD_IMAGE = "nucleus-default-reference.png"

Workflow = dict[str, dict[str, Any]]


def _ref(node_id: str, output_index: int = 0) -> list:
    """Build a ComfyUI cross-node reference."""
    return [node_id, output_index]


def translate_svd_image_to_video(
    prompt: str,
    reference_image_url: str,
    duration_s: float,
    motion_bucket: int = 127,
) -> Workflow:
    """Stable Video Diffusion image-to-video workflow.

    *prompt* is carried through as metadata only — SVD is conditioned on the
    image, not on text.  We attach it as a positive text string on the
    SVD conditioning node so downstream log viewers can see it.
    """
    # SVD runs at ~8 fps; convert duration into a frame count.
    video_frames = max(1, int(duration_s * 8))
    image = reference_image_url or _DEFAULT_SVD_IMAGE

    return {
        "1": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": "svd_xt.safetensors"},
        },
        "2": {
            "class_type": "LoadImage",
            "inputs": {"image": image},
        },
        "3": {
            "class_type": "SVD_img2vid_Conditioning",
            "inputs": {
                "image": _ref("2", 0),
                "model": _ref("1", 1),
                "clip_vision": _ref("1", 2),
                "vae": _ref("1", 3),
                "width": 1024,
                "height": 576,
                "video_frames": video_frames,
                "motion_bucket_id": motion_bucket,
                "fps": 8,
                "augmentation_level": 0.0,
                "prompt": prompt,
            },
        },
        "4": {
            "class_type": "KSampler",
            "inputs": {
                "model": _ref("3", 0),
                "positive": _ref("3", 1),
                "negative": _ref("3", 2),
                "latent_image": _ref("3", 3),
                "seed": 0,
                "steps": 20,
                "cfg": 2.5,
                "sampler_name": "euler",
                "scheduler": "karras",
                "denoise": 1.0,
            },
        },
        "5": {
            "class_type": "VAEDecode",
            "inputs": {"samples": _ref("4", 0), "vae": _ref("1", 3)},
        },
        "6": {
            "class_type": "VHS_VideoCombine",
            "inputs": {
                "images": _ref("5", 0),
                "frame_rate": 8,
                "filename_prefix": "nucleus-svd",
                "format": "video/h264-mp4",
            },
        },
    }


def translate_animatediff_text_to_video(
    prompt: str,
    duration_s: float,
    negative: str = "",
) -> Workflow:
    """AnimateDiff-Evolved SDXL text-to-video workflow."""
    video_frames = max(8, int(duration_s * 8))
    return {
        "1": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"},
        },
        "2": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": prompt, "clip": _ref("1", 1)},
        },
        "3": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": negative, "clip": _ref("1", 1)},
        },
        "4": {
            # AnimateDiff-Evolved custom node pack
            "class_type": "ADE_LoadAnimateDiffModel",
            "inputs": {"model_name": "mm_sdxl_v10_beta.ckpt"},
        },
        "5": {
            "class_type": "ADE_AnimateDiffUniformContextOptions",
            "inputs": {
                "context_length": 16,
                "context_stride": 1,
                "context_overlap": 4,
                "context_schedule": "uniform",
                "closed_loop": False,
            },
        },
        "6": {
            "class_type": "ADE_AnimateDiffLoaderWithContext",
            "inputs": {
                "model": _ref("1", 0),
                "motion_model": _ref("4", 0),
                "context_options": _ref("5", 0),
                "beta_schedule": "sqrt_linear (AnimateDiff)",
            },
        },
        "7": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": 1024, "height": 576, "batch_size": video_frames},
        },
        "8": {
            "class_type": "KSampler",
            "inputs": {
                "model": _ref("6", 0),
                "positive": _ref("2", 0),
                "negative": _ref("3", 0),
                "latent_image": _ref("7", 0),
                "seed": 0,
                "steps": 25,
                "cfg": 7.0,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1.0,
            },
        },
        "9": {
            "class_type": "VAEDecode",
            "inputs": {"samples": _ref("8", 0), "vae": _ref("1", 2)},
        },
        "10": {
            "class_type": "VHS_VideoCombine",
            "inputs": {
                "images": _ref("9", 0),
                "frame_rate": 8,
                "filename_prefix": "nucleus-animatediff",
                "format": "video/h264-mp4",
            },
        },
    }


def translate_ltx_video(
    prompt: str,
    duration_s: float,
    resolution: tuple[int, int] = (768, 512),
) -> Workflow:
    """LTX-Video text-to-video workflow."""
    width, height = resolution
    video_frames = max(1, int(duration_s * 24))
    return {
        "1": {
            "class_type": "LTXVModelLoader",
            "inputs": {"model_name": "ltx-video-2b-v0.9.safetensors"},
        },
        "2": {
            "class_type": "LTXVCLIPEncoder",
            "inputs": {"text": prompt, "clip": _ref("1", 1)},
        },
        "3": {
            "class_type": "LTXVCLIPEncoder",
            "inputs": {"text": "", "clip": _ref("1", 1)},
        },
        "4": {
            "class_type": "LTXVSampler",
            "inputs": {
                "model": _ref("1", 0),
                "positive": _ref("2", 0),
                "negative": _ref("3", 0),
                "width": width,
                "height": height,
                "num_frames": video_frames,
                "frame_rate": 24,
                "seed": 0,
                "steps": 30,
                "cfg": 3.0,
            },
        },
        "5": {
            "class_type": "VAEDecode",
            "inputs": {"samples": _ref("4", 0), "vae": _ref("1", 2)},
        },
        "6": {
            "class_type": "VHS_VideoCombine",
            "inputs": {
                "images": _ref("5", 0),
                "frame_rate": 24,
                "filename_prefix": "nucleus-ltxv",
                "format": "video/h264-mp4",
            },
        },
    }


def _compose_music_prompt(mood: str, genre: str, energy: float) -> str:
    """Turn structured music params into a natural-language prompt."""
    energy_word = "low-energy" if energy < 0.34 else (
        "high-energy" if energy > 0.66 else "mid-tempo"
    )
    parts = [p for p in (energy_word, mood, genre, "instrumental") if p]
    return ", ".join(parts)


def translate_musicgen(
    mood: str,
    genre: str,
    duration_s: float,
    energy: float,
) -> Workflow:
    """MusicGen workflow using the ComfyUI-MusicGen community node."""
    text = _compose_music_prompt(mood, genre, energy)
    return {
        "1": {
            "class_type": "MusicgenLoader",
            "inputs": {"model_name": "facebook/musicgen-medium"},
        },
        "2": {
            "class_type": "MusicgenGenerate",
            "inputs": {
                "model": _ref("1", 0),
                "prompt": text,
                "duration": float(duration_s),
                "temperature": 1.0,
                "top_k": 250,
                "cfg_coef": 3.0,
            },
        },
        "3": {
            "class_type": "SaveAudio",
            "inputs": {
                "audio": _ref("2", 0),
                "filename_prefix": "nucleus-musicgen",
                "format": "mp3",
            },
        },
    }


def translate_whisper(audio_url: str) -> Workflow:
    """Whisper transcription workflow."""
    return {
        "1": {
            "class_type": "LoadAudio",
            "inputs": {"audio": audio_url},
        },
        "2": {
            "class_type": "WhisperLoader",
            "inputs": {"model_name": "large-v3"},
        },
        "3": {
            "class_type": "WhisperTranscribe",
            "inputs": {
                "model": _ref("2", 0),
                "audio": _ref("1", 0),
                "language": "auto",
            },
        },
        "4": {
            "class_type": "SaveText",
            "inputs": {
                "text": _ref("3", 0),
                "filename_prefix": "nucleus-whisper",
            },
        },
    }


# ---------------------------------------------------------------------------
# Cloud-provider workflow shims
#
# Kling / Seedance / Veo / Runway / Luma / Hailuo are hosted cloud video
# models. They don't run inside ComfyUI proper, but the Nucleus ComfyUI
# event bridge treats any workflow dict the same way: submit it, stream
# progress, pull the final artifact. We expose thin single-node workflows
# here so Ruflo can speak one vocabulary ("build me a workflow for X")
# regardless of whether the backend is open-weights or cloud-API.
#
# A custom ComfyUI node (``NucleusCloudVideo`` / ``NucleusCloudAudio``)
# is assumed to exist that dispatches to the corresponding Nucleus
# provider — see ``nucleus/providers/{kling,seedance,elevenlabs,...}.py``.
# ---------------------------------------------------------------------------

_VIDEO_SUBTYPES = {"kling", "seedance", "veo", "runway", "luma", "hailuo"}
_AUDIO_SUBTYPES = {"elevenlabs", "stable_audio"}
_EDIT_TYPES = {
    "hook_rewrite",
    "cut_tightening",
    "music_swap",
    "pacing_change",
    "narration_rewrite",
    "visual_substitution",
    "caption_emphasis",
    "icp_reanchor",
}


def translate_cloud_video(
    subtype: str,
    prompt: str,
    duration_s: float,
    aspect_ratio: str = "16:9",
    reference_image_url: str | None = None,
) -> Workflow:
    """Single-node workflow that dispatches to a Nucleus cloud video provider."""
    if subtype not in _VIDEO_SUBTYPES:
        raise ValueError(f"Unknown cloud video subtype: {subtype}")
    return {
        "1": {
            "class_type": "NucleusCloudVideo",
            "inputs": {
                "provider": subtype,
                "prompt": prompt,
                "duration_s": float(duration_s),
                "aspect_ratio": aspect_ratio,
                "reference_image_url": reference_image_url or "",
            },
        },
        "2": {
            "class_type": "VHS_VideoCombine",
            "inputs": {
                "images": _ref("1", 0),
                "frame_rate": 24,
                "filename_prefix": f"nucleus-{subtype}",
                "format": "video/h264-mp4",
            },
        },
    }


def translate_cloud_audio(
    subtype: str,
    prompt: str,
    duration_s: float,
) -> Workflow:
    """Single-node workflow for cloud TTS / audio models (ElevenLabs, Stable Audio)."""
    if subtype not in _AUDIO_SUBTYPES:
        raise ValueError(f"Unknown cloud audio subtype: {subtype}")
    return {
        "1": {
            "class_type": "NucleusCloudAudio",
            "inputs": {
                "provider": subtype,
                "prompt": prompt,
                "duration_s": float(duration_s),
            },
        },
        "2": {
            "class_type": "SaveAudio",
            "inputs": {
                "audio": _ref("1", 0),
                "filename_prefix": f"nucleus-{subtype}",
                "format": "mp3",
            },
        },
    }


def translate_edit(
    edit_type: str,
    source_video_url: str,
    target_start_s: float | None = None,
    target_end_s: float | None = None,
    source_audio_url: str | None = None,
) -> Workflow:
    """Single-node workflow that dispatches to an ffmpeg-backed edit operation."""
    if edit_type not in _EDIT_TYPES:
        raise ValueError(f"Unknown edit_type: {edit_type}")
    return {
        "1": {
            "class_type": "NucleusEdit",
            "inputs": {
                "edit_type": edit_type,
                "source_video_url": source_video_url,
                "source_audio_url": source_audio_url or "",
                "target_start_s": -1.0 if target_start_s is None else float(target_start_s),
                "target_end_s": -1.0 if target_end_s is None else float(target_end_s),
            },
        },
        "2": {
            "class_type": "VHS_VideoCombine",
            "inputs": {
                "images": _ref("1", 0),
                "frame_rate": 24,
                "filename_prefix": f"nucleus-edit-{edit_type}",
                "format": "video/h264-mp4",
            },
        },
    }


__all__ = [
    "Workflow",
    "translate_animatediff_text_to_video",
    "translate_cloud_audio",
    "translate_cloud_video",
    "translate_edit",
    "translate_ltx_video",
    "translate_musicgen",
    "translate_svd_image_to_video",
    "translate_whisper",
]
