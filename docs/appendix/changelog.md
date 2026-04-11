# Changelog

Documentation and content changelog for the Nucleus concept site.

## 2026-04-10 — Comprehensive build-out

The pitch-slice site from April 9 is expanded into a full
concept-and-engineering documentation site.

### Added

**Design section** (11 pages):
- Data model, orchestrator, state machine, tenant isolation,
  authentication, observability, CI/CD, security, rate limiting,
  dataflow, failure modes.

**Stack section** (5 pages):
- Composition layer evaluation (Remotion vs alternatives)
- Diffusion video provider evaluation (15+ providers)
- Avatar, voice, music provider evaluation (30+ tools)
- Per-archetype stack decisions

**Ingestion section** (6 pages):
- Brand KB schema and data model
- Connector catalog (PDF, URL, Notion, Confluence, Drive, MCP)
- RAG query pattern
- TruPeer MCP integration
- Multi-agent research pipeline (for the education archetype)

**Brand section** (5 pages):
- Naming rationale and shortlist
- Visual identity (color, typography, shape, iconography)
- Voice and tone guide
- In-product brand pattern

**GTM section** (6 pages):
- Pricing (tiered + per-variant metering)
- Packaging
- Launch sequence (design partner → private beta → GA)
- Case study template
- Sales enablement playbook

**Compliance section** (7 pages):
- TRIBE v2 license analysis (CC BY-NC 4.0)
- FTC synthetic testimonials rule
- EU AI Act Article 50
- SOC 2 inheritance model
- GDPR handling
- Output IP and likeness rights

**Research section** (9 pages):
- TRIBE v2 deep dive
- Alternative models survey
- Benchmark datasets
- Evaluation methodology
- Benchmarks (Algonauts, Brain-Score, UGC-Brain-Score)
- Honest gaps
- Research roadmap (projects, papers, partnerships,
  conferences, OSS)
- Internal experiments (N-AB-1 through N-TECH-5)
- Fallback path (`AttentionProxyAnalyzer`)

**Runbooks section** (8 pages):
- Tenant onboarding
- Incident response
- Cost monitoring
- Provider failure
- Stuck job recovery
- Brand KB ingestion operations
- Tenant deletion

**Appendix**:
- Glossary (~100 terms)
- Canonical ICP library (24 personas across functional roles)
- This changelog

### Changed

- The site structure now has 8 top-level sections plus an
  appendix, organized around reader intent rather than document
  chronology.
- `POST_MEETING_PLAN.md` items for Sections 2–8 are now complete.
  The plan is updated to reflect what's been built vs what's
  still deferred.

### Research additions

- 5 additional research briefs in `/research/`:
  - `stack-composition.md` (OSS video composition deep dive)
  - `stack-diffusion-video.md` (15 diffusion video provider eval)
  - `stack-avatar-voice-music.md` (30+ avatar/voice/music tools)
  - `compliance-legal.md` (full compliance legal analysis)
  - `neuro-models-and-benchmarks.md` (neuro R&D deep research)

### Total scope

- **60+ documentation pages** added in a single session
- **~60,000 words** of new content across all sections
- **Every section** includes tables, diagrams, and cited sources
- **The research section** adds 13+ academic citations with DOIs
  for the neuroforecasting literature and the TRIBE v2 papers

## 2026-04-09 — Initial pitch slice

The first version of the Nucleus concept site, shipped for a
Friday meeting with Pritish Gupta (TruPeer co-founder).

### Added

- Hero home page
- Concept page (what Nucleus is and isn't)
- Features page (card-based capability surface)
- How-it-works page (loop mechanics, cost model, pluggable
  analyzer teaser)
- Archetypes page (demo, marketing, knowledge, education)
- Foundation page (UGC market evidence + 13 neuroforecasting
  citations)
- Competitive landscape page (Descript deep dive + 14
  competitors + positioning map)
- Integration page (TruPeer as first design partner)
- Roadmap page (MVP → v1 → v2)
- Appendix: UGC primer, neuromarketing primer, TruPeer context
- Post-meeting plan (Sections 2–8 deferred work)
- Next-session prompt (for continuing the work)
- Custom TruPeer-aligned aesthetic (indigo palette, card-based
  features, no glass morphism)

### Research collected

- `competitive-landscape.md` (15+ competitor scan)
- `ugc-neuromarketing-intersection.md` (market + academic brief)
- `trupeer-context.md` (company research pull with direct quotes)

### Deployment

- Repo created at `github.com/Ygali04/nucleus`
- GitHub Pages deployment via GitHub Actions workflow
- Site live at `https://ygali04.github.io/nucleus/`

## Older entries

None — this is a new project.

## How this changelog is maintained

Every material change to the mkdocs site is recorded here. The
format follows [Keep a Changelog](https://keepachangelog.com/)
with Added / Changed / Deprecated / Removed / Fixed sections.

Minor typo fixes and formatting cleanups are not recorded here —
only structural changes, new pages, significant content
additions, and deletions.

The changelog is updated by whoever makes the change, as part of
the same commit that makes it. PR reviews check that the
changelog has been updated for material changes.
