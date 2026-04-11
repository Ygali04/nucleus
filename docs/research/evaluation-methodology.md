# Evaluation Methodology

This is the most important page in the research section for
anyone who wants to evaluate Nucleus's model claims. It describes
how the field measures the quality of a brain encoder, what
Nucleus will adopt unchanged, and where Nucleus will extend the
methodology to cover cases the field doesn't yet evaluate.

## Four axes of cross-validation

Every evaluation of a brain encoder should specify where it sits
on four independent axes. Most academic papers report two; Nucleus
has to report all four.

### Axis 1 — Held-out subjects vs. held-in subjects

Does the model predict a subject it has never seen (zero-shot) or
a subject whose head it has been fit to (subject-specific)?

| Regime | What it measures |
|---|---|
| **Zero-shot (held-out subjects)** | Generalization across human neural variability. The harder test. |
| **Subject-specific (held-in)** | The model is fit to this person's brain. The easier test. |

Academic papers often report both. TRIBE v1's Algonauts 2025 results
are subject-specific — the 4 CNeuroMod subjects were in the
training set.

### Axis 2 — Held-out stimuli vs. held-in stimuli

Is the test video one the model has seen during training
(in-distribution) or novel (out-of-distribution)?

| Regime | What it measures |
|---|---|
| **In-distribution** | The model memorized the training set perfectly |
| **Out-of-distribution (same format)** | The model generalizes within the training format |

TRIBE v1 reports r = 0.3195 in-distribution (*Friends* S7) and
r = 0.2604 out-of-distribution (*Pulp Fiction*). The OOD drop is
~19% relative.

### Axis 3 — Held-out format vs. held-in format

Movie training → movie test is **in-format**. Movie training → UGC
test is **out-of-format**. Nucleus's entire value proposition sits
in the out-of-format regime.

| Regime | What it measures |
|---|---|
| **In-format** | The model generalizes within the same stimulus type |
| **Out-of-format** | The model generalizes across stimulus types (short-form UGC vs long-form film) |

No published paper formally reports this axis. It is where
Nucleus's internal benchmark is most informative.

### Axis 4 — Held-out domain vs. held-in domain

Naturalistic film → ad-content test is out-of-domain. Academic
papers almost never report this.

| Regime | What it measures |
|---|---|
| **In-domain** | The model generalizes across stimuli with the same pragmatic intent |
| **Out-of-domain** | The model generalizes across pragmatic contexts (entertainment vs. persuasion) |

This is the hardest axis and the one that matters most for
commercial neuromarketing use.

## The four-axis matrix

| Evaluation | Subjects | Stimuli | Format | Domain |
|---|---|---|---|---|
| TRIBE v1 in-distribution | Held-in | Held-in | Held-in | Held-in |
| TRIBE v1 out-of-distribution | Held-in | Held-out | Held-in | Held-in |
| Nucleus short-clip test | Held-in | Held-out | **Held-out** | Held-in |
| Nucleus cross-subject | **Held-out** | Held-out | Held-in | Held-in |
| Nucleus UGC | Held-in | Held-out | Held-out | **Held-out** |
| Nucleus "full honest" | **Held-out** | Held-out | **Held-out** | **Held-out** |

The last row is the evaluation no one has run. It's what Nucleus's
internal benchmark suite targets.

## Canonical metrics

The field has converged on **noise-ceiling-normalized Pearson r**,
computed vertex-wise or parcel-wise, then averaged within an ROI.
Three variants matter:

### Raw Pearson r

Correlation between predicted and measured BOLD time series. Simple
to compute. What Algonauts 2025 reports on the leaderboard.

**Limits:** Doesn't account for signal-to-noise ratio per voxel. A
low-SNR voxel can have a low ceiling even in principle.

### Noise-normalized r

Raw r divided by the split-half reliability of the ground-truth
BOLD signal. This corrects for low signal-to-noise in individual
voxels and is what Brain-Score uses.

**Quirk:** Values can exceed 1 if the model generalizes better than
the noise-limited ceiling — a surprisingly common outcome at group
level (because averaging across subjects reduces noise).

**Recommendation:** Report noise-normalized r as the primary
metric. Raw r as a secondary.

### R² (variance explained)

Less common in the encoding literature because BOLD signals are
noisy and raw R² lowballs model quality.

**Recommendation:** Report R² only if you're going to report
noise-normalized R² alongside.

## Nucleus's reporting standard

For every model comparison, Nucleus reports:

1. **Raw Pearson r** — by region, averaged across subjects
2. **Noise-normalized Pearson r** — by region, averaged across
   subjects
3. **The fraction of variance explained** in the Nucleus ROI list
4. **Per-region breakouts** for the regions that matter for
   marketing (NAcc, AIns, hippocampus, mPFC, OFC, STG, dorsal
   attention network, V1 as a sanity check)
5. **Out-of-distribution vs in-distribution** side-by-side
6. **Out-of-format vs in-format** side-by-side
7. **Out-of-domain vs in-domain** side-by-side when the benchmark
   supports it
8. **Confidence intervals** via block bootstrap

The commitment is to publish all of these for every model release,
including when the out-of-format numbers are worse than the
in-format numbers. Especially then.

## Voxel-wise vs ROI-wise

- **Voxel-wise / vertex-wise evaluation** reports a number per
  voxel — tens of thousands of measurements per subject. This is
  what Algonauts and Brain-Score use to avoid confounds from ROI
  definition.
- **ROI-wise evaluation** aggregates within pre-defined regions
  (Schaefer, Glasser, HCP-MMP1 parcellations). Easier to interpret
  but depends on the parcellation choice.
- **Hybrid** is what most papers do: compute vertex-wise metrics,
  then plot them on an ROI atlas for interpretation.

**Recommendation for Nucleus.** Adopt **HCP-MMP1** (Glasser et al.
2016) as the canonical ROI atlas for human-readable reporting, but
preserve vertex-wise predictions internally. Publish a fixed list
of **Nucleus ROIs** (NAcc, AIns, hippocampus, mPFC, OFC, STG,
dorsal attention network, V1) and commit to always reporting
these.

## The generative reward vs measurement distinction

This is the methodological insight nobody in the field has
formally framed, and it's the one Nucleus could publish first.

Nucleus uses a neural score for two different things:

1. **Generative loop reward.** Used inside the generate → score →
   edit → re-generate pipeline. The model is queried millions of
   times.
2. **Measurement report.** Used once per finished asset to produce
   a human-readable Neural Report.

These two use cases have **incompatible evaluation criteria**:

| Criterion | Generative reward | Measurement report |
|---|---|---|
| **Speed** | Sub-second per query | Minutes per asset is fine |
| **Noise tolerance** | Must be smooth — a noisy reward breaks training | Can tolerate noise if summarized with confidence intervals |
| **Interpretability** | Scalar suffices | Must include per-region narrative |
| **Calibration** | Relative ranking matters; absolute values don't | Absolute values matter; must map to industry benchmarks |
| **Robustness to adversarial edge cases** | Critical — generator will exploit any loophole | Moderate — reports are shown to humans |
| **Canonical metric** | Per-region weighted reward (NAcc / AIns dominating) | Full cortex map + ROI table |

Most academic benchmarks (Brain-Score, Algonauts) optimize for
Type 2 (measurement accuracy) and miss Type 1 (reward quality).

**Nucleus needs its own benchmark for reward quality** that tests
whether optimizing against the score actually produces better
outcomes — not just whether the score correlates with ground truth
on a static test set. This is the biggest methodological gap in
the public literature and is Nucleus's chance to contribute.

The [research roadmap](research-roadmap.md) proposes a paper
specifically on this distinction.

## Out-of-distribution video evaluation

This is the core scientific question the Nucleus evaluation suite
has to answer:

> **How much does TRIBE v2's accuracy degrade when you move from
> long-form naturalistic film to short-form vertical UGC ad
> content?**

No published number answers this. The closest public signals:

- TRIBE v1's own *Friends* S7 → *Pulp Fiction* drop: r = 0.3195 →
  0.2604, a ~19% relative decrease over what is still a long-form
  Hollywood format.
- Algonauts 2021's BMD (3 s clip) winners achieved peak r ≈ 0.22
  normalized — suggesting short-clip prediction is harder even
  in-distribution.
- Anecdotal: every encoder that has been tested on ads has shown
  further degradation, but this is not formally published.

**A reasonable planning assumption** is that TRIBE v2 loses 30–50%
of its in-distribution Pearson r when applied zero-shot to 9-second
vertical UGC ads, with the largest drops in high-level semantic
and reward regions (mPFC, NAcc), where the distributional shift
from movie to ad is most severe. Low-level visual and auditory
cortex (V1, STG) should degrade less because they track stimulus-
locked features that don't care about content genre.

## The Nucleus internal test suite

| Test | Purpose | Stimuli | Subjects | Expected difficulty |
|---|---|---|---|---|
| **LongForm-InDist** | Sanity check | Held-out episodes of training shows | Held-in | Easy — just confirms inference works |
| **LongForm-OOD** | Replicate TRIBE v1's public result | Held-out feature films | Held-in | Medium — published baseline exists |
| **ShortForm-Naturalistic** | Short-duration baseline | Held-out BMD-style 3 s clips | Held-in | Medium — academic precedent |
| **UGC-Ad-Synthetic** | The Nucleus-specific benchmark | 100–500 short-form UGC ads with behavioral outcomes | 24 (Nucleus-collected) | Hard — no prior baseline |
| **UGC-Ad-InternalProduction** | Measure loop improvement | Nucleus-generated variants from the recursive loop | 24 (same cohort) | Hard — tests whether fine-tuning helps |

**UGC-Ad-Synthetic is the dataset Nucleus has to build.** See
[research roadmap → N-Data-1](research-roadmap.md#n-data-1-nucleus-ugc-fmri-corpus-phase-1).

## Behavioral validation — does neural signal predict outcomes?

This is where neuroforecasting converts from "interesting science"
to "reward function for a generative loop."

### The neuroforecasting literature

| Paper | Brain signal | Predicted outcome | Key result |
|---|---|---|---|
| Tong et al. PNAS 2020 | NAcc (+), AIns (−) | YouTube video views + duration | NAcc at onset forecasts aggregate YouTube engagement above and beyond behavioral metrics |
| Genevsky & Knutson Psych Sci 2015 | NAcc | Kiva microloan success | 30 subjects → market-level microlending across the whole site |
| Genevsky, Yoon & Knutson J Neurosci 2017 | NAcc | Kickstarter funding | Only NAcc (not mPFC, not self-report) predicted real crowdfunding outcomes |
| Berns & Moore JCP 2012 | NAcc | Song sales 3 years later | 27 adolescents' ventral striatum response to unknown songs predicted future album sales |
| Kühn, Strelow & Gallinat NeuroImage 2016 | mPFC + NAcc | In-store chocolate sales | 18-subject lab scan forecast real sales across 63,617 shoppers |
| Falk, Berkman & Lieberman Psych Sci 2012 | mPFC | Real PSA call volume | 31 subjects' mPFC predicted national 1-800-QUIT-NOW calls |
| Scholz, Baek, O'Donnell et al. PNAS 2017 | mPFC (value + self-relevance) | Real NYT article shares | mPFC value signal predicted 117,611 actual shares |
| Chan, Boksem, Venkatraman et al. JMR 2024 | Early-window emotion + memory | Ad liking across 113 subjects × 85 ads | First 3 s neural signature is the strongest predictor |
| Genevsky, Tong, Knutson et al. PNAS Nexus 2025 | NAcc | Crowdfunding + video outcomes | NAcc ICC ≈ 0.41 across subjects; mPFC is not reliable at population scale |

### The synthesized principle

**Affect-side signals (NAcc, AIns) generalize across subjects and
predict aggregate outcomes. Integrative signals (mPFC, OFC) are
more idiosyncratic and predict individual choices better than
aggregate ones.**

This is the **Affect–Integration–Motivation (AIM) framework**
(Knutson, Katovich & Suri, TICS 2014). For Nucleus:

- **Reward signal for generation** (small-sample, aggregate
  forecast): weight NAcc and AIns heavily.
- **Personalization signal** (large-sample, per-cohort): mPFC and
  OFC are useful, but only after Nucleus has collected cohort-
  specific data.

## The neuroforecasting paradigm explicitly

Neuroforecasting in the Knutson / Berns / Falk / Genevsky sense is:

1. Take a **small sample** (20–30 subjects) of brain responses to
   a stimulus.
2. Aggregate within **a priori regions** (NAcc, mPFC).
3. Use that aggregated signal to predict **large-sample behavior**
   (ticket sales, ad engagement, crowdfunding outcomes).

The trick is that **only certain regions obey this principle**.
Knutson et al. 2014 explicitly argues that affective regions (NAcc,
AIns) have high inter-subject reliability (ICC ≈ 0.4) while
integrative regions (mPFC) do not — consistent with the empirical
finding that only NAcc predicts aggregate outcomes well.

**This is the scientific foundation on which Nucleus's entire
reward model rests.** TRIBE v2 gives you the neural signal for
free; the neuroforecasting literature tells you which part of that
signal to use as a reward.

## Algonauts-style evaluation in one paragraph

For completeness: the Algonauts 2025 methodology is (a) encoder
submitted by the team maps frozen backbone features to 1,000 brain
parcels via a linear or nonlinear head; (b) evaluation runs
predictions on held-out movie frames from subjects seen during
training (no zero-shot on subjects in 2025); (c) scores are
noise-normalized Pearson r averaged across parcels and subjects;
(d) the final leaderboard metric is a single scalar.

The main methodological limitation of the 2025 challenge is that
it evaluates **in-subject, out-of-stimulus only** — there is no
held-out-subject or held-out-format axis. Nucleus's evaluation
suite explicitly covers all four axes.

## What this page commits Nucleus to

Four commitments:

1. **Always report all four axes.** When comparing two models,
   always report the in-subject × in-stimulus × in-format ×
   in-domain regime AND at least one fully held-out regime.
2. **Always report noise-normalized r as the primary metric.**
   Raw r is secondary.
3. **Always report per-region breakouts for the Nucleus ROI list.**
   Never publish a single-scalar summary without the per-region
   breakdown.
4. **Always separate generative-reward metrics from measurement
   metrics.** A model that's great for one can be bad for the
   other, and conflating them is the most common methodological
   error in the space.
