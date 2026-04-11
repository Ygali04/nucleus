# Fallback Path — AttentionProxyAnalyzer

If Nucleus cannot secure a commercial license for TRIBE v2, the
technically cleanest fallback is to build an
**`AttentionProxyAnalyzer`** that inherits TRIBE's feature backbone
(V-JEPA 2 + Wav2Vec-BERT + LLaMA 3.2, all commercially licensed)
but trains a new prediction head from scratch on **attention
proxies** instead of fMRI.

This page is the architecture and project plan for that fallback.

## The TL;DR

| Field | Value |
|---|---|
| **Architecture** | Frozen V-JEPA 2 backbone + Wav2Vec-BERT + LLaMA 3.2 + lightweight trained head |
| **Training targets** | Eye-tracking dwell time, pupil dilation, 24h recall, view-duration, CTR |
| **Training data** | 5k–20k short-form videos with eye-tracking + behavioral outcomes (available or collectable) |
| **License** | Fully commercially clean |
| **Cost** | $300–500k, 4–6 months to v0 |
| **Expected performance gap vs TRIBE v2** | Significant on neural prediction, probably close or better on behavioral outcomes |
| **Status** | Parallel track to TRIBE v2; built as insurance |

## Architecture

The key insight from TRIBE v2's architecture is that
**the backbones are frozen**. Gradient only flows through the
fusion transformer and the prediction head. This means Nucleus
can:

1. Freeze V-JEPA 2 (Apache 2.0 licensed) as the video encoder
2. Freeze Wav2Vec-BERT 2.0 (Apache-ish) as the audio encoder
3. Freeze LLaMA 3.2 (Llama community license, commercially
   permissible) as the text encoder
4. Train a **new prediction head** that outputs attention proxies
   instead of fMRI BOLD

The feature quality is nearly identical to TRIBE v2 at the
backbone level. What changes is what the head predicts.

```
┌─────────────────────────────────────────────┐
│             Frozen backbones                │
│                                             │
│  V-JEPA 2    Wav2Vec-BERT    LLaMA 3.2      │
│  (video)     (audio)         (text)         │
└──────┬──────────┬──────────────┬────────────┘
       │          │              │
       └──────────┼──────────────┘
                  │
                  ▼
       ┌─────────────────────┐
       │   Fusion transformer│   ← Trained from scratch
       │   (small, ~50M)     │
       └─────────┬───────────┘
                 │
                 ▼
       ┌─────────────────────────┐
       │  AttentionProxyHead     │   ← Trained from scratch
       │  (MLP → multi-output)   │
       └─────────┬───────────────┘
                 │
      ┌──────────┼──────────┬──────────┐
      ▼          ▼          ▼          ▼
   Per-second  Per-second  Global     Global
   attention   arousal     memorab.   engagement
   (eye-track) (pupil)     (24h recall) (view + CTR)
```

## Training targets

Instead of BOLD, the head predicts **four behavioral proxies**:

| Output | Target data source | What it measures |
|---|---|---|
| **Per-second attention score** | Eye-tracking dwell time | Where is the viewer looking? Is their gaze held? |
| **Per-second arousal score** | Pupil dilation or GSR | Emotional intensity over time |
| **Global memorability score** | 24h recall test | Will the viewer remember this tomorrow? |
| **Global engagement score** | View-duration + CTR | Did the viewer actually watch? Did they click? |

Each output is trained with its own loss on its own labels. The
shared trunk means the model learns representations that
generalize across the four outputs.

## Training data

Three categories of data, ordered by difficulty of acquisition:

### Category A — Public eye-tracking datasets

| Dataset | Size | Notes |
|---|---|---|
| **MIT/Tuebingen Saliency Benchmark** | ~5M fixations on images | Image-only, not video |
| **DHF1K** | ~1k videos with eye-tracking | Generic video content |
| **LEDOV** | ~538 videos | Short clips |
| **Hollywood2** | ~1.7k videos | Film clips |

These are small for a foundation-model-class head but sufficient
for a v0 that proves the architecture works.

### Category B — Commercial eye-tracking panels

| Provider | Data shape |
|---|---|
| **Prolific + webcam eye-tracking** | ~$2/subject/session, ~$10–20k for a 1000-subject panel |
| **Lumen Research** | Higher-quality webcam tracking, ~2x cost |
| **RealEye** | Paid panel with eye-tracking, ~$5/subject |
| **Tobii Pro** | Lab-grade equipment, more expensive per subject but highest quality |

A 5k-subject webcam panel on 1k videos costs roughly $50–100k and
produces ~5M fixation-time-points. That's a usable training set.

### Category C — Nucleus's own in-house data

From the [research roadmap](research-roadmap.md):

- **N-Data-2 behavioral panel** — 500 subjects × 200 ads = 100k
  behavioral datapoints
- **N-Data-3 in-market outcomes** — 200 ads × real paid media =
  direct CTR / conversion labels
- **N-Data-4 EEG** — 100 subjects × 100 ads = 10k trials of EEG
  data, usable as a fifth training target

If all four N-Data projects complete, Nucleus has a richer and
more ad-specific training set than any commercial competitor.

## Performance expectations

### On neural prediction

**Significant underperformance.** The `AttentionProxyAnalyzer` is
not trained on brain data, so it cannot replicate per-voxel BOLD
predictions. It will underperform TRIBE v2 on any encoding
benchmark.

Expected Algonauts 2025 score: **~0.05–0.10 noise-normalized
Pearson r** (vs TRIBE v2's ~0.21). Not competitive on the pure
neural encoding axis.

### On behavioral outcomes

**Probably close, possibly better.** For the things Nucleus
actually cares about (CTR, view-through, conversion prediction),
a behavioral-proxy model trained directly on those labels can
match or beat a neural-encoder whose features are only indirectly
connected to behavior.

Neurons Inc's Predict hit **~95% correlation with eye-tracking**
on images using a similar approach. Realeyes has patented a similar
attention model that Meta / Nielsen treat as production-grade.

For commercial deployment, behavioral outcomes are what matters.
Neural prediction is scientific cachet, not a revenue signal.

### On scientific defensibility

**Weaker.** The "we predict your brain" narrative is gone. Nucleus
would pivot to "we predict behavior using a brain-plausible
architecture, backed by the public neuroforecasting literature."

This is still a strong story for marketers, but it loses some
technical moat against neuroforecasting-savvy competitors.

## Cost and timeline

| Item | Cost | Timeline |
|---|---|---|
| Engineering (2 ML engineers × 4 months) | ~$200–300k | 4 months |
| Data (Nucleus's N-Data-2 + parallel behavioral panels) | $50–150k | Parallel |
| Compute (training run on H100 cluster) | $20–50k | 1 month |
| Evaluation harness development | Included above | Parallel |
| **Total** | **$300–500k** | **4–6 months** |

This is **about the same cost as Nucleus's N-Data-1 fMRI corpus**
but produces a usable production model, while N-Data-1 produces
research data. The two projects complement each other — the
AttentionProxyAnalyzer unblocks commercial use immediately;
N-Data-1 produces the data to eventually surpass TRIBE v2 on
neural prediction specifically.

## Does Brain-Score-style evaluation still apply?

**Partially.** Brain-Score's encoding benchmarks (V1/V2/V4/IT
neural alignment) still apply to the V-JEPA 2 features inside
`AttentionProxyAnalyzer`. Nucleus can report "our backbone scores
X on Brain-Score Vision" as a scientific anchor.

But **Brain-Score-style vertex-level BOLD prediction does not
apply** because the head is not predicting BOLD. For evaluation,
Nucleus would instead benchmark `AttentionProxyAnalyzer` on:

1. **Held-out behavioral prediction accuracy** (the thing it was
   trained for)
2. **Cross-vendor comparison vs Neurons AI and Realeyes** (the
   thing it will be sold against)
3. **In-market A/B tests** (N-AB-1 from the
   [research roadmap](research-roadmap.md))

## Verdict

The fallback is viable. It gives up some scientific narrative but
keeps the product's commercial headroom. The strategically correct
stance is to **build the `AttentionProxyAnalyzer` in parallel with
the TRIBE v2 pipeline** — they share infrastructure, the fallback
unblocks commercial use immediately, and the TRIBE pipeline stays
in research mode until Meta clarifies licensing or Nucleus ships
its own fine-tuned brain model with clean IP.

## How the two tracks fit together

```
┌──────────────────────────────────────────────────┐
│                Production track                   │
│                                                    │
│   AttentionProxyAnalyzer                           │
│   (V-JEPA 2 + head trained on behavioral proxies) │
│                                                    │
│   ↓ Ships in commercial pipeline                   │
│   ↓ Fast, clean, commercial-safe                   │
│   ↓ Beats Neurons / Realeyes on ad CTR             │
└──────────────────────────────────────────────────┘

                    ┌──── informs ────┐
                    │                  │
                    ▼                  │
┌──────────────────────────────────────┴───────────┐
│                 Research track                    │
│                                                    │
│   TRIBE v2                                         │
│   (CC BY-NC, research use only)                    │
│                                                    │
│   ↓ Benchmark target                               │
│   ↓ Scientific credibility                         │
│   ↓ Source of academic papers                      │
│   ↓ Reference for fine-tuning future production    │
└────────────────────────────────────────────────────┘
```

Both tracks feed into the same benchmark suite. Every model release
reports scores on the same set of tests, so the tracks are
comparable. Over time:

1. **The production track gets better** through more data and
   better heads
2. **The research track stays fixed** at TRIBE v2 until Meta
   updates
3. **Eventually the production track surpasses the research track**
   on behavioral outcomes, which is the actual commercial metric

That's the ideal end state. Nucleus ships a clean commercial model
that beats the academic baseline on the only metric that pays the
bills, while continuing to publish research that establishes the
brand in the scientific community.

## What this page doesn't cover

- **The full license analysis.** Covered on the
  [compliance license page](../compliance/license-tribe-v2.md).
- **The detailed training recipe.** Will be documented as a
  research blog post after v0 ships.
- **The specific hyperparameters and training schedule.** Same.
- **Alternative backbone choices.** V-JEPA 2 is the clear winner
  because it's the actual TRIBE v2 backbone, but if licensing on
  V-JEPA 2 ever changes, alternatives like DINOv2 (Meta, Apache)
  or DINOv2+video would be the next candidates.
