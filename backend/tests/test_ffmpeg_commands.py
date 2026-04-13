"""Unit tests for the pure argv builders in _ffmpeg_commands.

These run without the ffmpeg binary installed - they only assert the shape
of the argv list returned by each builder.
"""

from __future__ import annotations

import pytest

from nucleus.tools._ffmpeg_commands import (
    _atempo_chain,
    build_add_music_bed_cmd,
    build_adjust_speed_cmd,
    build_concat_cmd,
    build_concat_list_file,
    build_ffprobe_duration_cmd,
    build_ffprobe_has_audio_cmd,
    build_overlay_text_cmd,
    build_trim_cmd,
    escape_drawtext,
)


# ----------------------------------------------------------------------
# escape_drawtext
# ----------------------------------------------------------------------


class TestEscapeDrawText:
    def test_plain_text_unchanged(self) -> None:
        assert escape_drawtext("hello world") == "hello world"

    def test_escapes_colon(self) -> None:
        assert escape_drawtext("1:30") == "1\\:30"

    def test_escapes_apostrophe(self) -> None:
        # Close-escape-reopen so the outer single-quoted string stays valid.
        assert escape_drawtext("it's") == "it'\\''s"

    def test_escapes_percent(self) -> None:
        assert escape_drawtext("100%") == "100\\%"

    def test_escapes_backslash(self) -> None:
        assert escape_drawtext("a\\b") == "a\\\\b"

    def test_escapes_combo(self) -> None:
        # backslash first so it doesn't double-escape the others
        assert escape_drawtext("a:b'c%d\\e") == "a\\:b'\\''c\\%d\\\\e"


# ----------------------------------------------------------------------
# trim
# ----------------------------------------------------------------------


class TestTrim:
    def test_argv_exact(self) -> None:
        argv = build_trim_cmd("in.mp4", "out.mp4", 0.0, 2.5)
        assert argv == [
            "ffmpeg",
            "-y",
            "-ss",
            "0.0",
            "-to",
            "2.5",
            "-i",
            "in.mp4",
            "-c",
            "copy",
            "out.mp4",
        ]

    def test_rejects_bad_range(self) -> None:
        with pytest.raises(ValueError, match="end_s"):
            build_trim_cmd("in.mp4", "out.mp4", 5.0, 5.0)

    def test_accepts_pathlib(self, tmp_path) -> None:
        argv = build_trim_cmd(tmp_path / "in.mp4", tmp_path / "out.mp4", 0, 1)
        assert argv[7] == str(tmp_path / "in.mp4")
        assert argv[-1] == str(tmp_path / "out.mp4")


# ----------------------------------------------------------------------
# concat
# ----------------------------------------------------------------------


class TestConcat:
    def test_argv_exact(self) -> None:
        argv = build_concat_cmd("list.txt", "out.mp4")
        assert argv == [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            "list.txt",
            "-c",
            "copy",
            "out.mp4",
        ]

    def test_list_file_basic(self) -> None:
        body = build_concat_list_file(["/tmp/a.mp4", "/tmp/b.mp4"])
        assert body == "file '/tmp/a.mp4'\nfile '/tmp/b.mp4'\n"

    def test_list_file_escapes_quote(self) -> None:
        body = build_concat_list_file(["/tmp/it's.mp4"])
        assert body == "file '/tmp/it'\\''s.mp4'\n"


# ----------------------------------------------------------------------
# overlay_text
# ----------------------------------------------------------------------


class TestOverlayText:
    def test_bottom_position(self) -> None:
        argv = build_overlay_text_cmd(
            "in.mp4", "out.mp4", "Hi", 0.0, 2.0, position="bottom"
        )
        assert argv[0] == "ffmpeg"
        assert argv[1] == "-y"
        assert argv[2] == "-i"
        assert argv[3] == "in.mp4"
        assert argv[4] == "-vf"
        assert "drawtext=text='Hi'" in argv[5]
        assert "y=h-text_h-h*0.1" in argv[5]
        # commas in the enable expression are backslash-escaped to survive
        # the top-level filtergraph parser.
        assert "enable=between(t\\,0.0\\,2.0)" in argv[5]
        assert argv[-1] == "out.mp4"

    def test_top_position(self) -> None:
        argv = build_overlay_text_cmd(
            "in.mp4", "out.mp4", "Hi", 0, 1, position="top"
        )
        assert "y=h*0.1" in argv[5]

    def test_center_position(self) -> None:
        argv = build_overlay_text_cmd(
            "in.mp4", "out.mp4", "Hi", 0, 1, position="center"
        )
        assert "y=(h-text_h)/2" in argv[5]

    def test_escapes_text(self) -> None:
        argv = build_overlay_text_cmd(
            "in.mp4", "out.mp4", "time: 1:30", 0, 1
        )
        assert "drawtext=text='time\\: 1\\:30'" in argv[5]

    def test_invalid_position(self) -> None:
        with pytest.raises(ValueError, match="position"):
            build_overlay_text_cmd(
                "in.mp4", "out.mp4", "Hi", 0, 1, position="middle"
            )

    def test_invalid_range(self) -> None:
        with pytest.raises(ValueError, match="end_s"):
            build_overlay_text_cmd("in.mp4", "out.mp4", "Hi", 2, 1)


# ----------------------------------------------------------------------
# adjust_speed
# ----------------------------------------------------------------------


class TestAdjustSpeed:
    def test_speed_up_with_audio(self) -> None:
        argv = build_adjust_speed_cmd("in.mp4", "out.mp4", 2.0, has_audio=True)
        assert argv == [
            "ffmpeg",
            "-y",
            "-i",
            "in.mp4",
            "-filter_complex",
            "[0:v]setpts=0.5*PTS[v];[0:a]atempo=2.0[a]",
            "-map",
            "[v]",
            "-map",
            "[a]",
            "out.mp4",
        ]

    def test_slow_down_with_audio(self) -> None:
        argv = build_adjust_speed_cmd("in.mp4", "out.mp4", 0.5, has_audio=True)
        assert argv[5] == "[0:v]setpts=2.0*PTS[v];[0:a]atempo=0.5[a]"

    def test_no_audio(self) -> None:
        argv = build_adjust_speed_cmd("in.mp4", "out.mp4", 2.0, has_audio=False)
        assert argv == [
            "ffmpeg",
            "-y",
            "-i",
            "in.mp4",
            "-filter_complex",
            "[0:v]setpts=0.5*PTS[v]",
            "-map",
            "[v]",
            "out.mp4",
        ]

    def test_zero_speed_rejected(self) -> None:
        with pytest.raises(ValueError, match="speed_factor"):
            build_adjust_speed_cmd("in.mp4", "out.mp4", 0.0)

    def test_atempo_chain_inside_range(self) -> None:
        assert _atempo_chain(1.5) == "atempo=1.5"
        assert _atempo_chain(0.75) == "atempo=0.75"

    def test_atempo_chain_extreme_fast(self) -> None:
        # 4.0 = 2.0 * 2.0
        assert _atempo_chain(4.0) == "atempo=2.0,atempo=2.0"

    def test_atempo_chain_extreme_slow(self) -> None:
        # 0.25 = 0.5 * 0.5
        assert _atempo_chain(0.25) == "atempo=0.5,atempo=0.5"


# ----------------------------------------------------------------------
# add_music_bed
# ----------------------------------------------------------------------


class TestAddMusicBed:
    def test_argv_exact(self) -> None:
        argv = build_add_music_bed_cmd("v.mp4", "m.mp3", "out.mp4", -10.0)
        assert argv == [
            "ffmpeg",
            "-y",
            "-i",
            "v.mp4",
            "-i",
            "m.mp3",
            "-filter_complex",
            "[1:a]volume=-10.0dB[a1];"
            "[0:a][a1]amix=inputs=2:duration=first:dropout_transition=0[aout]",
            "-map",
            "0:v",
            "-map",
            "[aout]",
            "-c:v",
            "copy",
            "out.mp4",
        ]


# ----------------------------------------------------------------------
# ffprobe builders
# ----------------------------------------------------------------------


class TestFFprobeBuilders:
    def test_duration_argv(self) -> None:
        argv = build_ffprobe_duration_cmd("in.mp4")
        assert argv[0] == "ffprobe"
        assert "format=duration" in argv
        assert argv[-1] == "in.mp4"

    def test_has_audio_argv(self) -> None:
        argv = build_ffprobe_has_audio_cmd("in.mp4")
        assert argv[0] == "ffprobe"
        assert "a" in argv  # select_streams audio
        assert "stream=codec_type" in argv
        assert argv[-1] == "in.mp4"
