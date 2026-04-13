"""clip_ffmpeg tool - trim, concat, overlay via ffmpeg subprocess.

In mock mode (``NUCLEUS_MOCK_PROVIDERS=true``, the default), this returns a
synthetic ``s3://`` URL without touching the filesystem. In real mode, it
downloads the source video, runs ffmpeg via ``asyncio.create_subprocess_exec``,
uploads the result, and returns a storage URI.

Supported operations (each reads its settings from ``req.params[<op>]``
except for ``trim``, which also honours top-level ``start_s``/``end_s``):

* ``trim``          - uses top-level ``start_s``/``end_s``
* ``concat``        - ``{additional_urls: list[str]}``
* ``overlay_text``  - ``{text, start_s, end_s, position}``
* ``adjust_speed``  - ``{speed_factor}``
* ``add_music_bed`` - ``{music_url, volume_db}``
"""

from __future__ import annotations

import asyncio
import functools
import logging
import shutil
import uuid
from pathlib import Path
from urllib.parse import urlparse

import httpx

from nucleus.tools._ffmpeg_commands import (
    build_add_music_bed_cmd,
    build_adjust_speed_cmd,
    build_concat_cmd,
    build_concat_list_file,
    build_ffprobe_has_audio_cmd,
    build_overlay_text_cmd,
    build_trim_cmd,
)
from nucleus.tools.mock_fixtures import is_mock, mock_video_url
from nucleus.tools.schemas import ClipFFmpegRequest, ClipFFmpegResponse

log = logging.getLogger(__name__)

VALID_OPERATIONS = {
    "trim",
    "concat",
    "overlay_text",
    "adjust_speed",
    "add_music_bed",
}

_TMP_ROOT = Path("/tmp/nucleus")


class FFmpegError(RuntimeError):
    """Raised when an ffmpeg invocation returns a non-zero exit code."""

    def __init__(self, returncode: int, stderr: str, argv: list[str] | None = None):
        self.returncode = returncode
        self.stderr = stderr
        self.argv = argv or []
        cmd = " ".join(argv) if argv else "ffmpeg"
        super().__init__(
            f"{cmd} exited with code {returncode}: {stderr.strip()[:500]}"
        )


@functools.lru_cache(maxsize=1)
def _ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None


async def clip_ffmpeg(req: ClipFFmpegRequest) -> ClipFFmpegResponse:
    invalid = set(req.operations) - VALID_OPERATIONS
    if invalid:
        raise ValueError(f"Unknown ffmpeg operations: {sorted(invalid)}")

    if is_mock() or not _ffmpeg_available():
        return ClipFFmpegResponse(video_url=mock_video_url("clipped"))

    if not req.operations:
        raise ValueError("At least one operation is required in real mode")

    workdir = _TMP_ROOT / uuid.uuid4().hex
    workdir.mkdir(parents=True, exist_ok=True)
    try:
        current = await _download_to_tmp(req.input_url, workdir, name="input")
        for idx, op in enumerate(req.operations):
            op_params = req.params.get(op, {})
            output = workdir / f"step_{idx}_{op}.mp4"
            current = await _run_operation(
                op, current, output, req, op_params, workdir
            )
        return ClipFFmpegResponse(video_url=await _upload_result(current))
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


# ----------------------------------------------------------------------
# Operation dispatch
# ----------------------------------------------------------------------


async def _run_operation(
    op: str,
    input_path: Path,
    output_path: Path,
    req: ClipFFmpegRequest,
    op_params: dict,
    workdir: Path,
) -> Path:
    if op == "trim":
        argv = build_trim_cmd(
            input_path,
            output_path,
            op_params.get("start_s", req.start_s),
            op_params.get("end_s", req.end_s),
        )
    elif op == "concat":
        extras = op_params.get("additional_urls") or []
        # Download concat inputs in parallel - they're independent.
        extra_paths = await asyncio.gather(
            *(
                _download_to_tmp(url, workdir, name=f"concat_{i}")
                for i, url in enumerate(extras)
            )
        )
        paths = [input_path, *extra_paths]
        list_file = workdir / "concat_list.txt"
        list_file.write_text(build_concat_list_file(paths))
        argv = build_concat_cmd(list_file, output_path)
    elif op == "overlay_text":
        argv = build_overlay_text_cmd(
            input_path,
            output_path,
            text=op_params["text"],
            start_s=op_params.get("start_s", 0.0),
            end_s=op_params.get("end_s", 3.0),
            position=op_params.get("position", "bottom"),
        )
    elif op == "adjust_speed":
        has_audio = await _probe_has_audio(input_path)
        argv = build_adjust_speed_cmd(
            input_path,
            output_path,
            speed_factor=float(op_params["speed_factor"]),
            has_audio=has_audio,
        )
    elif op == "add_music_bed":
        music_path = await _download_to_tmp(
            op_params["music_url"], workdir, name="music"
        )
        argv = build_add_music_bed_cmd(
            input_path,
            music_path,
            output_path,
            volume_db=float(op_params.get("volume_db", 0.0)),
        )
    else:  # pragma: no cover - validated above
        raise ValueError(f"Unhandled operation: {op}")

    await _run_ffmpeg(argv)
    return output_path


# ----------------------------------------------------------------------
# Subprocess helpers
# ----------------------------------------------------------------------


async def _run_ffmpeg(argv: list[str]) -> None:
    """Run argv and raise FFmpegError on non-zero exit code."""
    log.debug("ffmpeg argv: %s", argv)
    proc = await asyncio.create_subprocess_exec(
        *argv,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise FFmpegError(
            proc.returncode or -1, stderr.decode(errors="replace"), argv
        )


async def _probe_has_audio(path: Path) -> bool:
    argv = build_ffprobe_has_audio_cmd(path)
    proc = await asyncio.create_subprocess_exec(
        *argv,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, _ = await proc.communicate()
    return b"audio" in stdout


# ----------------------------------------------------------------------
# I/O helpers
# ----------------------------------------------------------------------


async def _download_to_tmp(url: str, workdir: Path, name: str) -> Path:
    """Materialize ``url`` into ``workdir`` and return the local path.

    Supports ``file://``, ``http(s)://``. ``s3://`` is not yet wired - swap
    for the storage util once WU-C lands.
    """
    parsed = urlparse(url)
    scheme = parsed.scheme.lower()

    suffix = Path(parsed.path).suffix or ".mp4"
    dest = workdir / f"{name}{suffix}"

    if scheme in ("", "file"):
        src = Path(parsed.path if scheme == "file" else url)
        shutil.copy(src, dest)
        return dest

    if scheme in ("http", "https"):
        async with httpx.AsyncClient(
            timeout=60.0, follow_redirects=True
        ) as client:
            async with client.stream("GET", url) as resp:
                resp.raise_for_status()
                with dest.open("wb") as f:
                    async for chunk in resp.aiter_bytes():
                        f.write(chunk)
        return dest

    if scheme == "s3":
        # TODO(WU-C): swap for real storage util once merged.
        raise NotImplementedError(
            "s3:// download requires the storage util from WU-C"
        )

    raise ValueError(f"Unsupported URL scheme: {scheme}")


async def _upload_result(local_path: Path) -> str:
    """Persist the final output outside the ephemeral workdir.

    TODO(WU-C): replace with the real storage util that uploads to s3 and
    returns an ``s3://`` URI. For now we copy into ``/tmp/nucleus`` and
    return a ``file://`` URI so callers can still locate the artifact.
    """
    _TMP_ROOT.mkdir(parents=True, exist_ok=True)
    final = _TMP_ROOT / f"out_{uuid.uuid4().hex}{local_path.suffix}"
    shutil.copy(local_path, final)
    return f"file://{final}"
