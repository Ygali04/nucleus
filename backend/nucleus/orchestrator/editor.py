"""Edit decision logic — picks the most impactful edit primitive."""

from __future__ import annotations

from nucleus.models import EditType, ScoreBreakdown


def pick_edit(breakdown: ScoreBreakdown) -> EditType:
    """Choose the edit that addresses the weakest scoring dimension.

    If the attention curve shows a sharp drop (>15-point fall between
    consecutive windows), *cut_tightening* is preferred regardless of
    the per-dimension minimum because a mid-video attention cliff usually
    dominates the composite score.
    """
    # Check for sharp attention-curve drop first.
    curve = breakdown.attention_curve
    if len(curve) >= 2:
        for i in range(1, len(curve)):
            if curve[i - 1] - curve[i] > 15:
                return EditType.CUT_TIGHTENING

    # Otherwise, pick the dimension with the lowest sub-score.
    dimension_map: list[tuple[float, EditType]] = [
        (breakdown.hook_score, EditType.HOOK_REWRITE),
        (breakdown.emotional_resonance, EditType.MUSIC_SWAP),
        (breakdown.cognitive_accessibility, EditType.PACING_CHANGE),
        (breakdown.memory_encoding, EditType.CAPTION_EMPHASIS),
        (breakdown.aesthetic_quality, EditType.VISUAL_SUBSTITUTION),
    ]

    _, best_edit = min(dimension_map, key=lambda pair: pair[0])
    return best_edit
