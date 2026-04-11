# Glossary

Terms used across the Nucleus documentation, defined once.

## A

**AIM framework** — Affect–Integration–Motivation framework from
Knutson, Katovich & Suri (2014). The theoretical spine of
neuroforecasting: affect components (NAcc, AIns) generalize across
people; integrative components (mPFC) are more idiosyncratic.

**Algonauts** — Community benchmark series for brain-response
prediction from sensory input. Runs annual challenges in 2019,
2021, 2023, 2025. TRIBE v1 won the 2025 movie-watching challenge.

**Anterior insula (AIns)** — Brain region tied to anticipatory
avoidance / negative affect. The "bounce signal" in the Nucleus
hook metric.

**Archetype** — One of Nucleus's four output classes (demo,
marketing, knowledge, education). Each archetype has its own
generation stack and scoring weights.

**AttentionProxyAnalyzer** — The commercially-clean fallback
scorer Nucleus plans to build. Uses V-JEPA 2 + Wav2Vec-BERT +
LLaMA 3.2 as frozen backbones with a trained head predicting
behavioral proxies (eye-tracking, pupil dilation, recall, CTR)
instead of fMRI BOLD.

## B

**BOLD** — Blood-oxygen-level-dependent signal. The fMRI
measurement that tracks neural activity indirectly via
hemodynamic response. 1 Hz effective resolution.

**BOLD Moments Dataset (BMD)** — Algonauts 2021 dataset. 10
subjects × 1,102 × 3-second naturalistic clips. Closest academic
precedent to short-clip encoding.

**Brain-Score** — Open benchmark that scores ANN features
against neural and behavioral datasets in primate vision. Template
for Nucleus's proposed UGC-Brain-Score.

**Brand KB** (Brand Knowledge Base) — A tenant-scoped
retrieval-augmented knowledge store that grounds every generated
variant. Built on LightRAG / LlamaIndex / RAGAnything.

**Brief** — The input to a Nucleus job. Specifies source
recording, Brand KB, ICPs, languages, archetypes, platforms, score
threshold, and max iterations.

## C

**Candidate** — A single variant inside a Nucleus job. The
cross-product expansion produces one candidate per (ICP, language,
archetype, platform, variant_index) cell.

**C2PA** — Content Authenticity Initiative / Coalition for Content
Provenance and Authenticity. Industry-standard content-
credentials metadata format. Nucleus embeds C2PA metadata in
every output.

**CC BY-NC 4.0** — Creative Commons Attribution-NonCommercial 4.0
International license. The license TRIBE v2 ships under. Blocks
commercial use.

**CNeuroMod (Courtois NeuroMod)** — 6-subject dense fMRI dataset
scanned over 5 years on long-form TV and films. TRIBE v1 training
base.

**Cross-product** — The fan-out of a brief across ICPs ×
languages × archetypes × platforms × variants-per-cell. A brief
with 10 ICPs × 4 languages × 2 archetypes × 3 platforms × 2
variants produces 480 candidates.

## D

**DeepTutor** — The multi-agent RAG pipeline Nucleus reuses for
Brand KB management and the education archetype's research
pipeline.

**Deepfake** — Per EU AI Act Article 3(60), "AI generated or
manipulated image, audio or video content that resembles existing
persons, objects, places, entities or events and would falsely
appear to a person to be authentic or truthful." Nucleus adds
explicit labels to deepfake-class variants.

**DreamSim** — Perceptual similarity metric trained on human
triplet judgments. Used in the recursive loop as a diversity
guard to prevent mode collapse.

## E

**Editor agent** — The Nucleus agent that reads a neural score
breakdown and issues targeted edits (hook rewrite, cut tightening,
music swap, etc.) on an under-threshold candidate.

**Ecological validity** — How well lab conditions reflect
real-world usage. The "Forrest-to-TikTok gap" is the primary
ecological validity concern for TRIBE v2 → UGC transfer.

**ElevenLabs IVC** — Instant Voice Clone. The voice cloning
service Nucleus uses for brand-consistent voiceover.

## F

**fMRI** — Functional magnetic resonance imaging. Measures brain
activity via BOLD signal. 1 Hz temporal, ~2 mm spatial.

**fsaverage5** — Standard cortical surface mesh (~20k vertices)
used by TRIBE v2 as its output space.

## G

**Generator agent** — The Nucleus agent that reads a brief, Brand
KB, and source footage, and produces a candidate variant through
the hybrid generation stack.

**Generative reward vs measurement** — Two incompatible evaluation
criteria for neural scorers. Generative reward needs speed,
smoothness, and relative ranking. Measurement needs accuracy,
calibration, and interpretability. Most academic benchmarks
optimize for measurement; Nucleus argues generative reward
requires its own benchmark.

## H

**HeyGen** — Avatar video platform. Nucleus uses HeyGen (via
TruPeer's existing partnership) for marketing-archetype
talking-head shots.

**Hippocampus** — Brain region tied to memory encoding. Nucleus's
memory-encoding metric.

**Host product** — The brand-facing SaaS Nucleus embeds inside.
First host is TruPeer.

**Hook score** — The neural score for the first 0–3 seconds of a
variant. Driven by NAcc + AIns onset differential. Highest-weighted
metric for marketing-archetype variants.

## I

**ICP** — Ideal Customer Profile. A canonical persona definition
in a tenant's ICP library.

**In-distribution / out-of-distribution (ID/OOD)** — Whether a
test stimulus was inside the training distribution. TRIBE v1
reported r = 0.3195 ID and 0.2604 OOD.

**In-format / out-of-format** — Whether a test stimulus has the
same format as training stimuli. Movie → movie is in-format; movie
→ UGC is out-of-format. The axis Nucleus most cares about.

**Iteration** — One pass of the recursive loop on a candidate.
Each iteration produces a new rendered artifact and a new score.

## J

**JWT** (JSON Web Token) — Signed token used for auth handoff
between the host product and Nucleus.

## L

**LightRAG** — Knowledge-graph-based RAG framework. Default
Brand KB provider.

**Lyria** (Google Lyria 2) — AI music generation model. Default
music layer in Nucleus.

## M

**MCP** (Model Context Protocol) — Open standard for AI agents
to call external tools. TruPeer ships an MCP server that Nucleus
uses as a Brand KB source.

**mPFC** (medial prefrontal cortex) — Brain region tied to value
integration and social cognition. The "share signal" per Scholz
2017.

**MindEye / MindEye 2** — fMRI-to-image decoder. Not a scorer,
but relevant because (a) it proves how much information is
recoverable from cortex, and (b) its shared-subject latent
technique is relevant for small-panel Nucleus deployments.

## N

**NAcc** (nucleus accumbens) — Brain region tied to anticipatory
reward / approach. The "hook signal" per Tong 2020, Berns 2012,
Knutson 2014.

**NeuroPeer** — The existing neuromarketing scoring service in
the author's stack. Nucleus's default analyzer path runs TRIBE v2
through NeuroPeer, with `AttentionProxyAnalyzer` as the
commercially-clean fallback.

**Neuroforecasting** — Using small-sample brain signals to
predict large-sample behavioral outcomes. Central paradigm of
Knutson, Genevsky, Falk, Berns. The scientific foundation of
Nucleus's reward model.

**Noise-normalized Pearson r** — Pearson correlation normalized
by the split-half reliability of the ground-truth signal. The
canonical metric in Brain-Score and Algonauts.

## O

**OpenRouter** — LLM routing service Nucleus uses to call
Anthropic / OpenAI / Google models behind a single API.

**Orchestrator** — The Nucleus state machine that coordinates
the recursive loop. The one net-new service in the engine.

## P

**Pluggable analyzer** — The Protocol-typed interface that lets
Nucleus swap scoring backends (TRIBE v2, `AttentionProxyAnalyzer`,
third-party) at config time.

**Postmortem** — Written incident review for CRITICAL / HIGH
severity events, within 7–14 days. Blameless, focused on system
improvements.

## R

**RAG** — Retrieval-Augmented Generation. The pattern of
retrieving relevant context before generating text. Nucleus's
Brand KB is a RAG store.

**Remotion** — Programmatic React video framework. Nucleus's
primary composition layer for deterministic branded templating.

**Research track vs production track** — Two parallel scoring
tracks Nucleus runs. Research track uses TRIBE v2 for
benchmarking only. Production track uses
`AttentionProxyAnalyzer` for commercial deployment.

## S

**Schaefer-1000 atlas** — A cortical parcellation scheme (Schaefer
et al. 2018). TRIBE v1 predicts into Schaefer 1000-parcel space.

**Seedance 2.0** — ByteDance's diffusion video model. Current
Arena Elo leader for text-to-video. Cost-optimized tier in
Nucleus's routing.

**Slice scoring** — Nucleus's optimization where only the changed
slice of an edited variant is re-scored, reusing parent metrics
for the unchanged portion. ~70% cost reduction per iteration.
The one upstream change required of NeuroPeer.

**Source recording** — Brand-owned video asset (typically from
TruPeer's Chrome extension) that Nucleus generates variants from.

**State machine** — The formal model of candidate states
(pending → generating → scoring → evaluating → editing →
delivering → delivered / failed). Lives in Postgres.

**Stop condition** — A condition that terminates the loop on a
candidate (score passed, max iterations, monotone failure, cost
ceiling, time ceiling, manual kill).

**Strategist agent** — The Nucleus agent that synthesizes a GTM
strategy guide from a job's scored variants.

**SynthID** — Google's invisible watermarking system. Embedded
automatically in Veo 3.1 output.

## T

**Tavus** — Conversational video AI platform. Nucleus backup for
interactive avatar use cases.

**Tenant** — A host-product customer with access to Nucleus. 1:1
mapping with a host-product tenant.

**TRIBE v1** — The Algonauts 2025 winning model (d'Ascoli et al.
2025, arXiv:2507.22229). 4 subjects × 80 hours × 1,000 parcels.
The version with reproducible validation numbers.

**TRIBE v2** — Meta FAIR's March 2026 release (d'Ascoli et al.
2026). ~720 subjects × ~1,115 hours × fsaverage5 mesh. The
version Nucleus treats as the benchmark target.

**TruPeer** — The host product for Nucleus's first deployment.
B2B SaaS that turns screen recordings into polished videos + docs
+ translations.

## U

**UGC** (User-Generated Content) — Video content that looks
creator-made rather than studio-made. In 2026, the dominant paid
social creative format. Often AI-generated in commercial
pipelines.

**UGC-Brain-Score** — The open benchmark Nucleus intends to
publish. Extends Brain-Score methodology to short-form vertical
UGC ad content.

## V

**Variant** — A single rendered piece of content Nucleus produces
from a brief. Each candidate in the loop becomes at most one
delivered variant.

**V-JEPA 2** — Meta's self-supervised video encoder (Assran et
al. 2025, arXiv:2506.09985). Apache 2.0 licensed. The video
backbone inside TRIBE v2 and the basis for Nucleus's
`AttentionProxyAnalyzer`.

**Veo 3.1** — Google's diffusion video model. Default diffusion
provider for Nucleus's marketing archetype hero clips.

**Voyage AI** — Embedding model provider. Default embedding model
(`voyage-3`) for Brand KB chunks.

## W

**Wav2Vec-BERT 2.0** — Meta's self-supervised audio encoder.
The audio backbone inside TRIBE v2 and reused in
`AttentionProxyAnalyzer`.

## Abbreviations

| Abbr | Full |
|---|---|
| AIM | Affect-Integration-Motivation framework |
| AIns | Anterior insula |
| BKB | Brand Knowledge Base |
| BOLD | Blood-oxygen-level-dependent |
| CC BY-NC | Creative Commons Attribution-NonCommercial |
| CPA | Cost per acquisition |
| CTR | Click-through rate |
| DMN | Default-mode network |
| fMRI | Functional magnetic resonance imaging |
| HRF | Hemodynamic response function |
| ICC | Intraclass correlation coefficient |
| ICP | Ideal Customer Profile |
| IRB | Institutional Review Board |
| IVC | Instant Voice Clone |
| KB | Knowledge base |
| LLM | Large language model |
| LMS | Learning management system |
| MCP | Model Context Protocol |
| mPFC | Medial prefrontal cortex |
| NAcc | Nucleus accumbens |
| NLE | Non-linear editor |
| NSD | Natural Scenes Dataset |
| OFC | Orbitofrontal cortex |
| OOD | Out-of-distribution |
| PVC | Professional Voice Clone |
| RAG | Retrieval-Augmented Generation |
| RLS | Row-level security |
| ROI | Region of interest |
| SaaS | Software as a Service |
| SLO | Service level objective |
| SOP | Standard operating procedure |
| SSO | Single sign-on |
| STG | Superior temporal gyrus |
| TPJ | Temporoparietal junction |
| UGC | User-Generated Content |
| VFX | Visual effects |
