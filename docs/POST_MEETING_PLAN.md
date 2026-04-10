# Post-Meeting Continuation Plan

This document exists so that after Friday's meeting with Pritish, future-me (or the author, or a collaborator) can pick up the Nucleus design work without re-discovering context. It enumerates every piece of the full 8-section mkdocs site that was *deliberately deferred* from the first session in order to ship a tight pitch-grade slice for the meeting.

Read this alongside [NEXT_SESSION_PROMPT.md](NEXT_SESSION_PROMPT.md) — that file is the self-contained prompt to start a new Claude Code session with. This file is the project plan.

## What the pitch site contains (shipped Apr 9, 2026)

- [x] `mkdocs.yml` with Material theme, Nucleus-branded indigo palette, clean TruPeer-aligned aesthetic
- [x] `docs/stylesheets/extra.css` — custom styling: white backgrounds, indigo accent, card-based features, no glass morphism
- [x] `docs/index.md` — hero page: "Brand knowledge in, neuro-scored video out" + 6 feature cards + loop diagram + why-now cards
- [x] `docs/concept.md` — what Nucleus is, what it's not, the core insight, what's novel, who uses it
- [x] `docs/features.md` — full feature surface organized as Ingest / Generate / Deliver, card-based
- [x] `docs/how-it-works.md` — mechanical view: loop, state machine, services, step-by-step, continuous scoring, throughput, cost model, pluggable analyzer
- [x] `docs/archetypes.md` — four output archetypes (demo, marketing, knowledge, education) with stacks, use cases, scoring weights
- [x] `docs/foundation.md` — UGC market evidence + neuromarketing literature + full academic spine with DOIs
- [x] `docs/landscape.md` — Descript deep-dive + competitor table + positioning map + whitespace + at-risk incumbents
- [x] `docs/integration.md` — integration pattern, tenant UX, service reuse map, TruPeer as first design partner, cost model, extraction path
- [x] `docs/roadmap.md` — MVP / v1 / v2 with dates, deliverables, risks, success criteria
- [x] `docs/appendix/ugc-primer.md` — UGC research condensed
- [x] `docs/appendix/neuromarketing-primer.md` — Academic citations with DOIs + TRIBE v2 + AIM framework
- [x] `docs/appendix/trupeer-keywords.md` — TruPeer company snapshot, ICPs, pain clusters, pricing, languages (reference doc, not pitch front matter)
- [x] `research/competitive-landscape.md` — unabridged competitive research
- [x] `research/ugc-neuromarketing-intersection.md` — unabridged UGC + neuro research
- [x] `research/trupeer-context.md` — unabridged TruPeer research
- [x] This plan
- [x] `NEXT_SESSION_PROMPT.md`

**Pages deliberately removed from the previous draft** because the
pitch site is now a **concept doc for Nucleus front and center**, not
a response to a specific founder ask:

- ~~`docs/problem.md`~~ — removed. Problem framing absorbed into
  `concept.md` as "the core insight" and into `foundation.md` as the
  research grounding.
- ~~`docs/product.md`~~ — replaced by `features.md` + `how-it-works.md`
  + `archetypes.md`, which present Nucleus as a product with a feature
  surface instead of as a response to a specific ask.
- ~~`docs/architecture.md`~~ — replaced by `how-it-works.md` (mechanics
  + loop + cost) and `integration.md` (reuse map + embed pattern).
- ~~`docs/competitive-landscape.md`~~ — renamed to `docs/landscape.md`
  and reframed Nucleus-first (what Nucleus does that incumbents don't,
  not how Nucleus responds to the market).

## What's explicitly deferred to post-meeting

The full product spec was decomposed into 8 sections. The pitch slice covers Section 1 (vision & positioning) deeply. Sections 2–8 are deferred:

### Section 2 — Full system design doc

The pitch slice has an **architecture teaser**. The full design doc needs:

- [ ] Complete database schema — jobs, brands, briefs, variants, iterations, scores, reports, strategy guides, doc deltas, tenants, Brand KBs, usage metering
- [ ] Full Celery task breakdown with retry policies, error handling, dead-letter queues
- [ ] Tenant isolation model (row-level security in Postgres, per-tenant S3 prefixes, per-tenant Redis namespaces)
- [ ] Authentication + authorization model inside TruPeer's product shell (handoff pattern, token exchange, session continuity)
- [ ] Observability stack (Sentry / OpenTelemetry / Grafana for metrics, Loki for logs, Tempo for traces, per-tenant dashboards)
- [ ] CI/CD pipeline for Railway + Vercel deploys (Nucleus repo structure, GitHub Actions workflow, preview environments per PR)
- [ ] Secret management (Doppler vs Railway secrets vs 1Password for CI)
- [ ] Security model (PII handling, brand KB encryption at rest, video retention windows, right-to-delete pipeline, SOC2 mapping — TruPeer has SOC 2, Nucleus inherits the obligation)
- [ ] Rate limiting + quota enforcement per TruPeer tenant
- [ ] Full data-flow diagrams for each archetype
- [ ] State machine diagram for the loop orchestrator
- [ ] Failure-mode catalog (what breaks, how it surfaces, how it recovers)

### Section 3 — OSS video editor / timeline evaluation

The product page mentions Remotion as the default composition layer. A fuller evaluation is needed:

- [ ] Matrix of OSS video composition options: Remotion, Revideo, Editly, Shotstack (hosted OSS), Auto-Editor, Olive, Kdenlive, DaVinci Resolve (API)
- [ ] Trade-off analysis for each: determinism, render speed, template expressiveness, brand flexibility, licensing, hosting cost
- [ ] Decision doc: why Remotion wins for Nucleus + what Manim/Mermaid add for knowledge/education archetypes
- [ ] In-frame agentic editing: design doc for the post-v2 "click on an element in the video, prompt the edit" UX (the user's specific product insight from the Descript notes)
- [ ] Timeline-free editor design: the author's thesis that the entire right-hand toolbar can be collapsed in favor of chat-first + in-frame selection; decide whether this lands in v2 or v3

### Section 4 — Video generation stack evaluation

The product page names specific generation tools. A fuller evaluation:

- [ ] Diffusion video provider matrix: Veo 3.1 vs Seedance vs Sora 2 vs Pika 2.2 vs Luma Ray 3 vs Runway Gen-4 — quality, cost/clip, latency, API reliability, brand safety, watermarking
- [ ] Avatar provider matrix: HeyGen (partnership) vs Tavus vs D-ID vs Synthesia (enterprise) — per use case
- [ ] Voice provider matrix: ElevenLabs (IVC incumbent) vs Cartesia vs PlayHT vs Bark — per language, per archetype
- [ ] Music provider matrix: Google Lyria vs Udio vs Suno vs Mubert vs curated library — licensing, brand safety, prompt responsiveness
- [ ] Decision doc per archetype with specific provider choices

### Section 5 — Brand KB ingestion + research pipeline

The product uses DeepTutor as the RAG backbone but the full design isn't written:

- [ ] Brand KB schema: what docs, what metadata, what vector store, what embedding model, what chunking strategy
- [ ] Ingestion pipeline design: TruPeer blog crawler, Notion connector, Google Drive connector, Confluence connector, arbitrary PDF upload, auto-refresh cadence
- [ ] RAG query pattern inside the generator: retrieval-augmented script generation, persona-specific retrieval, multi-hop retrieval for education archetype
- [ ] TruPeer MCP server integration: TruPeer already ships `api.trupeer.ai/mcp` with `search_knowledge_base` + `answer_query_from_knowledge_base` — Nucleus can call this directly for TruPeer customers who already have a TruPeer KB populated
- [ ] DeepTutor research pipeline (multi-agent deep research) as the education-archetype back end

### Section 6 — Brand identity, naming, design system

Pitch slice locked the name as Nucleus. Full brand system is deferred:

- [ ] Name rationale doc (why Nucleus, alternatives considered, trademark check)
- [ ] Logo concepts (minimum viable: text treatment + mark)
- [ ] Color system adaptation of "Tempered Glass over Warm Light" for Nucleus (probably keep the glass morphism + shift primary to a brain-evoking blue, retain the Dawn Magenta accent as the Nucleus highlight)
- [ ] Typography: keep Inter + Space Grotesk + JetBrains Mono
- [ ] Component library: inherit from ManimStudio design system
- [ ] Motion language: the ambient orbs + glass shine + pulse-ring animations
- [ ] In-product brand placement inside TruPeer — how Nucleus feels like a native TruPeer capability without losing its own identity
- [ ] Marketing site treatment (post-extraction)

### Section 7 — TruPeer keyword / pain-point / ICP index

The pitch slice has the pain-point clusters and keyword themes. The post-meeting work expands this into an operational reference:

- [ ] Full keyword inventory per theme (target: 500+ keywords with pain-point tags, ICP tags, language tags)
- [ ] ICP persona library: 15–30 canonical personas that Nucleus briefs default to, each with pain points, typical objections, preferred content format, preferred language
- [ ] Blog post → archetype mapping: which of TruPeer's 180+ blog posts becomes which Nucleus archetype input
- [ ] Keyword cluster → variant count projection: "if TruPeer's customer targets cluster X, what's the Nucleus output volume?"
- [ ] Competitor keyword overlap: where TruPeer ranks vs where Nucleus could extend them

### Section 8 — Go-to-market + packaging

- [ ] Pricing model: Enterprise add-on vs per-variant metered vs credit-parity; proposal with unit economics
- [ ] Packaging: starter / growth / enterprise tiers with specific variant limits per month
- [ ] Positioning inside TruPeer's product: where Nucleus shows up in the UI, how it's discovered by existing customers, upsell triggers
- [ ] Launch sequence: design partner (first paid customer) → private beta (5 customers) → GA
- [ ] Case-study template: what does a TruPeer customer success story look like for Nucleus; which metrics matter (variant volume, cost savings, neural score improvement, in-market lift)
- [ ] Reference customer identification: Glean, LambdaTest, Zuora, Siigo — which is the best fit for the first Nucleus deployment
- [ ] TruPeer sales + CS enablement: how do TruPeer's own account teams sell Nucleus
- [ ] Partner ecosystem: who else plugs into Nucleus (e.g., HeyGen partnership extended, Consensus partnership extended)

## Deferred technical build tasks (post-meeting, separate from docs)

These are not documentation — they are implementation. Kept here so they don't get forgotten.

- [ ] Create the actual `ugc-peer` repo structure (backend/, frontend/, docs/ already exists)
- [ ] Scaffold FastAPI service (reuse NeuroPeer's structure)
- [ ] Port Neuroflix Director agent to Python / FastAPI
- [ ] Slice-scoring endpoint on NeuroPeer (the one upstream change)
- [ ] DeepTutor tenant-isolation refactor
- [ ] Remotion template library for Nucleus archetypes
- [ ] Railway deployment config (docker-compose.yml, Dockerfile, .env.example)
- [ ] First integration test: end-to-end brief → scored variant

## Deferred research agents to dispatch in the next session

The first session dispatched three background research agents (competitive landscape, UGC + neuro intersection, TruPeer context). The next session should dispatch these:

1. **OSS video composition deep-dive** — Remotion vs Revideo vs Editly vs Shotstack vs Auto-Editor — feature matrix, render benchmarks, licensing, community health
2. **Diffusion video API deep-dive** — Veo 3.1, Seedance, Sora 2, Pika 2.2, Luma Ray 3, Runway Gen-4 — pricing per clip, quality samples, API reliability, brand-safety guarantees, watermarking rules
3. **Compliance / legal deep-dive** — TRIBE v2 CC BY-NC implications in detail, Meta FAIR licensing process, FTC synthetic-testimonial rules, EU AI Act video labeling, SOC2 inheritance from TruPeer, GDPR for brand KB storage
4. **Pricing / packaging benchmarks** — How Tavus, HeyGen, Arcads, Descript, Opus Clip price enterprise add-ons, what per-variant or per-minute economics the market supports, reference points for Nucleus's own pricing proposal

## Open questions to resolve post-meeting

Questions the first session could not answer without Pritish's input. Any of these may come up in Friday's meeting and shape the next session:

1. **Does TruPeer already have a neuromarketing angle in its roadmap, or is Nucleus introducing this concept fresh?** If fresh, the pitch needs to educate before it sells. The appendix is structured to support either.
2. **What's Pritish's comfort with a "TruPeer × Nucleus" co-brand vs. a pure TruPeer feature?** The pitch assumes Nucleus shows up as a capability inside TruPeer, but there's a version where it's a co-marketed sub-brand (like "TruPeer × Consensus" on the demos page).
3. **What's TruPeer's tolerance for the CC BY-NC license dependency?** If they want immediate commercial deployment, the `AttentionProxyAnalyzer` fallback goes on the critical path from day one.
4. **Who is the design-partner customer for the MVP?** The pitch suggests Glean, LambdaTest, Zuora, or Siigo — but Pritish will have the real answer.
5. **What's the margin split?** Nucleus provides the engine; TruPeer provides the distribution and customer relationship. The economic split (rev share, per-variant fee, flat licensing) is a negotiation the pitch deliberately does not pre-empt.
6. **Does TruPeer want Nucleus inside `api.trupeer.ai` as a new sub-route, or in a separate Railway service that TruPeer proxies to?** Deployment topology choice.
7. **What's the timeline pressure from Pritish's side?** The pitch proposes a 6-week v1. If Pritish wants it in 3 weeks, archetypes get cut; if he's patient, v2 items can move into v1.

## What "done" looks like for the full mkdocs site

When the post-meeting buildout is complete, the site will have these sections that don't exist today:

- `docs/design/` — full system design docs (one page per subsystem)
- `docs/stack/` — OSS and provider evaluation docs
- `docs/brand/` — naming, design system, visual identity
- `docs/keywords/` — expanded keyword / ICP / pain-point index
- `docs/gtm/` — pricing, packaging, launch, case studies
- `docs/compliance/` — security, legal, license, SOC2 mapping
- `docs/runbooks/` — operational playbooks for customers and for TruPeer's support team
- `docs/api/` — OpenAPI reference for the Nucleus API

And an actual codebase in `backend/`, `frontend/`, and `worker/` directories.

## How to resume

Open `NEXT_SESSION_PROMPT.md` and paste its contents into a new Claude Code session. That prompt contains everything a fresh Claude instance needs to pick up where this one left off — the context, the constraints, the scope, and the exact files to read first.
