# Features

Nucleus's feature surface is organized around the three things the engine
actually does: **ingest a brand**, **generate and score variants in a
closed loop**, and **deliver results a human can act on**. Everything below
is a concrete capability, not a marketing line.

## Ingest

### Brand knowledge ingestion

Nucleus builds a tenant-scoped **Brand Knowledge Base** for every brand it
serves. The KB is the single source of truth the generator agent is
grounded against — every script, every voiceover, every scene selection,
every editor rewrite flows through it.

<div class="grid cards" markdown>

-   :material-file-document-multiple:{ .lg .middle } __Multi-format ingestion__

    ---

    PDFs, markdown, docx, HTML, plain text, transcripts, URLs, Notion
    exports, Confluence exports, sitemap crawls. Each document is parsed,
    chunked, embedded, and indexed into a LightRAG or LlamaIndex store.

-   :material-source-branch:{ .lg .middle } __Connectors__

    ---

    Direct connectors for the sources a brand actually uses: marketing
    site, blog, product docs, Notion workspace, Google Drive, Confluence,
    GitHub README + wiki, TruPeer's own MCP server for customers already
    on the TruPeer stack.

-   :material-update:{ .lg .middle } __Incremental updates__

    ---

    When a source document changes, only the affected chunks re-embed.
    Every generation call reads the current state of the KB — product
    updates propagate into the next variant job without a full re-ingest.

-   :material-tag-multiple:{ .lg .middle } __Semantic tagging__

    ---

    Documents are auto-tagged with ICP relevance, pain-point cluster,
    language, content type, and freshness. The generator uses the tags to
    pull the right context for a given brief instead of dumping everything
    into the prompt.

</div>

### Source footage ingestion

Nucleus treats existing brand video as raw material, not as a starting
point to replace.

<div class="grid cards" markdown>

-   :material-video:{ .lg .middle } __Recording ingest__

    ---

    Accepts any brand-owned video: product demos, screen recordings,
    founder interviews, customer testimonials, existing UGC. Uses
    yt-dlp + ffmpeg for the download step; falls back through multiple
    extraction strategies for auth-walled sources.

-   :material-timeline-text:{ .lg .middle } __Word-level transcript__

    ---

    Every ingested video is transcribed with word-level timestamps via
    faster-whisper or ElevenLabs Scribe. Transcripts feed the segment
    selector and the Brand KB simultaneously.

-   :material-vector-polyline:{ .lg .middle } __Semantic segment index__

    ---

    Video segments are embedded with a video-text model (Twelve Labs
    Marengo or equivalent) so the generator can query "find the 8-second
    segment where the founder explains X" by intent, not by keyword.

</div>

### Brand Kit reuse

Nucleus does not ask the brand to re-define its visual identity. It
consumes the Brand Kit that already exists in the host product.

<div class="grid cards" markdown>

-   :material-palette:{ .lg .middle } __Logos, colors, intros, outros__

    ---

    Pulled directly from the host's existing Brand Kit object. Applied
    deterministically during the Remotion composition pass.

-   :material-microphone-settings:{ .lg .middle } __Cloned voices__

    ---

    Existing ElevenLabs IVC voice clones are reused. No new onboarding
    step for the customer — if a voice was good enough for the host's
    existing product, it's good enough for a Nucleus variant.

-   :material-book-open-page-variant:{ .lg .middle } __Glossary & pronunciations__

    ---

    The custom glossary and pronunciation dictionary carry over. Brand
    terms, product names, technical acronyms — all spoken the way the
    brand wants them spoken.

</div>

## Generate

### Persona variant generation

The generator is an agentic pipeline that composes a candidate variant
from the brief, the Brand KB, and the source footage.

<div class="grid cards" markdown>

-   :material-account-group-outline:{ .lg .middle } __ICP-targeted scripting__

    ---

    Every script is rewritten per ICP using Brand KB context. The generator
    selects pain points from the KB that match the target persona, rewrites
    hooks in language that persona actually uses, and adjusts CTAs to the
    persona's buying stage.

-   :material-translate-variant:{ .lg .middle } __Language fan-out__

    ---

    One script template generates 65+ language variants through the host's
    existing translation infrastructure. Auto-resyncs pacing to the target
    language's natural cadence.

-   :material-format-list-bulleted-square:{ .lg .middle } __Cross-product expansion__

    ---

    A single brief expands into the full ICP × language × platform × archetype
    space. A typical brief (10 ICPs × 10 languages × 3 platforms × 2
    archetypes) produces up to 600 candidate variants, of which the engine
    delivers the top-scoring ~20 per (ICP, language) cell.

-   :material-image-multiple-outline:{ .lg .middle } __Hybrid generation stack__

    ---

    Deterministic composition via Remotion for known layouts; diffusion
    (Veo 3.1 / Seedance / Sora 2) for atmospheric B-roll; HeyGen or Tavus
    for avatar talking heads; ElevenLabs for voice; Lyria for music. Each
    layer is pluggable behind a single provider interface.

</div>

### Hybrid generation stack

The generation pipeline deliberately mixes deterministic composition with
diffusion. Most persona variance is deterministic (known layouts, known
text, known intros/outros) and should be produced by code — fast, cheap,
consistent. The narrow slices where generative models add real value
(atmospheric B-roll, character shots, transitions) get the diffusion
budget.

| Layer | Tool | Why |
|---|---|---|
| Deterministic composition | Remotion | Programmatic React video. Same input → same output. CPU-rendered. ~Zero marginal cost per variant. |
| Diffusion B-roll | Veo 3.1 / Seedance / Sora 2 / Pika / Luma Ray 3 | Pluggable behind a single provider interface. Switch per-cost or per-quality. |
| Avatars | HeyGen (default) or Tavus (conversational) or Synthesia (enterprise) | Reuses the host's existing partnerships where possible. |
| Voice | ElevenLabs IVC (default) | Reuses existing cloned voices from the host's Brand Kit. |
| Music | Google Lyria | Subtle beds per archetype; optional. |
| Diagrams | Mermaid + Manim | Reserved for knowledge and education archetypes. |

### Deterministic composition

Remotion is the workhorse of Nucleus because 80% of persona variance is
deterministic. For every archetype, Nucleus maintains a library of
Remotion templates. A variant is produced by filling slots in a template
with brand-specific content, not by generating pixels from scratch. This
is what makes 100 variants/day financially viable.

<div class="grid cards" markdown>

-   :material-vector-square:{ .lg .middle } __Template library per archetype__

    ---

    Each of the [four archetypes](archetypes.md) ships with 3–10 Remotion
    templates. Brands can override or add their own.

-   :material-flash:{ .lg .middle } __Seconds to render__

    ---

    A 60-second Remotion render on a Railway worker takes 10–30 seconds
    on CPU. No GPU required. No per-frame compute cost.

-   :material-replay:{ .lg .middle } __Idempotent__

    ---

    Same brief + same Brand KB version = same output. This is critical
    for the editor loop: when the editor changes a slice, everything else
    renders identically and the diff is clean.

</div>

### Neuro-predictive scoring

Every candidate is scored by a brain model before it's delivered. The
scorer is the reward function for the entire engine.

<div class="grid cards" markdown>

-   :material-brain:{ .lg .middle } __18 neural metrics__

    ---

    Hook score, sustained attention, emotional arousal, valence, reward
    prediction, social cognition, aesthetic quality, sensory richness,
    scene composition, cognitive load, memory encoding, mind wandering,
    message clarity, audio-visual coherence, narration impact, modality
    dominance, novelty spike, curiosity gap. Weights per metric are
    overridable per archetype and per platform.

-   :material-chart-bell-curve-cumulative:{ .lg .middle } __TRIBE v2 by default__

    ---

    Default analyzer is Meta FAIR's TRIBE v2 — the SOTA zero-shot neural
    encoder released March 2026. Predicts fMRI response across ~70,000
    cortical voxels without recruiting subjects.

-   :material-swap-horizontal:{ .lg .middle } __Pluggable analyzer__

    ---

    The analyzer is a single interface with three concrete implementations:
    TRIBE v2 (precision, research-grade), V-JEPA2 + trained attention head
    (commercial-safe fallback), or third-party API (Neurons, Realeyes).
    Switch at config time.

-   :material-timer-sand:{ .lg .middle } __Slice scoring__

    ---

    When the editor changes a 3-second slice, only that slice is re-run
    through the scorer. Metrics that don't depend on the changed slice
    are inherited from the parent. Cuts per-iteration cost by roughly 70%.

</div>

### Recursive edit loop

The editor is a dedicated agent that consumes a scored candidate and
issues targeted edits.

<div class="grid cards" markdown>

-   :material-pencil-ruler:{ .lg .middle } __Seven edit primitives__

    ---

    Hook rewrite, cut tightening, music swap, pacing change, narration
    rewrite, visual substitution, caption emphasis, ICP re-anchor. Each
    primitive is a bounded operation with known cost.

-   :material-chart-line-variant:{ .lg .middle } __Gradient-driven__

    ---

    The editor reads the per-metric score breakdown and picks the edit
    that is expected to move the composite score most. Not a random
    regeneration — a targeted descent.

-   :material-alert-octagon:{ .lg .middle } __Monotone failure detection__

    ---

    When the score fails to improve across two consecutive iterations,
    the editor stops and escalates. Prevents the loop from thrashing.

-   :material-check-decagram:{ .lg .middle } __Six stop conditions__

    ---

    Threshold pass, max iterations, monotone failure, cost ceiling, time
    ceiling, manual kill. Every stopped variant is delivered with its
    terminal score and reason.

</div>

## Deliver

### Neural report

Every delivered variant comes with a neural report. The report is the
artifact a CMO or creative lead can actually read and decide on.

<div class="grid cards" markdown>

-   :material-chart-timeline-variant-shimmer:{ .lg .middle } __Per-second attention curve__

    ---

    Dorsal attention network activation across the full timeline.
    Color-coded zones for high engagement, decline, and critical drops.

-   :material-head-snowflake-outline:{ .lg .middle } __3D brain activation map__

    ---

    Interactive fsaverage5 cortical surface with real-time heatmap.
    Scrub the video timeline to see which regions activate when.

-   :material-star-shooting:{ .lg .middle } __Key moments__

    ---

    Auto-identified inflection points: best hook, peak engagement,
    emotional peaks, drop-off risk, recovery points. Each tagged with its
    neural substrate.

-   :material-history:{ .lg .middle } __Iteration history__

    ---

    Full score history across every loop iteration, with the specific
    edits applied and how much each moved the composite. Makes the "why"
    of the final variant legible.

-   :material-ab-testing:{ .lg .middle } __Multi-variant comparison__

    ---

    For briefs that produce multiple variants per cell, a side-by-side
    comparison panel with statistical significance on metric differences.

-   :material-download:{ .lg .middle } __PDF export__

    ---

    One-click export of the full report as a CMO-ready PDF.

</div>

### GTM strategy guide

Scored variants are useful. Scored variants with a go-to-market plan
attached are actionable. The strategist agent reads the scored variants,
the Brand KB, and the brand's existing GTM context, and emits a guide.

<div class="grid cards" markdown>

-   :material-target-account:{ .lg .middle } __ICP pairing__

    ---

    Which variant is best for which ICP. Often matches the ICP the
    variant was generated for — but the scorer sometimes surfaces
    unexpected fits worth testing.

-   :material-cellphone-message:{ .lg .middle } __Platform pairing__

    ---

    Which platform to post each variant on first, in what aspect ratio,
    with what caption style, with what CTA anchor.

-   :material-clock-outline:{ .lg .middle } __Launch cadence__

    ---

    Daypart, sequencing, and frequency recommendations for the full
    variant bundle. Derived from the brand's existing launch playbooks
    in the KB.

-   :material-poll:{ .lg .middle } __A/B pairing__

    ---

    Which variants to A/B against which, based on score differences that
    are actually significant. Stops the brand from running A/B tests
    between statistically identical creatives.

</div>

### Doc delta (optional)

For brands that live in a doc-first world, Nucleus can optionally emit a
documentation delta alongside each variant — an SOP or written guide that
reflects the variant's persona framing. Off by default; on for customer
success, training, and change-management archetypes.

## What ships when

Not every feature above is in the MVP. The [roadmap](roadmap.md) has the
full schedule. The short version: the closed loop, the Remotion templates
for one archetype, the scorer, and a basic neural report ship at MVP. All
four archetypes, the full Brand KB ingestion surface, the GTM strategist,
and the multi-tenant integration ship at v1. Cross-brand learning, in-frame
agentic editing, and the extraction path ship at v2.
