# Neuromarketing Primer

> The full research brief with complete citations and pitch narrative lives in `research/ugc-neuromarketing-intersection.md`. This page is the pitch-grade summary focused on the academic evidence base for Nucleus's scoring loop.

## What neuromarketing measures

Neuromarketing is the application of brain and body signals to creative evaluation. The tooling stack, from most invasive/expensive to least:

- **fMRI** — gold-standard spatial resolution; identifies which brain regions respond. Used in ~all landmark "brain predicts sales" studies. ~$800/subject, lab-only.
- **EEG** — millisecond temporal resolution, cheap enough for commercial panels. Strong for arousal, attention, frontal asymmetry.
- **Eye-tracking** — where gaze lands and dwells; proxy for bottom-up attention.
- **GSR / EDA** — skin conductance; arousal proxy.
- **Facial coding** — CNN-based classification of micro-expressions.
- **Heart-rate variability** — Immersion Neuroscience's bet on vagal signals of emotional resonance.
- **Self-report** — famously decoupled from actual behavior.

## The regions that matter for marketing outcomes

Fifteen years of neuroforecasting research have converged on a small set of brain regions:

| Region | What it encodes | Why Nucleus scores it |
|---|---|---|
| **Nucleus accumbens (NAcc)** | Anticipatory reward / approach | The "hook signal" — NAcc activation in the first seconds predicts whether viewers lean in or bounce |
| **Anterior insula (AIns)** | Anticipatory loss / avoidance | Low AIns at onset = low bounce; the differential NAcc↑ / AIns↓ is the single most validated hook metric |
| **Hippocampus + medial temporal lobe** | Memory encoding | Whether the brand will be recalled at the shelf/store |
| **Dorsal attention network (IPS, FEF)** | Sustained attention | The attention curve across the full video |
| **Medial prefrontal cortex (mPFC)** | Subjective value, social cognition | Predicts *sharing* — the signal Nucleus weights for virality |
| **Orbitofrontal cortex (OFC)** | Aesthetic valuation | Subjective "this is beautiful" signal |
| **Default-mode network (DMN)** | Mind-wandering (inverse engagement) | Rising DMN activation flags drop-off risk |
| **Broca / Wernicke** | Language comprehension | Message clarity signal |

Together these form what Knutson et al. (2014) call the **Affect–Integration–Motivation (AIM)** framework: affect components (NAcc, AIns) generalize across people; integrative components (mPFC) are more idiosyncratic but predict social outcomes like sharing.

## The TRIBE v2 breakthrough

**Meta FAIR's TRIBE v2** (d'Ascoli et al., 2026) is a multimodal transformer that takes raw video + audio + text and predicts fMRI responses across ~70,000 cortical voxels, trained on 1,115+ hours of fMRI from 700+ subjects. Released under CC BY-NC on 2026-03-26 with open weights and code.

The critical property: **zero-shot predictions of group-averaged neural response to unseen video are, in many cortical regions, more accurate than an individual real subject's own fMRI recording.** It is the first scoring infrastructure that makes a closed-loop generative pipeline possible without recruiting a single human.

Nucleus runs TRIBE v2 as the default analyzer through the NeuroPeer service already deployed in the author's stack. The [pluggable analyzer](../how-it-works.md#pluggable-analyzer) design lets Nucleus fall back to a commercial-safe alternative if the CC BY-NC license blocks commercial deployment.

## The evidence that brain signals predict real-world behavior

The reason Nucleus's neuro-loop is not speculative is that fifteen years of research have repeatedly shown small-sample neural response predicts **population-level behavioral outcomes** better than self-report, better than focus groups, and often better than the individual participants' own behavioral ratings.

The citations that carry the pitch:

### Tong et al. (2020) — *PNAS*

> *Brain activity forecasts video engagement in an internet attention market.* PNAS 117(12): 6936–6941. DOI: 10.1073/pnas.1905178117.

**Why it matters.** NAcc ↑ and AIns ↓ at video onset forecast aggregate YouTube view frequency and duration **above and beyond** conventional metrics. This is the direct scientific basis for scoring video hooks with a neuro-predictive model.

### Genevsky & Knutson (2015) — *Psychological Science*

> *Neural affective mechanisms predict market-level microlending.* Psych Sci 26(9): 1411–1422. DOI: 10.1177/0956797615588467.

**Why it matters.** Lab NAcc signal from 30 people predicted the success of Kiva microloan appeals across the *entire internet* — brain beats behavioral self-report for aggregate forecasting.

### Genevsky, Yoon & Knutson (2017) — *Journal of Neuroscience*

> *When brain beats behavior: Neuroforecasting crowdfunding outcomes.* J Neurosci 37(36): 8625–8634. DOI: 10.1523/JNEUROSCI.1633-16.2017.

**Why it matters.** Only NAcc (not mPFC, not self-report) generalized to forecast real Kickstarter funding weeks later. Establishes the "early-affect generalizes, late-integration doesn't" principle.

### Genevsky, Tong, Knutson et al. (2025) — *PNAS Nexus*

> *Neuroforecasting reveals generalizable components of choice.* PNAS Nexus 4(2): pgaf029. DOI: 10.1093/pnasnexus/pgaf029.

**Why it matters.** Confirms across both crowdfunding and video-viewing that NAcc activity is correlated across subjects (ICC ≈ 0.41, p<.01) while mPFC is not. Locks in NAcc as the single most reliable target for population-level prediction.

### Falk, Berkman & Lieberman (2012) — *Psychological Science*

> *From neural responses to population behavior: Neural focus group predicts population-level media effects.* Psych Sci 23(5): 439–445. DOI: 10.1177/0956797611434964.

**Why it matters.** 31 smokers' mPFC response to anti-smoking PSAs predicted the real-world call volume to 1-800-QUIT-NOW across the entire US market. Self-report didn't. Small-sample neuro → massive-population behavior — the foundation of neuroforecasting.

### Scholz et al. (2017) — *PNAS*

> *A neural model of valuation and information virality.* PNAS 114(11): 2881–2886. DOI: 10.1073/pnas.1615259114.

**Why it matters.** mPFC value signal during article reading predicted 117,611 real internet shares of NYT articles. Establishes mPFC as the "will this be shared" substrate — directly usable as a virality reward channel.

### Vessel, Starr & Rubin (2012) and follow-ups — *Frontiers / PNAS*

> *The brain on art: intense aesthetic experience activates the default mode network.* Front Hum Neurosci 6:66. DOI: 10.3389/fnhum.2012.00066.
> *The default-mode network represents aesthetic appeal that generalizes across visual domains.* PNAS 116(38): 19155–19160. DOI: 10.1073/pnas.1902650116.

**Why it matters.** Aesthetic appeal signal in DMN/mPFC is **domain-general** — same region codes beauty for landscapes, architecture, artwork. Means a single aesthetic channel can score any visual.

### Berns & Moore (2012) — *Journal of Consumer Psychology*

> *A neural predictor of cultural popularity.* JCP 22(1): 154–160. DOI: 10.1016/j.jcps.2011.05.001.

**Why it matters.** NAcc activation from 27 adolescents listening to unknown songs predicted **3 years of future album sales** — neural signal beat subjects' own liking ratings. Direct analog for short-form video.

### Kühn, Strelow & Gallinat (2016) — *NeuroImage*

> *Multiple "buy buttons" in the brain: Forecasting chocolate sales at point-of-sale based on functional brain activation using fMRI.* NeuroImage 136: 122–128. DOI: 10.1016/j.neuroimage.2016.05.021.

**Why it matters.** 18-subject lab fMRI forecasted real in-store chocolate sales measured across **63,617 shoppers**. Explicit liking judgments were the weakest predictor. Hard proof lab neural signal scales to real retail outcomes.

### Chan, Boksem, Venkatraman et al. (2024) — *Journal of Marketing Research*

> *Neural signals of video advertisement liking: Insights into psychological processes and their temporal dynamics.* JMR. DOI: 10.1177/00222437231194319.

**Why it matters.** Across 113 subjects and 85 video ads, **emotion and memory neural signatures in the first 3 seconds** are the earliest and strongest predictors of ad liking. Direct justification for scoring UGC hooks with an early-window neuro metric.

### d'Ascoli, Banville, Rapin et al. (2026) — *Meta FAIR*

> *TRIBE v2: A tri-modal brain encoding model for video, audio, and text.* Meta FAIR release, 2026-03-26.

**Why it matters.** SOTA brain encoder; predicts fMRI across ~70K voxels from raw multimodal stimuli; zero-shot beats individual human subjects for group-averaged predictions. **This is the scoring engine Nucleus runs.**

### Knutson, Katovich & Suri (2014) — *Trends in Cognitive Sciences*

> *Inferring affect from fMRI data.* TiCS 18(8): 422–428. DOI: 10.1016/j.tics.2014.04.006.

**Why it matters.** Establishes the AIM framework — affect components (NAcc, AIns) generalize across people, integrative components (mPFC) are idiosyncratic. This is the theoretical spine of every result above and the reason a neuro reward model can be built at all.

## The pitch-ready takeaway

Three sentences for the deck:

> *Fifteen years of fMRI research have shown that lab-scale neural response — from as few as 18–40 subjects — predicts population-level behavioral outcomes (views, shares, purchases, crowdfunding, music downloads, chocolate sales) better than self-report and better than behavioral ratings. As of March 2026, Meta FAIR's TRIBE v2 makes those neural predictions **zero-shot** from raw video without recruiting subjects. Nucleus is the first product that uses this signal as the objective function of a generative video pipeline instead of as a measurement report.*
