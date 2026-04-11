# Stack Evaluation: Avatar, Voice & Music AI Providers (2026)

> **Scope.** This document evaluates the avatar, voice, and music AI provider landscape as of **April 2026** for use inside a server-side pipeline that programmatically assembles brand-safe video components at scale. Every provider is assessed against the same criteria so that the Nucleus pipeline can make substitution decisions without re-running full research.

> **Last verified:** 2026-04-09. Prices, model versions, and licensing move fast in this category; re-verify before signing any enterprise contract.

---

## 1. Avatar / Talking-Head Video Providers

### 1.1 Provider deep-dive

#### HeyGen — Avatar IV
- **Latest model.** Avatar IV (generally available, 2026). A diffusion-transformer head model that drives a single reference photo or short video with TTS or imported audio. HeyGen also ships Photo Avatar, Interactive Avatar, and Realtime Avatar variants on the same API.
- **API.** REST `/v2/video/generate` plus `/v1/streaming` for realtime, both documented at `api.heygen.com`. Async job model: POST → poll → MP4 URL. SDKs in JS, Python, and cURL.
- **Pricing.** API-only plans: Free/Trial, Pro API $99/mo (100 credits), Scale API $330/mo (660 credits), Enterprise custom. **Avatar IV burns 1 credit per 10 seconds of output (~6 credits/minute).** A 60s variant therefore costs ~$0.60–$0.90 on Pro API, dropping toward ~$0.35 on Scale.
- **Lip-sync quality.** Best-in-class for English, Spanish, German, Portuguese. Micro-expressions, eye darts, and head micro-motion are convincing in A/B tests. Mandarin/Thai/Arabic show mild drift under fast speech.
- **Languages.** TTS + lip-sync in **175+ languages** with automatic lip-reshape on translation. This is the strongest translation pipeline in the category.
- **Custom avatar.** Instant Avatar from ~2-minute selfie video (included on Creator/Team). Studio Avatar (full body, recorded in HeyGen studio or partner) ~$500–$1,500 one-time; Enterprise bundles negotiate it in. Avatar IV accepts a single reference photo → usable within minutes.
- **Reference image support.** Yes, single still image is a first-class input to Avatar IV.
- **Realtime vs batch.** Both. Batch is the default API; Streaming Avatar supports real-time WebRTC at ~400–800 ms glass-to-glass.
- **Commercial license.** Full commercial on Creator/Team/API paid tiers. Terms explicitly permit paid ads, UGC, and client work.
- **Brand safety.** Mature moderation stack (face matching, prohibited-content filter, consent verification on custom avatars). Celebrity/politician lockdown is enforced.
- **Notable users.** Publicly named customers include Salesforce, Accenture, McKinsey, Unilever, the BBC, and Moderna.

#### Tavus — Phoenix-4 (CVI) + Replica (batch)
- **Latest model.** **Phoenix-4** (Feb 2026) Gaussian-diffusion head model with sub-600 ms end-to-end conversational latency; paired with **Raven-1** (emotional perception) and **Sparrow-1** (turn-taking). Replica 2.0 handles pre-rendered batch.
- **API.** REST + WebRTC. `/v2/replicas`, `/v2/videos`, `/v2/conversations`. Live conversations run over Daily.co-backed WebRTC rooms.
- **Pricing.** Free 25 live minutes → Starter $59/mo → Growth $375/mo → Enterprise custom. Usage is billed in Interactions: **1 min of CVI ≈ 6.5 Interactions**, **1 text message ≈ 1.2 Interactions**, overage $20 / 1,300 Interactions (~$0.015/interaction). So a 60-s CVI minute runs **~$0.10 on overage** and cheaper in bundle. Replica batch video is billed separately at roughly $0.10–$0.25 per rendered minute depending on plan.
- **Lip-sync quality.** Excellent for real-time; slightly softer than HeyGen Avatar IV on fine texture but better at emotional reactivity (gaze, micro-nods, active listening).
- **Languages.** Sparrow-1 is multilingual; ~30 languages for TTS, English-first for turn-taking accuracy.
- **Custom avatar.** Personal Replica from **2-minute consent + training video** (free on all tiers). Studio Replica (full-body, studio recording) via partner production; ~$1–2k one-time. Turnaround typically <4 hours for Personal Replica.
- **Reference image support.** Phoenix-4 takes a short reference video; single-image is supported but quality degrades vs a motion reference.
- **Realtime vs batch.** Tavus is the **only provider in the set that is built realtime-first**. CVI is the flagship; batch is a secondary `/videos` endpoint.
- **Commercial license.** Full commercial on paid plans. Uses Daily.co for transport (SOC2 Type II).
- **Brand safety.** Mandatory consent video for any Replica; face-swap of a non-consenting likeness is blocked. Content moderation via OpenAI moderation + internal classifiers.
- **Notable users.** Delphi.ai, Intercom, Lindy, Stytch, Glean, Siena.

#### Synthesia — Enterprise
- **Latest model.** Synthesia EXPRESS-2 avatars (2026). Studio-grade talking heads; Creator/Enterprise plans.
- **API.** REST API gated to Enterprise only. `/v2/videos` synchronous or webhook callback. No public pricing.
- **Pricing.** Starter $18/mo, Creator $64/mo, Enterprise $custom (typical $10k–$100k+ ACV). Studio Express-1 custom avatars **$1,000/year** add-on on annual plans.
- **Lip-sync quality.** Broadcast-level, though noticeably stiffer than HeyGen or Tavus Phoenix-4. Designed for compliance-friendly corporate video, not UGC.
- **Languages.** 140+ languages; translation + lip-sync included on Enterprise.
- **Custom avatar.** Personal Avatar: record 15-min scripted video → 24–72h processing, included on Starter/Creator annual. Studio Express: green-screen session at their London studio, ~10-day turnaround, $1k/yr.
- **Reference image support.** Not supported — Synthesia requires a full motion capture session.
- **Realtime vs batch.** Batch only.
- **Commercial license.** Full commercial on Creator/Enterprise. Famous for its hard-line moderation: every script passes a content review.
- **Brand safety.** **Highest bar in the category.** Human-in-the-loop review for sensitive topics. Compliance certifications (SOC 2, ISO 27001, GDPR, HIPAA BAA on Enterprise).
- **Notable users.** Zoom, Heineken, Google, Amazon, Reuters, Tiffany & Co., BSH, WPP.

#### D-ID — Studio + API
- **Latest model.** Expressive Avatars (2025–2026). Image-driven talking heads via "Live Portrait"–style method.
- **API.** Well-documented REST (`/talks`, `/animations`, `/clips`, `/streams`). Most mature streaming API of the early entrants.
- **Pricing.** Trial free / Pro $29/mo / Advanced $196/mo / Enterprise custom. API minutes are deducted from the same balance as Studio. Rough **$0.10–$0.30 per rendered minute** on Advanced, cheaper on Enterprise.
- **Lip-sync quality.** Good for single-image driven content; lower fidelity than HeyGen Avatar IV on close-up shots but very fast and cheap.
- **Languages.** 100+ languages via TTS partners (Microsoft, ElevenLabs).
- **Custom avatar.** Pro tier: 1 voice clone + upload your own photo. Photo → talking head in seconds. No motion-capture required.
- **Reference image support.** First-class; D-ID was the original "photo to talking head" API.
- **Realtime vs batch.** Both. The `/streams` endpoint is the oldest real-time lip-sync API (used by ChatGPT voice demos, tutoring apps).
- **Commercial license.** Commercial allowed on Pro+. Enterprise adds a deeper indemnity.
- **Brand safety.** Celebrity block-list, consent required for any uploaded likeness, moderation on uploaded audio.
- **Notable users.** Microsoft (Azure AI Studio integration), Teleperformance, NatWest, JPMorgan, McCann.

#### Akool — Face Swap + Lip Sync
- **Latest model.** Akool Streaming Avatar + Video Translation 2.0 (2026).
- **API.** Public REST API at `openapi.akool.com`. Face-swap, lip-sync, talking photo, video translation.
- **Pricing.** Credit system: Pro $30/mo, Max $90/mo, Enterprise custom. Face-swap ~$0.10/min rendered; video translation ~$0.20/min.
- **Lip-sync quality.** Strong for ad/marketing use cases; preserves skin texture and micro-expressions well on swap. Not as robust on long-form talking head as HeyGen.
- **Languages.** 150+ languages for translation.
- **Custom avatar.** Upload-a-photo or upload-a-video; no studio required.
- **Reference image support.** Yes, primary workflow.
- **Realtime vs batch.** Streaming Avatar is live; face-swap and translation are batch.
- **Commercial license.** Paid tiers include commercial rights. **Because it is face-swap first, consent/identity controls are the primary risk.**
- **Brand safety.** Lower bar than HeyGen/Synthesia: the face-swap flow means celebrity deepfake risk must be managed by the caller. Celebrity blocklist exists but is less aggressive.
- **Notable users.** Netflix (localization pilot), GMA Network, Snap, multiple UGC ad platforms.

#### Hour One — Enterprise Virtual Humans
- **Latest model.** Real Character 3 (2025–2026). Studio-recorded virtual humans marketed for L&D and corporate comms.
- **API.** Studio API via REST; Zapier integration; CSV bulk import.
- **Pricing.** Lite $25/mo, Business $112/mo, Enterprise custom. API access is Enterprise-tier.
- **Lip-sync quality.** Good on the canned character library; custom characters require studio recording so quality matches Synthesia-tier.
- **Languages.** 100+ languages.
- **Custom avatar.** Requires in-person or supervised video shoot. Custom "Real Character" ~$2k–$10k one-time.
- **Reference image support.** No.
- **Realtime vs batch.** Batch only.
- **Commercial license.** Enterprise contracts include indemnity.
- **Brand safety.** Strong (recorded talent, signed releases).
- **Notable users.** NBC, Berlitz, DHL, Nice, Genpact.

#### Colossyan — Corporate Avatars
- **Latest model.** Colossyan Creator 4 (2026) — focused on instructional/corporate content with multi-speaker scenes.
- **API.** API available as an add-on — not the core product. Starter $19/mo (annual) → Pro $70/mo → Business/Enterprise custom. API add-on grants ~360 min/year.
- **Pricing.** Video costs ~$0.50–$1.00 per finished minute depending on plan; API is a bolt-on rather than primary delivery.
- **Lip-sync quality.** Corporate-grade, similar to Synthesia's visual bar but cheaper.
- **Languages.** 70+.
- **Custom avatar.** Instant Avatar from selfie, or Studio Avatar (partner recording, ~$1k).
- **Reference image support.** Limited; motion video preferred.
- **Realtime vs batch.** Batch only.
- **Commercial license.** Commercial on paid tiers.
- **Brand safety.** Moderate.
- **Notable users.** BDO, Electrolux, Vodafone, Novo Nordisk.

#### Vidnoz — Consumer Tier
- **Latest model.** Vidnoz AI Avatar 3 (2025–2026) — optimized for volume and price rather than fidelity.
- **API.** API tier exists but is documented lightly; intended for affiliate creators.
- **Pricing.** Free (with watermark) → $19.99/mo (~15 rendered minutes) → Business $88/mo. API add-on ~$50–$150/mo.
- **Lip-sync quality.** Noticeably lower than HeyGen/Tavus/Synthesia; watermarked on free tier.
- **Languages.** 140+.
- **Custom avatar.** Upload-a-photo; very low friction.
- **Reference image support.** Yes.
- **Realtime vs batch.** Batch only.
- **Commercial license.** Paid tiers permit commercial; enterprise indemnity is thin.
- **Brand safety.** Weaker moderation; not recommended for paid media use without a pre-flight classifier.
- **Notable users.** Primarily UGC-affiliate creators; few named enterprise logos.

#### Open-Source Lip-Sync Stack (local)
- **SadTalker** (Tencent, CVPR 2023) — single image + audio → talking head. Apache-2.0 weights; good for static explainer content; quality now trailing newer diffusion models. Runs on a single consumer GPU.
- **MuseTalk** (TMElyralab, Tencent) — 30+ FPS on a 24GB GPU; best-in-class real-time open-source lip-sync for dubbing. MIT code, non-commercial weights (read the card carefully).
- **Hallo3** (Fudan/Baidu, Dec 2024) — diffusion transformer portrait animation, currently the highest-fidelity open release; weights non-commercial research.
- **EchoMimic v2** (Ant Group) — audio-driven portrait with editable landmark conditions; stronger at pose control; Apache-2.0 code but weights under custom terms.
- **V-Express** (Tencent) — audio + pose conditioning; middle-tier quality; weights non-commercial.
- **Infra cost.** A single A10G/L4 on Modal/RunPod renders a 30-s 512²@25fps clip in ~60–120 s. Amortized hardware cost works out to **~$0.03–$0.08 per rendered minute**, excluding eng overhead.
- **License trap.** Most "open" talking-head weights are **research/non-commercial** even when the code is MIT/Apache. Audit every weight before shipping.

### 1.2 Avatar decision matrix

| Provider | Latest model | Realtime | Per-minute (batch) | Languages | Custom avatar | Reference image | Commercial | Brand safety | Best fit |
|---|---|---|---|---|---|---|---|---|---|
| **HeyGen** | Avatar IV | Yes (WebRTC) | ~$0.35–$0.90 | **175+** | Instant (photo/video) + Studio | Yes | Full | High | Scale UGC + translation |
| **Tavus** | Phoenix-4 | **Yes (<600ms)** | ~$0.10–$0.25 | 30+ | Personal Replica (2-min video) | Partial | Full | High | Conversational agents |
| **Synthesia** | EXPRESS-2 | No | $custom (~$1–$3/min eff.) | 140+ | Studio Express ($1k/yr) | No | Full + indemnity | **Highest** | Regulated enterprise |
| **D-ID** | Expressive Avatars | Yes | ~$0.10–$0.30 | 100+ | Photo upload | Yes | Full | High | Low-cost streaming |
| **Akool** | Streaming Avatar 2 | Yes | ~$0.10–$0.20 | 150+ | Photo/video upload | Yes | Full | **Moderate** | Ad/localization |
| **Hour One** | Real Character 3 | No | $custom | 100+ | Studio recording | No | Full + indemnity | High | L&D, corporate comms |
| **Colossyan** | Creator 4 | No | ~$0.50–$1.00 | 70+ | Instant or Studio | Limited | Full | Moderate | Training content |
| **Vidnoz** | Avatar 3 | No | ~$0.30–$1.33 | 140+ | Photo upload | Yes | Full | **Low** | Consumer/affiliate UGC |
| **MuseTalk (OSS)** | v1.5 | Possible (self-host) | ~$0.03–$0.08* | N/A (BYO TTS) | BYO image | Yes | Non-commercial weights | Self-managed | Local dev / fallback |
| **Hallo3 (OSS)** | Dec 2024 | No (30s/clip on L4) | ~$0.05–$0.10* | N/A | BYO image | Yes | Research-only weights | Self-managed | Highest quality OSS |

<sub>*Infra-only; excludes engineering, QA, and indemnity.</sub>

### 1.3 Avatar recommendations
- **Primary pick: HeyGen (Avatar IV).** Combination of Avatar IV fidelity, 175-language lip-resync, photo-only reference, and a well-structured Scale API tier is unmatched for a programmatic pipeline that mass-produces brand-safe variants. $330/mo Scale API is the sweet spot.
- **Backup pick: Tavus (Replica batch).** Swap Tavus in if HeyGen raises prices, throttles credits, or if the pipeline shifts toward conversational use cases where sub-600 ms latency matters. Tavus also wins if you need "always-on" interactive avatars in addition to batch render.
- **Regulated-vertical override: Synthesia.** If a customer is in finance, pharma, or government and requires indemnity + human-review workflow, route their jobs through Synthesia Enterprise and eat the higher per-minute cost.
- **Local fallback: MuseTalk + a custom TTS.** Keep a self-hosted MuseTalk worker on Modal/RunPod as the "the API is down and we have to ship" path. Acceptable quality for rough-cuts, unacceptable for hero variants.

---

## 2. Voice Synthesis / Cloning Providers

### 2.1 Provider deep-dive

#### ElevenLabs — v3, Multilingual v2, IVC, PVC
- **Latest model.** **Eleven v3** (alpha → GA early 2026). Supports 70+ languages, inline audio tags (`[whispers]`, `[laughs]`, `[sad]`), multi-speaker dialogue, and emotion direction. Multilingual v2, Turbo v2.5, and Flash v2.5 remain for latency-critical and cheap workloads.
- **API.** REST + WebSocket streaming (`/v1/text-to-speech/{voice_id}/stream-input`). Mature SDKs in Python, JS, Go, and Swift. Supports Studio projects for long-form.
- **Pricing (API).** Flash/Turbo: **$0.06 per 1,000 characters**. Multilingual v2 / v3: **$0.12 per 1,000 chars**. API plans: API Pro $99/mo (100 credits), API Scale $330/mo (660 credits). v3 was at an 80% promotional discount through mid-2025; that window has closed.
- **Supported languages.** 70+ on v3; 32 on Multilingual v2.
- **Voice clone quality.** Instant Voice Cloning (IVC) from ~1 minute of audio (Starter+), Professional Voice Cloning (PVC) from ≥30 min (Creator+). PVC quality is the industry benchmark for TTS cloning.
- **Emotion control.** Inline audio tags (v3) plus stability/style sliders. Best-in-class.
- **Prosody control.** Per-sentence and per-token stability control; SSML-like audio tags in v3.
- **Streaming.** Yes, WebSocket input → audio chunks at ~300 ms TTFB.
- **Commercial license.** Full commercial on Starter+. No usage of cloned voices of public figures without consent.
- **Brand safety.** Strongest moderation in TTS (voice verification captcha, prohibited content classifier, voice CAPTCHA for PVC). Fingerprints every generated file.
- **Notable users.** The Washington Post, New York Times audio, Bedtime Stories, HarperCollins audiobooks, Epic Games, Riot Games.

#### Cartesia — Sonic 2 / Sonic 3
- **Latest model.** **Sonic 3** (late 2025/early 2026) with real-time AI laughter and emotion; Sonic 2 still available. State-space model architecture (Mamba) → **<90 ms TTFB**.
- **API.** REST + WebSocket streaming; first-party Python SDK; voices tagged by language and style.
- **Pricing.** Usage-based: **1 credit per character** (Sonic) / **1.5 credits per character** (Pro Voice Cloning). Subscription tiers Free / Pro / Startup / Scale / Enterprise; Pro ~$49/mo. Pricing lands very close to ElevenLabs Multilingual per character in practice.
- **Languages.** 15+ (English-heavy).
- **Voice clone quality.** Instant + Pro Voice Cloning. Quality gap to ElevenLabs PVC is small and continues to close.
- **Emotion control.** Yes, including built-in laughter/sigh effects in Sonic 3.
- **Prosody control.** Good; explicit SSML-style tags.
- **Streaming.** **Best-in-class latency for voice agents** — Cartesia is the default TTS inside many LiveKit/Daily voice-agent builds.
- **Commercial license.** Paid tiers include commercial usage.
- **Brand safety.** Solid; consent verification on Pro Voice Cloning.
- **Notable users.** LiveKit, Retell, Vapi, Bland.ai, multiple Series-B voice-agent startups.

#### PlayHT 3.0
- **Latest model.** Play 3.0 Mini (low-latency) and Play 3.0 (quality).
- **API.** REST + gRPC streaming.
- **Pricing.** Creator $31.20/mo (3M chars/yr) or **Unlimited $29/mo** (no char cap for non-API). API: **$0.03–$0.08 per 1,000 chars** depending on volume.
- **Languages.** 140+ (via multilingual model).
- **Voice clone quality.** Instant Voice Clone from 30 s; custom voice models on Enterprise. Quality sits between Cartesia and ElevenLabs.
- **Emotion control.** Style/emotion presets, less granular than ElevenLabs tags.
- **Streaming.** Yes, ~300–500 ms TTFB.
- **Commercial license.** Paid tiers commercial.
- **Brand safety.** Moderate; similar controls to Cartesia.
- **Notable users.** ClickUp, Freshworks, Loom, Descript (partial).

#### Hume AI — Octave 2 + EVI 3
- **Latest model.** **Octave 2** (Oct 2025; 50% cost reduction vs Octave 1). EVI 3 adds empathic voice interface with full-duplex interruption.
- **API.** REST for Octave, WebSocket for EVI.
- **Pricing.** Free 10k chars, Creator $10/mo (100k chars), Pro $50/mo (500k chars), Scale $150/mo (2M chars), Business $500/mo. Overages: $0.13–$0.20 per 1k chars. EVI overage: $0.06/min beyond Pro's 1,200 included minutes.
- **Languages.** 15+ on Octave 2, English-first.
- **Voice clone quality.** Instant voice cloning; quality trails ElevenLabs PVC but emotional expressivity is unrivaled.
- **Emotion control.** **The unique selling point.** Native emotion embedding trained on Hume's own facial/vocal affect dataset. Instructed-style prompts like "sad, almost crying" actually work.
- **Prosody control.** Best-in-class; the model was trained to modulate prosody from affect embeddings.
- **Streaming.** Yes via EVI.
- **Commercial license.** Allowed on paid tiers.
- **Brand safety.** Strong; Hume explicitly built on ethical AI principles and its voice cloning requires consent verification.
- **Notable users.** Voicetext, Softbank, Character.ai (partial), various mental-health platforms.

#### Resemble AI
- **Latest model.** Chatterbox + Resemble 2026 voice engine (enterprise-focused).
- **API.** REST + streaming; on-prem/VPC option available.
- **Pricing.** Creator $30/mo, Professional $60/mo, Flex usage-based **~$0.006/second (~$0.36/min)**. Volume tiers $0.03–$0.15 per 1k chars.
- **Languages.** 60+.
- **Voice clone quality.** Strong; enterprise specialty is **deepfake detection** + localized deployment.
- **Emotion control.** Good.
- **Streaming.** Yes.
- **Commercial license.** Full commercial.
- **Brand safety.** Positions itself as the "safe" choice: Resemble Detect, watermarking (Resemblyzer), on-prem.
- **Notable users.** Netflix (dubbing pilots), Deloitte, Ernst & Young, Warner Music (experimentation).

#### Speechify (Studio + API)
- **Latest model.** Speechify Studio 2026 (Celebrity voices + custom).
- **API.** Public TTS API: **$10 per 1M characters pay-as-you-go** (simplest pricing in the category). Studio is a separate SaaS for creators.
- **Languages.** 60+.
- **Voice clone quality.** Middle tier; strong for audiobook-style narration.
- **Emotion control.** Limited.
- **Streaming.** Supported.
- **Commercial license.** Paid tiers commercial.
- **Brand safety.** Licensed celebrity voices (Snoop, Gwyneth Paltrow etc.) — useful if a client requests a specific voice.
- **Notable users.** Large consumer app (Speechify reader) — less enterprise B2B exposure.

#### Google Gemini TTS / Cloud TTS (Chirp 3 HD)
- **Latest models.** **Gemini 2.5 Pro TTS**, **Gemini 3.1 Flash TTS**, **Chirp 3 HD**.
- **API.** Gemini TTS via Vertex AI; Chirp via Cloud Text-to-Speech.
- **Pricing.** Gemini 2.5 Pro TTS: **$1.00/M input tokens, $20.00/M audio output tokens** (~$0.10/min). Flash: $0.50 / $10. Chirp 3 HD: **$0.030/1k chars** ($30/M). Generous free tier (1M free chars/mo).
- **Languages.** Chirp 3 HD: 30+ languages. Gemini TTS: English-first, expanding.
- **Voice clone quality.** Chirp HD has a custom-voice program (Enterprise, min commit). Not consumer voice-cloning.
- **Emotion control.** Gemini TTS supports natural-language style instructions ("Say this like you're reading a bedtime story").
- **Streaming.** Yes.
- **Commercial license.** Standard Google Cloud terms.
- **Brand safety.** **Highest institutional trust**; built-in content moderation; hyperscaler SLAs.
- **Notable users.** Duolingo, YouTube auto-dub, Google Assistant.

#### Microsoft Azure Neural TTS
- **Latest model.** Azure HD Voices V2 (2025–2026) and Neural TTS 400+ standard voices.
- **API.** REST + SDK + streaming (~200 ms TTFB).
- **Pricing.** Neural TTS: **$16/M characters** (real-time + batch). HD V2: $30/M. Long-form: $100/M. Custom Neural Voice (CNV) is an enterprise program ~$1–2k training + $0.024/char.
- **Languages.** 140+ languages, 500+ neural voices.
- **Voice clone quality.** CNV (Professional Custom Voice) is gated and requires Responsible AI review; quality is enterprise-grade.
- **Emotion control.** Built-in speaking styles via SSML (`<mstts:express-as style="cheerful">`).
- **Streaming.** Yes.
- **Commercial license.** Azure commercial terms + enterprise indemnity.
- **Brand safety.** **Highest bar among hyperscalers.** CNV requires signed consent, use-case review, and watermarking.
- **Notable users.** AT&T, BBC, Duolingo, Progressive, most Microsoft products.

#### Amazon Polly
- **Latest model.** **Generative voices** (10 new voices + 2 regions + bidirectional streaming as of Mar 2026).
- **API.** REST + bidirectional streaming.
- **Pricing.** Standard $4.80/M chars, **Neural $16/M chars**, **Generative $30/M chars**, Long-form $100/M. Free tier 1M Neural chars for first 12 mo.
- **Languages.** 40+ languages, 100+ voices.
- **Voice clone quality.** Brand Voice program (Enterprise, min-commit, studio-recorded). Not consumer cloning.
- **Emotion control.** Limited styles via SSML.
- **Streaming.** Yes (bidirectional as of 2026).
- **Commercial license.** AWS commercial.
- **Brand safety.** Hyperscaler trust + Brand Voice is studio-recorded.
- **Notable users.** NHS, Duolingo, CNN Money, BBC, many AWS reference logos.

#### OpenAI TTS (gpt-4o-tts / gpt-4o-mini-tts)
- **Latest model.** **gpt-4o-mini-tts** (token-based multimodal) and **tts-1-hd**.
- **API.** REST.
- **Pricing.** gpt-4o-mini-tts: **$0.60/M text input tokens + $12/M audio output tokens (~$0.015/min)**. tts-1 $15/M chars; tts-1-hd $30/M chars.
- **Languages.** Multilingual via Whisper training corpus, 50+ supported.
- **Voice clone quality.** **No voice cloning** — preset voices only (Alloy, Echo, Nova, Shimmer, Onyx, Fable, Sage, Coral, Verse, Ballad, Ash).
- **Emotion control.** gpt-4o-mini-tts accepts natural-language style prompts ("Sound like an excited sports announcer"). Surprisingly effective.
- **Streaming.** Yes.
- **Commercial license.** OpenAI commercial terms.
- **Brand safety.** Strong; OpenAI enforces no-cloning policy at model level.
- **Notable users.** Khan Academy, ChatGPT voice mode, multiple Y Combinator startups.

#### Open-source voice stack
- **Coqui XTTS v2** — 17 languages, 6-second zero-shot clone, MIT/Coqui dual. License is **CPML for commercial** → requires a separate agreement. Widely forked; quality still strong.
- **Bark (Suno)** — MIT license. Generates music, sound effects, and voice. Great for non-verbal expressive content; deterministic cloning is weak.
- **OpenVoice v2** (MyShell) — MIT, tone-color cloning, real-time capable; quality below XTTS on long-form but superb for zero-shot.
- **F5-TTS** (SWivid, 2024–2025) — MIT. Top open-source quality-vs-speed balance; strong English + Mandarin, broad community support, ~3 s processing for 20 s of output on L4.
- **MaskGCT** (Amphion, 2024–2025) — MIT code, research-only weights; highest naturalness among OSS but licensing is the blocker.
- **Kokoro-82M** — MIT, Apache-friendly; fastest OSS option (<0.3 s generation). Limited emotion.
- **Fish Speech / OpenAudio S1-mini** — Apache-2.0, **most commercially-friendly** high-quality option.

### 2.2 Voice decision matrix

| Provider | Latest model | Price per 1M chars (API) | Langs | Clone | Emotion | Streaming | License | Brand safety | Best fit |
|---|---|---|---|---|---|---|---|---|---|
| **ElevenLabs v3** | v3 GA | $60 Flash / **$120 v3** | **70+** | IVC + **PVC** | **Audio tags** | Yes (~300 ms) | Full | **Highest** | Hero narration + cloned brand voice |
| **Cartesia Sonic 3** | Sonic 3 | ~$90 (credit-based) | 15+ | IVC + Pro | Good | **<90 ms** | Full | High | Realtime voice agents |
| **PlayHT 3.0** | 3.0 + Mini | $30–$80 | 140+ | IVC | Moderate | Yes | Full | Moderate | Cheap multilingual |
| **Hume Octave 2** | Octave 2 / EVI 3 | $130–$200 | 15+ | Yes | **Best** | Yes | Full | High | Emotionally rich narration |
| **Resemble AI** | 2026 engine | $30–$150 | 60+ | IVC + Pro | Good | Yes | Full + deepfake detect | **Highest (on-prem)** | Regulated / dubbing |
| **Speechify API** | 2026 | **$10** | 60+ | Limited | Low | Yes | Full | Moderate | Cheap long-form |
| **Google Chirp 3 HD** | Chirp 3 HD | $30 | 30+ | Enterprise CNV | Good (style) | Yes | Full + SLA | **Highest** | Hyperscaler default |
| **Gemini 2.5 Pro TTS** | 2.5 Pro | ~$100 eff. | 50+ | No | Style prompts | Yes | Full | Highest | Tight Gemini integration |
| **Azure Neural TTS** | HD V2 | $16 / $30 HD | 140+ | Enterprise CNV | SSML styles | Yes | Full + indemnity | **Highest** | Microsoft-shop default |
| **Amazon Polly** | Generative 2026 | $16 Neural / $30 Gen | 40+ | Enterprise Brand Voice | Limited | Yes (bidi) | Full + indemnity | Highest | AWS-shop default |
| **OpenAI TTS** | gpt-4o-mini-tts | ~$15 eff. | 50+ | **No** | Natural-lang prompts | Yes | Full | High | Prototyping |
| **Coqui XTTS v2 (OSS)** | v2 | ~$2–$5 infra | 17 | Zero-shot | Low | Possible | **CPML (non-comm default)** | Self | Dev / fallback |
| **F5-TTS (OSS)** | 2024/25 | ~$2–$5 infra | EN+ZH | Zero-shot | Low | Possible | MIT | Self | Best quality OSS |
| **Kokoro-82M (OSS)** | 2025 | ~$1–$3 infra | EN+ | No | Very low | Possible | MIT | Self | Fastest OSS |

<sub>Price normalized to ~$per 1M characters for the v3-class model; exact amount depends on tier and overage.</sub>

### 2.3 Voice recommendations
- **Primary pick: ElevenLabs v3.** 70+ languages, the audio-tag emotion system, PVC-tier clone quality, and a pricing model that scales cleanly from $99/mo to enterprise. It is the only provider that covers *every* use case (hero narration, cloned brand voices, multilingual translation, streaming agents) with production-grade quality.
- **Backup pick: Cartesia Sonic 3.** If ElevenLabs ever chokes (rate limit, pricing tier change), Sonic 3's sub-90 ms latency and similar per-character pricing make it a clean swap — especially for any real-time Tavus/LiveKit flow. Sonic 3 is also the answer if emotion comes second to latency.
- **Regulated override: Microsoft Azure Neural TTS + CNV.** For enterprises that need indemnity, GDPR BAA, and audit logging, Azure wins on paper. Slightly lower expressivity than ElevenLabs v3 but enterprise-buyer risk is near-zero.
- **Emotionally-rich creative content override: Hume Octave 2.** Where the creative brief demands "sad, almost crying" or "amped up, about to laugh," Octave 2 outperforms ElevenLabs audio tags on naturalness.
- **Cheap/high-volume override: Speechify API ($10/M chars)** or **Amazon Polly Neural ($16/M chars)** for long-form explainer content where emotional expressivity is secondary.
- **Local fallback: F5-TTS** (MIT, best OSS quality) with **Kokoro-82M** as the sub-second latency option.

---

## 3. AI Music Generation Providers

### 3.1 Provider deep-dive

#### Google Lyria 2 / Lyria 3 Pro
- **Latest model.** **Lyria 3 Pro** (preview 2026). Lyria 2 is GA via Vertex AI.
- **API.** Vertex AI `predict` endpoint; WAV output at 48 kHz.
- **Pricing.** **Lyria 2: $0.06 per 30 seconds** ($0.12/min). Lyria 3 Pro pricing TBD but ~$0.10–$0.20/30 s at announcement.
- **Max length.** 30-second clips by default; can be chained to longer compositions but that is a pipeline responsibility.
- **Vocal vs instrumental.** Instrumental-first (Lyria 2). Lyria 3 adds richer instrumentation and stem separation.
- **Prompt controllability.** Strong text-to-music; supports mood, genre, instrument, tempo prompts.
- **Commercial license.** **Full commercial via Google Cloud terms**, and — critically — **trained only on licensed music** (per DeepMind's public statements). This is the cleanest provenance story in the category.
- **Brand safety.** **Highest** — enterprise indemnity, SynthID audio watermarking on every output, no copyright contamination.
- **Notable users.** YouTube Shorts AI soundtrack, MusicFX (Google Labs), Lyria integrations in Adobe Firefly.

#### Suno v4 / v4.5
- **Latest model.** Suno v4.5 (2025–2026), continues to push vocal realism.
- **API.** **No official public API.** Third-party wrappers (CometAPI, EvoLink, SunoAPI.org) exist but violate ToS. Official enterprise API is custom.
- **Pricing (consumer).** Free (50 credits/day, non-commercial), Pro $10/mo (2,500 credits, commercial), Premier $30/mo (10,000 credits + Suno Studio DAW + commercial). Third-party APIs ~$0.11 per song.
- **Max length.** Up to 8 minutes on Premier.
- **Vocal vs instrumental.** **Industry-leading vocals** (real-sounding singing with lyric control).
- **Prompt controllability.** Strong; "Custom mode" exposes genre, lyrics, structure tags.
- **Commercial license.** Commercial for songs *made while subscribed*; Warner Music settled Nov 2025 and a licensed Suno product is launching in 2026. Sony + UMG still litigating.
- **Brand safety.** **Material legal risk while the SNY/UMG suits are active.** Use only the licensed model path when it ships, or avoid for brand campaigns.
- **Notable users.** Millions of consumer creators; few openly disclosed enterprise brand users.

#### Udio
- **Latest model.** Udio 1.5 (2025–2026).
- **API.** Third-party wrappers (musicapi.ai, udioapi.pro). Official API is limited access.
- **Pricing.** Free tier, Standard $10/mo, Professional $30/mo (full commercial).
- **Max length.** ~15 minutes stitched.
- **Vocal vs instrumental.** Strong vocals, less polished than Suno but broader style range.
- **Prompt controllability.** Good.
- **Commercial license.** Paid tiers grant commercial rights. **UMG settled Oct 2025** and a joint UMG-Udio subscription launches in 2026 with properly-licensed training data.
- **Brand safety.** Improving fast after UMG settlement; Sony still litigating.
- **Notable users.** Consumer creators; Universal Music Group partnership is the flagship enterprise deal.

#### Mubert
- **Latest model.** Mubert Render 3 (2025–2026).
- **API.** Public REST API — one of the oldest in the category. `mubert.com/render/api`.
- **Pricing.** Creator $14/mo, Pro $39/mo, Business $199/mo, Enterprise + perpetual licenses up to $499.
- **Max length.** Arbitrary (streaming music).
- **Vocal vs instrumental.** **Instrumental only.**
- **Prompt controllability.** Tag-based (genre, mood, instrument, tempo) — less flexible than Suno's prompts.
- **Commercial license.** Paid tiers full commercial; perpetual license lets you sub-license.
- **Brand safety.** **Clean provenance** — trained on music from Mubert's own contributor network. Default safe choice for ad and UGC pipelines.
- **Notable users.** TikTok (partial library integration), Microsoft, NBC, Marvel, Puma.

#### AIVA
- **Latest model.** AIVA 2 (2025–2026).
- **API.** Limited REST API; primary interface is the AIVA Editor.
- **Pricing.** Free (non-commercial), Standard €15/mo, Pro €49/mo. Pro grants **full copyright ownership**.
- **Max length.** Up to ~5:30.
- **Vocal vs instrumental.** Instrumental only (classical/orchestral focus).
- **Prompt controllability.** Structured editor with style presets, chord progression control.
- **Commercial license.** Pro transfers ownership fully.
- **Brand safety.** Clean; trained on public-domain + licensed.
- **Notable users.** NVIDIA (GTC keynote music), cinematic trailers, game studios.

#### SoundDraw (Soundraw)
- **Latest model.** 2026 generative engine.
- **API.** Enterprise API available; consumer product is web-based.
- **Pricing.** Personal $16.99/mo, Artist $29.99/mo, Business $49.99/mo, Enterprise custom.
- **Max length.** Customizable up to ~5 min.
- **Vocal vs instrumental.** Instrumental only.
- **Prompt controllability.** **Most fine-grained non-prompt UI** — per-section intensity/instrument editor.
- **Commercial license.** Paid tiers are YouTube-safe and commercial.
- **Brand safety.** Clean — trained on in-house recordings.
- **Notable users.** YouTubers, podcasters, some enterprise marketing teams.

#### Loudly
- **Latest model.** Loudly Studio 2026.
- **API.** Public API available.
- **Pricing.** Free tier, Pro $15/mo, Enterprise custom.
- **Max length.** 3–6 min.
- **Vocal vs instrumental.** Primarily instrumental.
- **Prompt controllability.** Text prompts + style dropdowns.
- **Commercial license.** Paid tiers full commercial.
- **Brand safety.** Clean; licensed training data.
- **Notable users.** Meta, TikTok (pilots), Samsung.

#### Stability AI — Stable Audio 2.5
- **Latest model.** **Stable Audio 2.5** (enterprise grade, 2025–2026).
- **API.** REST via `platform.stability.ai`; Replicate and Fal.ai mirrors.
- **Pricing.** Credit-based ($0.01/credit); Stable Audio ~$0.04–$0.10 per generation depending on length. Enterprise license available for self-hosting.
- **Max length.** Up to 3 minutes per generation; 4.5 min on 2.5.
- **Vocal vs instrumental.** Primarily instrumental; sound effects + music.
- **Prompt controllability.** Text prompts, audio-to-audio conditioning.
- **Commercial license.** Stability AI commercial license ($20/mo+ individual, enterprise custom). Outputs are clean.
- **Brand safety.** Trained on licensed music from AudioSparx catalog; strong provenance story.
- **Notable users.** Adobe (Firefly audio), multiple indie game studios.

#### Meta AudioCraft / MusicGen (open source)
- **Model.** MusicGen Large/Melody + AudioGen + EnCodec.
- **License.** **MIT code + CC-BY-NC 4.0 weights** → **non-commercial for production** under the strict interpretation.
- **Quality.** Decent instrumental generation; quality has been surpassed by Stable Audio 2.5 and Lyria 2.
- **Use case.** Research and internal prototyping. **Do not use in client deliverables.**

#### Riffusion
- **Model.** Stable-Diffusion-derived spectrogram model (2022 open-source origin) → 2025 commercial relaunch → community backlash → usage collapsed back to 2023 lows by early 2026.
- **API.** Waitlist-only.
- **Pricing.** Consumer subscription; API TBD.
- **Commercial license.** Underclarified — the commercial relaunch's licensing terms are not clearly documented, which is a red flag for a brand-safe pipeline.
- **Quality.** Novel sounds; inferior musical coherence vs Suno/Udio.
- **Notable users.** Primarily hobbyists.

### 3.2 Music decision matrix

| Provider | Latest model | API | Price | Max length | Vocals | Prompt control | License | Brand safety | Best fit |
|---|---|---|---|---|---|---|---|---|---|
| **Google Lyria 2/3** | Lyria 3 Pro | Vertex AI | **$0.12/min** | 30 s (chainable) | Instrumental | Strong | Full + **SynthID** + licensed training | **Highest** | Brand/ad background |
| **Suno v4.5** | v4.5 | None official | $0.11/song (3rd party) | 8 min | **Best vocals** | Strong | Commercial (paid) — **UMG/Sony suing** | **Low (legal risk)** | Pending licensed model |
| **Udio** | Udio 1.5 | 3rd party | $10–$30/mo | ~15 min | Strong vocals | Strong | Commercial (paid) — **UMG settled** | Moderate → High post-2026 launch | Vocal-driven creative |
| **Mubert** | Render 3 | Public REST | $14–$199/mo | Unlimited streaming | Instrumental | Tag-based | Full + perpetual | **Highest** | Background ambiance |
| **AIVA** | AIVA 2 | Limited REST | €15–€49/mo | 5:30 | Instrumental | Editor-based | **Full copyright transfer** | High | Cinematic/orchestral |
| **SoundDraw** | 2026 engine | Enterprise API | $16.99–$49.99/mo | 5 min | Instrumental | Best non-prompt UI | Full | High | Creator-crafted BGM |
| **Loudly** | Studio 2026 | Public | $15+/mo | 6 min | Instrumental | Prompt + dropdown | Full | High | Web/UGC backgrounds |
| **Stable Audio 2.5** | 2.5 | REST | ~$0.04–$0.10/gen | 4.5 min | Instrumental | Text + audio-to-audio | Full + self-host | High | SFX + ambient |
| **MusicGen (OSS)** | Large/Melody | Self-host | Infra only | 30 s | Instrumental | Prompt | **CC-BY-NC weights** | **Non-commercial** | Research only |
| **Riffusion** | 2025 relaunch | Waitlist | TBD | Varies | Some | Prompt | Unclear | **Low** | Experimental |

### 3.3 Music recommendations
- **Primary pick: Google Lyria 2 (soon Lyria 3 Pro).** Only provider with all three of: (a) clean provenance / licensed training data, (b) SynthID audio watermarking, (c) enterprise indemnity via Google Cloud. At **$0.12/min**, it is also cheaper per finished minute than every other enterprise-safe option. Chainable 30-second clips work fine for a 60-second variant and can be beat-matched in ffmpeg.
- **Backup pick: Mubert (Public API).** If Lyria has availability issues, Mubert has the longest-standing public API, clean provenance, and a perpetual-license tier that insulates you from future pricing changes. Less prompt-expressive than Lyria, but programmatic and reliable.
- **Vocal-driven override: Udio (after UMG-licensed 2026 launch).** If a variant needs sung vocals, wait for the Udio × UMG licensed product and use that, not Suno. Sony/Suno suits are still pending.
- **Cinematic override: AIVA Pro.** €49/mo and full copyright transfer → best for orchestral hero cues.
- **Local fallback: Stable Audio 2.5 self-hosted** or **MusicGen for research only.** Stable Audio is the only OSS-lineage option with a commercial license path.

---

## 4. Cross-Category Synthesis

### 4.1 Voice + music combinations per Nucleus archetype

| Archetype | Voice (primary) | Voice (style) | Music (primary) | Music (style) | Rationale |
|---|---|---|---|---|---|
| **Demo** | ElevenLabs v3 (PVC brand voice) | Confident, conversational, slight warmth via `[smiles]` tags | Lyria 2 | Minimal upbeat underscore, 95–110 BPM | Demo variants need a consistent cloned brand voice for recognizability and a low-key instrumental that won't compete with voice. |
| **Marketing** | Hume Octave 2 | Excited, energetic, with `"amped up"` affect | Mubert Pro | Genre-tagged (e.g. "uplifting electronic", "cinematic epic") | Marketing variants benefit from Hume's emotional range; Mubert tags map cleanly to campaign-brief mood keywords. |
| **Knowledge** | ElevenLabs Multilingual v2 (preset voice) | Neutral, authoritative, clear pronunciation | Lyria 2 | Ambient, 70–85 BPM, no melodic peaks | Long-form explanation needs clarity + neutrality; ambient Lyria won't distract from information density. |
| **Education** | Cartesia Sonic 3 | Warm, friendly, patient pacing | SoundDraw (Business) | Editable per-section intensity, gentle | Education variants often need pacing adjustments mid-video; Sonic 3's low latency + SoundDraw's per-section editor handle section-by-section changes cleanly. |

### 4.2 Cost projection — 60-second variant at 100/day (3,000/mo)

**Assumptions:**
- Voice: ~150 words (~900 characters) per 60 s of narration.
- Music: 60 s backing track.
- Avatar: 60 s rendered output.

| Component | Primary provider | Unit price | Per variant | Per day (100) | Per month (3,000) |
|---|---|---|---|---|---|
| Avatar | HeyGen Avatar IV (Scale API) | ~$0.50/min effective | $0.50 | $50 | **$1,500** |
| Voice | ElevenLabs v3 (Scale API) | $0.12 / 1k chars | $0.11 | $11 | **$330** |
| Music | Google Lyria 2 | $0.06 / 30 s | $0.12 | $12 | **$360** |
| **Total (primary)** | | | **$0.73** | **$73** | **$2,190** |

| Component | Backup provider | Unit price | Per variant | Per day (100) | Per month (3,000) |
|---|---|---|---|---|---|
| Avatar | Tavus Replica batch | ~$0.20/min effective | $0.20 | $20 | **$600** |
| Voice | Cartesia Sonic 3 | ~$0.09 / 1k chars | $0.08 | $8 | **$240** |
| Music | Mubert Pro | $39/mo flat (at this volume) | ~$0.013 | $1.30 | **$39** |
| **Total (backup)** | | | **$0.29** | **$29** | **$879** |

| Component | Regulated-safe provider | Unit price | Per variant | Per day (100) | Per month (3,000) |
|---|---|---|---|---|---|
| Avatar | Synthesia Enterprise | ~$1.50–$3.00/min effective | $2.25 | $225 | **$6,750** |
| Voice | Azure Neural TTS (CNV) | $16 / 1M chars + flat CNV fee | $0.014 + amortized $100/mo = $0.047 | $4.70 | **$140** |
| Music | Google Lyria 2 | $0.12/min | $0.12 | $12 | **$360** |
| **Total (regulated)** | | | **$2.42** | **$242** | **$7,250** |

**Voice + music only** (ignoring avatar):
- Primary: **$0.23/variant** → $690/mo
- Backup: **$0.093/variant** → $279/mo
- Regulated: **$0.167/variant** → $500/mo

The primary stack sits at **~$0.73/finished 60s variant all-in** — very comfortable for a per-variant resale model above $2–$3 and still healthy at $1–$2.

### 4.3 Risk callouts

#### Avatar
- **Deepfake liability.** Any provider that accepts an uploaded face (HeyGen, D-ID, Akool, Vidnoz) can be weaponized. Pipeline must enforce consent verification + blocklists independently; don't trust the vendor to be the only line of defense.
- **Pricing volatility.** HeyGen has re-shuffled credit values twice in the last 12 months. Keep the Tavus fallback warm.
- **Model deprecation.** Avatar IV replaced Avatar III in a single-day deprecation. Pin the model ID in API calls (`avatar_iv`) and monitor changelogs weekly.
- **OSS license traps.** Most talking-head weights (Hallo3, MuseTalk, V-Express) are **research-only** even when the repo says MIT. Audit every checkpoint before production.

#### Voice
- **Voice-clone consent.** ElevenLabs and Cartesia require consent verification for PVC/Pro clones. Build this into the onboarding flow, don't bolt it on later.
- **Multilingual lip-sync coupling.** Voice language must match avatar language *and* HeyGen's lip-sync map. Mandarin, Arabic, and Thai still degrade noticeably; flag these languages for manual QA.
- **Token-based billing surprises (OpenAI).** gpt-4o-mini-tts bills in audio output tokens, not characters — long pauses/music cues can balloon costs. If you use it, throttle via `max_output_tokens`.
- **Open-source license trap.** Coqui XTTS v2 is CPML-licensed for commercial use. F5-TTS (MIT) and Kokoro-82M (MIT) are safer defaults for open-source fallback.

#### Music
- **Suno/Sony/UMG litigation.** **Do not use Suno-generated music in any brand campaign until the licensed product ships.** Warner settled Nov 2025; Sony + UMG lawsuits still active; use only the Warner-licensed Suno model once available, or choose a clean-provenance provider.
- **Provenance + watermarking.** Only Lyria 2 ships with SynthID watermarking out of the box. If your brand-safety SOP requires watermarking, Lyria is the default and Mubert is the backup.
- **CC-BY-NC trap.** Meta MusicGen and some Hallo3-adjacent music weights are CC-BY-NC. Do not use in client deliverables; research only.
- **Pricing non-transparency.** Stable Audio 2.5's per-generation price via platform.stability.ai varies by length; always set an upper bound in your request wrapper.

---

## 5. Final Stack Recommendation

For the Nucleus video pipeline as of April 2026:

| Slot | Primary | Backup | Regulated/compliance |
|---|---|---|---|
| **Avatar** | HeyGen Avatar IV (Scale API) | Tavus Replica (batch) + Phoenix-4 (realtime) | Synthesia Enterprise |
| **Voice** | ElevenLabs v3 (API Scale) | Cartesia Sonic 3 | Azure Neural TTS (Custom Neural Voice) |
| **Music** | Google Lyria 2 (Vertex AI) | Mubert Pro API | Google Lyria 2 (already safest) |

Monthly cost at 100 finished 60-second variants/day is approximately:
- **$2,190/mo** on primary stack (all-in avatar + voice + music)
- **$879/mo** on backup stack
- **$7,250/mo** on regulated stack

Keep a **self-hosted fallback lane** running MuseTalk + F5-TTS + Stable Audio 2.5 for local development and "API down" continuity. Pin model IDs, monitor vendor changelogs weekly, and build consent verification + watermark injection into the ingestion side of the pipeline rather than trusting any single vendor.

---

## Sources

**Avatar providers**
- [HeyGen API Pricing](https://www.heygen.com/api-pricing)
- [HeyGen Avatar IV](https://www.heygen.com/avatars/avatar-iv)
- [HeyGen Avatar IV multilingual test](https://coda.io/@rohan-mac/heygen-avatar-iv-review/heygen-multilingual-test-lipsync-translation-and-accent-quality-7)
- [Tavus Pricing](https://www.tavus.io/pricing)
- [Tavus Phoenix-4 announcement](https://www.tavus.io/post/phoenix-4-real-time-human-rendering-with-emotional-intelligence)
- [Tavus Sparrow-1 announcement](https://www.tavus.io/post/sparrow-1-human-level-conversational-timing-in-real-time-voice)
- [Tavus CVI overview](https://docs.tavus.io/sections/conversational-video-interface/overview-cvi)
- [Synthesia Pricing](https://www.synthesia.io/pricing)
- [Synthesia Review 2026 (custom avatar cost)](https://blogrecode.com/synthesia-review-ai-avar-tool/)
- [D-ID API Pricing](https://www.d-id.com/pricing/api/)
- [D-ID Expressive Avatars](https://www.d-id.com/resources/product-updates/expressive-avatars-are-live-in-d-id-studio/)
- [Akool OpenAPI](https://akool.com/openapi)
- [Akool Face Swap API docs](https://docs.akool.com/ai-tools-suite/faceswap)
- [Hour One Studio API](https://hourone.ai/studio-api/)
- [Colossyan Pricing](https://www.colossyan.com/pricing)
- [Vidnoz Pricing 2026](https://aiblogfirst.com/vidnoz-ai-pricing/)
- [Open-Source Lip Sync Comparison 2026](https://lipsync.com/blog/open-source-lip-sync)
- [SadTalker GitHub](https://github.com/OpenTalker/SadTalker)
- [MuseTalk GitHub](https://github.com/TMElyralab/MuseTalk)
- [Awesome Talking-Head Generation](https://github.com/harlanhong/awesome-talking-head-generation)

**Voice providers**
- [ElevenLabs API Pricing](https://elevenlabs.io/pricing/api)
- [Eleven v3 launch](https://elevenlabs.io/blog/eleven-v3)
- [Eleven v3 audio tags](https://elevenlabs.io/blog/v3-audiotags)
- [ElevenLabs Cheat Sheet 2026](https://www.webfuse.com/elevenlabs-cheat-sheet)
- [Cartesia Pricing](https://cartesia.ai/pricing)
- [Cartesia Sonic 3](https://cartesia.ai/sonic)
- [PlayHT Pricing Guide](https://voice.ai/hub/tts/play-ht-pricing/)
- [Hume AI Pricing](https://www.hume.ai/pricing)
- [Hume Octave launch (VentureBeat)](https://venturebeat.com/ai/hume-launches-text-to-speech-model-octave)
- [Hume TTS docs](https://dev.hume.ai/docs/text-to-speech-tts/overview)
- [Resemble AI Pricing](https://www.resemble.ai/pricing/)
- [Speechify API Pricing](https://speechify.com/pricing-api/)
- [Google Gemini TTS Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Google Cloud Chirp TTS Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)
- [Azure Speech Pricing](https://azure.microsoft.com/en-us/pricing/details/speech/)
- [Amazon Polly Pricing](https://aws.amazon.com/polly/pricing/)
- [Amazon Polly Generative 2026 update](https://aws.amazon.com/about-aws/whats-new/2026/03/amazon-polly-expands-TTS-new-voices-and-bidirectional-streaming/)
- [OpenAI API Pricing](https://developers.openai.com/api/docs/pricing)
- [Open Source TTS Comparison 2026](https://www.hyperstack.cloud/blog/case-study/popular-open-source-text-to-speech-models)
- [Coqui TTS GitHub](https://github.com/coqui-ai/TTS)

**Music providers**
- [Lyria 2 on Vertex AI](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/lyria-music-generation)
- [Lyria 3 DeepMind](https://deepmind.google/models/lyria/)
- [Lyria 3 announcement](https://blog.google/innovation-and-ai/technology/ai/lyria-3-pro/)
- [Suno Pricing](https://suno.com/pricing)
- [Suno Terms of Service](https://suno.com/terms-of-service)
- [Suno Lawsuit Update Feb 2026](https://patentailab.com/riaa-vs-suno-lawsuit-update-2026/)
- [Warner-Suno settlement](https://allaboutlawyer.com/suno-lawsuit-exposed-warner-secures-multi-million-dollar-settlement-over-stream-ripping-claims/)
- [UMG-Udio settlement (RA News)](https://ra.co/news/83897)
- [NPR on Udio-UMG deal](https://www.npr.org/2025/11/07/nx-s1-5598492/new-licensing-deal-highlights-the-growing-trend-of-media-giants-embracing-ai)
- [Mubert Render Pricing](https://mubert.com/render/pricing)
- [AIVA Pricing](https://www.saasworthy.com/product/aiva-ai)
- [SoundDraw Pricing](https://www.saasworthy.com/product/soundraw-io/pricing)
- [Stability Platform Pricing](https://platform.stability.ai/pricing)
- [Stable Audio 2.5 announcement](https://stability.ai/stable-audio)
- [Stability AI License](https://stability.ai/license)
- [Meta AudioCraft](https://ai.meta.com/resources/models-and-libraries/audiocraft/)
- [MusicGen GitHub (facebookresearch/audiocraft)](https://github.com/facebookresearch/audiocraft/)
- [RIAA lawsuit (Suno/Udio)](https://www.riaa.com/record-companies-bring-landmark-cases-for-responsible-ai-againstsuno-and-udio-in-boston-and-new-york-federal-courts-respectively/)
