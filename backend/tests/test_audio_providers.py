"""Tests for ElevenLabs and Lyria audio providers (mock mode)."""

from __future__ import annotations

import os

import pytest

from nucleus.providers.elevenlabs_provider import AudioProvider, ElevenLabsProvider
from nucleus.providers.lyria import LyriaProvider, MusicProvider


# ── Fixtures ──────────────────────────────────────────────────────────────────


@pytest.fixture(autouse=True)
def mock_mode():
    """Ensure all provider calls use mock mode during tests."""
    os.environ["NUCLEUS_MOCK_PROVIDERS"] = "true"
    yield
    os.environ.pop("NUCLEUS_MOCK_PROVIDERS", None)


# ── Protocol conformance ─────────────────────────────────────────────────────


def test_elevenlabs_satisfies_audio_provider_protocol():
    assert isinstance(ElevenLabsProvider(), AudioProvider)


def test_lyria_satisfies_music_provider_protocol():
    assert isinstance(LyriaProvider(), MusicProvider)


# ── ElevenLabs TTS ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_elevenlabs_speech():
    provider = ElevenLabsProvider()
    result = await provider.generate_speech("Hello, this is a test.", "voice-123", "en")
    assert result.provider == "elevenlabs"
    assert result.cost_usd > 0
    assert result.duration_s > 0
    assert result.audio_url == "s3://mock/speech.mp3"


@pytest.mark.asyncio
async def test_elevenlabs_speech_duration_scales_with_text():
    provider = ElevenLabsProvider()
    short = await provider.generate_speech("Hi", "v1")
    long = await provider.generate_speech("Hi " * 100, "v1")
    assert long.duration_s > short.duration_s


# ── ElevenLabs cost estimation ────────────────────────────────────────────────


def test_elevenlabs_cost_1k_chars():
    provider = ElevenLabsProvider()
    assert provider.estimate_cost(1000) == pytest.approx(0.06)


def test_elevenlabs_cost_5k_chars():
    provider = ElevenLabsProvider()
    assert provider.estimate_cost(5000) == pytest.approx(0.30)


def test_elevenlabs_cost_zero():
    provider = ElevenLabsProvider()
    assert provider.estimate_cost(0) == pytest.approx(0.0)


# ── ElevenLabs voice cloning ─────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_elevenlabs_clone_voice():
    provider = ElevenLabsProvider()
    voice_id = await provider.clone_voice(
        "Test Voice", "https://example.com/sample.mp3"
    )
    assert voice_id.startswith("mock-voice-")


# ── Lyria music generation ───────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_lyria_music():
    provider = LyriaProvider()
    result = await provider.generate_music(
        "Upbeat corporate music", 30.0, "energetic"
    )
    assert result.provider == "lyria"
    assert result.cost_usd == pytest.approx(0.06, abs=0.01)
    assert result.duration_s == 30.0
    assert result.audio_url == "s3://mock/music.mp3"


@pytest.mark.asyncio
async def test_lyria_music_short_clip():
    provider = LyriaProvider()
    result = await provider.generate_music("Ambient pad", 5.0)
    assert result.duration_s == 5.0
    assert result.cost_usd == pytest.approx(0.01)


# ── Lyria cost estimation ────────────────────────────────────────────────────


def test_lyria_cost_30s():
    provider = LyriaProvider()
    assert provider.estimate_cost(30.0) == pytest.approx(0.06)


def test_lyria_cost_zero():
    provider = LyriaProvider()
    assert provider.estimate_cost(0.0) == pytest.approx(0.0)
