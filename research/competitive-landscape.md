# AI UGC Video Generation — Competitive Landscape (2025-2026)

> Snapshot: Q2 2026. Prepared for pitch-deck use. Pricing reflects publicly listed figures at time of research; enterprise tiers are quote-only unless noted.

---

## 1. Deep Dive: Descript

**Core offering (one sentence).** A script-first, transcript-driven video/podcast editor whose AI co-editor "Underlord" can agentically polish, clip, and publish long-form content and which, as of Sept 2025, has consolidated every AI feature behind a unified credits meter.

### What Descript is genuinely good at

| Feature | Reality (not marketing) |
|---|---|
| **Underlord (agentic co-editor)** | Executes 15-20 chained edit steps from a single instruction ("polish this podcast for publishing"), can add b-roll, generate images, tighten cuts, and suggest socially clippable moments. Launched as general release in Descript "Season 6," Aug 2025. |
| **Script-first / edit-by-text** | The core differentiator since day one — delete words in the transcript, the video cut follows. Still best-in-class for long-form dialogue. |
| **Studio Sound** | One-click dereverb + denoise that holds up across noisy rooms. Consumes AI credits. |
| **Filler-word removal** | Detects "um / uh / like / you know / so / actually," shows timestamps, lets you review each before bulk-kill. |
| **Eye Contact** | AI gaze correction, optimized for single-subject talking heads. |
| **AI Clips / Highlights** | Automatically extracts social-ready clips from long uploads. No published virality score — weaker than Opus on ranking. |
| **Write Mode** | Writes/edits script before recording; tightly coupled to teleprompter. |
| **Publish Suite** | Publish to YouTube, TikTok, LinkedIn, X, Instagram directly from the app. Multi-format export. |
| **Generative media** | Underlord can call stock libraries OR generate net-new images/clips (Veo/Sora-class diffusion, routed; not Descript's own model). |

### What Descript lacks

- **No brand-document ingestion.** No concept of a brand RAG store. You cannot upload PDFs of messaging guidelines, ICP documents, or competitor analyses and have Underlord ground its edits against them.
- **No neuro/attention feedback loop.** Highlights and clip picks are based on transcript + heuristics, not on a predictive attention model or engagement score.
- **Clip ranking is weak vs Opus.** No numeric virality score per clip.
- **Not a UGC ad platform.** Descript is a long-form editor. Performance-marketing teams rarely treat it as their UGC ad factory — they use HeyGen/Arcads/Creatify for that and hand the output to Descript to repurpose.
- **Credits are volatile.** Post-Sept-2025 repricing, unused credits do NOT roll over, which is a real friction point for teams with bursty workflows.

### Pricing (public, Sept 2025 repricing)

| Plan | $ / mo | Media minutes | AI credits | Notes |
|---|---|---|---|---|
| Free | $0 | 60 | 100 one-time | watermark on exports |
| Hobbyist | ~$16 (annual) | 10 hrs | monthly grant | |
| Creator | ~$24 (annual) | 30 hrs | monthly grant | watermark-free, AI Clips |
| Business | ~$40 (annual) | 40 hrs | monthly grant | collaboration |
| Enterprise | Custom | | | |

Sources: [descript.com/pricing](https://www.descript.com/pricing), [Trebble breakdown of Sept 2025 changes](https://www.trebble.fm/post/descript-pricing-september-2025), [Underlord overview](https://www.descript.com/underlord), [Season 6 announcement](https://www.descript.com/blog/article/descript-season-6-meet-underlord), [Eye Contact](https://www.descript.com/eye-contact), [Filler words](https://www.descript.com/filler-words).

---

## 2. Competitors in Rank Order

### 2.1 HeyGen

- **Core offering.** Avatar-based UGC and explainer video platform powered by its proprietary Avatar IV model, with batch generation and brand-kit governance for marketing teams.
- **Genuinely good at.** Avatar IV (full-body motion, gestures, hand movement, not just talking-head), 1,100+ stock avatars, 175-language voice cloning, true batch (one script × N avatars = 25+ variants in one pass), Brand Hub 2.0 with auto-imported brand colors/logos from a URL, a Brand Glossary that governs how terms are pronounced/translated.
- **What it lacks.** No deep brand-document RAG (Brand Kit is visual + glossary only — no ingestion of full brand messaging PDFs or ICP briefs). No neuromarketing scoring inside generation. No recursive quality loop — user still has to eyeball which of the 25 variants is best. Limited in-frame post-generation editing.
- **Pricing.** Free (3 videos/mo, watermarked) · Creator $24-29/mo · Team ~$39/seat · Business $79-99/mo · Enterprise custom ($500-2000+/mo typical).
- **Links.** [heygen.com/pricing](https://www.heygen.com/pricing) · [Avatar IV / UGC Ads](https://www.heygen.com/avatars/ugc) · [Brand Kit](https://help.heygen.com/en/articles/9889198-how-to-create-a-brand-kit).

### 2.2 Arcads.ai

- **Core offering.** "Hire AI UGC actors" for talking-head performance ads, trained from motion-capture of consenting real creators; designed around the performance-marketing workflow.
- **Genuinely good at.** Realism of talking-head actors (Motion-captured library of 1,000+ actors), 35+ languages, Emotion Control (tag-based), Speech-to-Speech (record your own delivery, the AI actor mimics tone), Unboxing POV b-roll, "Show your app" feature (actor holds a phone displaying your landing page). Closed a $16M Sequoia-led seed in Dec 2025; $6M ARR with 5 employees.
- **What it lacks.** No brand-doc ingestion — script generation is shallow, relying on a hook-generator and template library. No neuro/attention scoring. No recursive refinement loop. Thin on long-form / editor — it is a one-shot ad factory, not a studio.
- **Pricing.** Basic $149/mo (20 videos) · Pro $179/mo (50 videos) · Turbo $249/mo (unlimited). ~$11/video effective cost.
- **Links.** [arcads.ai](https://www.arcads.ai) · [Features: Speech to Speech](https://www.arcads.ai/features/speech-to-speech).

### 2.3 Creatify

- **Core offering.** URL-to-UGC-ad tool: paste a product URL and get 5-10 script variants plus 500+ avatars and 10,000+ b-roll clips, optimized for D2C performance ads.
- **Genuinely good at.** URL ingestion → auto-scripts, huge b-roll library, custom avatars, 170+ voices across 29 languages, auto-resize across aspect ratios, fast iteration for testing hooks.
- **What it lacks.** Lip-sync and avatar realism inconsistent versus Arcads/HeyGen. No RAG on brand docs — the URL-scrape is a one-shot snapshot, not a persistent brand knowledge base. No neuro/attention scoring. Credits expire after 2 months.
- **Pricing.** Starter $19/mo (1,200 credits/yr) · Pro $49/mo (2,400 credits/yr, ~480 videos).
- **Links.** [creatify.ai/pricing](https://creatify.ai/pricing).

### 2.4 Captions (Mirage)

- **Core offering.** Mobile-first social video editor that has pivoted hard into "AI Twins" / AI actors and the Mirage generative model.
- **Genuinely good at.** Animated captions (original strength), AI Twins (clone yourself), AI Dubbing across languages, fast mobile workflow. Strong on solo-creator ergonomics.
- **What it lacks.** No brand-doc grounding. No neuromarketing loop. Credit-based AI features make pricing unpredictable. Best for individuals, not brand teams.
- **Pricing.** Pro $9.99/mo · Max $24.99/mo (or $57 for 1,200 credits) · Scale $69.99/mo (or $115 for 3,600 credits).
- **Links.** [captions.ai/plans](https://captions.ai/plans) · [Mirage pricing](https://mirage.app/captions/pricing).

### 2.5 Opus Clip / Opus Pro

- **Core offering.** Long-form → short-clip "clip farming" with a branded Virality Score per clip.
- **Genuinely good at.** Best-in-class virality scoring (0-100 per clip), ClipAnything (handles arbitrary video types), ReframeAnything (auto vertical), AI B-roll, XML export to Premiere/DaVinci, social scheduler, 10-25 clips per upload with animated captions.
- **What it lacks.** Virality Score is a *heuristic / pattern-matched* predictor — it is NOT a neuromarketing or attention-prediction model. No brand-document RAG. No in-frame agentic editing. No generation from scratch — it can only re-clip existing footage.
- **Pricing.** Free (60 min/mo) · Pro $29/mo monthly, ~$14.50/mo annual (300 min/mo).
- **Links.** [opus.pro/pricing](https://www.opus.pro/pricing).

### 2.6 Synthesia

- **Core offering.** Enterprise avatar video platform for L&D, internal comms, and product marketing — the incumbent in regulated industries.
- **Genuinely good at.** 240+ avatars, ~140 languages, Brand Kits, SSO, brand governance, custom avatar ($1k/yr add-on), Avatar Builder that lets you apply logos/clothing, deep enterprise procurement muscle.
- **What it lacks.** Very little UGC DNA — avatars feel "boardroom" not "TikTok." No neuromarketing loop. No deep RAG (brand kit is visual assets + fonts + colors, not messaging grounding). Script generation is basic.
- **Pricing.** Free $0 (3 min/mo) · Starter $18-29/mo (10 min/mo) · Creator $64-89/mo (30 min/mo) · Enterprise custom.
- **Links.** [synthesia.io/pricing](https://www.synthesia.io/pricing).

### 2.7 Runway ML

- **Core offering.** General-purpose generative video studio (Gen-4 for generation, Aleph for in-context editing) — the creative professional's AI video tool.
- **Genuinely good at.** Gen-4 (Mar 2025) solved character consistency across cuts. **Aleph (Jul 2025) is the only "in-frame agentic editor" in this set** — text-prompt edits ("add rain," "golden-hour lighting," "remove this object") applied to existing footage with temporal consistency. Strong creative controllability: keyframes, camera direction, reference image control.
- **What it lacks.** Not a UGC ad platform — no avatars, no script-first workflow, no batch UGC. No brand-document RAG. No neuro/attention prediction in-loop. Aleph caps single generation at 5s.
- **Pricing.** Free (125 one-time credits) · Standard $12/mo · Pro $28/mo · Unlimited $76/mo.
- **Links.** [runwayml.com/pricing](https://runwayml.com/pricing) · [Aleph research post](https://runwayml.com/research/introducing-runway-aleph).

### 2.8 Pictory

- **Core offering.** Text/article-to-video with automatic stock-footage matching — the "blog post to video" workhorse.
- **Genuinely good at.** URL/article ingestion, automatic summary-sentence selection, large stock library, decent voice synthesis, branded templates.
- **What it lacks.** No avatars comparable to HeyGen/Arcads. No brand RAG. No neuro scoring. Generic output.
- **Pricing.** Standard $19-23/mo (30 videos) · Premium $39-47/mo (60 videos) · Teams $99-119/mo (90 videos).
- **Links.** [pictory.ai/pricing](https://pictory.ai/pricing/).

### 2.9 InVideo AI

- **Core offering.** Prompt-to-video tool aimed at solo creators and SMBs; conversational interface for iterating.
- **Genuinely good at.** Natural-language editing loop ("make this scene shorter, add energetic music"), huge template library, fast turnaround.
- **What it lacks.** No brand-doc grounding. No neuromarketing. Avatar and b-roll quality mid-tier. Output often feels templated.
- **Pricing.** Free tier (with watermark) · Plus ~$20/mo · Max ~$48/mo.
- **Links.** [invideo.io](https://invideo.io/ai/).

### 2.10 Pika Labs

- **Core offering.** Consumer-friendly generative video model with "Scene Ingredients" (drop in characters/objects/locations) for quick creative shots.
- **Genuinely good at.** Affordable access to decent generative video, Scene Ingredients feature, strong community.
- **What it lacks.** Not a UGC ad platform, no avatars or brand tools, no scoring, no RAG. It's a model with a UI.
- **Pricing.** Starter pack ~$10 (700 credits).
- **Links.** [pika.art](https://pika.art/).

### 2.11 Luma Dream Machine (Ray 2 / Ray 3)

- **Core offering.** High-fidelity generative video — Ray 3 is among the best-looking models in the public market as of late 2025.
- **Genuinely good at.** Visual fidelity of Ray 3 (540p/720p/1080p tiers), camera motion controls, fast iteration.
- **What it lacks.** Same as Pika — no brand workflow, no scoring, no avatars, no UGC-ad tooling.
- **Pricing.** Lite $9.99/mo (3,200 credits) · More $29.99/mo (10,000 credits) · Unlimited $94.99/mo.
- **Links.** [lumalabs.ai/pricing](https://lumalabs.ai/pricing).

### 2.12 Akool

- **Core offering.** Identity-aware video suite — face swap, lip sync, video translation, avatar creation — with a focus on preserving facial identity across edits.
- **Genuinely good at.** Face swap and lip-sync quality, video translation with accurate lip-sync, multi-feature suite, enterprise tier with dedicated CSM.
- **What it lacks.** No brand RAG. No neuro/attention loop. More of a feature suite than a brand-content platform.
- **Pricing.** Free basic · Pro / Pro Max / Business tiers (credit-based, 30% annual discount) · Enterprise custom.
- **Links.** [akool.com/pricing](https://akool.com/pricing).

### 2.13 Reach (and "MagicUGC," "MakeUGC," "CreatorKit" cluster)

- **Core offering.** A wave of sub-$50/mo AI UGC tools (MagicUGC, MakeUGC, ReelFarm, CreatorKit, Reach) selling 200-1000 AI actors and hook-generators to performance marketers.
- **Genuinely good at.** Speed-to-first-ad, low price, dead-simple interfaces, TikTok-optimized output.
- **What it lacks.** Commoditized output, weak brand grounding, no neuromarketing, heavy avatar overlap (many share underlying models). "Reach" specifically has a thin public footprint — no clear brand-knowledge-ingestion story discoverable.
- **Pricing.** Typically $19-49/mo.
- **Links.** [magicugc.com](https://www.magicugc.com/) · [makeugc.ai](https://www.makeugc.ai/).

### 2.14 ReelFarm

- **Core offering.** TikTok-centric UGC video + slideshow automation with direct scheduling into TikTok.
- **Genuinely good at.** Viral hook generator, unlimited UGC videos on Growth plan, Pinterest-scraped imagery, direct publishing to TikTok, multi-brand support.
- **What it lacks.** No brand RAG. No neuro loop. Output quality is volume-optimized, not craft-optimized.
- **Pricing.** Starter $19/mo · Growth $29-39/mo (unlimited UGC, 500 AI credits).
- **Links.** [reel.farm](https://reel.farm/).

### 2.15 Tavus

- **Core offering.** Real-time **conversational** video agents (CVI — Conversational Video Interface) — not batch ads, but live video AI that sees, listens, and replies with ~600ms latency.
- **Genuinely good at.** Lowest-latency avatar conversation in the market, RAG-powered personas with custom LLMs and function calling, white-labeled deployment, developer-facing API. Closest thing on this list to genuine "brand knowledge grounding" — personas can be fed knowledge bases and tool-calls.
- **What it lacks.** Not a UGC-ad tool at all (different use case). No neuromarketing loop. No creative optimization loop on attention.
- **Pricing.** Free (25 live minutes) · Starter $59/mo · Growth / Enterprise usage-based.
- **Links.** [tavus.io](https://www.tavus.io/) · [video agents](https://www.tavus.io/video-agents) · [pricing comparison](https://www.tavus.io/post/conversational-video-ai-cost-comparison).

---

## 3. Positioning Map — Breadth of Stack × Brand/Knowledge Grounding

```
                                    BRAND / KNOWLEDGE GROUNDING (high)
                                              ^
                                              |
                                              |                        [ EMPTY QUADRANT ]
                                              |                        ←  new entrant target
                                              |
                            Tavus *           |
                                              |
                          Synthesia *         |
                                              |
             HeyGen  *                        |   
                                              |
                              Arcads  *       |
   Creatify *                                 |         Descript  *
                    Captions *                |
   InVideo *                                  |
  Pictory *                                   |    Opus Clip  *
                                              |
  ReelFarm *                                  |
  Reach/MagicUGC/MakeUGC *   Akool *          |             Runway (Gen-4 / Aleph) *
                                              |
                                              |        Pika *    Luma Dream Machine *
                                              +-------------------------------------------->
(low) <---- BREADTH OF STACK (generate + edit + score + publish) ----> (high)
```

**Reading the map.**
- **X-axis (Breadth of Stack):** how much of the full pipeline — generation → in-frame editing → attention scoring → publishing — the tool covers.
- **Y-axis (Brand/Knowledge Grounding):** how deeply the tool ingests brand documents, messaging, ICP, product specs and grounds generation against them.
- The upper-right is empty. **No vendor today combines a full generate+edit+score+publish stack with deep brand/knowledge RAG grounding plus a quality feedback loop.** Tavus is the furthest north (because of its RAG persona system) but is strictly conversational. Descript, Runway, and Opus are far east but shallow on Y. HeyGen and Synthesia sit middle-north because of Brand Hub 2.0 / brand kits but those are visual+glossary, not semantic brand RAG.

---

## 4. Concrete Gaps a New Entrant Can Exploit

1. **No brand-doc RAG ingestion at scale.** Nobody accepts an arbitrary PDF corpus (brand guidelines, ICP doc, competitor positioning, product specs, transcripts of sales calls) and grounds every generated frame/script/voice-over against it. HeyGen's "Brand Kit" is logos + colors + glossary, not messaging. Tavus has persona RAG but only for conversational, not for batch UGC.
2. **No neuromarketing / attention-prediction feedback loop inside generation.** Opus's "Virality Score" is a heuristic label applied *after* clipping. Nothing on this list routes a predictive attention signal back into the generator to re-roll underperforming shots. (See Section 5.)
3. **No recursive quality loop.** Current tools are single-shot: user gets N variants, eyeballs them, ships. No auto-refinement where low-scoring outputs become negative exemplars for the next generation.
4. **Batch variant generation without brand-integrity enforcement.** HeyGen lets you make 25 variants from one script, but none of them are guaranteed to stay within brand voice because there's no RAG gate on generation.
5. **No in-frame agentic editing tied to brand rules.** Runway Aleph does in-frame edits, but its prompts are free-form. No tool lets a brand say "Aleph, but every edit must conform to these brand rules you've ingested."
6. **Weak bridge between long-form source material and performance UGC.** Descript owns long-form editing; Arcads/HeyGen own UGC ad generation. Nothing spans the two — i.e., ingest a 60-minute founder interview, extract brand knowledge + tone, then auto-generate 50 on-brand UGC ads scored by attention prediction.
7. **No cross-campaign learning loop.** None of the tools feed ad-performance back into the generator to bias future output toward winners for *this specific brand's audience*.
8. **Pricing models punish iteration.** Credits-don't-rollover (Descript), credit inflation (Captions), per-video Arcads pricing — all create friction against the recursive-loop workflow that a new entrant could make cheap because the refinement happens inside one job.
9. **No unified "brand brain" object.** Brand data lives siloed: colors in HeyGen's Brand Hub, glossary in HeyGen, scripts pasted into Arcads, footage in Descript. A new entrant that owns the canonical brand representation wins the platform layer.
10. **No neuro-grounded A/B seeding.** Pre-flight attention scoring (Realeyes, Neurons) is sold to media buyers for *filtering*, not wired into generators for *seeding*. The new entrant opportunity is to use those signals as the reward function, not the gate.

---

## 5. Neuromarketing / Attention-Prediction Inside the Generation Loop — Reality Check

**CRITICAL FINDING: No tool in this landscape uses neuromarketing or attention prediction as a recursive feedback loop inside the generation pipeline.** Everything currently in-market is either (a) heuristic scoring bolted on after the fact or (b) a separate pre-flight testing service that marketers use *outside* the generator.

| Signal type in market | Example vendors | How it's used | Is it inside the generation loop? |
|---|---|---|---|
| Heuristic "virality score" | Opus Clip (score 0-100), StreamLadder, quso.ai | Ranks already-generated clips by engagement heuristics (hook strength, pacing, topic). | **No.** Post-hoc label, not a gradient signal. |
| Predictive attention via CNN / gaze model | Neurons Inc (Predict), Realeyes PreView, Attention Insight, Adverteyes, TVision+Realeyes | Pre-flight scoring of finished creatives; predicts heatmaps, view-time, branded attention. Sold to media buyers and creative ops. | **No.** It's a scoring API applied to finished assets. Neurons exposes an API (`/v1/predict`) that marketers call *after* a creative is made. |
| Real eye-tracking panels | RealEye (plugged into Neurons) | Large-scale panel data for model training and campaign measurement. | **No.** It's a measurement product. |
| Conversational attention (agent reads viewer response) | Tavus CVI | Video agent adapts in real time to what the user says/does. | **Partially**, but only in live two-way conversations — not in asynchronous UGC ad generation. |

### Why this is the differentiator for your product

A recursive neuromarketing loop inside generation is architecturally different from anything on this list:

- **Existing stack (Neurons + Arcads pattern):** Generate → Export → Upload to Neurons → Get attention score → Human reads score → Human re-prompts → Regenerate. 4-6 hops, human in the middle, scoring is advisory.
- **Your proposed stack (recursive loop):** Generate candidate frames/clips → Score with attention model → Feed score back as reward → Re-roll low-attention regions → Converge on optimum automatically. Zero hops, no human between scoring and regeneration, scoring is the training signal.

### Closest analogs to call out

- **Neurons AI Predict API** — most technically dangerous analog. They have a REST API marketed exactly as "plug into your product to score creatives." If they partnered with HeyGen or Arcads tomorrow, it would close 70% of this gap on paper. But — and this is important — Neurons scores *finished assets*; they do not re-generate them. The loop still requires a human.
- **Realeyes PreView + CreativeX "AttentionX"** — pre-flight scoring, built for media buyers, not generator-integrated.
- **Descript's AI Clips highlight selection** — uses transcript features and pacing heuristics, no biological/attention grounding at all.

**Defensibility angle for the deck:** The moat is not the attention model (licensable from Neurons/Realeyes). The moat is (1) the closed loop that makes attention the reward function, (2) the brand-RAG store that constrains what the generator is allowed to emit, and (3) the per-brand learning that sharpens over time. Any existing player bolting on Neurons' API will get a pre-flight score; only a ground-up architecture gets a recursive loop.

Sources: [Neurons AI Predict](https://www.neuronsinc.com/neurons-ai) · [Neurons API](https://www.neuronsinc.com/api) · [Realeyes PreView](https://www.realeyesit.com/ad-testing/preview/) · [RealEye + Neurons collaboration](https://www.realeye.io/case-study/realeye-and-neurons-developed-technology-for-online-ad-testing) · [CreativeX + Realeyes AttentionX](https://blog.realeyesit.com/creativex-and-realeyes-join-forces-to-launch-attentionx) · [Opus Virality Score explainer](https://www.futurepedia.io/courses/opus-clip-ai/lessons/virality-score).

---

## 6. Incumbents Most At Risk

| # | Incumbent | Why at risk |
|---|---|---|
| 1 | **Arcads.ai** | Pure UGC-ad factory with no brand RAG and no scoring beyond emotion tags. Their moat is actor realism, which is a model problem, not a platform problem — and their customers (performance marketers) are the exact buyers who will switch fastest for measurable CTR lift from neuro-scored output. $16M Sequoia seed means they have 12-18 months to add this or be flanked. |
| 2 | **HeyGen** | Biggest brand-governance presence in UGC (Brand Hub 2.0, 175 languages, batch variants), but their Brand Kit stops at logos/colors/glossary — they haven't gone semantic. They have the enterprise muscle to ship a neuro loop, but shipping it requires rebuilding the generation stack around a reward signal they don't currently model. A focused insurgent can get there first on a smaller surface area. |
| 3 | **Opus Clip** | Built their brand on the Virality Score, which is the weakest technical moat on this list — a heuristic ranker that a recursive-neuro loop renders obsolete. The moment a buyer sees a side-by-side where the neuro-optimized clip beats the Opus top-scored clip, the pitch collapses. |

Descript is notably *not* on this risk list because it sits in a different job-to-be-done (long-form editing for creators/podcasters). Synthesia is safe short-term due to enterprise procurement lock-in. Runway is safe because it's a creative tool, not a performance-marketing tool.

---

## 7. Summary Table (One Glance)

| Tool | Primary JTBD | Brand RAG | Neuro loop | Batch UGC | In-frame edit | Public starting $ |
|---|---|---|---|---|---|---|
| Descript | Long-form editor | No | No | No | Partial (Underlord) | $16/mo |
| HeyGen | Avatar UGC at scale | Shallow (Brand Hub) | No | **Yes** | No | $24/mo |
| Arcads.ai | Performance UGC ads | No | No | **Yes** | No | $149/mo |
| Creatify | URL → UGC ads | URL scrape only | No | Yes | No | $19/mo |
| Captions | Social clips + AI twin | No | No | Partial | No | $9.99/mo |
| Opus Clip | Long → short clip farm | No | Heuristic only | No | No | $29/mo |
| Synthesia | Enterprise avatars | Shallow (Brand Kit) | No | Partial | No | $18/mo |
| Runway | Generative video studio | No | No | No | **Yes (Aleph)** | $12/mo |
| Pictory | Article → video | No | No | No | No | $19/mo |
| InVideo AI | Prompt → video | No | No | No | No | ~$20/mo |
| Pika | Generative clips | No | No | No | No | ~$10 pack |
| Luma (Ray 3) | Generative video | No | No | No | No | $9.99/mo |
| Akool | Face-swap / lip-sync | No | No | No | Partial | Free + paid |
| ReelFarm | TikTok UGC automation | No | No | Yes | No | $19/mo |
| Tavus | Conversational agents | **Yes (persona RAG)** | No | No | N/A | $59/mo |
| **Empty quadrant** | **Recursive-loop brand UGC** | **Deep** | **Yes** | **Yes** | **Yes** | **—** |

---

## 8. Citations (master list)

**Descript:** [Pricing](https://www.descript.com/pricing) · [Underlord](https://www.descript.com/underlord) · [Season 6](https://www.descript.com/blog/article/descript-season-6-meet-underlord) · [Eye Contact](https://www.descript.com/eye-contact) · [Filler words](https://www.descript.com/filler-words) · [Sept 2025 pricing recap (Trebble)](https://www.trebble.fm/post/descript-pricing-september-2025)

**HeyGen:** [Pricing](https://www.heygen.com/pricing) · [UGC Avatars](https://www.heygen.com/avatars/ugc) · [Brand Kit help](https://help.heygen.com/en/articles/9889198-how-to-create-a-brand-kit) · [Avatar IV launch recap](https://medium.com/@AdaGaoYY/heygen-launches-ai-powered-ugc-ad-avatars-revolutionizing-product-video-creation-6ecbc4387dba)

**Arcads:** [Arcads AI homepage](https://www.arcads.ai) · [Speech-to-Speech](https://www.arcads.ai/features/speech-to-speech) · [eesel review](https://www.eesel.ai/blog/arcads-ai)

**Creatify:** [Pricing](https://creatify.ai/pricing) · [vs HeyGen comparison](https://creatify.ai/compare/heygen)

**Captions:** [Plans](https://captions.ai/plans) · [Mirage pricing](https://mirage.app/captions/pricing)

**Opus Clip:** [Pricing](https://www.opus.pro/pricing) · [Virality Score](https://www.futurepedia.io/courses/opus-clip-ai/lessons/virality-score)

**Synthesia:** [Pricing](https://www.synthesia.io/pricing) · [Enterprise pricing (Speechify)](https://speechify.com/blog/what-is-synthesia-enterprise-pricing/)

**Runway:** [Pricing](https://runwayml.com/pricing) · [Aleph research](https://runwayml.com/research/introducing-runway-aleph) · [Aleph help](https://help.runwayml.com/hc/en-us/articles/43176400374419-Creating-with-Aleph)

**Pictory:** [Pricing](https://pictory.ai/pricing/)

**Luma:** [Pricing](https://lumalabs.ai/pricing) · [Dream Machine pricing info](https://lumalabs.ai/learning-hub/dream-machine-support-pricing-information)

**Pika:** [pika.art](https://pika.art/)

**Akool:** [Pricing](https://akool.com/pricing)

**ReelFarm:** [reel.farm](https://reel.farm/)

**Tavus:** [tavus.io](https://www.tavus.io/) · [Video agents](https://www.tavus.io/video-agents) · [Cost comparison](https://www.tavus.io/post/conversational-video-ai-cost-comparison)

**Neuromarketing APIs (analog landscape):** [Neurons AI](https://www.neuronsinc.com/neurons-ai) · [Neurons API](https://www.neuronsinc.com/api) · [Realeyes PreView](https://www.realeyesit.com/ad-testing/preview/) · [RealEye × Neurons case study](https://www.realeye.io/case-study/realeye-and-neurons-developed-technology-for-online-ad-testing) · [CreativeX AttentionX](https://blog.realeyesit.com/creativex-and-realeyes-join-forces-to-launch-attentionx)
