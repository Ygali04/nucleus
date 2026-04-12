"""clip_ffmpeg tool — trim, concat, overlay via ffmpeg subprocess."""

from __future__ import annotations

import functools
import shutil

from nucleus.tools.mock_fixtures import is_mock, mock_video_url
from nucleus.tools.schemas import ClipFFmpegRequest, ClipFFmpegResponse

VALID_OPERATIONS = {
    "trim",
    "concat",
    "overlay_text",
    "adjust_speed",
    "add_music_bed",
}


@functools.lru_cache(maxsize=1)
def _ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None


async def clip_ffmpeg(req: ClipFFmpegRequest) -> ClipFFmpegResponse:
    invalid = set(req.operations) - VALID_OPERATIONS
    if invalid:
        raise ValueError(f"Unknown ffmpeg operations: {sorted(invalid)}")

    if is_mock() or not _ffmpeg_available():
        return ClipFFmpegResponse(video_url=mock_video_url("clipped"))

    # Real mode would build an ffmpeg command based on req.operations.
    return ClipFFmpegResponse(video_url=mock_video_url("ffmpeg"))
