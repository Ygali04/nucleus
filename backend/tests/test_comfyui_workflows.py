"""Tests for comfyui_workflows translators — Kling i2v switching."""

from __future__ import annotations

import json

import pytest

from nucleus.providers.comfyui_workflows import translate_fal_video


def _fal_model(workflow: dict) -> str:
    return workflow["1"]["inputs"]["model"]


def _fal_args(workflow: dict) -> dict:
    return json.loads(workflow["1"]["inputs"]["arguments_json"])


def test_kling_with_reference_image_uses_i2v_slug():
    wf = translate_fal_video(
        "kling",
        prompt="a brand hero shot",
        duration_s=5.0,
        aspect_ratio="16:9",
        reference_image="https://ref.png",
    )
    model = _fal_model(wf)
    assert model == "fal-ai/kling-video/v2.1/standard/image-to-video"
    args = _fal_args(wf)
    assert args["image_url"] == "https://ref.png"
    assert args["prompt"] == "a brand hero shot"


def test_kling_without_reference_uses_t2v_slug():
    wf = translate_fal_video(
        "kling", prompt="text-only prompt", duration_s=5.0
    )
    assert _fal_model(wf) == "fal-ai/kling-video/v2.1/standard/text-to-video"
    args = _fal_args(wf)
    assert "image_url" not in args


def test_other_subtypes_still_switch_on_reference():
    # Seedance with reference → i2v; without → t2v. Sanity check that
    # existing subtypes still follow the same rule.
    with_ref = translate_fal_video(
        "seedance", prompt="x", duration_s=3.0, reference_image="https://r"
    )
    without_ref = translate_fal_video("seedance", prompt="x", duration_s=3.0)
    assert _fal_model(with_ref) == "fal-ai/bytedance/seedance/v1/pro/image-to-video"
    assert _fal_model(without_ref) == "fal-ai/bytedance/seedance/v1/pro/text-to-video"


def test_unknown_subtype_raises():
    with pytest.raises(ValueError):
        translate_fal_video("not-a-thing", prompt="x", duration_s=1.0)
