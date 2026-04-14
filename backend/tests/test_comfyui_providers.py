"""Tests for ComfyUI workflow translators + providers.

These translators target ComfyUI custom nodes that proxy closed-source
APIs (ComfyUI-fal-API + GiusTex/ComfyUI-ElevenLabs); ComfyUI is an
orchestration layer, not a local model host.
"""

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


# ---------------------------------------------------------------------------
# Stub ComfyUI client
# ---------------------------------------------------------------------------


class StubComfyUIClient:
    """Records all calls; returns pre-seeded history + bytes."""

    def __init__(
        self,
        prompt_id: str = "prompt-42",
        filename: str = "out.mp4",
        payload: bytes = b"fake-bytes",
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
                    "99": {
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
# Video translator tests
# ---------------------------------------------------------------------------


class TestKlingTranslator:
    def test_text_to_video_uses_fal_kling(self) -> None:
        wf = translate_fal_kling_v2("a cat dancing", duration_s=5.0)
        class_types = {n["class_type"] for n in wf.values()}
        assert "FAL_Kling_V2_1_Master" in class_types
        gen = next(n for n in wf.values() if n["class_type"] == "FAL_Kling_V2_1_Master")
        assert gen["inputs"]["prompt"] == "a cat dancing"
        assert gen["inputs"]["aspect_ratio"] == "16:9"

    def test_duration_clamped_to_discrete_values(self) -> None:
        short = translate_fal_kling_v2("x", duration_s=3.0)
        long = translate_fal_kling_v2("x", duration_s=10.0)
        sgen = next(n for n in short.values() if n["class_type"] == "FAL_Kling_V2_1_Master")
        lgen = next(n for n in long.values() if n["class_type"] == "FAL_Kling_V2_1_Master")
        assert sgen["inputs"]["duration"] == "5"
        assert lgen["inputs"]["duration"] == "10"

    def test_reference_image_adds_load_node(self) -> None:
        wf = translate_fal_kling_v2(
            "x", duration_s=5.0, reference_image_url="https://example.com/ref.png"
        )
        class_types = {n["class_type"] for n in wf.values()}
        assert "LoadImage" in class_types
        gen = next(n for n in wf.values() if n["class_type"] == "FAL_Kling_V2_1_Master")
        assert isinstance(gen["inputs"]["image"], list)


class TestSeedanceTranslator:
    def test_class_type(self) -> None:
        wf = translate_fal_seedance_pro("x", duration_s=6.0)
        assert any(n["class_type"] == "FAL_Seedance_1_Pro" for n in wf.values())


class TestVeo3Translator:
    def test_class_type_and_text_only(self) -> None:
        wf = translate_fal_veo3("a dragon", duration_s=8.0, aspect_ratio="9:16")
        gen = next(n for n in wf.values() if n["class_type"] == "FAL_Veo_3")
        assert gen["inputs"]["prompt"] == "a dragon"
        assert gen["inputs"]["aspect_ratio"] == "9:16"
        # Veo has no LoadImage node regardless of inputs.
        assert not any(n["class_type"] == "LoadImage" for n in wf.values())


class TestRunwayTranslator:
    def test_class_type(self) -> None:
        wf = translate_fal_runway_gen4("x", duration_s=5.0)
        assert any(n["class_type"] == "FAL_Runway_Gen4" for n in wf.values())


class TestLumaTranslator:
    def test_class_type(self) -> None:
        wf = translate_fal_luma("x", duration_s=5.0)
        assert any(n["class_type"] == "FAL_LumaDreamMachine" for n in wf.values())


class TestHailuoTranslator:
    def test_class_type(self) -> None:
        wf = translate_fal_hailuo("x", duration_s=5.0)
        assert any(n["class_type"] == "FAL_MiniMax_Hailuo" for n in wf.values())


# ---------------------------------------------------------------------------
# Audio translator tests
# ---------------------------------------------------------------------------


class TestElevenLabsTranslator:
    def test_includes_text_and_voice_id(self) -> None:
        wf = translate_elevenlabs_speech(
            text="Hello world", voice_id="voice-123"
        )
        tts = next(n for n in wf.values() if n["class_type"] == "ElevenLabs_TTS")
        assert tts["inputs"]["text"] == "Hello world"
        assert tts["inputs"]["voice_id"] == "voice-123"
        assert tts["inputs"]["model_id"] == "eleven_multilingual_v2"

    def test_voice_clone_workflow(self) -> None:
        wf = translate_elevenlabs_voice_clone(
            sample_audio_url="https://example.com/sample.mp3", voice_name="Alice"
        )
        clone = next(n for n in wf.values() if n["class_type"] == "ElevenLabs_VoiceClone")
        assert clone["inputs"]["voice_name"] == "Alice"


class TestStableAudioTranslator:
    def test_class_and_prompt(self) -> None:
        wf = translate_fal_stable_audio("ambient drone", duration_s=20.0)
        gen = next(n for n in wf.values() if n["class_type"] == "FAL_StableAudio_2")
        assert gen["inputs"]["prompt"] == "ambient drone"
        assert gen["inputs"]["duration"] == 20.0


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
        provider = ComfyUIVideoProvider(subtype="kling", client=client, job_id="job-1")
        result = await provider.generate(
            "a cat", duration_s=5.0, reference_image="ref.png"
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
        assert result.provider == "comfyui-kling"
        assert result.provider_job_id == "p1"

    async def test_mock_mode_skips_client(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")

        async def boom(*_a: Any, **_k: Any) -> str:
            raise AssertionError("client should not be called in mock mode")

        monkeypatch.setattr(_comfyui_runtime, "upload_bytes", boom)

        provider = ComfyUIVideoProvider(subtype="kling", client=None)
        result = await provider.generate("x", duration_s=5.0)
        assert result.video_url.startswith("s3://nucleus-media/fixtures/")
        assert result.metadata["mock"] is True

    @pytest.mark.parametrize(
        "subtype,expected_class",
        [
            ("kling", "FAL_Kling_V2_1_Master"),
            ("seedance", "FAL_Seedance_1_Pro"),
            ("veo", "FAL_Veo_3"),
            ("runway", "FAL_Runway_Gen4"),
            ("luma", "FAL_LumaDreamMachine"),
            ("hailuo", "FAL_MiniMax_Hailuo"),
        ],
    )
    async def test_subtype_dispatch(
        self,
        subtype: str,
        expected_class: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")

        async def fake_upload_bytes(key: str, data: bytes, content_type: str = "") -> str:
            return f"s3://nucleus-media/{key}"

        monkeypatch.setattr(_comfyui_runtime, "upload_bytes", fake_upload_bytes)
        client = StubComfyUIClient()
        provider = ComfyUIVideoProvider(subtype=subtype, client=client)  # type: ignore[arg-type]
        await provider.generate("prompt", duration_s=5.0)

        wf = client.submitted[0]
        class_types = {n["class_type"] for n in wf.values()}
        assert expected_class in class_types

    async def test_unknown_subtype_rejected(self) -> None:
        with pytest.raises(ValueError):
            ComfyUIVideoProvider(subtype="bogus")  # type: ignore[arg-type]

    @pytest.mark.parametrize(
        "subtype,expected",
        [
            ("kling", 0.084),
            ("seedance", 0.07),
            ("veo", 0.30),
            ("runway", 0.25),
            ("luma", 0.10),
            ("hailuo", 0.04),
        ],
    )
    def test_default_cost_rates(self, subtype: str, expected: float) -> None:
        # Ensure no env override is leaking in.
        env_var = f"COMFYUI_{subtype.upper()}_COST_PER_SECOND"
        os.environ.pop(env_var, None)
        provider = ComfyUIVideoProvider(subtype=subtype)  # type: ignore[arg-type]
        assert provider.cost_per_second == expected
        assert provider.estimate_cost(10.0) == round(expected * 10.0, 4)

    def test_cost_env_override(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("COMFYUI_KLING_COST_PER_SECOND", "0.5")
        provider = ComfyUIVideoProvider(subtype="kling")
        assert provider.cost_per_second == 0.5

    def test_extract_output_filename_handles_missing(self) -> None:
        with pytest.raises(RuntimeError):
            extract_output_filename({"p1": {"outputs": {}}}, "p1")


class TestComfyUIAudioProvider:
    async def test_elevenlabs_speech_roundtrip(
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

        client = StubComfyUIClient(filename="speech.mp3", payload=b"AUDIO")
        provider = ComfyUIAudioProvider(
            subtype="elevenlabs", client=client, job_id="job-7"
        )
        result = await provider.generate_speech(
            text="Hello there", voice_id="voice-xyz"
        )
        assert result.audio_url.startswith("s3://nucleus-media/jobs/job-7/raw/")
        assert result.audio_url.endswith(".mp3")
        assert uploads[0][2] == "audio/mpeg"
        wf = client.submitted[0]
        tts = next(n for n in wf.values() if n["class_type"] == "ElevenLabs_TTS")
        assert tts["inputs"]["text"] == "Hello there"
        assert tts["inputs"]["voice_id"] == "voice-xyz"

    async def test_stable_audio_music_roundtrip(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")

        async def fake_upload_bytes(key: str, data: bytes, content_type: str = "") -> str:
            return f"s3://nucleus-media/{key}"

        monkeypatch.setattr(_comfyui_runtime, "upload_bytes", fake_upload_bytes)

        client = StubComfyUIClient(filename="music.mp3", payload=b"AUDIO")
        provider = ComfyUIAudioProvider(
            subtype="stable_audio", client=client, job_id="j"
        )
        result = await provider.generate_music(
            prompt="ambient", duration_s=10.0, mood="calm"
        )
        assert result.audio_url.endswith(".mp3")
        wf = client.submitted[0]
        gen = next(n for n in wf.values() if n["class_type"] == "FAL_StableAudio_2")
        assert "ambient" in gen["inputs"]["prompt"]
        assert "calm" in gen["inputs"]["prompt"]

    async def test_mock_mode_short_circuits_speech(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")
        provider = ComfyUIAudioProvider(subtype="elevenlabs", client=None)
        result = await provider.generate_speech(text="x", voice_id="v")
        assert result.audio_url.startswith("s3://nucleus-media/fixtures/")

    async def test_mock_mode_short_circuits_music(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")
        provider = ComfyUIAudioProvider(subtype="stable_audio", client=None)
        result = await provider.generate_music("x", duration_s=5.0)
        assert result.audio_url.startswith("s3://nucleus-media/fixtures/")

    async def test_wrong_subtype_for_music_raises(self) -> None:
        provider = ComfyUIAudioProvider(
            subtype="elevenlabs", client=StubComfyUIClient()
        )
        with pytest.raises(RuntimeError):
            await provider.generate_music("x", duration_s=1.0)

    async def test_wrong_subtype_for_speech_raises(self) -> None:
        provider = ComfyUIAudioProvider(
            subtype="stable_audio", client=StubComfyUIClient()
        )
        with pytest.raises(RuntimeError):
            await provider.generate_speech("x", voice_id="v")

    def test_unknown_subtype_rejected(self) -> None:
        with pytest.raises(ValueError):
            ComfyUIAudioProvider(subtype="bogus")  # type: ignore[arg-type]

    def test_elevenlabs_cost_per_char(self) -> None:
        provider = ComfyUIAudioProvider(subtype="elevenlabs")
        # $0.06 per 1k chars → $0.006 for 100 chars.
        assert provider.estimate_cost(1000) == pytest.approx(0.06, abs=1e-4)

    def test_stable_audio_cost_per_second(self) -> None:
        provider = ComfyUIAudioProvider(subtype="stable_audio")
        assert provider.estimate_cost(10.0) == pytest.approx(0.2, abs=1e-4)


# ---------------------------------------------------------------------------
# Registry integration
# ---------------------------------------------------------------------------


class TestRegistryIntegration:
    def test_get_provider_resolves_bare_kling(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Bare ``"kling"`` must resolve to the ComfyUI proxy, not KlingVideoProvider."""
        monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
        from nucleus.providers import registry as registry_mod

        registry_mod.get_registry.cache_clear()
        try:
            from nucleus.providers import get_provider

            provider = get_provider("video", "kling")
            assert isinstance(provider, ComfyUIVideoProvider)
            assert provider.subtype == "kling"
        finally:
            registry_mod.get_registry.cache_clear()

    def test_get_provider_resolves_bare_seedance_to_comfyui(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
        from nucleus.providers import registry as registry_mod

        registry_mod.get_registry.cache_clear()
        try:
            from nucleus.providers import get_provider

            provider = get_provider("video", "seedance")
            assert isinstance(provider, ComfyUIVideoProvider)
            assert provider.subtype == "seedance"
        finally:
            registry_mod.get_registry.cache_clear()

    def test_get_provider_resolves_qualified_subtype(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
        from nucleus.providers import registry as registry_mod

        registry_mod.get_registry.cache_clear()
        try:
            from nucleus.providers import get_provider

            provider = get_provider("video", "video:veo")
            assert isinstance(provider, ComfyUIVideoProvider)
            assert provider.subtype == "veo"
        finally:
            registry_mod.get_registry.cache_clear()
