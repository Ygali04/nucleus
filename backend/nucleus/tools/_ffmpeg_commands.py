"""Pure argv builders for ffmpeg operations.

Each function returns a ``list[str]`` suitable for passing to
``asyncio.create_subprocess_exec(*argv, ...)``. No subprocess calls are made
here - this module only constructs commands and is trivially unit-testable
without the ffmpeg binary installed.
"""

from __future__ import annotations

from pathlib import Path

# Positions for overlay_text (maps to drawtext y-expression).
_DRAWTEXT_Y_EXPR = {
    "top": "h*0.1",
    "center": "(h-text_h)/2",
    "bottom": "h-text_h-h*0.1",
}


def escape_drawtext(text: str) -> str:
    """Escape a string for use inside ffmpeg's drawtext ``text=`` option.

    We produce a value safe to drop into ``text='<value>'`` in a filtergraph
    string. ffmpeg's filter parser does two passes:

    1. Filtergraph-level: ``,``, ``;``, ``[``, ``]``, ``'``, and ``\\`` are
       meta. Single-quoting disables ``,`` and ``;`` splitting but a literal
       ``'`` still needs to close and reopen the quotes (``'\\''``).
    2. drawtext-level: inside the resulting value, ``:`` and ``%`` are meta
       and must be backslash-escaped.
    """
    out = text.replace("\\", "\\\\")
    out = out.replace(":", "\\:")
    out = out.replace("%", "\\%")
    # Close-escape-reopen pattern so a literal apostrophe survives both
    # passes without prematurely closing the outer single-quoted string.
    out = out.replace("'", "'\\''")
    return out


def build_trim_cmd(
    input_path: str | Path,
    output_path: str | Path,
    start_s: float,
    end_s: float,
) -> list[str]:
    """Trim ``input`` from ``start_s`` to ``end_s`` with stream copy."""
    if end_s <= start_s:
        raise ValueError(f"end_s ({end_s}) must be greater than start_s ({start_s})")
    return [
        "ffmpeg",
        "-y",
        "-ss",
        f"{start_s}",
        "-to",
        f"{end_s}",
        "-i",
        str(input_path),
        "-c",
        "copy",
        str(output_path),
    ]


def build_concat_cmd(
    list_file_path: str | Path,
    output_path: str | Path,
) -> list[str]:
    """Concat via the demuxer using a pre-written list file."""
    return [
        "ffmpeg",
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(list_file_path),
        "-c",
        "copy",
        str(output_path),
    ]


def build_concat_list_file(paths: list[str | Path]) -> str:
    """Return contents of a concat demuxer list file for the given paths.

    ffmpeg's concat demuxer needs single-quoted paths with ``'`` escaped as
    ``'\\''`` (shell-style). We keep this helper pure - the caller writes the
    string to disk.
    """
    lines = []
    for p in paths:
        safe = str(p).replace("'", "'\\''")
        lines.append(f"file '{safe}'")
    return "\n".join(lines) + "\n"


def build_overlay_text_cmd(
    input_path: str | Path,
    output_path: str | Path,
    text: str,
    start_s: float,
    end_s: float,
    position: str = "bottom",
    fontsize: int = 48,
    fontcolor: str = "white",
) -> list[str]:
    """Burn ``text`` onto the video between ``start_s`` and ``end_s``."""
    if position not in _DRAWTEXT_Y_EXPR:
        raise ValueError(
            f"position must be one of {sorted(_DRAWTEXT_Y_EXPR)}, got {position!r}"
        )
    if end_s <= start_s:
        raise ValueError(f"end_s ({end_s}) must be greater than start_s ({start_s})")

    y_expr = _DRAWTEXT_Y_EXPR[position]
    escaped = escape_drawtext(text)
    # NOTE: commas inside the ``enable`` expression must be backslash-escaped
    # so the top-level filtergraph parser doesn't treat them as filter
    # separators. Single quotes alone are not enough for this parser.
    enable_expr = f"between(t\\,{start_s}\\,{end_s})"
    drawtext = (
        f"drawtext=text='{escaped}'"
        f":fontsize={fontsize}"
        f":fontcolor={fontcolor}"
        f":x=(w-text_w)/2"
        f":y={y_expr}"
        f":enable={enable_expr}"
    )
    return [
        "ffmpeg",
        "-y",
        "-i",
        str(input_path),
        "-vf",
        drawtext,
        "-codec:a",
        "copy",
        str(output_path),
    ]


def build_adjust_speed_cmd(
    input_path: str | Path,
    output_path: str | Path,
    speed_factor: float,
    has_audio: bool = True,
) -> list[str]:
    """Change playback speed. ``speed_factor > 1`` speeds up, ``< 1`` slows.

    atempo only accepts factors in [0.5, 100.0]; for extreme values, chain
    multiple atempo filters. We support the common 0.5..2.0 range directly.
    """
    if speed_factor <= 0:
        raise ValueError(f"speed_factor must be > 0, got {speed_factor}")

    video_pts = f"[0:v]setpts={1 / speed_factor}*PTS[v]"

    if has_audio:
        audio_chain = _atempo_chain(speed_factor)
        filter_complex = f"{video_pts};[0:a]{audio_chain}[a]"
        return [
            "ffmpeg",
            "-y",
            "-i",
            str(input_path),
            "-filter_complex",
            filter_complex,
            "-map",
            "[v]",
            "-map",
            "[a]",
            str(output_path),
        ]

    return [
        "ffmpeg",
        "-y",
        "-i",
        str(input_path),
        "-filter_complex",
        video_pts,
        "-map",
        "[v]",
        str(output_path),
    ]


def _atempo_chain(speed: float) -> str:
    """Chain atempo filters so the net speed change equals ``speed``.

    atempo's valid range is [0.5, 100]. For speeds outside [0.5, 2.0] we
    chain multiple stages (most common case: 2x slow-mo -> 0.5 * 0.5 = 0.25).
    """
    remaining = speed
    parts: list[str] = []
    while remaining > 2.0:
        parts.append("atempo=2.0")
        remaining /= 2.0
    while remaining < 0.5:
        parts.append("atempo=0.5")
        remaining /= 0.5
    parts.append(f"atempo={remaining}")
    return ",".join(parts)


def build_add_music_bed_cmd(
    video_path: str | Path,
    music_path: str | Path,
    output_path: str | Path,
    volume_db: float,
) -> list[str]:
    """Mix a music bed into the video at ``volume_db`` gain, duration=video."""
    filter_complex = (
        f"[1:a]volume={volume_db}dB[a1];"
        f"[0:a][a1]amix=inputs=2:duration=first:dropout_transition=0[aout]"
    )
    return [
        "ffmpeg",
        "-y",
        "-i",
        str(video_path),
        "-i",
        str(music_path),
        "-filter_complex",
        filter_complex,
        "-map",
        "0:v",
        "-map",
        "[aout]",
        "-c:v",
        "copy",
        str(output_path),
    ]


def build_ffprobe_duration_cmd(input_path: str | Path) -> list[str]:
    """ffprobe argv that prints the container duration in seconds."""
    return [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        str(input_path),
    ]


def build_ffprobe_has_audio_cmd(input_path: str | Path) -> list[str]:
    """ffprobe argv that prints ``audio`` if an audio stream exists."""
    return [
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "a",
        "-show_entries",
        "stream=codec_type",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        str(input_path),
    ]
