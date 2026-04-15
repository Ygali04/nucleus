"""generate_gtm_strategy tool — invoked by the strategist agent on the Delivery node.

Given a set of scored variants plus their NeuroPeer reports, produces a
GTM strategy guide (per-variant ICP/platform/time-slot recommendations +
3 overarching campaign insights) and a short strategy summary.

In mock mode (``NUCLEUS_MOCK_PROVIDERS=true`` or no GLM key set) we emit a
deterministic markdown fixture so the UI can be demo'd end-to-end without
reaching a live model.
"""

from __future__ import annotations

import os

from nucleus.tools.mock_fixtures import is_mock
from nucleus.tools.schemas import (
    GenerateGtmStrategyRequest,
    GenerateGtmStrategyResponse,
    StrategyVariant,
)

SYSTEM_PROMPT = (
    "You are a GTM strategist. Below are N successful variants with their "
    "NeuroPeer neural reports. For each, recommend which platform + "
    "time-slot + audience to run it against, and why — citing specific "
    "metrics. Then provide 3 overarching campaign insights."
)


def _platform_recommendation(variant: StrategyVariant, idx: int) -> str:
    platforms = ["TikTok", "Instagram Reels", "YouTube Shorts"]
    timeslots = ["weekday evenings 6–9pm", "weekend mornings 9–11am", "late-night 10pm–midnight"]
    platform = variant.platform or platforms[idx % len(platforms)]
    timeslot = timeslots[idx % len(timeslots)]
    audience = variant.icp or "founder-led SaaS buyers"
    breakdown = variant.report.get("breakdown") if isinstance(variant.report, dict) else {}
    hook = breakdown.get("hook_score") if isinstance(breakdown, dict) else None
    emo = breakdown.get("emotional_resonance") if isinstance(breakdown, dict) else None
    reason_bits: list[str] = []
    if hook is not None:
        reason_bits.append(f"hook_score={hook:.1f}")
    if emo is not None:
        reason_bits.append(f"emotional_resonance={emo:.1f}")
    reason_bits.append(f"neural={variant.score:.1f}")
    reasoning = ", ".join(reason_bits)
    return (
        f"### Variant {idx + 1} — score {variant.score:.1f}\n"
        f"- **Platform:** {platform}\n"
        f"- **Time-slot:** {timeslot}\n"
        f"- **Audience:** {audience}\n"
        f"- **Why:** {reasoning}. Deliver this variant first because its "
        f"metrics are strongest in those dimensions.\n"
        f"- **Artifact:** {variant.video_url}\n"
    )


def _mock_gtm(req: GenerateGtmStrategyRequest) -> GenerateGtmStrategyResponse:
    brand = req.brand_name or "the brand"
    variants = req.variants
    if not variants:
        guide = (
            f"# GTM Strategy Guide — {brand}\n\n"
            "_No passing variants were supplied. Re-run the loop with a "
            "lower threshold or more iterations before shipping._\n"
        )
        return GenerateGtmStrategyResponse(
            gtm_guide=guide,
            strategy_summary="No variants delivered.",
        )

    top = max(variants, key=lambda v: v.score)
    body = "\n".join(_platform_recommendation(v, i) for i, v in enumerate(variants))
    insights = (
        "## Overarching Campaign Insights\n\n"
        "1. **Lead with the strongest hook.** Variant "
        f"{1 + variants.index(top)} ({top.score:.1f}) should launch first — "
        "its NAcc activation is carrying the campaign.\n"
        "2. **Sequence by platform fit.** Short-form TikTok cuts drive reach; "
        "Reels + Shorts are the compounders. Run them in that order across "
        "the first 72 hours.\n"
        "3. **Retire monotone variants fast.** If any variant's neural score "
        "doesn't clear the threshold inside 3 iterations, drop it and "
        "reallocate the budget to the top performer.\n"
    )
    guide = (
        f"# GTM Strategy Guide — {brand}\n\n"
        f"{len(variants)} variant(s) cleared scoring. Highest neural score: "
        f"{top.score:.1f}.\n\n"
        "## Per-Variant Recommendations\n\n"
        f"{body}\n"
        f"{insights}"
    )
    summary = (
        f"{len(variants)} variants shipped. Highest: {top.score:.1f}. "
        "Launch top variant on TikTok first; sequence Reels + Shorts "
        "over the next 72h."
    )
    return GenerateGtmStrategyResponse(gtm_guide=guide, strategy_summary=summary)


async def generate_gtm_strategy(
    req: GenerateGtmStrategyRequest,
) -> GenerateGtmStrategyResponse:
    """Produce a GTM strategy guide for a delivered campaign."""
    # Mock mode (or missing GLM key) → deterministic fixture the UI can render.
    if is_mock() or not os.environ.get("GLM_API_KEY"):
        return _mock_gtm(req)

    # Real-model path would POST to GLM-4.7-flash here. Until that credential
    # is wired, we fall through to the mock — behaviour stays demo-able in
    # every environment and the shape of the response is unchanged.
    return _mock_gtm(req)
