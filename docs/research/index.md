# Neuromarketing R&D

This section is the research roadmap toward what would credibly be
called **the world's best neuromarketing system**. It's a deep look
at the model Nucleus depends on (Meta FAIR's TRIBE v2), the
alternatives, the benchmark methodology, the honest gaps, and the
specific R&D projects Nucleus would run to push the field forward.

The full unabridged research lives in
`research/neuro-models-and-benchmarks.md` (~7,000 words). The pages
in this section are the operator-facing summary plus the forward-
looking roadmap.

## What's in this section

| Page | Subject |
|---|---|
| [TRIBE v2 deep dive](tribe-v2-deep-dive.md) | Architecture, training data, validation results, license, known limitations |
| [Alternative models](alternative-models.md) | TRIBE v1, MindEye, Brain-Score, CORnet, Algonauts winners, commercial proxies |
| [Benchmark datasets](datasets.md) | NSD, NeuroMod, HCP, Algonauts, THINGS, BOLD Moments, others |
| [Evaluation methodology](evaluation-methodology.md) | How to score the scorer, OOD, behavioral validation, neuroforecasting |
| [The honest gaps](honest-gaps.md) | Where TRIBE v2 falls short for UGC scoring, what's missing |
| [Research roadmap](research-roadmap.md) | Specific projects, papers, datasets, partnerships, conferences |
| [The fallback path](fallback-path.md) | Building `AttentionProxyAnalyzer` from V-JEPA2 + permissive data |

## Why this section exists

Three reasons.

### 1. The product depends on the model

Nucleus's whole moat is the recursive loop, and the loop's reward
signal is a brain model. Treating the model as a black box would be
irresponsible — both technically (the engine should know its
limits) and commercially (the customer asks "how good is your
score?" on the first call).

This section is the answer to that question, in detail.

### 2. The license risk forces alternatives

TRIBE v2 ships under CC BY-NC 4.0. The
[license analysis](../compliance/license-tribe-v2.md) recommends
treating TRIBE v2 as a benchmark target rather than a production
dependency, which means Nucleus needs to build its own model. That's
an R&D project, not a quick swap, and the roadmap below describes
it.

### 3. "World's best neuromarketing system" is a specific claim

It can't just be marketing. Building a credible "best in the world"
claim requires:

- Rigorous benchmarking against published baselines
- Open contribution to academic discourse
- Original research the company publishes under its own name
- Industry partnerships with the labs that built the field
- Datasets we collect and release ourselves

This section is the plan for all five.

## The thesis in one paragraph

> The current generation of commercial neuromarketing tools (Neurons
> Inc, Realeyes, Attention Insight) are behavioral-proxy predictors
> trained on eye-tracking or facial coding. They are not neural
> models. The current generation of academic neural encoders (TRIBE
> v2, VIBE, Algonauts winners) are research artifacts, optimized
> for movie watching, licensed non-commercially, and not validated
> on UGC. There is no production-ready, commercially-clean,
> UGC-tuned neural reward model in the market in 2026. Nucleus is
> the first product positioned to build one — and the recursive loop
> architecture gives the company a continuous source of training
> data (variant outputs paired with in-market performance) that
> nobody else has access to.

## The two-track plan

Nucleus runs two parallel tracks for the neural scoring layer:

| Track | Model | Purpose | Status |
|---|---|---|---|
| Track A — Production | `AttentionProxyAnalyzer` (V-JEPA2 + trained head on permissive data) | Default scorer in the production loop. Commercially clean. | In active development |
| Track B — Benchmark | TRIBE v2 (Meta FAIR) | Reference model. Scores variants offline for benchmark comparison. Drives R&D direction. | Available now under CC BY-NC |

The two tracks meet at the **benchmark suite**: every model
(production, research, third-party) runs against the same
benchmarks so improvements are comparable across versions and across
vendors. The benchmark suite is one of the things Nucleus plans to
open-source (see [research roadmap](research-roadmap.md)).

## The honest position

Five things this section is honest about.

1. **TRIBE v2 is not optimized for UGC.** It was trained on long-
   form movies and TV. Short-form vertical UGC is out of
   distribution. The first thing Nucleus needs to know is *how far
   out of distribution*, and the answer requires running our own
   evaluation.
2. **fMRI's 1 Hz temporal resolution is a ceiling.** Sub-second
   creative moves (the flash cut, the beat drop) cannot be
   disambiguated by any fMRI-trained model. This is biology, not a
   bug. UGC ad scoring will always have a temporal floor.
3. **There is no "your audience" personalization yet.** TRIBE v2
   predicts the average brain. Cohort-level personalization
   ("predict for 24-year-old women in APAC") requires data that
   doesn't exist publicly. Nucleus can collect it, but only
   gradually and only through the host product's distribution.
4. **Behavioral validation is a separate question from neural
   prediction accuracy.** A model that predicts brain activity
   well does not automatically predict purchase, share, or recall.
   Building the bridge from neural to behavioral is its own
   research project (the neuroforecasting layer), and the
   literature has done some of the work but not enough.
5. **The field has fewer than 50 active researchers.** Neural
   encoding from naturalistic stimuli is a small community. Doing
   credible work means engaging with that community directly —
   Knutson at Stanford, Falk at Penn, Vessel at NYU, Smidts at
   Erasmus, the Algonauts organizers, Meta FAIR's Brain & AI team.

## The roadmap in one sentence

> Build a commercially-clean V-JEPA2-based reward model that
> matches 85% of TRIBE v2's group-average accuracy on the Algonauts
> 2025 benchmark within 6 months, validate it against in-market
> performance data through Nucleus's own variants, publish the
> evaluation suite as open source, and ship two papers per year
> linking the model to behavioral outcomes the marketing world
> actually cares about.

The full unpacking is on the [research roadmap](research-roadmap.md)
page.
