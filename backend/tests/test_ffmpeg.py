"""Integration tests that invoke the real ffmpeg binary.

Skipped cleanly if ``ffmpeg``/``ffprobe`` are not on PATH.
"""

from __future__ import annotations

import asyncio
import os
import shutil
from pathlib import Path

import pytest

# Force real mode (not mock) for these tests - they drive actual ffmpeg.
os.environ["NUCLEUS_MOCK_PROVIDERS"] = "false"

from nucleus.tools._ffmpeg_commands import (
    build_add_music_bed_cmd,
    build_adjust_speed_cmd,
    build_concat_cmd,
    build_concat_list_file,
    build_ffprobe_duration_cmd,
    build_overlay_text_cmd,
    build_trim_cmd,
)
from nucleus.tools.clip_ffmpeg import clip_ffmpeg
from nucleus.tools.schemas import ClipFFmpegRequest

pytestmark = pytest.mark.skipif(
    shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None,
    reason="ffmpeg/ffprobe not available on PATH",
)

FIXTURE_DIR = Path(__file__).parent / "fixtures"
TEST_MP4 = FIXTURE_DIR / "test.mp4"
TEST_AV_MP4 = FIXTURE_DIR / "test_av.mp4"
TEST_MUSIC = FIXTURE_DIR / "test_music.mp3"


async def _run(argv: list[str]) -> tuple[int, bytes, bytes]:
    proc = await asyncio.create_subprocess_exec(
        *argv,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()
    return proc.returncode or 0, stdout, stderr


async def _probe_duration(path: Path) -> float:
    rc, stdout, stderr = await _run(build_ffprobe_duration_cmd(path))
    assert rc == 0, stderr.decode()
    return float(stdout.strip())


# ----------------------------------------------------------------------
# Builder-level integration (argv -> real ffmpeg)
# ----------------------------------------------------------------------


async def test_trim_produces_shorter_video(tmp_path: Path) -> None:
    out = tmp_path / "trim.mp4"
    argv = build_trim_cmd(TEST_MP4, out, 0.0, 0.5)
    rc, _, stderr = await _run(argv)
    assert rc == 0, stderr.decode()
    assert out.exists() and out.stat().st_size > 0
    duration = await _probe_duration(out)
    assert duration <= 0.75


async def test_concat_produces_doubled_duration(tmp_path: Path) -> None:
    list_file = tmp_path / "list.txt"
    list_file.write_text(build_concat_list_file([TEST_MP4, TEST_MP4]))
    out = tmp_path / "concat.mp4"
    rc, _, stderr = await _run(build_concat_cmd(list_file, out))
    assert rc == 0, stderr.decode()
    duration = await _probe_duration(out)
    original = await _probe_duration(TEST_MP4)
    assert duration == pytest.approx(2 * original, abs=0.2)


async def test_overlay_text_produces_valid_video(tmp_path: Path) -> None:
    out = tmp_path / "overlay.mp4"
    argv = build_overlay_text_cmd(
        TEST_MP4, out, "Hello", 0.0, 1.0, position="bottom"
    )
    rc, _, stderr = await _run(argv)
    assert rc == 0, stderr.decode()
    assert out.exists() and out.stat().st_size > 0
    duration = await _probe_duration(out)
    original = await _probe_duration(TEST_MP4)
    assert duration == pytest.approx(original, abs=0.2)


async def test_overlay_text_escapes_special_chars(tmp_path: Path) -> None:
    out = tmp_path / "overlay_colon.mp4"
    argv = build_overlay_text_cmd(
        TEST_MP4, out, "it's 1:30", 0.0, 1.0, position="center"
    )
    rc, _, stderr = await _run(argv)
    assert rc == 0, stderr.decode()


async def test_adjust_speed_halves_duration(tmp_path: Path) -> None:
    out = tmp_path / "fast.mp4"
    argv = build_adjust_speed_cmd(TEST_MP4, out, 2.0, has_audio=False)
    rc, _, stderr = await _run(argv)
    assert rc == 0, stderr.decode()
    duration = await _probe_duration(out)
    original = await _probe_duration(TEST_MP4)
    assert duration == pytest.approx(original / 2, abs=0.15)


async def test_add_music_bed_preserves_video_duration(tmp_path: Path) -> None:
    if not TEST_AV_MP4.exists() or not TEST_MUSIC.exists():
        pytest.skip("audio fixtures missing")
    out = tmp_path / "music.mp4"
    argv = build_add_music_bed_cmd(TEST_AV_MP4, TEST_MUSIC, out, -12.0)
    rc, _, stderr = await _run(argv)
    assert rc == 0, stderr.decode()
    duration = await _probe_duration(out)
    original = await _probe_duration(TEST_AV_MP4)
    assert duration == pytest.approx(original, abs=0.2)


# ----------------------------------------------------------------------
# End-to-end coroutine tests
# ----------------------------------------------------------------------


async def test_clip_ffmpeg_trim_end_to_end(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
    req = ClipFFmpegRequest(
        input_url=f"file://{TEST_MP4}",
        start_s=0.0,
        end_s=0.5,
        operations=["trim"],
    )
    resp = await clip_ffmpeg(req)
    assert resp.video_url.startswith("file:///tmp/nucleus/out_")
    local = Path(resp.video_url.removeprefix("file://"))
    try:
        assert local.exists() and local.stat().st_size > 0
    finally:
        local.unlink(missing_ok=True)


async def test_clip_ffmpeg_overlay_end_to_end(
    tmp_path: Path, monkeypatch
) -> None:
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "false")
    req = ClipFFmpegRequest(
        input_url=f"file://{TEST_MP4}",
        operations=["overlay_text"],
        params={
            "overlay_text": {
                "text": "Nucleus",
                "start_s": 0.0,
                "end_s": 1.0,
                "position": "bottom",
            }
        },
    )
    resp = await clip_ffmpeg(req)
    local = Path(resp.video_url.removeprefix("file://"))
    try:
        assert local.exists() and local.stat().st_size > 0
    finally:
        local.unlink(missing_ok=True)


async def test_clip_ffmpeg_mock_mode_returns_mock_url(monkeypatch) -> None:
    monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", "true")
    req = ClipFFmpegRequest(
        input_url="s3://nucleus-mock/input.mp4",
        operations=["trim"],
        start_s=0.0,
        end_s=1.0,
    )
    resp = await clip_ffmpeg(req)
    assert resp.video_url.startswith("s3://nucleus-mock/")


async def test_clip_ffmpeg_rejects_unknown_op() -> None:
    req = ClipFFmpegRequest(
        input_url="s3://nucleus-mock/x.mp4", operations=["flipflop"]
    )
    with pytest.raises(ValueError, match="Unknown ffmpeg operations"):
        await clip_ffmpeg(req)
