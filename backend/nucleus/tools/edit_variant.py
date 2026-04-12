"""edit_variant tool — applies a targeted edit to a candidate variant."""

from __future__ import annotations

from uuid import uuid4

from nucleus.tools.mock_fixtures import is_mock, mock_video_url
from nucleus.tools.schemas import EditVariantRequest, EditVariantResponse

VALID_EDIT_TYPES = {
    "hook_rewrite",
    "cut_tightening",
    "music_swap",
    "pacing_change",
    "narration_rewrite",
    "visual_substitution",
    "caption_emphasis",
    "icp_reanchor",
}

# Rough cost estimate per edit type in USD.
EDIT_COST: dict[str, float] = {
    "hook_rewrite": 0.15,
    "cut_tightening": 0.02,
    "music_swap": 0.04,
    "pacing_change": 0.03,
    "narration_rewrite": 0.08,
    "visual_substitution": 0.25,
    "caption_emphasis": 0.01,
    "icp_reanchor": 0.10,
}


async def edit_variant(req: EditVariantRequest) -> EditVariantResponse:
    if req.edit_type not in VALID_EDIT_TYPES:
        raise ValueError(
            f"Unknown edit_type: {req.edit_type}. Valid: {sorted(VALID_EDIT_TYPES)}"
        )

    cost = 0.0 if is_mock() else EDIT_COST.get(req.edit_type, 0.05)

    return EditVariantResponse(
        new_iteration_id=str(uuid4()),
        video_url=mock_video_url(f"edit-{req.edit_type}"),
        cost_usd=cost,
        edit_applied=req.edit_type,
    )
