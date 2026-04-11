# Diffusion Video Providers

The diffusion video layer is what Nucleus uses for atmospheric
B-roll, hero shots, and any visual content that benefits from
generative video over deterministic composition. Cost, quality, and
brand safety are all in tension here, so the engine treats this
layer as a pluggable interface with multiple providers behind it.

## The decision

**Primary (top quality): Google Veo 3.1.**
**Cost-optimized: Seedance 2.0 Lite (or Veo 3.1 Lite).**
**Character consistency across cuts: Runway Gen-4 References or Kling 3.0.**
**Self-host commercial-clean: LTX-2.3.**

These four cover the realistic permutations a brand variant needs.
The Nucleus generator agent picks per clip based on the brief's
quality target and budget.

## Critical market events (April 2026)

Three things to know before reading the rest of this page.

1. **OpenAI is shutting Sora 2 down.** Sora consumer app dies April
   26, 2026. Sora 2 API dies September 24, 2026. **Do not build new
   pipelines on Sora.**
2. **Veo 3.1 Lite shipped March 31, 2026** at ~$0.05/sec — making
   high-quality Google diffusion the cheapest option for batch work.
3. **Kling 3.0 (Feb 2026) introduced multi-shot character
   consistency** in a single generation. Combined with Runway Gen-4
   References, this is the moment character consistency stopped being
   a research artifact.

## Provider landscape

The full evaluation in `research/stack-diffusion-video.md` covers 14+
providers. The condensed table:

| Provider | Latest model | Pricing | Max clip | Quality (Arena Elo) | Best for |
|---|---|---|---|---|---|
| **Google Veo 3.1** | Veo 3.1 + Fast + Lite | $0.40 / $0.15 / $0.05 per sec | 8 sec | 1,219 (T2V), 1,291 (I2V Fast) | Cinematic B-roll, brand films with dialogue, 4K masters |
| **Seedance 2.0 (ByteDance)** | Lite + Pro | $0.010 / $0.03 per sec | 15 sec | **1,274 (T2V), 1,358 (I2V) — current Elo leader** | Cost-optimized batch, multi-shot sequences |
| **Kling 3.0 (Kuaishou)** | 3.0 + 1.6 + 1.5 | $0.10–$0.20/sec typical | 10 sec | 1,235 (T2V) | Multi-shot character consistency, dynamic motion |
| **Runway Gen-4.5** | Gen-4 + Gen-4 Turbo + Aleph + Act-Two | $0.05–$0.15/sec | 10 sec | 1,223 (T2V) | Best Western character consistency, 4K hero shots |
| **Luma Ray 3.14** | Ray 3.14 + Ray 3 Modify | ~$0.20–$0.30/sec | 5–10 sec | Strong on physics | Atmospheric motion, end-frame transitions, identity-locked v2v |
| **Pika 2.2** | 2.2 with Pikaframes/scenes | $0.20–$0.45 per 5-sec clip | 25 sec via chains | Mid-tier | Stylized social loops, multi-aspect-ratio batch |
| **Hailuo (MiniMax)** | T2V + I2V | $0.10/sec | 6 sec | Mid-tier | Cost-conscious creative work |
| **Hunyuan Video (Tencent)** | T2V + I2V | Self-host or API | 5 sec | Mid-tier | Self-host with open weights |
| **CogVideoX (THUDM)** | 5B / 5B-I2V | Self-host (Apache 2.0) | 6 sec | Mid-tier | Open-weights self-host with permissive license |
| **LTX-2.3 (Lightricks)** | LTX-2.3 (4K + audio) | Self-host | ~10 sec | Production-ready | **Best self-host option, truly open weights** |
| **Mochi (Genmo)** | 1 (10B params) | Self-host (Apache 2.0) | 5 sec | Mid-tier | Open-weights self-host |
| **Stable Video Diffusion** | SVD-XT | Self-host (CC BY-NC for non-commercial) | 4 sec | Older | Research / non-commercial |
| **Sora 2 (OpenAI)** | 2 + Pro | $0.10 / $0.30–$0.50 per sec | 10–20 sec | Surpassed by 2026 leaders | **DO NOT BUILD ON — shutting down** |

Sources for pricing and Arena Elo: see `research/stack-diffusion-video.md`.
The full per-provider deep dive includes API endpoints, brand-safety
notes, watermarking rules, commercial-license terms, and notable
production users for each.

## How Nucleus picks per clip

The generator agent gets a brief that includes a quality target
(`hero`, `standard`, `batch`, `cost-optimized`) and a budget cap per
clip. It picks the provider per clip from a routing table:

```python
PROVIDER_ROUTING = {
    "hero": [
        ("veo-3.1-full", {"max_cost_per_sec": 0.50}),
        ("runway-gen-4.5", {"max_cost_per_sec": 0.20}),
    ],
    "standard": [
        ("veo-3.1-fast", {"max_cost_per_sec": 0.20}),
        ("kling-3.0", {"max_cost_per_sec": 0.20}),
        ("seedance-2.0-pro", {"max_cost_per_sec": 0.05}),
    ],
    "batch": [
        ("seedance-2.0-lite", {"max_cost_per_sec": 0.015}),
        ("veo-3.1-lite", {"max_cost_per_sec": 0.06}),
    ],
    "character-consistent": [
        ("runway-gen-4-references", {"max_cost_per_sec": 0.20}),
        ("kling-3.0", {"max_cost_per_sec": 0.20}),
        ("luma-ray-3-modify", {"max_cost_per_sec": 0.30}),
    ],
    "self-host-only": [
        ("ltx-2.3", {}),
        ("cogvideox", {}),
    ],
}
```

The routing is overridable per tenant in `tenants.settings`.

## Brand safety

Brand safety is the dimension where the cheap providers most often
fall short. Two specific risks:

### NSFW bypass

Pika 2.2 has been flagged in T2VSafetyBench (arxiv 2407.05965) as
having the **highest NSFW-bypass rate** of four commercial T2V
models. For brand-sensitive work, this is disqualifying. The Nucleus
generator agent does not call Pika for marketing variants by default.

### Public-figure / IP infringement

| Provider | Public-figure handling |
|---|---|
| Veo 3.1 | Strong — public-figure prompts blocked, SynthID watermark always on |
| Sora 2 | Strong but shutting down |
| Runway Gen-4 | Public-figure detection, less aggressive |
| Kling 3.0 | Moderate |
| Seedance 2.0 | Chinese-platform moderation; less documented for Western brands |
| Pika 2.2 | Weakest |

For paid-ad use cases where IP protection matters, the engine
defaults to Veo 3.1. Generation requests that include public-figure-
adjacent prompts (e.g., a brand mention that could be confused with a
real person's name) get an explicit safety check before submission.

## Watermarking

Some providers embed watermarks in output. For paid social and ads,
the brand needs clean output:

| Provider | Watermark |
|---|---|
| Veo 3.1 | SynthID invisible watermark always on (acceptable for ads) |
| Runway Gen-4 | None on API output |
| Kling 3.0 | None on API output |
| Seedance 2.0 | None documented |
| Luma Ray 3 | None on paid outputs |
| Pika 2.2 | None on paid outputs |
| Sora 2 | C2PA metadata always; visible logo on app outputs only |

SynthID on Veo output is invisible and does not block ad use. C2PA
metadata is increasingly required (EU AI Act compliance) and is a
positive, not a negative.

## Self-hosting

For commercially-clean inference where the CC BY-NC license on TRIBE
v2 (or any other research-grade dependency) is a blocker, two
self-host paths exist:

### LTX-2.3 (Lightricks, recommended)

Released March 5, 2026 by Lightricks. **Truly open weights** under a
permissive license. 4K generation. Native audio. Production-ready.
Runs on a single A100. The best self-host option in the market as of
April 2026.

| Property | Value |
|---|---|
| License | Truly open weights (commercial-friendly) |
| Resolution | Up to 4K |
| Audio | Native generation |
| Hardware | A100 / H100 |
| Latency | ~30s for a 5-sec 1080p clip on A100 |
| Source | [Lightricks LTX](https://www.globenewswire.com/news-release/2026/01/06/3213304/0/en/Lightricks-Open-Sources-LTX-2-the-First-Production-Ready-Audio-and-Video-Generation-Model-With-Truly-Open-Weights.html) |

### CogVideoX (THUDM, fallback)

Apache 2.0 licensed open weights. Solid mid-tier quality. Less
mature than LTX but a clean fallback.

| Property | Value |
|---|---|
| License | Apache 2.0 |
| Resolution | 720p / 1080p |
| Audio | None native |
| Hardware | A100 |
| Latency | ~45s for a 5-sec 720p clip |
| Source | [THUDM CogVideoX](https://github.com/THUDM/CogVideo) |

The self-host path is the safety valve. If a customer requires
fully-isolated inference for compliance reasons, Nucleus can switch to
LTX-2.3 on a dedicated GPU pool with no other code changes.

## Why not the other open-weight models

| Model | Why not |
|---|---|
| **Mochi (Genmo)** | Quality is mid-tier; LTX-2.3 is better and similarly licensed |
| **Stable Video Diffusion (Stability)** | Older; license is CC BY-NC for non-commercial use |
| **HunyuanVideo (Tencent)** | Excellent quality but Tencent's commercial use terms are ambiguous |
| **WAN-Video (Alibaba)** | New; not yet stable enough for production |
| **VchitectXL (Shanghai AI Lab)** | Research-only |

LTX-2.3 + CogVideoX cover the self-host space.

## Cost projection

At Nucleus's target throughput (100 variants/day, ~3 diffusion clips
per marketing-archetype variant):

| Provider mix | Cost per variant (diffusion only) | Daily cost |
|---|---|---|
| All Veo 3.1 full | $4.80 | $480 |
| All Veo 3.1 Fast | $1.80 | $180 |
| All Veo 3.1 Lite | $0.60 | $60 |
| All Seedance 2.0 Lite | $0.12 | $12 |
| Mixed (Veo Fast for hero, Seedance Lite for B-roll) | ~$0.40 | $40 |

The mixed strategy is the default. The cost ceiling per variant
keeps any single variant from running away.

## Switching providers at runtime

Every diffusion call goes through a single `Provider` interface:

```python
class DiffusionVideoProvider(Protocol):
    name: str
    cost_per_second_usd: Decimal
    max_clip_seconds: int
    supports_image_to_video: bool
    supports_character_reference: bool

    async def generate(
        self,
        prompt: str,
        duration_s: int,
        aspect_ratio: AspectRatio,
        reference_images: list[ImageRef] = None,
        camera_motion: CameraMotion = None,
        seed: int = None,
    ) -> GenerationResult: ...
```

Concrete implementations: `VeoProvider`, `SeedanceProvider`,
`KlingProvider`, `RunwayProvider`, `LumaProvider`, `PikaProvider`,
`HailuoProvider`, `LtxProvider` (self-host), `CogVideoXProvider`
(self-host).

The generator agent calls the routing table, picks a provider,
issues the call, handles retries on transient errors, falls through
to the next provider on permanent errors. The orchestrator never
hardcodes a provider name.

## Risk callouts

| Risk | Mitigation |
|---|---|
| Sora 2 shutdown (Sept 24, 2026) | Don't build on Sora; migrate any Sora prototypes immediately |
| Veo 3.1 price increase | Routing table allows cheaper fallback (Seedance, Kling) per clip |
| Seedance 2.0 API not yet GA | Use Seedance 1.5 Pro until GA; route to Atlas Cloud Fast tier as a third option |
| Provider deprecates a model mid-pipeline | Provider abstraction layer; routing table updates without code changes |
| Provider returns degraded output | Garbage detection layer (frame count, RMS, watermark detection) |
| New SOTA provider appears | Monthly stack review; routing table is data, not code |

## When to revisit

The diffusion provider layer should be revisited:

- Monthly, against the Artificial Analysis text-to-video and
  image-to-video leaderboards
- Whenever a provider releases a major model version
- Whenever a provider changes pricing
- Whenever a self-host model crosses commercial-quality threshold
- Whenever a brand-safety incident surfaces
