"""Pure structural tests for ComfyUI workflow translators.

No providers, no clients — just make sure every translator returns a
well-formed workflow where cross-node references point somewhere real.
"""

from __future__ import annotations

from typing import Any

import pytest

from nucleus.providers.comfyui_workflows import (
    Workflow,
    translate_elevenlabs_speech,
    translate_elevenlabs_voice_clone,
    translate_fal_hailuo,
    translate_fal_kling_v2,
    translate_fal_luma,
    translate_fal_runway_gen4,
    translate_fal_seedance_pro,
    translate_fal_stable_audio,
    translate_fal_veo3,
)


def _collect_refs(value: Any) -> list[list]:
    """Walk *value* and collect every ``[node_id, output_idx]`` reference."""
    refs: list[list] = []
    if isinstance(value, list) and len(value) == 2 and isinstance(value[0], str) \
            and isinstance(value[1], int):
        refs.append(value)
        return refs
    if isinstance(value, dict):
        for v in value.values():
            refs.extend(_collect_refs(v))
    elif isinstance(value, list):
        for v in value:
            refs.extend(_collect_refs(v))
    return refs


def assert_workflow_valid(wf: Workflow) -> None:
    """Every node has class_type + inputs; every cross-ref resolves."""
    assert isinstance(wf, dict)
    assert wf, "workflow must have at least one node"
    node_ids = set(wf.keys())
    for node_id, node in wf.items():
        assert isinstance(node_id, str)
        assert "class_type" in node and isinstance(node["class_type"], str)
        assert "inputs" in node and isinstance(node["inputs"], dict)

    for node in wf.values():
        for ref in _collect_refs(node["inputs"]):
            src_id, out_idx = ref
            assert src_id in node_ids, f"reference to missing node {src_id!r}"
            assert out_idx >= 0


# ---------------------------------------------------------------------------
# Per-translator structural cases
# ---------------------------------------------------------------------------


TRANSLATOR_CASES: list[tuple[str, Any, dict[str, Any], str, list[str]]] = [
    (
        "kling-text",
        translate_fal_kling_v2,
        {"prompt": "cat", "duration_s": 5.0},
        "FAL_Kling_V2_1_Master",
        ["prompt", "duration", "aspect_ratio"],
    ),
    (
        "kling-i2v",
        translate_fal_kling_v2,
        {
            "prompt": "cat",
            "duration_s": 10.0,
            "reference_image_url": "https://example.com/r.png",
        },
        "FAL_Kling_V2_1_Master",
        ["prompt", "duration"],
    ),
    (
        "seedance",
        translate_fal_seedance_pro,
        {"prompt": "x", "duration_s": 6.0},
        "FAL_Seedance_1_Pro",
        ["prompt", "duration"],
    ),
    (
        "veo",
        translate_fal_veo3,
        {"prompt": "x", "duration_s": 8.0},
        "FAL_Veo_3",
        ["prompt", "duration", "aspect_ratio"],
    ),
    (
        "runway",
        translate_fal_runway_gen4,
        {"prompt": "x", "duration_s": 5.0},
        "FAL_Runway_Gen4",
        ["prompt", "duration"],
    ),
    (
        "luma",
        translate_fal_luma,
        {"prompt": "x", "duration_s": 5.0},
        "FAL_LumaDreamMachine",
        ["prompt", "duration"],
    ),
    (
        "hailuo",
        translate_fal_hailuo,
        {"prompt": "x", "duration_s": 5.0},
        "FAL_MiniMax_Hailuo",
        ["prompt", "duration"],
    ),
    (
        "elevenlabs-tts",
        translate_elevenlabs_speech,
        {"text": "hello", "voice_id": "vox"},
        "ElevenLabs_TTS",
        ["text", "voice_id"],
    ),
    (
        "elevenlabs-clone",
        translate_elevenlabs_voice_clone,
        {"sample_audio_url": "https://example.com/s.mp3", "voice_name": "Alice"},
        "ElevenLabs_VoiceClone",
        ["voice_name"],
    ),
    (
        "stable-audio",
        translate_fal_stable_audio,
        {"prompt": "drone", "duration_s": 20.0},
        "FAL_StableAudio_2",
        ["prompt", "duration"],
    ),
]


@pytest.mark.parametrize(
    "name,fn,kwargs,expected_class,required_inputs",
    TRANSLATOR_CASES,
    ids=[c[0] for c in TRANSLATOR_CASES],
)
def test_translator_returns_valid_workflow(
    name: str,
    fn: Any,
    kwargs: dict[str, Any],
    expected_class: str,
    required_inputs: list[str],
) -> None:
    wf = fn(**kwargs)
    assert isinstance(wf, dict)
    assert_workflow_valid(wf)

    node = next(
        (n for n in wf.values() if n["class_type"] == expected_class), None
    )
    assert node is not None, f"{name}: no node with class_type={expected_class!r}"
    for key in required_inputs:
        assert key in node["inputs"], f"{name}: missing input {key!r}"


def test_kling_discrete_duration_values() -> None:
    """Kling fal endpoint accepts '5' or '10' — anything else is a schema error."""
    for d in (1.0, 4.9, 5.0, 7.5):
        wf = translate_fal_kling_v2("x", duration_s=d)
        gen = next(n for n in wf.values() if n["class_type"] == "FAL_Kling_V2_1_Master")
        assert gen["inputs"]["duration"] == "5"
    for d in (7.51, 8.0, 10.0, 15.0):
        wf = translate_fal_kling_v2("x", duration_s=d)
        gen = next(n for n in wf.values() if n["class_type"] == "FAL_Kling_V2_1_Master")
        assert gen["inputs"]["duration"] == "10"


def test_all_video_translators_emit_save_node() -> None:
    for fn in (
        translate_fal_kling_v2,
        translate_fal_seedance_pro,
        translate_fal_veo3,
        translate_fal_runway_gen4,
        translate_fal_luma,
        translate_fal_hailuo,
    ):
        wf = fn(prompt="x", duration_s=5.0)
        assert any(n["class_type"] == "VHS_SaveVideo" for n in wf.values()), (
            f"{fn.__name__} missing VHS_SaveVideo terminal node"
        )


def test_audio_translators_emit_save_node() -> None:
    for wf in (
        translate_elevenlabs_speech(text="hi", voice_id="v"),
        translate_fal_stable_audio(prompt="drone", duration_s=10.0),
    ):
        assert any(n["class_type"] == "SaveAudio" for n in wf.values())
