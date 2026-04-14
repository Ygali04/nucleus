"""Tests for ComfyUI workflow translators + providers."""

from __future__ import annotations

import os
from collections.abc import AsyncIterator
from typing import Any

import pytest

# Ensure mock mode is disabled for the round-trip tests; individual tests
# flip it back on via monkeypatch as needed.
os.environ.pop("NUCLEUS_MOCK_PROVIDERS", None)

from nucleus.providers import _comfyui_runtime
from nucleus.providers._comfyui_runtime import extract_output_filename
from nucleus.providers.comfyui_audio import ComfyUIAudioProvider
from nucleus.providers.comfyui_video import ComfyUIVideoProvider
from nucleus.providers.comfyui_workflows import (
    _compose_music_prompt,
    translate_animatediff_text_to_video,
    translate_ltx_video,
    translate_musicgen,
    translate_svd_image_to_video,
    translate_whisper,
)


# ---------------------------------------------------------------------------
# Stub ComfyUI client
# ---------------------------------------------------------------------------


class StubComfyUIClient:
    """Records all calls; returns pre-seeded history + bytes."""

    def __init__(
        self,
        prompt_id: str = "prompt-42",
        filename: str = "nucleus-svd_00001.mp4",
        payload: bytes = b"fake-mp4-bytes",
        progress_events: list[dict] | None = None,
    ) -> None:
        self.prompt_id = prompt_id
        self.filename = filename
        self.payload = payload
        self.progress_events = progress_events or [
            {"type": "progress", "value": 0.5},
            {"type": "executed"},
        ]
        self.submitted: list[dict] = []
        self.fetched: list[tuple[str, str, str]] = []

    async def submit_workflow(self, workflow: dict) -> str:
        self.submitted.append(workflow)
        return self.prompt_id

    async def stream_progress(self, prompt_id: str) -> AsyncIterator[dict]:
        for event in self.progress_events:
            yield event

    async def get_history(self, prompt_id: str) -> dict:
        return {
            prompt_id: {
                "outputs": {
                    "6": {
                        "gifs": [
                            {"filename": self.filename, "subfolder": "", "type": "output"}
                        ]
                    }
                }
            }
        }

    async def fetch_output(
        self, filename: str, subfolder: str = "", type_: str = "output"
    ) -> bytes:
        self.fetched.append((filename, subfolder, type_))
        return self.payload


# ---------------------------------------------------------------------------
# Translator tests
# ---------------------------------------------------------------------------


class TestSVDTranslator:
    def test_workflow_shape(self) -> None:
        wf = translate_svd_image_to_video(
            prompt="a cat", reference_image_url="cat.png", duration_s=3.0
        )
        assert len(wf) >= 6
        assert wf["1"]["class_type"] == "CheckpointLoaderSimple"
        assert wf["1"]["inputs"]["ckpt_name"] == "svd_xt.safetensors"
        assert wf["2"]["class_type"] == "LoadImage"
        assert wf["2"]["inputs"]["image"] == "cat.png"
        assert wf["3"]["class_type"] == "SVD_img2vid_Conditioning"
        assert wf["4"]["class_type"] == "KSampler"
        assert wf["5"]["class_type"] == "VAEDecode"
        assert wf["6"]["class_type"] == "VHS_VideoCombine"

    def test_ksampler_references_svd_conditioning(self) -> None:
        wf = translate_svd_image_to_video("x", "img.png", duration_s=2.0)
        ksampler = wf["4"]["inputs"]
        assert ksampler["model"] == ["3", 0]
        assert ksampler["positive"] == ["3", 1]
        assert ksampler["negative"] == ["3", 2]
        assert ksampler["latent_image"] == ["3", 3]

    def test_duration_converts_to_frames(self) -> None:
        wf = translate_svd_image_to_video("x", "img.png", duration_s=3.0)
        assert wf["3"]["inputs"]["video_frames"] == 24  # 3 * 8 fps

    def test_motion_bucket_is_passed_through(self) -> None:
        wf = translate_svd_image_to_video("x", "img.png", duration_s=1.0, motion_bucket=200)
        assert wf["3"]["inputs"]["motion_bucket_id"] == 200

    def test_default_image_when_none_provided(self) -> None:
        wf = translate_svd_image_to_video("x", "", duration_s=1.0)
        assert wf["2"]["inputs"]["image"]


class TestAnimateDiffTranslator:
    def test_uses_animatediff_evolved_nodes(self) -> None:
        wf = translate_animatediff_text_to_video("dancing robot", duration_s=2.0)
        class_types = {node["class_type"] for node in wf.values()}
        assert "ADE_AnimateDiffLoaderWithContext" in class_types
        assert "ADE_AnimateDiffUniformContextOptions" in class_types
        assert "ADE_LoadAnimateDiffModel" in class_types

    def test_prompt_lands_in_text_encoder(self) -> None:
        wf = translate_animatediff_text_to_video("dancing robot", duration_s=2.0)
        text_encoders = [n for n in wf.values() if n["class_type"] == "CLIPTextEncode"]
        prompts = {n["inputs"]["text"] for n in text_encoders}
        assert "dancing robot" in prompts


class TestLTXVTranslator:
    def test_uses_ltxv_nodes(self) -> None:
        wf = translate_ltx_video("a hot air balloon", duration_s=2.0)
        class_types = {node["class_type"] for node in wf.values()}
        assert "LTXVModelLoader" in class_types
        assert "LTXVCLIPEncoder" in class_types
        assert "LTXVSampler" in class_types

    def test_resolution_passed_to_sampler(self) -> None:
        wf = translate_ltx_video("x", duration_s=1.0, resolution=(512, 384))
        sampler = next(n for n in wf.values() if n["class_type"] == "LTXVSampler")
        assert sampler["inputs"]["width"] == 512
        assert sampler["inputs"]["height"] == 384


class TestMusicGenTranslator:
    def test_prompt_composed_from_mood_genre_energy(self) -> None:
        text = _compose_music_prompt(mood="uplifting", genre="synthwave", energy=0.9)
        assert "high-energy" in text
        assert "uplifting" in text
        assert "synthwave" in text

    def test_workflow_includes_musicgen(self) -> None:
        wf = translate_musicgen(mood="calm", genre="lofi", duration_s=30.0, energy=0.2)
        class_types = {n["class_type"] for n in wf.values()}
        assert "MusicgenLoader" in class_types
        assert "MusicgenGenerate" in class_types
        gen = next(n for n in wf.values() if n["class_type"] == "MusicgenGenerate")
        assert "lofi" in gen["inputs"]["prompt"]
        assert "calm" in gen["inputs"]["prompt"]
        assert gen["inputs"]["duration"] == 30.0


class TestWhisperTranslator:
    def test_contains_whisper_nodes(self) -> None:
        wf = translate_whisper("https://example.com/a.mp3")
        class_types = {n["class_type"] for n in wf.values()}
        assert "WhisperLoader" in class_types
        assert "WhisperTranscribe" in class_types
        load = next(n for n in wf.values() if n["class_type"] == "LoadAudio")
        assert load["inputs"]["audio"] == "https://example.com/a.mp3"


# ---------------------------------------------------------------------------
# Provider tests
# ---------------------------------------------------------------------------


class TestComfyUIVideoProvider:
    async def test_generate_roundtrip_uploads_to_storage(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")

        uploads: list[tuple[str, bytes, str]] = []

        async def fake_upload_bytes(
            key: str, data: bytes, content_type: str = "application/octet-stream"
        ) -> str:
            uploads.append((key, data, content_type))
            return f"s3://nucleus-media/{key}"

        monkeypatch.setattr(_comfyui_runtime, "upload_bytes", fake_upload_bytes)

        client = StubComfyUIClient(
            prompt_id="p1", filename="out.mp4", payload=b"VIDEO"
        )
        provider = ComfyUIVideoProvider(subtype="svd", client=client, job_id="job-1")
        result = await provider.generate(
            "a cat", duration_s=2.0, reference_image="ref.png"
        )

        assert len(client.submitted) == 1
        assert client.fetched == [("out.mp4", "", "output")]
        assert len(uploads) == 1
        key, data, content_type = uploads[0]
        assert key.startswith("jobs/job-1/raw/")
        assert key.endswith(".mp4")
        assert data == b"VIDEO"
        assert content_type == "video/mp4"
        assert result.video_url == f"s3://nucleus-media/{key}"
        assert result.provider == "comfyui-svd"
        assert result.provider_job_id == "p1"

    async def test_mock_mode_skips_client(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")

        async def boom(*_a: Any, **_k: Any) -> str:
            raise AssertionError("client should not be called in mock mode")

        monkeypatch.setattr(_comfyui_runtime, "upload_bytes", boom)

        provider = ComfyUIVideoProvider(subtype="svd", client=None)
        result = await provider.generate("x", duration_s=1.0)
        assert result.video_url.startswith("s3://nucleus-media/fixtures/")
        assert result.metadata["mock"] is True

    async def test_subtype_dispatch_svd(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")

        async def fake_upload_bytes(key: str, data: bytes, content_type: str = "") -> str:
            return f"s3://nucleus-media/{key}"

        monkeypatch.setattr(_comfyui_runtime, "upload_bytes", fake_upload_bytes)
        client = StubComfyUIClient()
        provider = ComfyUIVideoProvider(subtype="svd", client=client)
        await provider.generate("cat", duration_s=1.0, reference_image="r.png")

        wf = client.submitted[0]
        assert wf["1"]["inputs"]["ckpt_name"] == "svd_xt.safetensors"

    async def test_subtype_dispatch_animatediff(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")

        async def fake_upload_bytes(key: str, data: bytes, content_type: str = "") -> str:
            return f"s3://nucleus-media/{key}"

        monkeypatch.setattr(_comfyui_runtime, "upload_bytes", fake_upload_bytes)
        client = StubComfyUIClient()
        provider = ComfyUIVideoProvider(subtype="animatediff", client=client)
        await provider.generate("robot", duration_s=2.0)

        wf = client.submitted[0]
        class_types = {node["class_type"] for node in wf.values()}
        assert "ADE_AnimateDiffLoaderWithContext" in class_types

    async def test_unknown_subtype_rejected(self) -> None:
        with pytest.raises(ValueError):
            ComfyUIVideoProvider(subtype="bogus")  # type: ignore[arg-type]

    def test_cost_from_env(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("COMFYUI_SVD_COST_PER_SECOND", "0.05")
        provider = ComfyUIVideoProvider(subtype="svd", client=StubComfyUIClient())
        assert provider.estimate_cost(10.0) == 0.5

    def test_extract_output_filename_handles_missing(self) -> None:
        with pytest.raises(RuntimeError):
            extract_output_filename({"p1": {"outputs": {}}}, "p1")


class TestComfyUIAudioProvider:
    async def test_musicgen_roundtrip(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")

        uploads: list[tuple[str, bytes, str]] = []

        async def fake_upload_bytes(
            key: str, data: bytes, content_type: str = ""
        ) -> str:
            uploads.append((key, data, content_type))
            return f"s3://nucleus-media/{key}"

        monkeypatch.setattr(_comfyui_runtime, "upload_bytes", fake_upload_bytes)

        client = StubComfyUIClient(filename="music.mp3", payload=b"AUDIO")
        provider = ComfyUIAudioProvider(
            subtype="musicgen", client=client, job_id="job-7"
        )
        result = await provider.generate_music(
            prompt="ignored",
            duration_s=15.0,
            mood="happy",
            genre="pop",
            energy=0.8,
        )
        assert result.audio_url.startswith("s3://nucleus-media/jobs/job-7/raw/")
        assert result.audio_url.endswith(".mp3")
        assert uploads[0][2] == "audio/mpeg"
        wf = client.submitted[0]
        gen = next(n for n in wf.values() if n["class_type"] == "MusicgenGenerate")
        assert "happy" in gen["inputs"]["prompt"]
        assert "pop" in gen["inputs"]["prompt"]

    async def test_whisper_transcribe(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")

        async def fake_upload_bytes(key: str, data: bytes, content_type: str = "") -> str:
            return f"s3://nucleus-media/{key}"

        monkeypatch.setattr(_comfyui_runtime, "upload_bytes", fake_upload_bytes)

        client = StubComfyUIClient(filename="out.txt", payload=b"hello world")
        provider = ComfyUIAudioProvider(subtype="whisper", client=client, job_id="j")
        result = await provider.transcribe("https://example.com/a.mp3")
        assert result.audio_url.endswith(".txt")
        wf = client.submitted[0]
        assert any(n["class_type"] == "WhisperTranscribe" for n in wf.values())

    async def test_mock_mode_short_circuits_music(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")
        provider = ComfyUIAudioProvider(subtype="musicgen", client=None)
        result = await provider.generate_music("x", duration_s=5.0)
        assert result.audio_url.startswith("s3://nucleus-media/fixtures/")

    async def test_wrong_subtype_for_music_raises(self) -> None:
        provider = ComfyUIAudioProvider(subtype="whisper", client=StubComfyUIClient())
        with pytest.raises(RuntimeError):
            await provider.generate_music("x", duration_s=1.0)


# ---------------------------------------------------------------------------
# Registry integration
# ---------------------------------------------------------------------------


class TestRegistryIntegration:
    def test_get_provider_resolves_comfyui_subtype(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
        # Force a fresh registry so env changes take effect.
        from nucleus.providers import registry as registry_mod

        registry_mod.get_registry.cache_clear()
        try:
            from nucleus.providers import get_provider

            provider = get_provider("video", "video:svd")
            assert isinstance(provider, ComfyUIVideoProvider)
            assert provider.subtype == "svd"
        finally:
            registry_mod.get_registry.cache_clear()
