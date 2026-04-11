# Benchmarks

This page covers the specific benchmark suites Nucleus runs
against, the benchmark Nucleus intends to publish, and how the two
fit together.

## The two benchmark families

| Family | Owner | Focus | Open? |
|---|---|---|---|
| **Algonauts** | MIT + collaborators (Cichy, Roig, Oliva) | Vision / vision+audio / multimodal encoding from naturalistic stimuli | Open challenge, annual |
| **Brain-Score** | DiCarlo lab (Schrimpf, Kubilius) | Vision model alignment to V1/V2/V4/IT neural + behavioral data | Open leaderboard, continuous |

Both are foundational. Nucleus treats both as required tests for
any model it ships, plus extends them with UGC-specific
benchmarks that don't yet exist.

## Algonauts — the community video benchmark

**Website:** algonautsproject.com

The Algonauts Project runs the canonical challenges for brain
response prediction:

| Year | Challenge | Stimulus | Best metric |
|---|---|---|---|
| **2019** | Image → IT cortex | Images | Early CNN entries |
| **2021** | 3 s clip → BOLD | BOLD Moments Dataset (10 subj × 1,102 × 3 s clips) | Peak r ≈ 0.22 normalized |
| **2023** | Image → ventral stream | NSD (8 subj × ~73k images) | DINO/CLIP/EVA entries |
| **2025** | Movie → BOLD | CNeuroMod subset (4 subj × ~65 h movies) | TRIBE v1 won with 0.2146 noise-normalized |

### Algonauts 2025 methodology

1. Team submits an encoder that maps frozen backbone features to
   1,000 brain parcels via a linear or nonlinear head
2. Evaluation runs predictions on held-out movie frames from
   subjects seen during training
3. Scores are noise-normalized Pearson r, averaged across parcels
   and subjects
4. Final leaderboard metric is a single scalar
5. Top 3: TRIBE (Meta FAIR) 0.2146, VIBE (MPI NCG) 0.2096, SDA
   0.2094

**Methodological limit:** No held-out-subject axis, no held-out-
format axis, no held-out-domain axis. This is what Nucleus's own
benchmark extends.

### What Nucleus reports against Algonauts

For every model Nucleus ships, the Algonauts 2025 score is
reported alongside:

- In-domain Pearson r (movie → movie)
- Out-of-domain Pearson r (movie → UGC-Brain-Score test set)
- Per-region breakouts for the Nucleus ROI list

The commitment is that Nucleus's in-house model will be within
10% of TRIBE v2's Algonauts 2025 score (so ~0.193 or better) by
the end of Year 1, while also shipping the out-of-domain UGC
numbers that TRIBE v2 hasn't published.

## Brain-Score — the vision model alignment benchmark

**Website:** brain-score.org
**Paper:** Schrimpf et al. 2020, Neuron 108(3):413–423.

Brain-Score is an **open benchmark** that pits ANN features against
~100 neural and behavioral datasets in primate vision. Methodology:

1. Map the model's features to V1/V2/V4/IT neural recordings via
   regression
2. Compute noise-ceiling-normalized Pearson r on each benchmark
3. Weight across benchmarks into a single composite score

**Why it's relevant to Nucleus:**

1. **It's the template for UGC-Brain-Score** (below).
2. **V-JEPA 2's Brain-Score can be published directly.** Nucleus's
   fallback analyzer uses V-JEPA 2 as its backbone, so the
   backbone's Brain-Score is a meaningful anchor.
3. **CORnet-S is the baseline to beat** on the Brain-Score V1/V2/V4/IT
   leaderboard if Nucleus ever wants to ship a lightweight "budget
   tier" scorer.

## UGC-Brain-Score — the benchmark Nucleus will publish

This is the Nucleus-specific extension. It doesn't exist yet. The
[research roadmap](research-roadmap.md) calls it **Project N-Bench-1**.

### The idea

A public benchmark suite with frozen train/test splits, specific
to short-form vertical UGC ads:

- **Train split:** 150 Nucleus-collected UGC ads with fMRI +
  behavioral labels
- **Test split:** 50 held-out UGC ads with all labels sealed until
  submission
- **Metrics:** Nucleus ROI-weighted Pearson r, neuroforecasting R²
  against CTR / view / share / conversion, behavioral prediction
  accuracy
- **Submission infrastructure:** mirror Brain-Score's Docker +
  GitHub submission model
- **Governance:** Nucleus as maintainer, academic advisory board

### Why publish a benchmark at all

Four reasons.

1. **It establishes Nucleus as the canonical arbiter of "is your
   model good at scoring ads."** Brand-Score does this for primate
   vision; UGC-Brain-Score can do it for ad content.
2. **It generates academic engagement.** Hundreds of labs will
   submit models if the benchmark is credible.
3. **It de-risks the TRIBE v2 license.** Publishing an open
   benchmark that doesn't depend on TRIBE v2 gives Nucleus a
   commercially-clean yardstick.
4. **It creates a moat from data, not from model weights.** The
   50-ad test set with in-market outcomes is the thing competitors
   can't easily replicate.

### The submission shape

```yaml
# nucleus-bench.yaml
model:
  name: "my-video-encoder"
  version: "1.0"
  backbone: "v-jepa-2"
  head: "linear-probe"
  license: "apache-2.0"

interface:
  # Model must expose this Python interface
  predict_bold: "my_model.predict_bold(video_uri: str) -> dict"
  predict_behavior: "my_model.predict_behavior(video_uri: str) -> dict"

compute:
  max_inference_time_per_video: 120  # seconds
  requires_gpu: true
  vram_gb: 24
```

Submissions run in a Docker container against the sealed test set.
Scores are published on a public leaderboard with full per-region
and per-outcome breakouts.

### UGC-Algonauts — the partnership track

Nucleus also plans to partner with the Algonauts organizers
(Gemma Roig, Radoslaw Cichy, Aude Oliva et al.) to host a **UGC
track in the 2027 Algonauts challenge**. Nucleus contributes the
data; the academic team contributes legitimacy and recruiting.

Outcome: hundreds of academic teams stress-testing the UGC
encoding problem on Nucleus's data, which validates the benchmark
and produces open research Nucleus can build on.

## Behavioral validation benchmarks

The neural prediction side has Algonauts and Brain-Score. The
behavioral side needs its own benchmarks. Three that Nucleus uses:

### Commercial analog comparison

Run Nucleus's model against the same 50 UGC ads that Neurons Inc's
Predict API scores and that Realeyes' PreView scores. Report
correlation with in-market CTR for each of the three. This is the
**honest head-to-head** paper the industry has never seen.

### DreamSim perceptual similarity

DreamSim (Fu et al., NeurIPS 2023) is a behavioral similarity
metric. Nucleus uses it as a **diversity guard** in the recursive
loop — it prevents the generator from collapsing onto a single
frame by rewarding perceptual distance from previous iterations.

### Outcome prediction R²

For every paper Nucleus publishes linking neural predictions to
behavioral outcomes, report R² against:

- CTR
- View-through rate
- Share rate
- Brand lift (survey-based)
- Conversion
- 24h recall (survey-based)

The commitment is to always report all six, even when the model
underperforms on some of them.

## The benchmark ladder

Nucleus's internal ladder for validating a model release:

| Rung | Test | Pass criterion |
|---|---|---|
| 1 | Sanity check on a 5-ad toy set | No runtime errors; outputs in expected range |
| 2 | Algonauts 2025 replication on TRIBE v1 held-in stimuli | Within 5% of TRIBE v1's published r |
| 3 | Out-of-distribution on *Pulp Fiction* | Within 10% of TRIBE v1's 0.2604 |
| 4 | BMD (Algonauts 2021) short-clip test | Peak r ≥ 0.18 |
| 5 | UGC-Brain-Score test set | Beats prior Nucleus release |
| 6 | Commercial analog comparison (Neurons / Realeyes) | Competitive or better on in-market CTR prediction |
| 7 | Live recursive loop on 10 internal brands | Monotonic score improvement across iterations |

A release that fails any of rungs 1–4 is blocked. Rungs 5–7 are
soft gates — a regression there triggers a review but not an
automatic block.

## What Nucleus publishes

For every major model release, Nucleus publishes:

1. A **model card** with architecture, training data, license,
   contact
2. A **benchmark report** with scores on all rungs of the ladder
3. **Per-region breakouts** on the Nucleus ROI list
4. **Statistical confidence intervals** via block bootstrap
5. **Comparison to TRIBE v1 and TRIBE v2** on shared benchmarks
6. **Known failure modes** from the evaluation
7. **A downloadable benchmark artifact** so external reviewers can
   reproduce the numbers

The commitment is that every benchmark result Nucleus cites in
marketing is traceable back to a specific published report. No
uncited claims.

## Open questions the benchmarks don't answer

Three gaps the current benchmarks don't cover and that Nucleus
research will address:

1. **Sub-second dynamics.** Benchmarks tied to fMRI inherit the
   1 Hz / 4–6 s HRF ceiling. EEG benchmarks cover the sub-second
   regime but aren't integrated with fMRI encoders. Nucleus's
   **N-Data-4** project (EEG on 100 subjects × 100 ads) is the
   response.
2. **Recursive loop quality.** No existing benchmark measures
   whether optimizing against a score actually produces better
   outcomes. The benchmark measures static correlation, not
   dynamic improvement. Nucleus's paper on
   [generative reward vs measurement](evaluation-methodology.md#the-generative-reward-vs-measurement-distinction)
   would define this benchmark.
3. **Cohort-level personalization.** Benchmarks assume a group-
   averaged target. No benchmark measures "how well does your
   model predict Gen Z specifically?" Nucleus could run the first
   experiment here with targeted fMRI collection.

All three are on the [research roadmap](research-roadmap.md).
