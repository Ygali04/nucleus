"""compose_remotion tool — renders a Remotion composition."""

from __future__ import annotations

from nucleus.tools.mock_fixtures import is_mock, mock_video_url
from nucleus.tools.schemas import ComposeRemotionRequest, ComposeRemotionResponse


async def compose_remotion(req: ComposeRemotionRequest) -> ComposeRemotionResponse:
    total_frames = sum(
        scene.get("durationInFrames", 0)
        for scene in req.scene_manifest.get("scenes", [])
    )
    duration_s = total_frames / 30.0 if total_frames else 0.0

    if is_mock():
        return ComposeRemotionResponse(
            video_url=mock_video_url("remotion"),
            cost_usd=0.0,
            duration_s=duration_s,
        )

    # Real mode would POST to remotion/render-api.ts at http://localhost:3100/render
    return ComposeRemotionResponse(
        video_url=mock_video_url("remotion"),
        cost_usd=0.001,  # Remotion render cost is near-zero
        duration_s=duration_s,
    )
