# Generative Video Providers 2026: Deep Evaluation for Brand-Safe Programmatic Generation

*Research cutoff: April 2026. Scope: server-side pipeline generating 100+ 5-10 second clips/day for brand work.*

This document evaluates every serious generative-video provider with API access (or open weights) in April 2026, mapped to the needs of a programmatic pipeline that produces brand-safe 5-10 second clips at scale. All prices are list-rate USD pulled from publicly linked pricing pages; third-party resellers (fal.ai, Replicate, kie.ai, Atlas Cloud) are noted where they offer material discounts.

The "Arena Elo" numbers below come from the [Artificial Analysis text-to-video](https://artificialanalysis.ai/video/leaderboard/text-to-video) and [image-to-video](https://artificialanalysis.ai/video/leaderboard/image-to-video) leaderboards (April 2026), which are the industry standard blind A/B benchmark. Higher = better.

---

## Critical market events you must know before reading

1. **OpenAI is shutting Sora down.** The Sora consumer app dies **April 26, 2026**; the Sora 2 API follows on **September 24, 2026**. Any pipeline built on Sora 2 today has a ~5-month runway, after which you must migrate. Source: [OpenAI Help Center — Sora discontinuation](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation), [TheDecoder](https://the-decoder.com/openai-sets-two-stage-sora-shutdown-with-app-closing-april-2026-and-api-following-in-september/).
2. **Veo 3.1 is GA, Veo 3.1 Lite was released March 31, 2026.** Developer access is now first-class on Vertex AI + Gemini API, with commercial-use rights for paid tiers. Source: [MarkTechPost — Veo 3.1 Lite](https://www.marktechpost.com/2026/03/31/google-ai-releases-veo-3-1-lite-giving-developers-low-cost-high-speed-video-generation-via-the-gemini-api/).
3. **Kling 3.0 (Feb 2026) introduced multi-shot character consistency** — the single most brand-relevant feature release of the cycle. Source: [Atlas Cloud — Kling 3.0 review](https://www.atlascloud.ai/blog/guides/kling-3.0-review-features-pricing-ai-alternatives).
4. **LTX-2.3 (March 5, 2026)** ships truly-open-weights 4K + audio generation — the best self-host option now exists. Source: [Lightricks press release](https://www.globenewswire.com/news-release/2026/01/06/3213304/0/en/Lightricks-Open-Sources-LTX-2-the-First-Production-Ready-Audio-and-Video-Generation-Model-With-Truly-Open-Weights.html).
5. **Seedance 2.0 tops the Artificial Analysis leaderboard** (Elo 1,273 text-to-video, 1,358 image-to-video) but the **official API is not yet GA** on Volcengine — only trial access via Ark experience center. Source: [LaoZhang AI — Seedance API status](https://blog.laozhang.ai/en/posts/seedance-2-api).

---

## Provider-by-provider evaluation

### 1. Google Veo 3.1 / Veo 3.1 Fast / Veo 3.1 Lite

| Field | Value |
|---|---|
| Parent | Google / Alphabet |
| Latest model | **Veo 3.1** (GA Oct 2025), **Veo 3.1 Fast** (Q1 2026), **Veo 3.1 Lite** (Mar 31, 2026) |
| API | Vertex AI + Gemini Developer API |
| Base URL | `us-central1-aiplatform.googleapis.com` (Vertex), `generativelanguage.googleapis.com` (Gemini) |
| Auth | Google Cloud IAM (Vertex) or API key (Gemini) |
| Pricing (list) | **Veo 3.1 with audio: $0.40/sec**, video-only: $0.20/sec. **Fast: $0.15/sec**. **Lite: ~$0.05/sec.** Runway resells Veo 3.1 at 40 credits/sec ($0.40) or 20 credits/sec ($0.20) video-only. |
| Max single clip | 8 sec per generation; extend workflow stitches up to ~148 sec |
| Resolutions | 720p, 1080p, **4K in Vertex preview**; 24 fps |
| Aspect ratios | 16:9, 9:16 |
| Latency | 11 sec best case, 2-5 min typical, 6 min peak. Veo 3.1 Fast: ~45-90 sec on fal |
| Quality (Arena Elo) | Veo 3 T2V 1,219; Veo 3.1 T2V 1,212; Veo 3.1 Fast 1,211. Image-to-video Veo 3.1 Fast Elo 1,291 (top 10). |
| Reputation | **Best-in-class lip sync + native dialogue audio**; best "cinematic stability" per [AI/ML API 2026 comparison](https://aimlapi.com/blog/best-ai-video-generators-2026-veo-3-1-kling-sora-2-seedance-more-compared) |
| Brand safety | **Strong.** Every frame carries [SynthID](https://www.hireoverseas.com/blogs/google-veo-3-watermarking) invisible watermark. Safety-filter controls exposed via API. Google indemnifies enterprise customers for Veo 3 output. Public-figure and trademark prompts are blocked. |
| Reference image | Yes (image-to-video, start/end frame) |
| T2V control | Strong; first-class cinematography vocabulary in prompts |
| Camera motion | Full set (pan, tilt, dolly, arc, crane) via prompt |
| Character consistency | **Weak across clips** — no built-in reference-image lock. Works scene-internally only. |
| Reliability | Backed by Google Cloud SLAs in GA; rate limits per project quota |
| Commercial license | **Yes for Vertex AI / Gemini Enterprise paying customers.** Pre-GA models (some preview tiers) prohibit commercial use. Indemnity provided. [Source](https://skywork.ai/blog/ai-video/veo-3-1-for-agencies-and-commercial-use-2/) |
| Watermark | Invisible SynthID always on; no visible overlay in API output |
| Multi-language | Native dialogue in 20+ languages; strongest multilingual voice of any commercial model |
| SDKs | `google-cloud-aiplatform` (Python/Node/Go), `@google/generative-ai`, direct REST |
| Notable users | WPP, Mondelez, Kraft Heinz pilot programs; Google Flow creative tooling |
| Best fit | Cinematic B-roll, hero shots, brand films with dialogue, 4K master files |
| Worst fit | High-volume batch (pricey), cross-clip character continuity |

Source: [Google Vertex AI pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing), [Veo 3.1 docs](https://ai.google.dev/gemini-api/docs/video), [Akool cost guide](https://akool.com/blog-posts/google-veo-3-1-cost-guide), [Runway API pricing (resell)](https://docs.dev.runwayml.com/guides/pricing/).

---

### 2. OpenAI Sora 2 / Sora 2 Pro *(DEPRECATED — do not build on)*

| Field | Value |
|---|---|
| Parent | OpenAI |
| Latest model | Sora 2 (Sep 30, 2025), Sora 2 Pro |
| API | `api.openai.com/v1/videos` |
| Auth | OpenAI API key (Tier 2+, requires $10 top-up minimum) |
| Pricing (list) | Sora 2: **$0.10/sec 720p**; Sora 2 Pro: **$0.30/sec 720p**, **$0.50/sec 1024p** |
| Max single clip | 10 sec (Sora 2), 20 sec (Sora 2 Pro) |
| Resolutions | 720p, 1024p (Pro) |
| Aspect ratios | 16:9, 9:16, 1:1 |
| Latency | 60-180 sec typical |
| Quality | Initially state-of-the-art for narrative depth; now surpassed by Kling 3.0, Seedance 2.0, Veo 3.1 |
| Brand safety | Blocks public-figure prompts, blocks real-person uploads without consent. C2PA metadata always embedded. |
| Reference image | Limited (image-to-video in Pro) |
| Camera motion | Via prompt only |
| Character consistency | Weak; no reference lock |
| Commercial license | You own outputs; must comply with IP/publicity laws. **API outputs are watermark-free**; app outputs carry visible OpenAI logo |
| Multi-language | 40+ languages via ChatGPT stack |
| **DISCONTINUATION** | **Sora web/app: April 26, 2026. Sora API: September 24, 2026.** OpenAI cited ~$1M/day operating cost and shift to enterprise core products. No drop-in replacement announced. [Source](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation) |

**Recommendation: Do not build new pipelines on Sora 2.** If already using it, plan migration before September 2026.

---

### 3. Runway Gen-4 / Gen-4 Turbo / Gen-4.5 / Aleph

| Field | Value |
|---|---|
| Parent | Runway AI, Inc. |
| Latest models | **Gen-4.5** (top quality), **Gen-4 Turbo** (fast/cheap), **Aleph** (video-to-video editing), **Act-Two** (performance capture) |
| API | `api.dev.runwayml.com/v1` |
| Auth | Bearer API key from developer portal (separate from web app) |
| Pricing (list) | **$0.01/credit**. Gen-4.5: **12 credits/sec = $0.12/sec**. Gen-4 Turbo: **5 credits/sec = $0.05/sec**. Aleph: 15 credits/sec = $0.15/sec. Runway also resells Veo 3.1 at 40 credits/sec. Volume: 275,000 credits for $1,250. [Source](https://docs.dev.runwayml.com/guides/pricing/) |
| Max single clip | 10 sec (Gen-4), 5 sec (Aleph video-to-video) |
| Resolutions | 720p, 1080p, **native 4K (Gen-4)**; portrait and landscape |
| Aspect ratios | 16:9, 9:16, 1:1, 4:3 |
| Latency | <60 sec typical simple prompts; async task queue |
| Quality (Arena Elo) | **Gen-4.5 Elo 1,223** (top 7 T2V). "Only Runway scaled cleanly to 4K without edge artifacts" per invideo.io shootout |
| Brand safety | Moderate. NSFW filter active; public-figure detection. Does **not** indemnify by default. |
| Reference image | **Gen-4 References** is the headline feature — 1 or more labeled refs (`image_1`, `image_2`) for style/character/object transfer |
| Camera motion | Full control vocabulary; dedicated camera widgets in UI |
| **Character consistency** | **Best-in-class for Western providers.** Gen-4 References keeps a character identical across shots, lighting conditions, locations from one reference image. [Runway research](https://runwayml.com/research/introducing-runway-gen-4) |
| Reliability | [status.runway.team](https://status.runway.team/). Tier-based concurrent limits (3-5 default). 429/503 retries required. Used by "world's largest consumer tech companies for millions of videos" per Runway. |
| Commercial license | **Yes on paid plans including API.** Outputs owned by customer. No indemnity at API tier. |
| Watermark | None on API output |
| Multi-language | Prompts in any language; audio via ElevenLabs integration (1 cr/50 chars multilingual) |
| SDKs | `@runwayml/sdk` (Node), `runwayml` (Python) |
| Notable users | CBS, Madonna tour visuals, Getty Images agency partners, TCL Films ("The Frost") |
| Best fit | **Character consistency across scene cuts**, 4K hero shots, editorial/agency work needing reference-image control |
| Worst fit | Extreme volume batch (Turbo helps but still pricier than Seedance/Kling), native audio (no Veo-level dialogue) |

---

### 4. Luma Ray 3 / Ray 3.14 / Ray 3 Modify

| Field | Value |
|---|---|
| Parent | Luma AI |
| Latest model | **Ray 3.14** (Q1 2026) — native 1080p, 4× faster. **Ray 3 Modify** (Dec 2025) for video-to-video with character lock. |
| API | `api.lumalabs.ai/dream-machine/v1` |
| Auth | API key |
| Pricing (list) | Credit-based, separate from consumer app. 1080p T2V/I2V: **80 credits/clip** (5 sec standard). HDR ~4× that. Video-to-video 1080p: 192 credits. Plus subscription $30/mo, Pro $90/mo, Ultra $300/mo all include API credits. [Source](https://lumalabs.ai/pricing) |
| Effective $/sec | ~$0.20-0.30/sec 1080p standard; ~$0.80/sec 1080p HDR |
| Max single clip | 5 sec or 10 sec per generation |
| Resolutions | Draft, 540p, 720p, 1080p (4K via upscale). **HDR supported.** |
| Aspect ratios | 16:9, 9:16, 1:1 |
| Latency | 45-120 sec fal-hosted; Draft mode for fast iteration |
| Quality | Strong on motion/physics; "cinematic realism engine" per [Genesys Growth](https://genesysgrowth.com/blog/runway-vs-pika-vs-luma-ai) |
| Brand safety | Standard NSFW filter; no public-figure block disclosed |
| Reference image | Yes — image-to-video, start frame, **end frame** (key feature), and character reference upload |
| Camera motion | Natural-language camera control; strong physics simulation |
| **Character consistency** | Ray 3 Modify **locks likeness, costume, identity continuity** across video-to-video clips via character reference image. [Dataconomy](https://dataconomy.com/2025/12/18/luma-ai-brings-character-consistency-to-video-with-ray3/) |
| Reliability | Hosted by Luma + fal + Adobe Creative Cloud integration |
| Commercial license | Yes on all paid plans (Plus $30/mo and up) |
| Watermark | None on paid outputs |
| Multi-language | Prompts any language; no native dialogue audio |
| SDKs | `lumaai` (Python, Node) |
| Notable users | Adobe Creative Cloud partnership; creative studios |
| Best fit | Atmospheric motion-heavy B-roll, start-to-end-frame transitions, physics-realistic product scenes |
| Worst fit | Dialogue-heavy shots, highest-end benchmark quality (now behind Kling/Seedance/Veo) |

---

### 5. Pika 2.2

| Field | Value |
|---|---|
| Parent | Pika Labs |
| Latest model | **Pika 2.2** with Pikaframes (keyframes) and Pikascenes (ingredient compositing) |
| API | Fal-hosted (`fal-ai/pika/v2.2/*`) is now the primary developer path; direct Pika API for partner tier |
| Auth | Fal API key or partner-tier Pika key |
| Pricing (list) | **$0.20 per 5-sec clip 720p**, **$0.45 per 5-sec clip 1080p** on fal. Subscription plans $8-$76/mo separately. [Source](https://fal.ai/models/fal-ai/pika/v2.2/text-to-video) |
| Max single clip | 10 sec single generation; **Pikaframes chains up to 25 sec** across 5 keyframes |
| Resolutions | 720p, 1080p |
| Aspect ratios | **7 formats**: 16:9, 9:16, 1:1, 4:5, 5:4, 3:2, 2:3 (most of any provider) |
| Latency | 30-90 sec on fal |
| Quality | Mid-tier; strong for stylized/fun content, shaky on photoreal |
| Brand safety | [Acceptable Use Policy](https://pika.art/acceptable-use-policy) blocks NSFW, violence, impersonation. T2VSafetyBench (arxiv 2407.05965) flags Pika as **highest NSFW-bypass rate** of four commercial T2V models — worth knowing for brand work. |
| Reference image | **Pikascenes** accepts multiple ingredient images (character, outfit, object, setting) and composes scene. |
| Camera motion | Supported via prompt |
| Character consistency | Moderate — Pikascenes handles character+outfit across compositions but not multi-shot continuity |
| Reliability | Depends on fal infrastructure (good) or Pika direct API (more limited) |
| Commercial license | Yes on paid plans ("Partner" license designation on fal) |
| Watermark | None on paid outputs |
| Multi-language | Prompt any language; no native audio |
| SDKs | `fal-client` (Python/JS) |
| Notable users | Consumer creator community; less prominent enterprise deployment |
| Best fit | Fast social loops, stylized content, multi-aspect-ratio batch (TikTok + YouTube + Instagram in one run) |
| Worst fit | Brand-sensitive work where NSFW bypass risk matters, photoreal hero shots |

---

### 6. ByteDance Seedance 2.0 (Doubao) + Seedream 4.5 (images)

| Field | Value |
|---|---|
| Parent | ByteDance |
| Latest model | **Seedance 2.0** (multi-modal video, top of Elo leaderboard); **Seedream 4.5** (images); Seedance 1.5 Pro (previous gen GA) |
| API | **Volcengine** (China) / **BytePlus** (international) |
| Auth | BytePlus API key |
| Pricing (list) | Seedance 2.0 Lite: **$0.010/sec**. Seedance 2.0 Pro: **$0.03/sec** (5-sec clip $0.15). Atlas Cloud Fast tier ~$0.022/sec. Seedance 1.5 Pro GA: ~$0.14/sec. Seedream 4.5 images: $0.04/image. [Atlas Cloud pricing breakdown](https://www.atlascloud.ai/blog/case-studies/seedance-2.0-pricing-full-cost-breakdown-2026) |
| Max single clip | 15 sec with multi-shot cuts inside one generation |
| Resolutions | 480p, 720p, 1080p |
| Aspect ratios | 16:9, 9:16, 1:1 |
| Latency | ~60-120 sec |
| Quality (Arena Elo) | **Dreamina Seedance 2.0 720p Elo 1,274 T2V (rank 2), 1,358 I2V (rank 2)** — currently the highest-scoring publicly tested video model after HappyHorse preview |
| Brand safety | Chinese platform moderation; limited public documentation of safety-filter behavior for non-Chinese brand prompts |
| Reference image | **Up to 9 images + 3 video clips + 3 audio files in single generation** |
| Camera motion | Yes via prompt |
| **Character consistency** | **Multi-shot narrative with consistent character across cuts** in a single 15-sec generation — direct competitor to Kling 3.0 |
| Reliability | **Official Seedance 2.0 API not GA as of March 27, 2026** per Volcengine docs — only Ark experience-center free quota. Seedance 1.5 Pro is fully available. |
| Commercial license | BytePlus enterprise TOS; data residency is China/Singapore |
| Watermark | None documented on API |
| Multi-language | Chinese + English first-class; audio generation included |
| SDKs | BytePlus SDK, third-party Python wrappers |
| Notable users | Dreamina, Doubao, CapCut pipeline; TikTok Creative Exchange |
| Best fit | Lowest-cost-per-quality batch generation, multi-shot sequences from a single prompt |
| Worst fit | Western brand legal comfort (data residency/TOS concerns), hardened API dependency today (pre-GA) |

---

### 7. Kling AI (Kuaishou)

| Field | Value |
|---|---|
| Parent | Kuaishou Technology |
| Latest models | **Kling 3.0** (Feb 5, 2026) and **Kling 3.0 Omni**, **Kling 2.6 Standard**, **Kling 2.5 Turbo** |
| API | `api.klingai.com` official + fal.ai, Atlas Cloud, PiAPI, WaveSpeedAI resellers |
| Auth | Access/Secret key pair (official); API keys on resellers |
| Pricing (list) | **Official Kling 3.0**: $0.084/sec (Standard) to $0.168/sec (Pro). Arena leaderboard shows **Kling 3.0 Pro 1080p at $13.44/min = $0.224/sec, Kling 3.0 Standard 720p at $10.08/min = $0.168/sec, Kling 2.5 Turbo at $4.20/min = $0.07/sec**. On fal, Kling 3.0 as low as $0.029/sec (roughly 3× cheaper than Sora 2, 10× cheaper than Veo 3.1). Official also offers **3-month $4,200 upfront commitment = 10K units/mo**. [Kling pricing](https://klingai.com/global/dev/pricing), [AIFreeAPI comparison](https://www.aifreeapi.com/en/posts/cheapest-sora-2-video-api) |
| Max single clip | **15 sec** in Kling 3.0 (vs 10 sec in 2.6) |
| Resolutions | 720p, 1080p, **4K image gen integrated** |
| Aspect ratios | 16:9, 9:16, 1:1 |
| Latency | 60-180 sec; Turbo variants ~45-90 sec |
| Quality (Arena Elo) | **Kling 3.0 1080p Pro 1,243 T2V (rank 4), 1,279 I2V**. Kling 3.0 Omni 1,229 T2V. |
| Brand safety | Content moderation active; some reports of inconsistent enforcement; Chinese-platform TOS |
| Reference image | **Element Reference / Bind Subject** locks face and clothing; accepts 3-8 sec reference videos |
| Camera motion | Director Control Toolkit: pan-down, dolly zoom, bird's eye view text commands |
| **Character consistency** | **Best multi-shot consistency commercially available.** Kling 3.0 treats photo as 3D anchor; Chain-of-Thought reasoning across shots. [Atlas Cloud character guide](https://www.atlascloud.ai/blog/guides/solving-character-inconsistency-a-guide-to-kling-3.0-image-to-video-mode) |
| Reliability | Kuaishou-backed; some rate-limit opacity; reseller fallback recommended |
| Commercial license | **Free tier = non-commercial only.** Standard ($6.99/mo) and above = commercial license. API tier has explicit commercial terms. [Source](https://checkthat.ai/brands/kling-ai/pricing) |
| Watermark | Free tier watermarked; paid API not watermarked |
| Multi-language | Mandarin, English, Japanese, Korean + native audio in Kling 3.0 |
| SDKs | Official Python/Node; extensive third-party wrappers |
| Notable users | Kuaishou ecosystem (800M+ DAU), Alibaba merchant video tooling |
| Best fit | **Character consistency across scene cuts at low cost**, multi-language audio, long-form 15-sec shots |
| Worst fit | Brands sensitive to Chinese data residency; official API pricing has jumped 41% in 6 months — volatility risk |

---

### 8. MiniMax Hailuo 02 / 2.3

| Field | Value |
|---|---|
| Parent | MiniMax |
| Latest model | **Hailuo 2.3** (with Fast variant), Hailuo 02 Pro/Standard |
| API | `api.minimax.io` official; fal, Replicate, WaveSpeedAI, Kie.ai resellers |
| Auth | MiniMax API key |
| Pricing (list) | **Hailuo 02 Pro 1080p: $0.08/sec** (6-sec clip $0.48). **Hailuo 02 Standard 768p: $0.045/sec**. 512p: $0.017/sec. Hailuo 2.3 Fast is "up to 50% cheaper" for batch. [Segmind pricing](https://www.segmind.com/models/minimax-ai/pricing) |
| Max single clip | 6 sec or 10 sec |
| Resolutions | 512p, 768p, 1080p |
| Aspect ratios | 16:9, 9:16, 1:1 |
| Latency | ~60-120 sec; Fast variant 30-60 sec |
| Quality | Strong on physics and prompt adherence; cinematic camera work |
| Brand safety | **Multi-layer NSFW filters** — prompt filtering, training-data exclusion, post-gen checks. API returns NSFW-detected flag. |
| Reference image | Subject-to-Video (S2V-01) model maintains identity from reference |
| Camera motion | **Director Control Toolkit**: pan, tilt, dolly, crane, bird's eye, dolly zoom — text commands |
| Character consistency | Good via S2V-01 subject reference |
| Reliability | MiniMax platform; rate limits per account tier |
| Commercial license | Yes on paid API; explicit commercial marketing |
| Watermark | None on API |
| Multi-language | Chinese + English; MiniMax also has top-tier voice synthesis (separate API) |
| SDKs | Python; also on fal/Replicate stacks |
| Notable users | Commercial spots, trailers, music promos explicitly targeted |
| Best fit | Best cost-to-quality for cinematic camera control, batch product shots with clean prompt adherence |
| Worst fit | Top-tier benchmark quality (behind Kling 3.0 / Seedance / Veo) |

---

### 9. Tencent Hunyuan Video 1.5

| Field | Value |
|---|---|
| Parent | Tencent |
| Latest model | **HunyuanVideo 1.5** (weights released Nov 20, 2025); HunyuanVideo-I2V variant |
| API | Tencent Cloud; fal.ai (`fal-ai/hunyuan-video`); Replicate; plus open-weight self-host |
| Auth | Cloud API key or local inference |
| Pricing (list) | **$0.40 per video on fal.ai** (fixed per-clip pricing). Self-host: free (compute only). |
| Max single clip | **15 sec at 720p**, 24 fps |
| Resolutions | Up to 1080p |
| Aspect ratios | 16:9, 9:16, 1:1 |
| Latency | ~2-5 min self-host on single H100; faster on fal |
| Quality | Solid — **8.3B parameter** model, competitive but not top-tier; "Wan 2.2 more cinematic, Hunyuan better ecosystem maturity" |
| Brand safety | **Self-host = zero provider-imposed filters** (you control). Tencent Cloud has its own moderation. |
| Reference image | Yes via HunyuanVideo-I2V |
| Camera motion | Prompt-driven |
| Character consistency | Moderate; no dedicated lock feature |
| Reliability | Depends on host — fal is stable; Tencent Cloud requires China/APAC account |
| Commercial license | **Weights are available under Tencent Community License** — permissive for commercial use under revenue threshold; self-check for the latest revision |
| Watermark | None by default self-host |
| Multi-language | English + Chinese |
| SDKs | Open source Python reference; ComfyUI integration |
| Notable users | Tencent ecosystem (WeChat, QQ) |
| Best fit | Self-host brand pipelines needing data sovereignty, custom fine-tuning on brand assets |
| Worst fit | Teams without GPU ops expertise; highest benchmark quality |

---

### 10. Stability AI — Stable Video Diffusion (SVD)

| Field | Value |
|---|---|
| Parent | Stability AI |
| Latest model | Stable Video Diffusion / SVD-XT (2023-2024 base; Stability is now focused on enterprise API, video has not had a flagship release in 2026) |
| API | Stability AI API + open weights on HuggingFace |
| Auth | Stability API key or local |
| Pricing (list) | Stability API: roughly $0.20 per gen; self-host: free |
| Max single clip | **2-4 sec at 24 fps** (14-25 frames) — smallest of any provider |
| Resolutions | 1024×576, 576×1024 |
| Aspect ratios | 16:9, 9:16 |
| Latency | 20-60 sec |
| Quality | Significantly behind 2026 frontier; image-to-video only, no text-to-video |
| Brand safety | Self-host: your call. Stability Commercial License covers outputs for most use cases. |
| Reference image | Image-to-video only (core mode) |
| Camera motion | Limited; implicit in training data |
| Character consistency | None beyond single-clip |
| Reliability | Stable but underinvested |
| Commercial license | [Stability Commercial License](https://terms.law/ai-output-rights/stable-diffusion/) — output rights permissive |
| Watermark | None |
| Multi-language | N/A (no text dialogue) |
| SDKs | diffusers (HuggingFace), ComfyUI |
| Notable users | Research community, lightweight prototypes |
| Best fit | Cheap single-image animation, prototyping, hobby projects |
| Worst fit | **Any 2026 production work** — model is too old for the quality bar |

---

### 11. Genmo Mochi 1

| Field | Value |
|---|---|
| Parent | Genmo |
| Latest model | Mochi 1 (released Oct 2024), Mochi 1 HD (720p planned) |
| API | [genmo.ai](https://www.genmo.ai/) hosted playground + open weights on HuggingFace |
| Auth | Genmo account or local inference |
| Pricing (list) | Hosted playground free with limits; self-host = compute only |
| Max single clip | **5.4 sec at 30 fps, 480p** |
| Resolutions | 480p (HD coming) |
| Aspect ratios | 16:9 |
| Latency | Self-host: minutes on 4× H100 (required) |
| Quality | SOTA among 2024 open-weight T2V at release; overtaken by Hunyuan 1.5 and LTX-2.3 by 2026 |
| Brand safety | Self-host = no filters by default |
| Reference image | Not in base release |
| Camera motion | Prompt-driven |
| Character consistency | None |
| Reliability | Self-host only, fragile |
| Commercial license | **Apache 2.0** — fully commercial |
| Watermark | None |
| Multi-language | N/A |
| SDKs | `mochi` Python package |
| Notable users | Open-source research labs |
| Best fit | Open-source pipelines needing maximum license freedom |
| Worst fit | 720p+ production; hardware budget is the killer (4× H100 minimum) |

---

### 12. CogVideoX (THUDM / Zhipu AI)

| Field | Value |
|---|---|
| Parent | Tsinghua University / Zhipu AI |
| Latest model | **CogVideoX1.5-5B** (text-to-video), **CogVideoX1.5-5B-I2V** (image-to-video) |
| API | Zhipu API + HuggingFace weights |
| Auth | Zhipu API key or local |
| Pricing (list) | Zhipu API ~$0.02/sec; self-host free |
| Max single clip | **10 sec at 768×1360, 8 fps** (CogVideoX-5B) |
| Resolutions | 768×1360, flexible in 1.5 I2V |
| Aspect ratios | Configurable |
| Latency | ~1-3 min on RTX 3060 (5B model); seconds on H100 |
| Quality | Mid-tier; good for open weights |
| Brand safety | Self-host = your control |
| Reference image | Yes in 1.5-I2V |
| Camera motion | Prompt-driven |
| Character consistency | Limited (video continuation feature extends clips) |
| Reliability | Depends on host |
| Commercial license | **Apache 2.0** for CogVideoX-2B; larger models under custom but permissive license |
| Watermark | None |
| Multi-language | English + Chinese |
| SDKs | diffusers, ComfyUI, CogVideoX Python |
| Notable users | Academic research; open-source creative tooling |
| Best fit | Low-VRAM self-host (runs on RTX 3060), research prototypes |
| Worst fit | Brand-quality hero shots; frame rate is only 8 fps |

---

### 13. Lightricks LTX Video / LTX-2 / LTX-2.3

| Field | Value |
|---|---|
| Parent | Lightricks |
| Latest model | **LTX-2.3** (March 5, 2026) — 22B params, native 4K + synchronized audio |
| API | Open weights on HuggingFace; hosted via LTX Studio, fal, ComfyUI |
| Auth | Self-host or fal API key |
| Pricing (list) | **Free self-host** under $10M ARR; LTX Studio subscription ~$35/mo; fal hosted per-clip |
| Max single clip | **20 sec at native 4K, 50 fps** |
| Resolutions | 480p draft, 1080p, **native 4K** |
| Aspect ratios | 16:9, 9:16, 1:1 |
| Latency | **9-12 min per 10-sec 4K clip on RTX 4090**; 2-4 min per 1080p draft; **~18× faster than Wan 2.2** at equivalent quality |
| Quality (Arena Elo) | **LTX-2 Pro ~1,130** — highest-ranked open-weight model on Artificial Analysis |
| Brand safety | Self-host = full control |
| Reference image | Yes (I2V, start/end frame) |
| Camera motion | Prompt-driven + LoRA extensions |
| Character consistency | Moderate; LoRA fine-tuning available (official trainer in repo) |
| Reliability | Your infrastructure |
| Commercial license | **Permissive — free for commercial use under $10M ARR** |
| Watermark | None |
| Multi-language | English + multilingual audio generation native |
| SDKs | `ltx-2` Python package, ComfyUI nodes |
| Notable users | LTX Studio, independent creators, self-hosted brand pipelines |
| Best fit | **The #1 self-host choice in April 2026** — 4K + audio + permissive license + active development |
| Worst fit | Real-time use cases (still batch-oriented), teams without GPU ops |

---

## Decision matrix

| Provider | Model | API $/sec (list) | Max clip | Top res | Quality tier (Elo) | Char consistency | Brand safety | Commercial OK | Typical latency |
|---|---|---|---|---|---|---|---|---|---|
| Google | Veo 3.1 | $0.40 (w/ audio) | 8s | 1080p / 4K preview | Top (1,212) | Weak | Strong + indemnity | Yes (Vertex) | 2-5 min |
| Google | Veo 3.1 Fast | $0.15 | 8s | 1080p | Top (1,211) | Weak | Strong + indemnity | Yes | 45-90s |
| Google | Veo 3.1 Lite | ~$0.05 | 8s | 720p | Good | Weak | Strong + indemnity | Yes | 30-60s |
| OpenAI | Sora 2 | $0.10 | 10s | 720p | Good | Weak | Strong, moving wm | Yes | 1-3 min |
| OpenAI | Sora 2 Pro | $0.30-0.50 | 20s | 1024p | Top | Weak | Strong | Yes | 2-5 min |
| **OpenAI** | **Sora 2 ALL** | **SHUTDOWN** | — | — | — | — | — | **Sep 24, 2026 EOL** | — |
| Runway | Gen-4.5 | $0.12 | 10s | 4K | Top (1,223) | **Best (References)** | Moderate | Yes | <60s |
| Runway | Gen-4 Turbo | $0.05 | 10s | 1080p | Good | Very good | Moderate | Yes | <45s |
| Runway | Aleph (V2V) | $0.15 | 5s | 1080p | Good | N/A (edit) | Moderate | Yes | 60s |
| Luma | Ray 3.14 | ~$0.20-0.30 (1080p) | 10s | 1080p+HDR | Good | Good (Modify) | Moderate | Yes | 45-120s |
| Pika | Pika 2.2 | $0.04/sec ($0.20/5s 720p) | 25s (frames) | 1080p | Mid | Moderate | **Weak (NSFW bypass)** | Yes | 30-90s |
| ByteDance | Seedance 2.0 Pro | $0.03 | 15s | 1080p | **#2 Top (1,274)** | **Top (multi-shot)** | Opaque | Yes (BytePlus) | 60-120s |
| ByteDance | Seedance 1.5 Pro | ~$0.14 | 10s | 1080p | Good | Good | Opaque | Yes (GA) | 60s |
| Kuaishou | Kling 3.0 Pro | $0.224 (fal: $0.029) | 15s | 1080p+4K img | Top (1,243) | **Top (Bind Subject)** | Chinese TOS | Yes (paid) | 60-180s |
| Kuaishou | Kling 2.5 Turbo | $0.07 | 10s | 1080p | Good (1,212) | Good | Chinese TOS | Yes (paid) | 45-90s |
| MiniMax | Hailuo 02 Pro | $0.08 | 10s | 1080p | Good | Good (S2V-01) | **Strong multi-layer** | Yes | 60-120s |
| MiniMax | Hailuo 02 Std | $0.045 | 6s | 768p | Mid | Good | Strong | Yes | 45-90s |
| Tencent | Hunyuan 1.5 | ~$0.04 (fal $0.40/clip) | 15s | 1080p | Good | Weak | Self-host = own | Yes (weights) | 2-5 min SH |
| Stability | SVD-XT | ~$0.10 | 4s | 576p | **Obsolete** | None | Self-host = own | Yes | 20-60s |
| Genmo | Mochi 1 | Free SH | 5.4s | 480p | Outdated | None | Self-host = own | Yes (Apache 2.0) | Minutes SH |
| THUDM | CogVideoX 1.5 | ~$0.02 / free SH | 10s | 768×1360 | Mid | Limited | Self-host = own | Yes (Apache 2.0) | 1-3 min SH |
| Lightricks | LTX-2.3 | Free SH; fal varies | 20s | **Native 4K** | **Top OSS (1,130)** | Moderate + LoRA | Self-host = own | **Yes (<$10M ARR)** | 9-12 min 4K SH |

*SH = self-host. List pricing; resellers (fal.ai) often 30-70% cheaper for Chinese models.*

---

## "Best for X" recommendation matrix

| Use case | Primary pick | Secondary | Rationale |
|---|---|---|---|
| **Atmospheric B-roll 3-5 sec** | **Luma Ray 3.14** | Hailuo 02 Pro | Best physics/motion realism for ambient lifestyle at moderate cost |
| **Talking-head avatar** | **Google Veo 3.1** | Runway Act-Two | Only provider with native multilingual lip-sync + indemnity |
| **Product-shot regeneration** | **Runway Gen-4** (with References) | Seedance 2.0 Pro | Reference-image lock is non-negotiable for product consistency; Runway leads, Seedance is cheapest alt |
| **Character consistency across cuts** | **Kling 3.0 Pro** (fal) | Runway Gen-4.5 | Bind Subject + multi-shot logic = killer feature; Runway is Western-TOS fallback |
| **Cost-optimized batch (worst acceptable)** | **Seedance 2.0 Lite** ($0.01/sec) | Veo 3.1 Lite ($0.05) or Kling 2.5 Turbo ($0.07) | 20-40× cheaper than premium tier; once Seedance 2.0 API goes GA |
| **Top-quality hero shot** | **Veo 3.1** (1080p/4K) | Runway Gen-4.5 4K | Veo wins on cinematic polish + audio + indemnity for brand hero moments |
| **Self-host / data sovereignty** | **LTX-2.3** | Hunyuan Video 1.5 | LTX is the only OSS 4K + audio + permissive license stack |
| **Multi-aspect-ratio batch** | **Pika 2.2** | Veo 3.1 | 7 aspect ratios in one call beats everyone |
| **Video editing (V2V)** | **Runway Aleph** | Luma Ray 3 Modify | Both are dedicated V2V; Aleph is pricier but more mature |

---

## Multi-provider abstraction: how the Nucleus generator should route

The pipeline generates 100+ brand-safe 5-10 sec clips/day. No single provider wins every clip type, and costs vary by ~20× between tiers. The generator agent should route per-clip via a **quality/cost/safety-tier decision tree**:

```
choose_provider(clip):
    # 1. Hard brand-safety gate
    if clip.requires_indemnity or clip.hero_shot:
        return "veo_3_1" (1080p, audio-on)

    # 2. Character-carry-over clips
    if clip.uses_brand_character_reference:
        if clip.western_TOS_required:
            return "runway_gen4"  (References API)
        else:
            return "kling_3_pro" (via fal)  # cheaper and often better

    # 3. Atmospheric / physics-heavy B-roll
    if clip.type in ("lifestyle", "ambient", "product_motion"):
        return "luma_ray_3_14"  (1080p standard, not HDR)

    # 4. Talking-head dialogue clip
    if clip.has_dialogue:
        return "veo_3_1"  (only provider with first-class lip-sync)

    # 5. Multi-shot narrative from single prompt
    if clip.multi_shot_cuts:
        return "seedance_2_pro" if SEEDANCE_API_GA else "kling_3_pro"

    # 6. Cheap batch fallback (acceptable quality)
    if clip.cost_optimized:
        return "seedance_2_lite" or "kling_2_5_turbo" or "veo_3_1_lite"

    # 7. Default
    return "hailuo_02_pro"  # best cost/quality balance
```

**Implementation guidance:**

- **Abstraction layer: use fal.ai as the primary broker.** Fal hosts Veo 3, Kling 3, Hailuo, Pika, Hunyuan, LTX-2, and Luma Ray behind one API key and one billing line, at discounted rates for Chinese models. Use direct providers only for Runway (Gen-4 References isn't on fal), Vertex AI for Veo 3.1 with indemnity, and BytePlus for Seedance once GA.
- **Normalize on a common schema:** `{provider, model, prompt, reference_images[], seed, duration, aspect_ratio, resolution, camera_directives, negative_prompt}`.
- **Async task queue with retry:** Every provider uses async submit→poll. Build a single task executor with 429/503 retries, provider-failover on hard errors (Runway→Kling→Veo chain), and webhook callbacks where supported (Runway supports them; BytePlus does).
- **Per-provider rate-limit budgeting:** Runway default is 3-5 concurrent; Veo has project quotas; Kling has tier-based limits. Track concurrent-in-flight per provider.
- **Cost guard:** Estimate credit cost before dispatch and reject any clip that exceeds a configured `max_cost_per_clip_usd`.
- **Output normalization:** Always strip provider watermarks (where legally permitted) and re-encode to the brand's container (1080p H.264, loudnorm'd audio) in a post-gen ffmpeg step.

---

## Risk callouts

| Risk | Provider(s) | Severity | Mitigation |
|---|---|---|---|
| **Hard sunset** | **OpenAI Sora 2** | **Critical** | App dies Apr 26; API dies Sep 24, 2026. Do not start new integrations. |
| **Pre-GA API** | ByteDance Seedance 2.0 (Volcengine official), Runway Gen-4.5 | High | Official Seedance 2.0 API not GA per [Volcengine docs Mar 27, 2026](https://blog.laozhang.ai/en/posts/seedance-2-api). Use Seedance 1.5 Pro today, add 2.0 when GA. Runway Gen-4.5 appears on leaderboard but "API unavailable" — use Gen-4 until confirmed. |
| **Pricing volatility** | Kling AI | Medium-High | Ultra tier went from $128 to $180/mo (+41%) in 6 months. Reseller prices (fal) are much more stable — pin to fal pricing for budget. |
| **NSFW bypass** | Pika 2.2 | Medium-High (brand risk) | T2VSafetyBench rates Pika as highest bypass risk. Do not use for brand work where safety review cost exceeds savings. |
| **Data residency** | Kling (Kuaishou), Seedance (ByteDance), Hunyuan (Tencent) | Medium (brand-dependent) | Chinese providers route through Chinese data centers by default; BytePlus offers Singapore region. For US/EU regulated brands, prefer Veo 3.1 or Runway. |
| **No commercial indemnity** | All non-Google providers | Medium | Only Google Vertex AI Veo 3/3.1 includes generative-AI indemnity. For high-stakes ad spend, legal should review. |
| **Character IP collisions** | All providers | Medium | Prompt "in style of [brand mascot]" can still generate infringing content even with brand-owned references. Post-gen human review is required. |
| **Watermark enforcement change** | Sora app-tier, Veo SynthID | Low-Medium | SynthID is invisible and persists through edits — do not attempt to strip. Sora API is watermark-free today but could change; no such policy risk for Veo or Runway. |
| **Open weights model rot** | SVD, Mochi 1 | High | Both models were SOTA at release but have been overtaken; use LTX-2.3 or Hunyuan 1.5 for any new self-host work. |
| **Queue degradation** | Veo 3.1 at peak | Medium | 6-min worst-case latency during US business hours on Vertex. Route non-hero shots to Veo 3.1 Fast or Lite to preserve premium quota. |

---

## Recommended default stack for Nucleus (April 2026)

1. **Primary premium**: Veo 3.1 via Vertex AI — hero shots, dialogue, anything requiring indemnity. Budget ~$3.20 per 8-sec clip with audio.
2. **Primary character-consistency**: Runway Gen-4 + Gen-4 References via official API — all brand character carry-over clips. Budget ~$0.05/sec Turbo or $0.12/sec Gen-4.5.
3. **Primary volume/batch**: Kling 2.5 Turbo via fal.ai or Hailuo 02 Pro via fal — cheap, reliable, cinematic camera control. Budget ~$0.07/sec and $0.08/sec respectively.
4. **Atmospheric B-roll**: Luma Ray 3.14 via official Luma API — physics-realistic motion. Budget ~$0.20-0.30/sec.
5. **Cost-floor fallback**: Veo 3.1 Lite for brand-safe cheap clips (~$0.05/sec) OR Seedance 1.5 Pro on BytePlus for lowest-cost sampling.
6. **Self-host fallback (optional)**: LTX-2.3 on an internal H100 node for sovereign/privacy-sensitive runs; 4K + audio + Apache-style permissive license under $10M ARR.
7. **Explicitly excluded**: OpenAI Sora 2 (sunset), Stable Video Diffusion (obsolete), Mochi 1 (obsolete + hardware cost), CogVideoX (frame rate too low for brand polish), Pika 2.2 for anything safety-critical.

Total production cost envelope for 100 clips/day, mixed stack: **~$80-$250/day** depending on hero-shot ratio. Premium-only (all Veo 3.1 with audio): ~$320/day.

---

## Sources

### Pricing and product pages
- [Google Vertex AI generative AI pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)
- [Gemini Developer API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Google Veo 3.1 generation docs](https://ai.google.dev/gemini-api/docs/video)
- [Akool Veo 3.1 cost guide](https://akool.com/blog-posts/google-veo-3-1-cost-guide)
- [Veo 3.1 per-second pricing](https://www.aifreeapi.com/en/posts/veo-3-1-pricing-per-second-gemini-api)
- [OpenAI Sora 2 launch page](https://openai.com/index/sora-2/)
- [OpenAI Sora discontinuation notice](https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation)
- [TheDecoder: Sora shutdown timeline](https://the-decoder.com/openai-sets-two-stage-sora-shutdown-with-app-closing-april-2026-and-api-following-in-september/)
- [Sora 2 API pricing guide](https://www.aifreeapi.com/en/posts/cheapest-sora-2-video-api)
- [Runway API pricing & costs](https://docs.dev.runwayml.com/guides/pricing/)
- [Runway pricing plans](https://runwayml.com/pricing)
- [Runway API tiers & limits](https://docs.dev.runwayml.com/usage/tiers/)
- [Runway Gen-4 research page](https://runwayml.com/research/introducing-runway-gen-4)
- [Runway status](https://status.runway.team/)
- [Luma Dream Machine pricing](https://lumalabs.ai/pricing)
- [Luma Ray 3 product page](https://lumalabs.ai/ray)
- [Luma Ray 3 Modify announcement](https://lumalabs.ai/news/ray3-modify)
- [Dataconomy: Luma Ray 3 character consistency](https://dataconomy.com/2025/12/18/luma-ai-brings-character-consistency-to-video-with-ray3/)
- [Pika 2.2 on fal.ai](https://fal.ai/models/fal-ai/pika/v2.2/text-to-video)
- [Pika acceptable-use policy](https://pika.art/acceptable-use-policy)
- [T2VSafetyBench paper](https://arxiv.org/html/2407.05965v1)
- [Kling AI developer pricing](https://klingai.com/global/dev/pricing)
- [Kling AI official site](https://kling.ai/dev/pricing)
- [Atlas Cloud: Kling 3.0 review](https://www.atlascloud.ai/blog/guides/kling-3.0-review-features-pricing-ai-alternatives)
- [Atlas Cloud: Kling 3.0 character consistency guide](https://www.atlascloud.ai/blog/guides/solving-character-inconsistency-a-guide-to-kling-3.0-image-to-video-mode)
- [Kling 3.0 vs 2.6 comparison](https://www.imagine.art/blogs/kling-3-0-vs-kling-2-6-comparison)
- [MiniMax Hailuo 2.3 announcement](https://www.minimax.io/news/minimax-hailuo-23)
- [MiniMax API pricing docs](https://platform.minimax.io/docs/guides/pricing)
- [Segmind: MiniMax pricing](https://www.segmind.com/models/minimax-ai/pricing)
- [Hailuo 02 Pro on fal.ai](https://fal.ai/models/fal-ai/minimax/hailuo-02/pro/text-to-video)
- [ByteDance Seed / Seedance](https://seed.bytedance.com/en/)
- [Seedance 2.0 pricing breakdown](https://www.atlascloud.ai/blog/case-studies/seedance-2.0-pricing-full-cost-breakdown-2026)
- [Seedance 2.0 API status March 2026](https://blog.laozhang.ai/en/posts/seedance-2-api)
- [BytePlus Seedance product page](https://www.byteplus.com/en/product/seedance)
- [Tencent HunyuanVideo 1.5 on HuggingFace](https://huggingface.co/tencent/HunyuanVideo-1.5)
- [HunyuanVideo GitHub](https://github.com/Tencent-Hunyuan/HunyuanVideo)
- [Hunyuan Video on fal.ai](https://fal.ai/models/fal-ai/hunyuan-video)
- [Stability AI Stable Video](https://stability.ai/stable-video)
- [SVD on HuggingFace](https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt)
- [Stable Diffusion commercial license](https://terms.law/ai-output-rights/stable-diffusion/)
- [Genmo Mochi 1 blog](https://www.genmo.ai/blog/mochi-1-a-new-sota-in-open-text-to-video)
- [Mochi 1 on HuggingFace](https://huggingface.co/genmo/mochi-1-preview)
- [Mochi GitHub](https://github.com/genmoai/mochi)
- [CogVideoX GitHub](https://github.com/zai-org/CogVideo)
- [CogVideoX-5B HuggingFace](https://huggingface.co/zai-org/CogVideoX-5b)
- [LTX-Video GitHub](https://github.com/Lightricks/LTX-Video)
- [LTX-2 GitHub](https://github.com/Lightricks/LTX-2)
- [Lightricks LTX-2 open-source press release](https://www.globenewswire.com/news-release/2026/01/06/3213304/0/en/Lightricks-Open-Sources-LTX-2-the-First-Production-Ready-Audio-and-Video-Generation-Model-With-Truly-Open-Weights.html)
- [LTX-2 product site](https://ltx-2.ai/)

### Benchmarks and reviews
- [Artificial Analysis text-to-video leaderboard](https://artificialanalysis.ai/video/leaderboard/text-to-video)
- [Artificial Analysis image-to-video leaderboard](https://artificialanalysis.ai/video/leaderboard/image-to-video)
- [AI/ML API: Best AI video generators 2026](https://aimlapi.com/blog/best-ai-video-generators-2026-veo-3-1-kling-sora-2-seedance-more-compared)
- [LaoZhang: Best AI video model 2026 comparison](https://blog.laozhang.ai/en/posts/best-ai-video-model)
- [VentureBeat: Runway Gen-4 character consistency](https://venturebeat.com/ai/runways-gen-4-ai-solves-the-character-consistency-challenge-making-ai-filmmaking-actually-useful)
- [DevTk: AI video API pricing 2026 comparison](https://devtk.ai/en/blog/ai-video-generation-pricing-2026/)
- [Hyperstack: Best open source video models 2026](https://www.hyperstack.cloud/blog/case-study/best-open-source-video-generation-models)
- [WhiteFiber: Open source video models comparison](https://www.whitefiber.com/blog/best-open-source-video-generation-model)
- [InVideo: Kling vs Sora vs Veo vs Runway](https://invideo.io/blog/kling-vs-sora-vs-veo-vs-runway/)
- [Sitepoint: Seedance 2.0 vs Sora vs Runway Gen-4](https://www.sitepoint.com/seedance2-vs-sora2-vs-runway-gen4/)

### Brand safety and licensing
- [Veo 3 watermarking guide](https://www.hireoverseas.com/blogs/google-veo-3-watermarking)
- [Veo 3.1 commercial use guide](https://www.glbgpt.com/hub/can-i-use-veo-3-1-for-commercial-use/)
- [Skywork: Veo 3.1 for agencies](https://skywork.ai/blog/ai-video/veo-3-1-for-agencies-and-commercial-use-2/)
- [VidPros: AI commercial rights by platform 2026](https://vidpros.com/ai-platforms-rights/)
- [Launching Sora responsibly](https://openai.com/index/launching-sora-responsibly/)
- [Skywork: Sora 2 commercial license guide](https://skywork.ai/blog/sora-2-commercial-license-guide/)
