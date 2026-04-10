# Output Archetypes

Nucleus produces four classes of variant. Each archetype is a distinct
composition stack, a distinct set of scoring weights, and a distinct
set of use cases. The engine is the same across all four — what changes
is the template library, the generator prompts, and which rows of the
metric taxonomy carry the most weight.

## Why four and not one

A 45-second paid-social ad and a 6-minute internal training video have
almost nothing in common except that they're both "video." They demand
different pacing, different visual density, different narration styles,
different scoring weights, and different delivery surfaces. Trying to
produce both with one template library gives you mediocre versions of
both.

Four archetypes gives Nucleus enough coverage for the realistic set of
brand content jobs without exploding the template surface area.

## Archetype 1 — Demo { .feature-heading }

<div class="grid cards" markdown>

-   :material-monitor-dashboard:{ .lg .middle } __What it is__

    ---

    30–90 second persona-targeted product walkthrough. Source footage
    segments re-narrated in the target language with the brand's cloned
    voice, persona-specific text overlays, composited in the brand's
    Brand Kit style.

-   :material-target:{ .lg .middle } __Use cases__

    ---

    Product marketing, sales enablement, pre-sales demos, customer
    onboarding, feature launches, in-product tooltips. The closest
    archetype to existing screen-recording-based content pipelines.

-   :material-cog-outline:{ .lg .middle } __Stack__

    ---

    Segment selection via Marengo embeddings. Script rewrite per ICP via
    generator + Brand KB. Composition in Remotion. Voice via ElevenLabs
    IVC. Text overlays via Remotion motion text. Music optional (subtle
    bed via Lyria).

-   :material-weight:{ .lg .middle } __Scoring weights__

    ---

    Cognitive accessibility, message clarity, memory encoding, sustained
    attention. Hook score de-emphasized because the viewer is usually
    already engaged (in-product surface or enablement context), not
    scrolling past.

</div>

**Why Remotion wins this archetype.** Demo variants are 80% deterministic:
known segments, known text, known transitions. Diffusion would be slower,
more expensive, and would introduce visual variance that breaks brand
consistency. Remotion produces the same clip at the same quality for the
same input every time, renders in 10–30 seconds on CPU, and costs
essentially zero per render. This is the archetype where the cost story
is strongest.

## Archetype 2 — Marketing { .feature-heading }

<div class="grid cards" markdown>

-   :material-bullseye-arrow:{ .lg .middle } __What it is__

    ---

    10–45 second high-production persona-targeted clip for paid ads or
    organic social. Avatar or talking-head format, punchy cuts, on-brand
    visuals, emotional beats. Grounded in the Brand KB for messaging and
    in source footage for product shots.

-   :material-target:{ .lg .middle } __Use cases__

    ---

    Instagram Reels, TikTok, YouTube Shorts, LinkedIn video feed, Meta
    paid ads, in-email video CTAs, product update announcements,
    customer education campaigns.

-   :material-cog-outline:{ .lg .middle } __Stack__

    ---

    Script via generator with Brand KB + hook generator. Talking-head
    via HeyGen API or Tavus. Atmospheric B-roll via Veo 3.1 / Seedance /
    Sora 2. Voice via ElevenLabs IVC. Music via Lyria. Final composition
    in Remotion for brand overlays and cuts.

-   :material-weight:{ .lg .middle } __Scoring weights__

    ---

    Hook score, emotional arousal, aesthetic appeal, reward prediction,
    social cognition. The recipe for scroll-stopping paid-social
    content.

</div>

**Why the hybrid stack.** Pure diffusion at this length is expensive and
has consistency problems. Doing the talking-head shots with a dedicated
avatar provider (HeyGen, reusing any existing partnership the host
product already has) and the atmospheric B-roll with diffusion is cheaper
and more controllable. Remotion composites the final cut with brand
overlays. Each layer is pluggable — swap providers at config time.

## Archetype 3 — Knowledge { .feature-heading }

<div class="grid cards" markdown>

-   :material-school-outline:{ .lg .middle } __What it is__

    ---

    2–6 minute internal-facing explainer. Feature walkthroughs,
    onboarding modules, change-management announcements, training
    lessons, SOP walkthroughs. Optimized for comprehension, not
    scroll-stopping.

-   :material-target:{ .lg .middle } __Use cases__

    ---

    Customer success content, training videos, change management,
    internal enablement, help center articles with video, product
    documentation, compliance training.

-   :material-cog-outline:{ .lg .middle } __Stack__

    ---

    Composition via Remotion + Mermaid for diagrams. Segment reuse from
    source footage via transcript segment RAG. Narration via ElevenLabs
    (detailed layman tone). Subtle music bed only. Diffusion used
    sparingly for scene transitions or metaphor-driven story beats.

-   :material-weight:{ .lg .middle } __Scoring weights__

    ---

    Cognitive accessibility, message clarity, memory encoding,
    narration impact, sustained attention. Optimized for "did the viewer
    understand and remember this?"

</div>

**Doc-delta option.** Knowledge archetype variants can optionally emit a
paired SOP or manual fragment that reflects the specific persona
framing — so a brand's doc rail stays synced with its video rail. Off
by default; a config flag turns it on for training and customer-success
use cases where doc sync is the actual value.

## Archetype 4 — Education { .feature-heading }

<div class="grid cards" markdown>

-   :material-book-open-blank-variant:{ .lg .middle } __What it is__

    ---

    5–15 minute long-form learning content. Explainers in the style of
    Kurzgesagt, 3Blue1Brown, or Crash Course: highly information-dense,
    heavy visualization, layman narration with multiple voice options.

-   :material-target:{ .lg .middle } __Use cases__

    ---

    Formal training libraries, customer academies, certification
    content, YouTube long-form education, LMS-hosted course modules,
    public learning resources.

-   :material-cog-outline:{ .lg .middle } __Stack__

    ---

    Composition via Remotion + Manim + Mermaid. Research ingestion via
    DeepTutor's multi-agent research pipeline over the Brand KB.
    Narration via ElevenLabs (detailed layman tone, multi-voice
    optional). Diffusion B-roll for metaphor-driven sequences only.

-   :material-weight:{ .lg .middle } __Scoring weights__

    ---

    Cognitive accessibility, memory encoding, narration impact,
    aesthetic appeal, sustained attention. Similar to Knowledge but with
    higher weight on aesthetic because long-form attention requires
    visual variety.

</div>

**Why it's in the architecture.** Education is included because it
reuses the same engine with minor scoring re-weighting. The incremental
engineering cost is a few Remotion templates and a tighter narration
prompt. When a brand with a formal training library asks for it — and
enterprise B2B brands running global training programs always eventually
ask for it — Nucleus can ship it without a second buildout.

## Archetype comparison

| Dimension | Demo | Marketing | Knowledge | Education |
|---|---|---|---|---|
| Typical length | 30–90s | 10–45s | 2–6 min | 5–15 min |
| Primary use | Product walkthroughs | Paid & organic social | Internal enablement | Formal learning |
| Composition | Remotion-heavy | Hybrid | Remotion + Mermaid | Remotion + Manim + Mermaid |
| Avatar | Optional | Primary | Rare | Rare |
| Diffusion B-roll | Minimal | Primary | Minimal | Targeted |
| Voice style | Product voice | Emotive hook | Layman explainer | Detailed layman |
| Top metric | Message clarity | Hook score | Cognitive accessibility | Memory encoding |
| Per-variant cost | Lowest | Highest | Medium | Medium-high |
| MVP priority | v1 | MVP | v1 | v2 |

## Which archetype fits which tenant

Not every tenant needs all four. The first design-partner deployment
(TruPeer) starts with Demo and Knowledge archetypes — the closest fit to
their existing enablement and training use cases. Marketing unlocks the
paid-social channel for tenants whose brands want to run short-form ads.
Education unlocks LMS integration for tenants running formal training
programs.

A tenant's archetype coverage is a brief parameter, not a code change.
Turning on a new archetype for a tenant is a config flip and a Remotion
template library allocation — no engineering lift.
