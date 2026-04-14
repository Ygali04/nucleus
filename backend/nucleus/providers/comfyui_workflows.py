"""Workflow translators for ComfyUI custom nodes that proxy closed-source APIs.

All translators target ComfyUI-fal-API (gokayfem/ComfyUI-fal-API) for video,
ComfyUI-ElevenLabs (GiusTex/ComfyUI-ElevenLabs) for voice, and the fal
Stable Audio 2 node for music. ComfyUI here is an orchestration/caching
layer — NOT a local model host.

Each translator returns a flat ``dict[str, dict]`` keyed by string node ids
(``"1"``, ``"2"``, ...). The inner dict always has the shape
``{"class_type": str, "inputs": dict[str, Any]}``.

Cross-node references follow the ComfyUI convention: a list of two
``[node_id: str, output_index: int]`` values.

Translators are side-effect free — no network, no env lookups — so they
can be unit tested without any ComfyUI server.

TODO: verify all FAL_* class names against ComfyUI-fal-API@main.
Patterns follow the repo's ``FAL_<Model>_<Variant>`` convention.
"""

from __future__ import annotations

from typing import Any

Workflow = dict[str, dict[str, Any]]


def _ref(node_id: str, output_index: int = 0) -> list:
    """Build a ComfyUI cross-node reference."""
    return [node_id, output_index]


def _kling_duration(duration_s: float) -> str:
    """Clamp to fal Kling's supported discrete duration values ("5" or "10")."""
    return "10" if duration_s > 7.5 else "5"


def _video_workflow(
    class_type: str,
    inputs: dict[str, Any],
    *,
    filename_prefix: str,
    reference_image_url: str | None,
) -> Workflow:
    """Assemble ``LoadImage? -> <class_type> -> VHS_SaveVideo`` workflow.

    When *reference_image_url* is falsy, the LoadImage node is omitted and
    *inputs* is passed through unchanged (text-to-video path).
    """
    wf: Workflow = {}
    if reference_image_url:
        wf["1"] = {
            "class_type": "LoadImage",
            "inputs": {"image": reference_image_url},
        }
        inputs = {**inputs, "image": _ref("1", 0)}
        gen_id = "2"
    else:
        gen_id = "1"
    wf[gen_id] = {"class_type": class_type, "inputs": inputs}
    wf[str(int(gen_id) + 1)] = {
        "class_type": "VHS_SaveVideo",
        "inputs": {
            "video": _ref(gen_id, 0),
            "filename_prefix": filename_prefix,
            "format": "video/h264-mp4",
        },
    }
    return wf


# ---------------------------------------------------------------------------
# Video translators (via ComfyUI-fal-API)
# ---------------------------------------------------------------------------


def translate_fal_kling_v2(
    prompt: str,
    duration_s: float,
    aspect_ratio: str = "16:9",
    reference_image_url: str | None = None,
    negative_prompt: str = "",
) -> Workflow:
    """fal Kling v2.1 Master video workflow.

    Kling supports discrete durations (5s or 10s); we clamp ``duration_s``.
    If a reference image URL is provided, an image-to-video variant is used.
    """
    # TODO: verify class name against ComfyUI-fal-API@main
    return _video_workflow(
        "FAL_Kling_V2_1_Master",
        {
            "prompt": prompt,
            "duration": _kling_duration(duration_s),
            "aspect_ratio": aspect_ratio,
            "negative_prompt": negative_prompt,
        },
        filename_prefix="nucleus-kling",
        reference_image_url=reference_image_url,
    )


def translate_fal_seedance_pro(
    prompt: str,
    duration_s: float,
    aspect_ratio: str = "16:9",
    reference_image_url: str | None = None,
    negative_prompt: str = "",
) -> Workflow:
    """fal Seedance 1 Pro video workflow."""
    # TODO: verify class name against ComfyUI-fal-API@main
    return _video_workflow(
        "FAL_Seedance_1_Pro",
        {
            "prompt": prompt,
            "duration": float(duration_s),
            "aspect_ratio": aspect_ratio,
            "negative_prompt": negative_prompt,
        },
        filename_prefix="nucleus-seedance",
        reference_image_url=reference_image_url,
    )


def translate_fal_veo3(
    prompt: str,
    duration_s: float,
    aspect_ratio: str = "16:9",
    negative_prompt: str = "",
) -> Workflow:
    """fal Veo 3 text-to-video workflow (no reference image support)."""
    # TODO: verify class name against ComfyUI-fal-API@main
    return _video_workflow(
        "FAL_Veo_3",
        {
            "prompt": prompt,
            "duration": float(duration_s),
            "aspect_ratio": aspect_ratio,
            "negative_prompt": negative_prompt,
        },
        filename_prefix="nucleus-veo",
        reference_image_url=None,
    )


def translate_fal_runway_gen4(
    prompt: str,
    duration_s: float,
    aspect_ratio: str = "16:9",
    reference_image_url: str | None = None,
    negative_prompt: str = "",
) -> Workflow:
    """fal Runway Gen-4 video workflow."""
    # TODO: verify class name against ComfyUI-fal-API@main
    return _video_workflow(
        "FAL_Runway_Gen4",
        {
            "prompt": prompt,
            "duration": float(duration_s),
            "aspect_ratio": aspect_ratio,
            "negative_prompt": negative_prompt,
        },
        filename_prefix="nucleus-runway",
        reference_image_url=reference_image_url,
    )


def translate_fal_luma(
    prompt: str,
    duration_s: float,
    reference_image_url: str | None = None,
    aspect_ratio: str = "16:9",
) -> Workflow:
    """fal Luma Dream Machine video workflow."""
    # TODO: verify class name against ComfyUI-fal-API@main
    return _video_workflow(
        "FAL_LumaDreamMachine",
        {
            "prompt": prompt,
            "duration": float(duration_s),
            "aspect_ratio": aspect_ratio,
        },
        filename_prefix="nucleus-luma",
        reference_image_url=reference_image_url,
    )


def translate_fal_hailuo(
    prompt: str,
    duration_s: float,
    reference_image_url: str | None = None,
    aspect_ratio: str = "16:9",
) -> Workflow:
    """fal MiniMax Hailuo video workflow."""
    # TODO: verify class name against ComfyUI-fal-API@main
    return _video_workflow(
        "FAL_MiniMax_Hailuo",
        {
            "prompt": prompt,
            "duration": float(duration_s),
            "aspect_ratio": aspect_ratio,
        },
        filename_prefix="nucleus-hailuo",
        reference_image_url=reference_image_url,
    )


# ---------------------------------------------------------------------------
# Audio translators
# ---------------------------------------------------------------------------


def translate_elevenlabs_speech(
    text: str,
    voice_id: str,
    model: str = "eleven_multilingual_v2",
) -> Workflow:
    """ElevenLabs text-to-speech workflow via GiusTex/ComfyUI-ElevenLabs."""
    # TODO: verify class name against GiusTex/ComfyUI-ElevenLabs
    return {
        "1": {
            "class_type": "ElevenLabs_TTS",
            "inputs": {
                "text": text,
                "voice_id": voice_id,
                "model_id": model,
            },
        },
        "2": {
            "class_type": "SaveAudio",
            "inputs": {
                "audio": _ref("1", 0),
                "filename_prefix": "nucleus-elevenlabs",
                "format": "mp3",
            },
        },
    }


def translate_elevenlabs_voice_clone(
    sample_audio_url: str,
    voice_name: str,
) -> Workflow:
    """ElevenLabs instant voice-cloning workflow."""
    # TODO: verify class name against GiusTex/ComfyUI-ElevenLabs
    return {
        "1": {
            "class_type": "LoadAudio",
            "inputs": {"audio": sample_audio_url},
        },
        "2": {
            "class_type": "ElevenLabs_VoiceClone",
            "inputs": {
                "audio": _ref("1", 0),
                "voice_name": voice_name,
            },
        },
    }


def translate_fal_stable_audio(
    prompt: str,
    duration_s: float,
    negative_prompt: str = "",
) -> Workflow:
    """fal Stable Audio 2 music/sfx workflow."""
    # TODO: verify class name against ComfyUI-fal-API@main
    return {
        "1": {
            "class_type": "FAL_StableAudio_2",
            "inputs": {
                "prompt": prompt,
                "duration": float(duration_s),
                "negative_prompt": negative_prompt,
            },
        },
        "2": {
            "class_type": "SaveAudio",
            "inputs": {
                "audio": _ref("1", 0),
                "filename_prefix": "nucleus-stable-audio",
                "format": "mp3",
            },
        },
    }


__all__ = [
    "Workflow",
    "translate_elevenlabs_speech",
    "translate_elevenlabs_voice_clone",
    "translate_fal_hailuo",
    "translate_fal_kling_v2",
    "translate_fal_luma",
    "translate_fal_runway_gen4",
    "translate_fal_seedance_pro",
    "translate_fal_stable_audio",
    "translate_fal_veo3",
]
