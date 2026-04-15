"""generate_sop tool — produces a markdown SOP so a human could recreate the campaign.

Invoked by the strategist agent from the Delivery node alongside the GTM
guide. In mock mode we emit a deterministic markdown fixture.
"""

from __future__ import annotations

import os

from nucleus.tools.mock_fixtures import is_mock
from nucleus.tools.schemas import (
    GenerateSopRequest,
    GenerateSopResponse,
    StrategyVariant,
)

SYSTEM_PROMPT = (
    "Produce a standard operating procedure (SOP) document explaining how a "
    "human could recreate this campaign from scratch. Include the exact "
    "brand voice, ICP persona, winning prompts, edit primitives that "
    "worked, and tools used. Format as markdown."
)


def _winning_prompts(variants: list[StrategyVariant]) -> str:
    if not variants:
        return "- (none)\n"
    lines: list[str] = []
    for idx, v in enumerate(variants, 1):
        hint = v.archetype or "testimonial"
        lang = v.language or "en"
        lines.append(
            f"- **Variant {idx}** ({v.score:.1f}) — archetype=`{hint}`, "
            f"language=`{lang}`, url=`{v.video_url}`"
        )
    return "\n".join(lines) + "\n"


def _edits_log(iterations_log: list[dict]) -> str:
    if not iterations_log:
        return "- No edit primitives recorded — first-pass generation cleared threshold.\n"
    lines = []
    for entry in iterations_log:
        edit = entry.get("edit_type") or entry.get("edit")
        score = entry.get("score")
        if edit and score is not None:
            lines.append(f"- `{edit}` → score {float(score):.1f}")
        elif edit:
            lines.append(f"- `{edit}`")
    return ("\n".join(lines) + "\n") if lines else "- (none)\n"


def _mock_sop(req: GenerateSopRequest) -> GenerateSopResponse:
    brand = req.brand_name or req.brand_kb.get("name") or "the brand"
    voice = req.brand_kb.get("voice_tone") or ["confident", "warm", "direct"]
    if isinstance(voice, list):
        voice_line = ", ".join(str(x) for x in voice)
    else:
        voice_line = str(voice)
    persona = (
        req.icp.get("persona")
        or req.icp.get("name")
        or "Founder-led SaaS buyer, 28–45, growth-minded"
    )
    pain = req.icp.get("pain_point") or "needs proof before shipping budget"

    doc = (
        f"# Campaign SOP — {brand}\n\n"
        f"_Campaign ID: `{req.campaign_id}`_\n\n"
        "## 1. Brand Voice\n"
        f"- Tone: {voice_line}\n"
        f"- Read as: {brand}'s voice, never generic marketing copy.\n\n"
        "## 2. ICP Persona\n"
        f"- Persona: {persona}\n"
        f"- Pain point: {pain}\n\n"
        "## 3. Winning Variants\n"
        f"{_winning_prompts(req.variants)}\n"
        "## 4. Edit Primitives That Worked\n"
        f"{_edits_log(req.iterations_log)}\n"
        "## 5. Tools Used\n"
        "- `generate_video` — initial variant generation\n"
        "- `score_neuropeer` — neural evaluation per iteration\n"
        "- `edit_variant` — targeted fixes (hook, cut, music, pacing)\n"
        "- `generate_gtm_strategy` + `generate_sop` — delivery docs\n\n"
        "## 6. Repro Steps\n"
        "1. Seed the brief with the ICP persona and brand tone above.\n"
        "2. Generate 1 variant per archetype × ICP cell.\n"
        "3. Score with NeuroPeer; if under threshold, apply the lowest-"
        "dimension edit primitive and re-score.\n"
        "4. Stop on pass, max iterations, or monotone failure.\n"
        "5. Ship passing variants per the companion GTM guide.\n"
    )
    return GenerateSopResponse(sop_doc=doc)


async def generate_sop(req: GenerateSopRequest) -> GenerateSopResponse:
    """Produce an SOP document capturing the recipe for a delivered campaign."""
    if is_mock() or not os.environ.get("GLM_API_KEY"):
        return _mock_sop(req)
    # Live GLM path not wired yet — fall through to the same deterministic
    # fixture so shape + behaviour match the mock contract.
    return _mock_sop(req)
