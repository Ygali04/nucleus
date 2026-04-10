# Nucleus — Concept Design Spec

- **Date:** 2026-04-09
- **Author:** Yahvin Gali (with Claude Opus 4.6)
- **Status:** Pitch site shipped for Friday meeting with Pritish Gupta (TruPeer co-founder)
- **Scope:** Nucleus as a concept doc — product, features, how it works, four archetypes, research foundation, competitive landscape, integration pattern, roadmap
- **Deferred:** Full engineering design docs (data schema, Celery tasks, tenant isolation, observability, CI/CD, compliance mapping, OSS stack evaluation, brand/logo, GTM packaging) — tracked in `docs/POST_MEETING_PLAN.md`

## What this spec is

This is the canonical design artifact per the Superpowers brainstorming skill. It points to the actual deliverable — the Nucleus mkdocs site rooted at `docs/index.md` in the same repo — and records the scoping decisions, the research inputs, and the assumptions the design rests on. Treat the mkdocs site as the *contents* of this spec; this file is the *header* that contextualizes them.

## Framing decision (revised during the session)

The first pass of the pitch site was built as a response to a specific founder ask (Pritish Gupta's WhatsApp messages from April 8). The user rejected that framing after seeing the draft and asked for a **Nucleus-first concept doc**: the product is front and center on every top-level page, incumbents are mentioned *relative to Nucleus* rather than the other way around, and TruPeer is present only on the `integration.md` page as the first design-partner tenant and in the appendix as a reference doc. The site was fully rewritten against this framing before the first commit.

Key structural changes from the rejected draft:
- `problem.md` removed; its content absorbed into `concept.md` as "the core insight" and into `foundation.md` as the research grounding.
- `product.md` split into `features.md` (capability surface, card-based) + `how-it-works.md` (mechanics) + `archetypes.md` (output classes).
- `architecture.md` split into `how-it-works.md` (loop, services, cost, pluggable analyzer) + `integration.md` (embed pattern, reuse map, extraction path, TruPeer as first tenant).
- `competitive-landscape.md` renamed to `landscape.md` and rewritten Nucleus-first.
- Visual aesthetic shifted from glass-morphism to clean white + indigo accent + card-based features to match trupeer.ai.

## Scoping decisions made during the brainstorming session

The user was asked three scope questions. Their answers shape everything the mkdocs site contains:

| Question | Answer | Implication |
|---|---|---|
| What do you need for the Friday meeting vs. longer-term artifact? | Polished pitch slice (Section 1 only) + comprehensive post-meeting plan + system prompt for future-me | Focus this session entirely on Section 1. Defer Sections 2–8. Produce `POST_MEETING_PLAN.md` and `NEXT_SESSION_PROMPT.md` as meta docs. |
| How should I handle TRIBE v2's CC BY-NC license for commercial use? | Assume a Meta FAIR commercial licensing deal is feasible (default). Design `AttentionProxyAnalyzer` fallback path in case that deal stalls. | The architecture page documents both paths. The pluggable analyzer interface is canonical. |
| Is Nucleus a standalone product, a TruPeer client deliverable, or a GlassRoom sub-product? | Built specifically for TruPeer as an internal product surface, but architected to be extractable as a multi-tenant product for other paying customers later | TruPeer-first framing across all pages. Multi-tenant considerations noted in architecture + roadmap. |
| Name? | Nucleus (from the proposed options) | All pages reference Nucleus, not ugc-peer or Striata or Thumbstop. |
| Pitch framing ratio? | 80% TruPeer-specific, 20% generalizable. Specifically: Nucleus becomes a service inside TruPeer's system such that TruPeer can serve multi-tenancy to its own customers | B2B2C framing: Nucleus → TruPeer → TruPeer's customers. |

## Inputs to the design

The design drew from three background research agents dispatched during the session. Their outputs landed in `research/`:

1. **`research/competitive-landscape.md`** — 7,000-word competitive analysis of 15+ AI video tools with a critical finding: no existing tool uses neuromarketing as a recursive feedback loop inside generation.
2. **`research/ugc-neuromarketing-intersection.md`** — 4,500-word brief linking UGC market growth, neuromarketing literature, TRIBE v2, and the gap opportunity.
3. **`research/trupeer-context.md`** — 8,000-word research pull on TruPeer's company, product surface, pain-point clusters, ICPs, keyword themes, and languages.

The TruPeer research was the most impactful — it completely reframed the pitch from "TikTok UGC factory for brand customers" (the initial read) to "persona × language multiplier for TruPeer's existing screen-recording asset base" (the correct read, grounded in TruPeer's own product positioning).

## Assumptions the design rests on

These are the load-bearing assumptions. If any of them turn out to be false, the pitch needs to be revisited.

1. **TruPeer's pain points are accurately represented by their own marketing copy.** The pitch leans heavily on direct quotes from TruPeer's use-case pages ("reps waste hours re-recording demos for every prospect", "localizing content means restarting production from scratch", etc.). If TruPeer's actual customer pain differs from what their marketing says, the pitch misses.
2. **Pritish will react to "ICP × language × platform" as the wedge, not to "recursive neuromarketing loop."** The research suggests TruPeer's customers care most about ICP personalization + localization. The neuromarketing angle is the moat but not the lead. The pitch is structured accordingly — problem page leads with the cross-product, product page introduces the loop as the mechanism.
3. **TRIBE v2 is technically capable of the scoring task Nucleus asks of it.** This is backed by the NeuroPeer spec, which already operates TRIBE v2 in production. But it's worth verifying that TRIBE v2's predictions on short-form UGC-style video (30-60s) are as accurate as its predictions on the longer-form content in its training distribution.
4. **TruPeer's existing HeyGen partnership is still active and can be leveraged without re-negotiation.** The pitch assumes Nucleus can call HeyGen through TruPeer's existing integration layer. If TruPeer's HeyGen partnership has lapsed or is limited in scope, this needs to be addressed before the MVP.
5. **The slice-scoring endpoint on NeuroPeer can be shipped in ~5 days.** This is the one upstream change Nucleus requires. If it takes longer, the cost economics of the loop degrade until it ships.
6. **TruPeer's SOC 2 / ISO 27001 / GDPR obligations can be inherited rather than re-certified separately.** Nucleus runs inside TruPeer's product shell, so customer data flows through TruPeer's compliance boundary. If Nucleus's architecture accidentally crosses that boundary (e.g., by calling external services that handle customer data without a BAA), the compliance story breaks.

## What Nucleus is NOT

Deliberately recording this so future-me doesn't drift:

- **Not a Descript competitor.** Descript is a long-form video editor for creators. Nucleus is a persona-variant factory inside a B2B SaaS tool. Different job-to-be-done.
- **Not a TikTok UGC creator tool.** Pritish's "UGC" word is a loose shorthand. Nucleus's actual customers (via TruPeer) are enterprise B2B SaaS teams producing product demos, sales enablement, training, customer success, and change-management content. TikTok Reels is one output surface, not the product category.
- **Not a HeyGen/Arcads replacement.** Those tools sit upstream of Nucleus for the avatar layer. Nucleus integrates them (via TruPeer's existing HeyGen partnership) and adds the recursive loop + Brand KB grounding on top.
- **Not a standalone SaaS.** V1 ships inside TruPeer's product shell. Multi-tenant extraction is an optional v2+ capability, not the primary architecture.
- **Not a greenfield rebuild.** Every major component already exists in the author's repos or as a reputable OSS project. The engineering budget is for wiring, not rebuilding.

## Success criteria for this spec

The spec is successful if, a week from now:

1. Pritish has reacted to the mkdocs site at the Friday meeting with a clear direction (fund, pivot, decline, or iterate)
2. Future-me can pick up `POST_MEETING_PLAN.md` + `NEXT_SESSION_PROMPT.md` in a new Claude Code session and resume without re-discovering context
3. The Nucleus repo has enough structure that the next session's implementation buildout (if approved) starts from a working baseline, not a blank directory

## References

- `docs/index.md` — entry point for the pitch site
- `docs/POST_MEETING_PLAN.md` — continuation plan for Sections 2–8
- `docs/NEXT_SESSION_PROMPT.md` — self-contained prompt for the next session
- `research/competitive-landscape.md` — unabridged competitor scan
- `research/ugc-neuromarketing-intersection.md` — unabridged UGC + neuro research
- `research/trupeer-context.md` — unabridged TruPeer research
- `/Users/yahvingali/video-brainscore/NEUROPEER_SPEC.md` — the existing NeuroPeer spec (scoring backend)
- `/Users/yahvingali/glassroom-edu/archs/neuroflix-architecture.md` — existing Neuroflix generator architecture
- `/Users/yahvingali/glassroom-edu/archs/deeptutor-architecture.md` — existing DeepTutor RAG architecture
- `/Users/yahvingali/glassroom-edu/archs/roto-architecture.md` — existing Roto video ingestion architecture
- `/Users/yahvingali/glassroom-edu/archs/ui-design-template.md` — existing design system
