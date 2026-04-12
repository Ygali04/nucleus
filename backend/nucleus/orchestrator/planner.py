"""Brief expansion into candidate specs."""

from __future__ import annotations

from itertools import product

from nucleus.models import BriefRequest, CandidateSpec


def expand_brief(brief: BriefRequest, job_id: str) -> list[CandidateSpec]:
    """Expand ICP x language x platform x archetype x variants_per_cell
    into a flat list of candidate specs."""
    return [
        CandidateSpec(
            job_id=job_id,
            icp=icp,
            language=lang,
            platform=platform,
            archetype=archetype,
            variant_index=variant_idx,
            score_threshold=brief.score_threshold,
            max_iterations=brief.max_iterations,
            cost_ceiling=brief.cost_ceiling,
            source_url=brief.source_url,
        )
        for icp, lang, platform, archetype, variant_idx in product(
            brief.icps,
            brief.languages,
            brief.platforms,
            brief.archetypes,
            range(brief.variants_per_cell),
        )
    ]
