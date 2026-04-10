# Research Foundation

Nucleus is not a speculative product. It sits on top of two bodies of
research that converged in the last twelve months: the structural shift
of brand video toward UGC-style creative, and fifteen years of
neuroforecasting literature that connects small-sample neural response
to population-level behavior. This page summarizes both so the rest of
the site can reference them as given.

## Why UGC is the default ad format in 2026

User-generated content is now the dominant paid social creative format
across Instagram Reels, TikTok, YouTube Shorts, and LinkedIn's video
feed. The "creator voice" out-performs polished brand assets on nearly
every downstream metric because it pattern-matches to organic content
and slips past ad-blindness.

> - **6.9× engagement** vs brand-generated content; **+28%** engagement
>   rate on Instagram vs branded posts *(inBeat, 2025)*
> - **4× higher CTR** and **~50% lower CPC** on UGC-based paid ads vs
>   studio creative *(inBeat, 2025)*
> - **+29% web conversion** for brands with a UGC-in-the-funnel
>   strategy; **+74% conversion lift** from on-site UGC
>   *(Backlinko, 2026)*
> - **79%** of consumers say UGC influences purchase; **60%** rank it
>   as the single most authentic content type *(Podium / CreatorLabz, 2025)*

The category is projected to grow from ~$9.85B in 2025 to $43.9B by
2031 — a 28% CAGR (Backlinko, 2026).

## Why the human creator pipeline breaks at brand scale

Human creators cost $150–$500+ per deliverable, take 2–3 weeks of
briefing/shipping/revisions, and iterate serially. Creator fatigue is
real — top creators are oversubscribed, and the long tail produces
inconsistent quality. The TikTok algorithm demands 20–40 fresh variants
per week per account for performant brands; no human creator pipeline
clears that bar.

Synthetic-UGC tools (HeyGen, Arcads, Creatify, Captions, Descript)
generate UGC-style videos from a script + product doc + avatar at
roughly **1% the unit cost of human UGC** (WebProNews, 2025). Early
adopters report AI-UGC TikTok engagement rates 3–5× above human-made
baselines on the same accounts.

The 2025 FTC ruling banning undisclosed synthetic testimonials and the
EU AI Act's labeling rules have not slowed adoption — they have forced
disclosure, which turns out not to hurt performance.

## The remaining problem: quality variance

Generative UGC tools produce 100 variants for the price of 3 human
videos, but **80 of those 100 are still mediocre**. The industry has
no scalable, non-human way to know which two will actually perform
before spending on paid media. Brand marketers become the quality
filter — which does not scale and does not improve.

This is the gap Nucleus closes. The quality signal comes from a
neuro-predictive model, and the editor agent descends that signal until
the variant passes threshold.

## The neuromarketing literature

Fifteen years of neuroforecasting research has repeatedly shown that
small-sample neural response — from as few as 18–40 subjects —
predicts **population-level** behavioral outcomes better than
self-report and often better than the participants' own behavioral
ratings.

### The brain regions that matter

Research has converged on a small set of cortical and subcortical
regions with direct marketing relevance:

| Region | What it encodes | Why Nucleus scores it |
|---|---|---|
| **Nucleus accumbens (NAcc)** | Anticipatory reward / approach | The "hook signal" — NAcc activation in the first seconds of a video predicts whether viewers lean in or bounce |
| **Anterior insula (AIns)** | Anticipatory loss / avoidance | Low AIns at onset = low bounce; the differential NAcc↑ / AIns↓ is the single most validated hook metric |
| **Hippocampus + medial temporal lobe** | Memory encoding | Whether the brand will be recalled at the shelf/store |
| **Dorsal attention network (IPS, FEF)** | Sustained attention | The attention curve across the full video |
| **Medial prefrontal cortex (mPFC)** | Subjective value, social cognition | Predicts *sharing* — the signal Nucleus weights for virality |
| **Orbitofrontal cortex (OFC)** | Aesthetic valuation | The subjective "this is beautiful" signal |
| **Default-mode network (DMN)** | Mind wandering (inverse engagement) | Rising DMN activation flags drop-off risk |
| **Broca / Wernicke** | Language comprehension | Message clarity signal |

Knutson, Katovich & Suri's **Affect–Integration–Motivation (AIM)
framework** (2014) is the theoretical spine: affect components (NAcc,
AIns) generalize across people; integrative components (mPFC) are more
idiosyncratic but predict social outcomes like sharing.

### TRIBE v2

**Meta FAIR's TRIBE v2** (d'Ascoli et al., released 2026-03-26) is a
multimodal transformer that takes raw video + audio + text and predicts
fMRI responses across ~70,000 cortical voxels, trained on 1,115+ hours
of fMRI from 700+ subjects. Released under CC BY-NC 4.0 with open
weights and code.

The critical property: **zero-shot predictions of group-averaged neural
response to unseen video are, in many cortical regions, more accurate
than an individual real subject's own fMRI recording.** It is the first
scoring infrastructure that makes a closed-loop generative pipeline
possible without recruiting a single human.

Nucleus runs TRIBE v2 as the default analyzer through the NeuroPeer
service already deployed in the author's stack. The
[pluggable analyzer](how-it-works.md#pluggable-analyzer) design lets
Nucleus fall back to a commercial-safe alternative if the CC BY-NC
license blocks commercial deployment.

## Academic spine

These are the papers Nucleus's architecture rests on. Each has been
verified with a DOI or equivalent. Each carries a one-line "why it
matters" for the engine.

### Hook and onset signal

**Tong, Acikalin, Genevsky, Shiv & Knutson (2020).** *Brain activity
forecasts video engagement in an internet attention market.* **PNAS
117(12): 6936–6941.** DOI: 10.1073/pnas.1905178117.

> NAcc ↑ and AIns ↓ at video onset forecast aggregate YouTube view
> frequency and duration **above and beyond** conventional metrics.
> This is the direct scientific basis for scoring video hooks with a
> neuro-predictive model.

**Chan, Boksem, Venkatraman, Dietvorst, Scholz, Vo, Falk & Smidts
(2024).** *Neural signals of video advertisement liking: Insights into
psychological processes and their temporal dynamics.* **Journal of
Marketing Research.** DOI: 10.1177/00222437231194319.

> Across 113 subjects and 85 video ads, **emotion and memory neural
> signatures in the first 3 seconds** are the earliest and strongest
> predictors of ad liking. Direct justification for scoring UGC hooks
> with an early-window neuro metric.

### Population-level prediction from small samples

**Falk, Berkman & Lieberman (2012).** *From neural responses to
population behavior: Neural focus group predicts population-level media
effects.* **Psychological Science 23(5): 439–445.**
DOI: 10.1177/0956797611434964.

> 31 smokers' mPFC response to anti-smoking PSAs predicted the
> real-world call volume to 1-800-QUIT-NOW across the entire US market.
> Self-report didn't. The foundational result.

**Genevsky & Knutson (2015).** *Neural affective mechanisms predict
market-level microlending.* **Psychological Science 26(9): 1411–1422.**
DOI: 10.1177/0956797615588467.

> Lab NAcc signal from 30 people predicted the success of Kiva
> microloan appeals across the entire internet — brain beats behavioral
> self-report for aggregate forecasting.

**Genevsky, Yoon & Knutson (2017).** *When brain beats behavior:
Neuroforecasting crowdfunding outcomes.* **Journal of Neuroscience
37(36): 8625–8634.** DOI: 10.1523/JNEUROSCI.1633-16.2017.

> Only NAcc (not mPFC, not self-report) generalized to forecast real
> Kickstarter funding weeks later. Establishes the "early-affect
> generalizes, late-integration doesn't" principle.

**Genevsky, Tong, Knutson et al. (2025).** *Neuroforecasting reveals
generalizable components of choice.* **PNAS Nexus 4(2): pgaf029.**
DOI: 10.1093/pnasnexus/pgaf029.

> Confirms across both crowdfunding and video-viewing that NAcc activity
> is correlated across subjects (ICC ≈ 0.41) while mPFC is not. Locks
> in NAcc as the single most reliable target for population-level
> prediction.

### Sharing and virality

**Scholz, Baek, O'Donnell, Kim, Cappella & Falk (2017).** *A neural
model of valuation and information virality.* **PNAS 114(11):
2881–2886.** DOI: 10.1073/pnas.1615259114.

> mPFC value signal during article reading predicted 117,611 real
> internet shares of NYT articles. Establishes mPFC as the "will this
> be shared" substrate — directly usable as a virality reward channel.

### Aesthetic appeal

**Vessel, Starr & Rubin (2012).** *The brain on art: intense aesthetic
experience activates the default mode network.* **Frontiers in Human
Neuroscience 6:66.** DOI: 10.3389/fnhum.2012.00066.

**Vessel, Isik, Belfi, Stahl & Starr (2019).** *The default-mode network
represents aesthetic appeal that generalizes across visual domains.*
**PNAS 116(38): 19155–19160.** DOI: 10.1073/pnas.1902650116.

> Aesthetic appeal signal in DMN/mPFC is **domain-general** — the same
> region codes beauty for landscapes, architecture, artwork. Means a
> single aesthetic channel can score any visual.

### Real-world behavioral forecasting

**Berns & Moore (2012).** *A neural predictor of cultural popularity.*
**Journal of Consumer Psychology 22(1): 154–160.**
DOI: 10.1016/j.jcps.2011.05.001.

> NAcc activation from 27 adolescents listening to unknown songs
> predicted **3 years of future album sales** — neural signal beat
> subjects' own liking ratings.

**Kühn, Strelow & Gallinat (2016).** *Multiple "buy buttons" in the
brain: Forecasting chocolate sales at point-of-sale based on functional
brain activation using fMRI.* **NeuroImage 136: 122–128.**
DOI: 10.1016/j.neuroimage.2016.05.021.

> 18-subject lab fMRI forecasted real in-store chocolate sales measured
> across **63,617 shoppers**. Explicit liking judgments were the
> weakest predictor.

### The SOTA zero-shot encoder

**d'Ascoli, Banville, Rapin et al. (2026).** *TRIBE v2: A tri-modal
brain encoding model for video, audio, and text.* Meta FAIR release,
2026-03-26. [github.com/facebookresearch/tribev2](https://github.com/facebookresearch/tribev2).
[huggingface.co/facebook/tribev2](https://huggingface.co/facebook/tribev2).

> SOTA brain encoder; predicts fMRI across ~70K voxels from raw
> multimodal stimuli; zero-shot beats individual human subjects for
> group-averaged predictions. **This is the scoring engine Nucleus
> runs.**

### The theoretical spine

**Knutson, Katovich & Suri (2014).** *Inferring affect from fMRI data.*
**Trends in Cognitive Sciences 18(8): 422–428.**
DOI: 10.1016/j.tics.2014.04.006.

> Establishes the Affect–Integration–Motivation (AIM) framework —
> affect components (NAcc, AIns) generalize across people, integrative
> components (mPFC) are idiosyncratic. This is the reason a neuro
> reward model can be built at all.

## One sentence for the reader in a hurry

> Fifteen years of fMRI research show that lab-scale neural response —
> from as few as 18–40 subjects — predicts population-level behavior
> (views, shares, purchases, crowdfunding, music downloads, chocolate
> sales) better than self-report; as of March 2026, TRIBE v2 makes
> those neural predictions zero-shot from raw video without recruiting
> subjects; Nucleus is the first product that uses this signal as the
> objective function of a generative video pipeline instead of as a
> measurement report.
