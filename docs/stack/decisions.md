# Stack Decisions Per Archetype

This page is the reference for **what stack each Nucleus archetype
actually runs**. It collapses the three preceding pages into a single
view organized by archetype, so an engineer or operator can answer
"what's the demo archetype made of" without rereading the full
evaluations.

## Demo archetype

**Use case:** product walkthroughs, sales enablement, pre-sales,
customer onboarding. 30–90 seconds. The closest archetype to TruPeer's
existing screen-recording-based content pipeline.

| Layer | Tool | Why |
|---|---|---|
| Source ingestion | yt-dlp + ffmpeg → faster-whisper transcript | Reuses Roto's existing pipeline |
| Segment selection | Twelve Labs Marengo embeddings | Semantic search over the source recording |
| Script rewrite | OpenRouter (Sonnet / GPT-4 / Claude) | Per-ICP, per-language |
| Voice | ElevenLabs IVC (reused from Brand Kit) | Existing TruPeer voice clones |
| Composition | Remotion | Deterministic, fast, brand-templatable |
| Text overlays | Remotion motion text | Reactive to the script |
| Music | Lyria (subtle bed, optional) | Brand-safe |
| Diffusion video | None (Remotion-only) | Cost optimization — no diffusion needed |
| Avatar | None (segment reuse only) | Source recording is the visual content |
| Pre-processor | Auto-Editor | Trims dead air from source |
| Output | MP4, 1080p, target aspect ratio | Standard |
| **Per-variant cost (est.)** | **~$0.30** | Lowest of any archetype |

The demo archetype is **the most margin-friendly variant** because it
skips the two most expensive layers (diffusion video and avatar
generation). It's also the closest fit to TruPeer's existing customer
pain points (every product update means re-record from scratch).

## Marketing archetype

**Use case:** Instagram Reels, TikTok, YouTube Shorts, LinkedIn,
paid ads. 10–45 seconds. The most "Arcads-like" archetype.

| Layer | Tool | Why |
|---|---|---|
| Script | OpenRouter LLM with Brand KB context | Hook generator + ICP-targeted body |
| Voice | ElevenLabs IVC | Brand voice |
| Avatar | HeyGen Avatar IV (via TruPeer partnership) | Existing partnership, top quality |
| Diffusion B-roll | Veo 3.1 Fast (default) or Seedance 2.0 Pro (cost path) | Multiple providers behind routing |
| Music | Lyria (mood-driven bed) | Brand-safe, fast |
| Composition | Remotion | Final cut + brand overlays |
| Pre-processor | None | No source recording involved |
| Output | MP4, 1080p, multiple aspect ratios per platform | Per-platform render |
| **Per-variant cost (est.)** | **~$0.70** | Highest of the four archetypes |

The marketing archetype is the most expensive because every layer
has a paid call. The cost ceiling per variant is the safety net.

### Marketing archetype routing detail

The diffusion video routing for marketing variants:

- **Hero clips (1 per variant):** Veo 3.1 Fast at $0.15/sec
- **B-roll clips (2 per variant):** Seedance 2.0 Pro at $0.03/sec or
  Veo 3.1 Lite at $0.06/sec depending on quality target
- **Character-consistent shots (rare):** Runway Gen-4 References at
  $0.12/sec or Kling 3.0

The avatar routing:

- **Default:** HeyGen Avatar IV
- **If conversational embed needed (rare for marketing):** Tavus
- **If host's customer is on a Synthesia contract:** Synthesia (used
  via the customer's existing avatar library)

## Knowledge archetype

**Use case:** internal training, customer success, change management,
help center videos, SOP walkthroughs. 2–6 minutes. Optimized for
comprehension, not scroll-stopping.

| Layer | Tool | Why |
|---|---|---|
| Source ingestion | yt-dlp + ffmpeg → faster-whisper | Same as demo |
| Segment selection | Marengo embeddings | Same as demo |
| Script | OpenRouter LLM with Brand KB context | Detailed explainer tone |
| Voice | ElevenLabs IVC (detailed, layman tone) | Brand voice |
| Diagrams | Mermaid (flowcharts, sequence diagrams) | SVG, embeddable in Remotion |
| Composition | Remotion + Mermaid | Mostly deterministic |
| Music | Minimal bed (Lyria) | Quiet under voice |
| Diffusion video | Rare — only for scene transitions or metaphors | Gated behind a "creative" flag |
| Avatar | None | Knowledge variants are usually voice + screen + diagrams |
| Doc delta | Optional Markdown SOP fragment output | Synced with the video's persona framing |
| Output | MP4, 1080p, 16:9 (typical) | Long-form aspect ratio |
| **Per-variant cost (est.)** | **~$0.40** | Mid-range |

Knowledge variants are the second most cost-friendly archetype
because diffusion video is rare. The doc-delta output is a key
differentiator from any other AI video tool.

## Education archetype

**Use case:** long-form learning content, customer academies, formal
training libraries, YouTube long-form education, LMS-hosted modules.
5–15 minutes.

| Layer | Tool | Why |
|---|---|---|
| Research ingestion | DeepTutor multi-agent research over Brand KB | Outline before scripting |
| Script | OpenRouter LLM with research outline | Long-form layman explainer |
| Voice | ElevenLabs IVC (detailed layman tone, multi-voice optional) | Brand voice |
| Math/concept animations | Manim CE (rendered to MP4) | Educational visualizations |
| Flowcharts | Mermaid | Diagrams |
| Composition | Remotion + Manim + Mermaid | Most complex composition stack |
| Music | Subtle bed (Lyria) | Background only |
| Diffusion B-roll | Optional, for metaphor-driven sequences | Gated |
| Avatar | Optional, for hosted-narrator format | Gated |
| Output | MP4, 1080p, 16:9 | YouTube-shaped |
| **Per-variant cost (est.)** | **~$1.50–$3.00** | Highest, due to length |

Education variants are expensive because they're 5–15 minutes long,
not because per-second cost is high. Cost per variant scales with
duration; cost per second is comparable to the knowledge archetype.

## Provider routing summary

The complete routing table, written as a YAML the engine consumes:

```yaml
archetypes:
  demo:
    composition: remotion
    voice: elevenlabs_ivc
    music: lyria
    diffusion: none
    avatar: none
    pre_processor: auto_editor
    cost_target_per_variant_usd: 0.50

  marketing:
    composition: remotion
    voice: elevenlabs_ivc
    music: lyria
    diffusion:
      hero: veo_3_1_fast
      broll: seedance_2_0_pro
      character_consistent: runway_gen_4_references
    avatar: heygen_avatar_iv
    cost_target_per_variant_usd: 1.00

  knowledge:
    composition: remotion
    diagrams: mermaid
    voice: elevenlabs_ivc
    music: lyria
    diffusion: optional
    avatar: none
    pre_processor: auto_editor
    cost_target_per_variant_usd: 0.60

  education:
    composition: remotion
    diagrams: [mermaid, manim]
    research: deeptutor
    voice: elevenlabs_ivc
    music: lyria
    diffusion: optional
    avatar: optional
    cost_target_per_variant_usd: 2.50
```

This file lives in the repo as `nucleus/config/archetypes.yaml` and
can be overridden per tenant via `tenants.settings`.

## What's intentionally not in the routing

A few tools that came up in the evaluation but aren't in the default
routing:

- **Sora 2.** Shutting down. Don't build on it.
- **Pika 2.2.** NSFW bypass risk; not for marketing variants. Could
  be used for stylized creative on a per-tenant flag.
- **MoviePy.** Determinism risk; not for the iteration loop.
- **DaVinci Resolve.** License ambiguity for server-farm use.
- **Synthesia.** Available as a per-tenant override but not default
  because of the boardroom feel.
- **D-ID.** Lower quality than HeyGen at similar cost.
- **Akool.** Better for video translation than fresh generation.

Each of these is a `tenants.settings` override away if a specific
customer needs it. The default routing keeps the per-variant cost,
quality, and brand safety predictable.

## Switching providers

Every provider call goes through a Protocol-typed interface
([how it works → pluggable analyzer](../how-it-works.md#pluggable-analyzer)
shows the same pattern for the scoring layer). Switching providers is:

1. Change the YAML config
2. Restart the workers
3. New jobs use the new routing; in-flight jobs finish on the old

No code change. No deploy. Routing is data, not behavior.

## Cost recap

| Archetype | Per-variant cost | Per-day cost (100 var) | Per-month |
|---|---|---|---|
| Demo | ~$0.30 | $30 | $900 |
| Marketing | ~$0.70 | $70 | $2,100 |
| Knowledge | ~$0.40 | $40 | $1,200 |
| Education | ~$1.50–$3.00 | $150–$300 | $4,500–$9,000 |

The mixed-archetype daily cost at 100 variants/day is ~$76 (the number
in the [how-it-works cost model](../how-it-works.md#cost-model)),
which assumes a typical mix of demo + marketing + occasional knowledge.
Pure marketing or pure education at 100/day is more expensive; pure
demo is cheaper.
