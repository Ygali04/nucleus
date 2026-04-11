# Research Roadmap

This is the plan for how Nucleus becomes, over the next 24 months,
the organization that owns the scientific frontier of
neuromarketing video. Every item is phrased as a project that could
be assigned to a specific person next quarter.

The levers are organized in four groups:

1. **Internal dataset collection** — the data Nucleus builds
2. **Behavioral validation studies** — the A/B tests that prove
   the loop works
3. **Open benchmark contributions** — the benchmarks Nucleus
   publishes
4. **Papers, conferences, partnerships, and open source** — the
   thought-leadership stack

## Internal dataset collection

### N-Data-1: Nucleus UGC-fMRI corpus, Phase 1

The first-of-its-kind short-form vertical UGC ad fMRI dataset.

| Field | Value |
|---|---|
| **Stimuli** | 200 short-form UGC ads (mix of in-house generation + scraped public ads with rights cleared) across 5 DTC verticals |
| **Subjects** | 24 × 1 hour × 3T scan = ~24 usable hours |
| **Target space** | fsaverage5 surface for TRIBE v2 compatibility |
| **Cost** | $150–200k (scanner time + subjects + preprocessing) |
| **Timeline** | 3 months from IRB approval to data release |
| **Output** | A small but ad-native fMRI dataset for fine-tuning TRIBE v2's prediction head |
| **Owner** | Research lead + partnership with a university neuroimaging center |
| **Status** | Planned, pending IRB |

### N-Data-2: Behavioral parallel panel

The behavioral column that pairs with the fMRI data.

| Field | Value |
|---|---|
| **Stimuli** | Same 200 ads as N-Data-1 |
| **Subjects** | 500 remote webcam-eye-tracked subjects via Prolific or Lumen |
| **Measurements** | Eye-tracking + self-report (liking, memorability, share-intent) + 24h recall |
| **Cost** | ~$25–50k |
| **Timeline** | 4 weeks |
| **Output** | Behavioral column for every ad in N-Data-1, enabling neuroforecasting model fitting |
| **Owner** | Research lead |
| **Status** | Planned, unblocks on N-Data-1 stimulus finalization |

### N-Data-3: In-market outcomes column

The ground-truth label for the entire predictive pipeline.

| Field | Value |
|---|---|
| **Approach** | Run the same ads as real paid-media campaigns on Meta / TikTok with a small budget ($5–15k per ad) |
| **Measurements** | CTR, view-through, conversion, brand lift |
| **Cost** | $1–3M in media spend (the big line item — possibly in partnership with a customer brand) |
| **Timeline** | 8–12 weeks |
| **Output** | The outcome column that turns neural predictions into revenue correlations |
| **Owner** | GTM lead + research lead |
| **Status** | Planned, requires a customer-brand partnership or sponsored spend |

### N-Data-4: UGC-native EEG

The sub-second complement to the fMRI data.

| Field | Value |
|---|---|
| **Stimuli** | 100 ads × 64-channel EEG = ~10k trials |
| **Subjects** | 100 (much cheaper than fMRI) |
| **Cost** | ~$30k |
| **Timeline** | 6 weeks |
| **Output** | High-temporal-resolution cross-check on TRIBE v2's sub-second blind spots — frontal asymmetry and parietal attention signals |
| **Owner** | Research lead, possibly via academic partner |
| **Status** | Planned, runs in parallel with N-Data-1 |

## Behavioral validation studies

### N-AB-1: Neural-scored vs human-curated

The headline experiment.

> Generate 40 ads for a single brand. Split into 20 selected by
> Nucleus neural score and 20 selected by a panel of expert UGC
> strategists. Run both sets in real paid media. Predicted result:
> neural-selected set wins by ≥15% on CPA.

This is the publishable headline. If it works, it's the proof
that the closed loop is commercially meaningful. If it doesn't,
the thesis needs revision before GA.

### N-AB-2: Within-loop improvement

Does the loop actually learn?

> Run the Nucleus recursive loop for 5 iterations on a fixed
> brief. At each iteration, measure real-world KPIs on the top-
> decile ads. Predicted result: monotonic improvement across
> iterations on conversion, with diminishing returns by iteration
> 3.

This tests whether the loop converges or just thrashes.

### N-AB-3: Neural vs behavioral reward

Is the neural signal actually better than a behavioral proxy?

> Run two parallel loops on the same brand: one rewarded on
> Realeyes-style behavioral prediction, one on TRIBE-derived
> neural prediction. Measure which produces better in-market
> performance. Predicted result: neural wins by a small but
> statistically significant margin on share-rate and brand-lift;
> behavioral wins on raw CTR.

This clarifies the use-case split between the two scoring
paradigms.

### N-AB-4: Population transfer test

Replicate the neuroforecasting paradigm for UGC.

> Collect small-sample fMRI data on 20 subjects for 40 ads, use
> it to forecast aggregate outcomes for those 40 ads at 1000+
> subject scale.

Replicates Genevsky & Knutson 2015 for the UGC format.
Publishable in *Psychological Science*, *PNAS Nexus*, or
*Journal of Neuroscience*.

## Open benchmark contributions

### N-Bench-1: UGC-Brain-Score

The open benchmark for scoring neural encoders on UGC content.

| Element | Detail |
|---|---|
| Train split | 150 Nucleus-collected UGC ads with fMRI + behavioral labels |
| Test split | 50 held-out UGC ads with all labels sealed until submission |
| Metrics | Nucleus ROI-weighted Pearson r + neuroforecasting R² + behavioral accuracy |
| Infrastructure | Mirror Brain-Score's Docker + GitHub submission model |
| Governance | Nucleus as maintainer, academic advisory board |
| Release | Phase 1 after Nucleus has 6 months commercial head start |
| Outcome | Nucleus becomes the canonical arbiter of "is your model good at scoring ads" |

### N-Bench-2: UGC-Algonauts partnership track

A UGC track in the 2027 Algonauts challenge.

| Element | Detail |
|---|---|
| Partners | Gemma Roig, Radoslaw Cichy, Aude Oliva (current Algonauts organizers) |
| Data | Nucleus contributes UGC corpus |
| Academic lead | MIT CSAIL + Goethe University Frankfurt |
| Nucleus contribution | Data + financial sponsorship + technical support |
| Outcome | Hundreds of academic teams stress-testing the UGC encoding problem on Nucleus's data |
| Timeline | Q3 2026 partnership conversation, Q1 2027 challenge launch |

## Papers to write

Seven papers across the 24-month roadmap.

### Paper 1 — The UGC-Brain-Score benchmark

**Title:** *UGC-Brain-Score: A benchmark for neural encoding
models of short-form vertical video advertisements.*

**Abstract:** We release a 200-ad, 24-subject fMRI dataset and a
behavioral parallel panel, and show that current SOTA brain
encoders (TRIBE v2) lose ~40% Pearson r when applied zero-shot to
UGC compared to in-domain naturalistic film.

**Target venue:** *Nature Communications* or *NeurIPS* (Datasets
and Benchmarks track).

### Paper 2 — Neuroforecasting short-form ads

**Title:** *Neuroforecasting short-form ad performance: NAcc as a
reward signal for generative video pipelines.*

**Abstract:** A 24-subject fMRI study predicting CTR / conversion
for 200 UGC ads run at 1M+ impression scale, showing that
NAcc-weighted TRIBE v2 output explains 35% of variance in real
paid-media CTR beyond behavioral baselines.

**Target venue:** *Journal of Marketing Research* or *PNAS Nexus*.

### Paper 3 — Domain adaptation

**Title:** *Domain adaptation of tri-modal brain encoders from
naturalistic film to short-form advertising content.*

**Abstract:** Technical paper on fine-tuning TRIBE v2's prediction
head on 150 ads, yielding an X% improvement on a held-out test
set.

**Target venue:** *NeurIPS NeuroAI Workshop* or *CCNeuro*.

### Paper 4 — Closed-loop optimization

**Title:** *Closed-loop generative video optimization with
neuro-predictive reward models.*

**Abstract:** Position + empirical paper describing the Nucleus
recursive pipeline and reporting in-market results against
baseline.

**Target venue:** *Marketing Science* or *Nature Human Behaviour*.

### Paper 5 — The ecological validity gap

**Title:** *The ecological validity gap in naturalistic
neuroscience: why Forrest Gump doesn't predict TikTok.*

**Abstract:** Opinion piece framing the open problem of movie-to-
ad transfer and inviting the field to address it.

**Target venue:** *Trends in Cognitive Sciences* or *Nature Human
Behaviour* (commentary).

### Paper 6 — Shared-subject latent for UGC

**Title:** *A shared-subject latent for small-sample ad
neuroforecasting, inspired by MindEye 2.*

**Abstract:** Methods paper showing how to transfer a group-level
head to a new 5-subject scan and still forecast population
outcomes. Brings MindEye 2's technique into the encoder side.

**Target venue:** *ICML* or *NeurIPS*.

### Paper 7 — Ad hook engineering at sub-second resolution

**Title:** *Ad hook engineering: sub-second neural predictors of
swipe-away in short-form video.*

**Abstract:** EEG cross-check on the fMRI-blind sub-second regime,
using the N-Data-4 dataset. Identifies frontal asymmetry and
parietal alpha signatures that predict swipe-away within 1
second.

**Target venue:** *Frontiers in Human Neuroscience* or *NeuroImage*.

## Industry / academic partnerships

The 12 labs and organizations Nucleus wants to partner with.

| Lab | PI | Why Nucleus | Collaboration shape |
|---|---|---|---|
| **Stanford SPANlab** | Brian Knutson | Neuroforecasting + NAcc literature is his — intellectual lineage of the entire product | Sponsor a postdoc, joint paper on UGC NAcc signal |
| **Annenberg CNS Lab (Penn)** | Emily Falk | mPFC → real-world behavior, virality | Co-author the share-prediction paper; Nucleus brings data |
| **Stanford GSB** | Alexander Genevsky | The living author of *When Brain Beats Behavior* | Advisor on forecasting methodology |
| **NYU Vessel Lab** | Ed Vessel | Aesthetic / default-mode network signal | Joint paper on aesthetic channels of UGC |
| **Erasmus / Rotterdam Neuroeconomics** | Ale Smidts, Maarten Boksem | *JMR 2024 Chan et al.* — the direct methodological template | Collaborate on replication + extension |
| **MIT CSAIL / Algonauts** | Aude Oliva, Radoslaw Cichy, Gemma Roig | The Algonauts organizers; academic legitimacy for any benchmark | Co-host UGC-Algonauts 2027 track |
| **Montreal CNeuroMod** | Pierre Bellec | Training data provider for TRIBE | Technical collaboration on fine-tuning |
| **Meta FAIR Brain & AI** | Stéphane d'Ascoli, Jean-Rémi King | The TRIBE v2 authors | Explore commercial licensing; offer to be a real-world deployment partner; co-author a "TRIBE in the wild" paper |
| **MIT McDermott Lab** | Josh McDermott | Auditory cortex modeling (Kell et al. 2018) | Voiceover-only scoring head |
| **DiCarlo Lab (MIT)** | James DiCarlo, Martin Schrimpf (EPFL) | Brain-Score authority | Methodology advisor on scorer evaluation |
| **Immersion Neuroscience** | Paul Zak | HRV data for wearable cross-check | Data-sharing partnership |
| **MSI / Forbes group** | Multiple | Industry visibility | White papers, MSI grant |

## Conferences to target

### Primary (scientific credibility)

| Conference | Why |
|---|---|
| **Society for Neuroeconomics (SfNE)** | Annual meeting of the neuroforecasting community. Knutson, Genevsky, Smidts, Falk all present here. Direct line to the research mainstream. |
| **Cognitive Computational Neuroscience (CCNeuro / CCN)** | Where the Algonauts community meets. Best for encoder methodology papers. |
| **NeurIPS NeuroAI Workshop** | Where Brain-Score and CORnet were published. Best for the modeling papers. |
| **CogSci / VSS** | Broader cognitive science audience. |

### Secondary (industry visibility)

| Conference | Why |
|---|---|
| **ANA Brand Masters / ANA Masters of Marketing** | Fortune 500 brand-side audience. This is where the customers are. |
| **Cannes Lions** | Creative industry cachet. |
| **IAB ALM** | Digital advertising execs. |

### Academic marketing journals

| Venue | Why |
|---|---|
| **Journal of Consumer Research (JCR)** | Flagship marketing journal. |
| **Marketing Science** | Quant / model-driven audience. |
| **Journal of Marketing Research (JMR)** | Where Chan et al. 2024 lives. The direct template for Nucleus's behavioral work. |
| **EMAC (European Marketing Academy)** | European counterpart. |
| **Marketing & Public Policy Conference (AMA)** | For the ethics / disclosure story. |
| **Marketing Science Institute (MSI)** | Funding source + thought-leader network. |

## Open-source contributions

Three tiers, all live within 12 months.

### Tier 1 — `nucleus-eval-harness`

**License:** MIT

An open-source benchmark harness for any neural video scorer. Takes
a model with a standard interface and runs it against a fixed
suite of encoding + forecasting + OOD tests. Sibling to Brain-Score
Vision.

**Outcome:** Establishes Nucleus as a legitimate evaluator, not
just a vendor. Academic labs will submit to it; commercial
vendors will quietly use it to internally benchmark against
Nucleus.

### Tier 2 — `nucleus-slice-api`

**License:** MIT

The OpenAPI spec + reference client for "slice scoring" — the
canonical API shape Nucleus has arrived at (segment a video,
score each slice, return per-slice neural metrics + aggregated
outcome forecast).

**Outcome:** Meant to become the industry default the way
Stripe's API shape became the default for payments. Other
vendors can adopt the spec; Nucleus's docs and tooling become
the canonical reference.

### Tier 3 — `nucleus-ugc-bench`

**License:** CC BY 4.0

The labeled UGC corpus from N-Data-1, with behavioral outcomes.
Released after Nucleus has 6 months of commercial head start.

**Outcome:** The canonical public dataset for short-form ad
neural encoding. Becomes a standard citation in papers that
come after.

### Smaller contributions

- **Fine-tuning recipes** for adapting TRIBE v2 / V-JEPA 2 to the
  UGC domain (if license permits)
- **A NucleusScore vertex-atlas visualizer** that maps TRIBE
  predictions to marketing-relevant ROIs for any input video.
  Useful for research communication
- **A CC BY 4.0 dataset on HuggingFace** containing the
  Nucleus-produced UGC variants + their neural scores + real-
  world outcomes

## Blog series and white papers

Thought leadership content Nucleus publishes to establish the
brand in the research community.

| Post | Audience |
|---|---|
| *What TRIBE v2 actually is — a technical reader's guide* | Researchers |
| *Why we fine-tuned the scorer (and what it took)* | Engineering blog readers |
| *The Forrest-to-TikTok gap* | Academic community |
| *Neuro-reward inside a generative loop — an RLHF parallel* | ML community |
| *Why NAcc matters more than mPFC for short-form ads* | Marketing scientists |
| *An honest comparison: TRIBE v2, Neurons AI Predict, and Realeyes PreView on the same 50 UGC ads* | Industry |
| *Brand-Score: why the ad industry needs its own benchmark* | Both |
| *Neuroforecasting UGC: an experimental framework* | Downloadable 40-page white paper for brand teams |

## Dataset contributions to OpenNeuro / HuggingFace

- **OpenNeuro:** the N-Data-1 fMRI UGC corpus (after commercial
  runway)
- **HuggingFace:** the UGC-Brain-Score test set, the Nucleus-Score
  reference implementation, fine-tuned adapter weights
- **Zenodo:** the behavioral panel + the outcomes column, with
  DOIs for citability

## 24-month milestone plan

| Quarter | Milestone |
|---|---|
| **Q2 2026** | N-Data-1 IRB approval; N-Data-2 panel run; Paper 1 draft started |
| **Q3 2026** | N-Data-1 fMRI collection complete; N-Data-4 EEG collection complete; first N-AB experiment live |
| **Q4 2026** | First fine-tuned in-house model; Algonauts 2025 replication numbers published; Paper 1 submitted to NeurIPS D&B |
| **Q1 2027** | `nucleus-eval-harness` open-sourced; UGC-Brain-Score v0 benchmark public; UGC-Algonauts 2027 partnership announced |
| **Q2 2027** | Papers 2 and 3 submitted; N-AB-1 results public; commercial license conversation with Meta continuing |
| **Q3 2027** | `nucleus-ugc-bench` released under CC BY 4.0; Paper 4 submitted; first external lab submissions to UGC-Brain-Score |
| **Q4 2027** | Paper 5 submitted as commentary; first industry case studies with measurable lift; Society for Neuroeconomics presentation |
| **Q1 2028** | UGC-Algonauts 2027 challenge runs; Paper 6 submitted |
| **Q2 2028** | Paper 7 submitted; cohort personalization work begins; second customer deployment |

## Success criteria

By the end of 2027, Nucleus is the research leader in
neuromarketing video if:

1. At least **3 papers are published** in peer-reviewed venues
2. At least **2 lab partnerships are active** with named PIs and
   joint publications in progress
3. **UGC-Brain-Score has ≥ 20 external submissions**
4. **At least one customer case study** shows > 20% in-market lift
   attributable to Nucleus
5. The **in-house `AttentionProxyAnalyzer` matches ≥ 85% of TRIBE
   v2's group-averaged accuracy** on Algonauts 2025
6. **The TRIBE v2 license question is resolved** — either via a
   commercial agreement with Meta or by demonstrating that the
   in-house model is good enough to replace it

## What this roadmap doesn't cover

- **Day-to-day engineering work** — that's on the
  [engineering roadmap](../roadmap.md), not this one
- **Commercial milestones** — covered in
  [GTM → launch sequence](../gtm/launch.md)
- **Hiring plans** — research roadmap implies ~4 research FTEs
  by end of 2027, but the hiring plan is separate
- **Funding strategy** — the roadmap is affordable at seed-stage
  volumes if customer partnerships cover the paid-media line item;
  otherwise it requires additional capital

## The spirit of the roadmap

This roadmap is ambitious. Every item has been chosen because it
compounds with the others — a new dataset makes the model better,
a better model makes the benchmark credible, a credible benchmark
produces papers, papers produce partnerships, partnerships produce
more data. The 24-month plan is the minimum credible path to being
called "the world's best neuromarketing system."

If any individual project fails, the rest still stand. If several
fail, Nucleus is still ahead of the field because the field isn't
trying. This is the scientific moat — and it's only defensible if
Nucleus actually does the work.
