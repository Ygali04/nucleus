# Internal Experiments

This page catalogs the specific experiments Nucleus will run to
validate the product thesis and inform the [research roadmap](research-roadmap.md).
Every experiment has a code, a hypothesis, a method, a predicted
outcome, and a failure mode.

These are the experiments that turn "we think the closed loop
works" into "we can show it works."

## Experiment framework

Every experiment follows the same structure:

```yaml
code: N-AB-1
title: "Neural-scored vs human-curated"
hypothesis: "Nucleus neural scoring beats expert human selection on in-market performance"
method:
  - Generate 40 ads for one brand via the Nucleus engine
  - Randomize into two splits of 20
  - Split A: top 20 by Nucleus neural score
  - Split B: top 20 by expert panel selection (blind to neural score)
  - Run both splits in real paid media on Meta + TikTok
  - Measure CPA, CTR, view-through over 14 days
prediction: "Split A wins on CPA by ≥15%"
failure_mode: "If split B wins or ties, the neural signal isn't commercially meaningful"
owner: research lead + first customer brand
cost: $15-30k media spend + engineering time
timeline: 4 weeks
status: planned
```

## The four core experiments

### N-AB-1 — Neural-scored vs human-curated

The headline experiment. If this works, Nucleus has the proof
point that the closed loop is commercially meaningful.

| Field | Value |
|---|---|
| Hypothesis | Nucleus neural scoring beats expert human selection on in-market performance |
| Method | 40 ads per brand, split into 20 (neural-ranked) + 20 (expert-ranked). Both run in paid media. |
| Metrics | CPA, CTR, view-through, brand lift (survey) |
| Prediction | Neural split wins CPA by ≥ 15% |
| Failure mode | If expert wins or ties, the neural signal isn't commercially meaningful |
| Blocker | Needs a customer brand partnership + paid-media budget |
| Cost | $15–30k per brand × 3 brands = $45–90k |
| Timeline | 4 weeks per run, 3 runs in parallel = 4 weeks total |
| Status | Planned for Phase 1 of Nucleus v1 |

### N-AB-2 — Within-loop improvement

Does the recursive loop actually learn, or does it thrash?

| Field | Value |
|---|---|
| Hypothesis | Iteration monotonically improves in-market performance |
| Method | Run the Nucleus loop for 5 iterations on a fixed brief. At each iteration, measure real-world KPIs on the top-decile of variants. |
| Metrics | CPA, CTR, view-through, per-iteration average neural score |
| Prediction | Monotonic improvement across iterations with diminishing returns by iteration 3 |
| Failure mode | Non-monotonic improvement suggests the loop is gaming the scorer, not improving quality |
| Blocker | Requires the loop to be production-quality |
| Cost | $10k media per iteration × 5 × 3 brands = $150k |
| Timeline | 8 weeks |
| Status | Planned for Phase 2 of Nucleus v1 |

### N-AB-3 — Neural vs behavioral reward

Is the neural signal actually better than a behavioral proxy?

| Field | Value |
|---|---|
| Hypothesis | Neural reward produces better in-market performance on share-rate and brand-lift; behavioral reward produces better CTR |
| Method | Run two parallel Nucleus loops on the same brand. Loop A: rewarded on Realeyes-style behavioral prediction. Loop B: rewarded on TRIBE-derived neural prediction. Run outputs in paid media. |
| Metrics | Share-rate, brand lift, CTR, view-through |
| Prediction | Neural wins small margin on share-rate and brand-lift. Behavioral wins on raw CTR. |
| Failure mode | If behavioral wins on everything, the neural track is a scientific nice-to-have, not a commercial advantage |
| Blocker | Requires both scoring backends to be working |
| Cost | $30k media × 3 brands = $90k |
| Timeline | 6 weeks |
| Status | Planned for Phase 2 |

### N-AB-4 — Population transfer test

Replicate the neuroforecasting paradigm for UGC specifically.

| Field | Value |
|---|---|
| Hypothesis | Small-sample fMRI on 20 subjects forecasts aggregate outcomes for the same ads at 1000+ subject scale |
| Method | Collect fMRI on 20 subjects × 40 ads. Use the NAcc signal from those 20 subjects to predict aggregate outcomes for the same 40 ads measured against 1000+ subjects in paid media. |
| Metrics | Correlation between 20-subject NAcc average and aggregate in-market performance |
| Prediction | r ≥ 0.5 between NAcc signal and aggregate CTR |
| Failure mode | If r < 0.3, the neuroforecasting paradigm doesn't transfer to UGC |
| Blocker | Requires N-Data-1 fMRI collection complete |
| Cost | Covered by N-Data-1 |
| Timeline | Can be run once N-Data-1 + in-market data are available |
| Status | Planned for Phase 3 |

## Supporting experiments

Smaller experiments that validate specific technical claims.

### N-TECH-1 — Slice scoring accuracy

Does the slice-scoring optimization produce the same results as
full re-scoring?

| Field | Value |
|---|---|
| Hypothesis | Slice scoring within 2% of full re-scoring on the composite metric |
| Method | For 100 variants with ≥3 loop iterations, compute both slice scores and full re-scores. Compare. |
| Metric | Mean absolute error on composite score |
| Prediction | MAE < 2 points on the 0–100 scale |
| Failure mode | If MAE > 5 points, the slice optimization is too noisy for production |
| Cost | GPU compute only (~$500) |
| Timeline | 1 week |

### N-TECH-2 — Generator grounding accuracy

How well does the generator agent stay grounded in the Brand KB?

| Field | Value |
|---|---|
| Hypothesis | ≥ 90% of factual claims in generated scripts are traceable to KB chunks |
| Method | Sample 50 generated scripts. Extract claims. For each claim, compute the best-matching KB chunk. Measure the fraction above the grounding threshold. |
| Metric | Grounding accuracy percentage |
| Prediction | ≥ 90% |
| Failure mode | If < 80%, the generator is hallucinating too often and the grounding validator needs to be stricter |
| Cost | LLM inference (~$50) |
| Timeline | 2 days |

### N-TECH-3 — Edit primitive effectiveness

Which edit primitives actually move the score?

| Field | Value |
|---|---|
| Hypothesis | Hook rewrites move the composite score most, followed by cut tightening |
| Method | For 500 iterations across a diverse set of jobs, record which edit primitive was applied and how much the composite score moved. Aggregate by primitive. |
| Metric | Average score delta per primitive |
| Prediction | Hook rewrite average delta > 3 points; cut tightening > 2 points |
| Failure mode | If some primitives consistently move the score by < 0.5 points, they're noise and should be removed |
| Cost | Data already collected during normal operation |
| Timeline | Ongoing analysis, rolled up monthly |

### N-TECH-4 — Cohort conditioning viability

Can a small fine-tuning dataset meaningfully shift the model's
predictions toward a specific cohort?

| Field | Value |
|---|---|
| Hypothesis | Fine-tuning the TRIBE head on 5 subjects from a specific demographic produces meaningfully different predictions than the average-subject head |
| Method | Use MindEye 2's shared-subject latent technique to train a cohort-specific head on 5 subjects. Compare predictions to the average-subject head on held-out ads. |
| Metric | Pearson r between cohort head and average head; lower is better (higher means no personalization) |
| Prediction | r between 0.6 and 0.8 — meaningful but partial personalization |
| Failure mode | If r ≥ 0.95, cohort fine-tuning isn't producing meaningful differentiation |
| Cost | Subject recruitment (~$10k) + compute (~$2k) |
| Timeline | 4 weeks |

### N-TECH-5 — Language transfer test

Does fine-tuning on English UGC transfer to Spanish or Japanese
UGC?

| Field | Value |
|---|---|
| Hypothesis | Language transfer is bottlenecked by the text encoder, not the video encoder |
| Method | Fine-tune the model on 100 English UGC ads. Test on 50 Spanish UGC ads. Compare to a baseline fine-tuned on zero language-specific data. |
| Metric | Out-of-language Pearson r |
| Prediction | Small degradation on Spanish (~10% relative) |
| Failure mode | If degradation > 30%, multi-language requires per-language fine-tuning |
| Cost | Compute only |
| Timeline | 2 weeks |

## Ethics and IRB

Experiments that involve human subjects go through an IRB review
before data collection:

| Experiment | IRB required? | Notes |
|---|---|---|
| N-AB-1, N-AB-2, N-AB-3 | No | No human subjects data collection — just paid media runs |
| N-AB-4 | Yes | fMRI scan of 20 subjects |
| N-TECH-1 through N-TECH-5 | No | Internal technical validation |

IRB approval is sought through a partner academic institution
(most likely Stanford via the SPANlab partnership or Penn via the
Annenberg CNS lab).

## The meta-experiment

There's one higher-order experiment the rest of this page exists
to support:

> **Does the Nucleus recursive-loop product produce measurably
> better in-market performance than any existing alternative,
> across multiple brands, multiple cohorts, and multiple creative
> formats?**

This is the commercial success criterion. The individual
experiments above are the scientific instruments that let
Nucleus answer it with confidence.

If the meta-experiment fails — if the loop doesn't produce
measurably better results after a year of tuning — the product
thesis needs revision. The most likely failure mode is that the
neural signal is too weak for small-sample outcome prediction,
in which case the fallback is to lean harder on the behavioral
proxy signal (N-AB-3 makes this question explicit).

## Publishing standards

Every experiment with a peer-reviewable outcome is published under
the same standards:

1. **Pre-registration** of hypothesis and method before data
   collection
2. **Open data release** where IRB permits (anonymized behavioral
   data, aggregate fMRI contrasts)
3. **Replication-friendly methodology** — scripts, configs,
   evaluation code on GitHub
4. **Honest reporting of failures** — negative results are
   published alongside positive ones
5. **Public preprints** on arXiv or bioRxiv before formal journal
   submission

This is the standard academic labs hold themselves to. Nucleus
holds itself to the same standard because the commercial moat is
the scientific credibility, and credibility doesn't survive
cherry-picked results.

## What this page doesn't cover

- **Day-to-day engineering experiments** — they're internal,
  not scientific publications
- **Product A/B tests unrelated to the scorer** — UX experiments,
  pricing experiments, onboarding experiments
- **The full statistical analysis plan** — covered per-paper,
  not on this page
- **Sample-size justifications** — computed per-experiment using
  the expected effect sizes from the neuroforecasting literature
