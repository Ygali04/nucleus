# TRIBE v2 Deep Dive

This page is the technical deep dive on Meta FAIR's TRIBE v2 — the
model Nucleus uses for scoring in the research and benchmarking
track. Reading this page tells you what TRIBE v2 actually is, what
it was trained on, what it can and can't predict, and where the
known limitations bite.

## Ground-truth note

> Several numbers in the public description of TRIBE v2 are
> inconsistent across sources. The arXiv preprint of the
> Algonauts-2025-winning "TRIBE" paper (v1; d'Ascoli et al., 2025,
> arXiv:2507.22229) describes a 4-subject / ~80-hour-per-subject
> model with 1,000-parcel output. The Meta FAIR release of TRIBE v2
> (d'Ascoli et al., 2026; HuggingFace model card; Meta blog)
> describes a ~720-subject / ~1,115-hour model predicting onto the
> fsaverage5 cortical mesh (~20k vertices). Where the two conflict,
> this page treats **v1 = Algonauts 2025 winner, 4 subjects, 1,000
> parcels** and **v2 = March 2026 Meta release, ~720 subjects,
> fsaverage5 ~20k vertices**, and flags ambiguity inline.

## What TRIBE v2 is

TRIBE v2 — full name *"A Foundation Model of Vision, Audition, and
Language for In-Silico Neuroscience"* — is Meta FAIR's March 2026
release of a multimodal encoder that ingests video, audio, and text
and predicts fMRI BOLD responses on a standard cortical surface
mesh.

It is the direct successor to the model that won the Algonauts 2025
challenge (TRIBE v1, arXiv:2507.22229). Both models were led by
Stéphane d'Ascoli with the Meta FAIR Brain & AI team.

TRIBE v2's stated ambition is explicit in the paper title: **in
silico neuroscience**. Meta FAIR positions the model as a way to
run neuroscientific experiments virtually, without repeatedly
collecting fMRI. That framing — not "neuromarketing tool" — is the
scientific north star of the project. Nucleus inherits a model
optimized for a different use case, which is the entire reason the
[honest gaps page](honest-gaps.md) exists.

## Architecture

TRIBE v2 stacks three frozen, off-the-shelf foundation backbones
plus a trainable brain-alignment head:

| Stage | Component | Role |
|---|---|---|
| Video encoder | **V-JEPA 2** (ViT-G, FPC64-256) | Pre-trained on 1M+ hours of internet video using a non-generative joint-embedding predictive objective (Assran et al., 2025, arXiv:2506.09985). Outputs token-level features at ~2 Hz. |
| Audio encoder | **Wav2Vec-BERT 2.0** | Frozen self-supervised speech / audio encoder (Meta, 2024). Produces 50 Hz acoustic tokens. |
| Text encoder | **LLaMA 3.2 (3B)** | Used for transcripts / subtitles / narration. Hidden states pooled to sentence or window level. |
| Fusion | Temporal transformer (8 layers in v1; v2 reports an expanded architecture) | Cross-modal attention aligns token streams, resampled to a common grid. |
| Head | Subject-specific linear / MLP prediction block onto fsaverage5 (~20,481 vertices across both hemispheres) | Outputs the BOLD signal offset by **+5 seconds in the past** to compensate for hemodynamic lag. |

Two subtle but important architectural facts:

### The backbones are frozen

Gradient flows only through the fusion transformer and the
prediction head. This is why TRIBE inherits V-JEPA 2's
representational structure almost wholesale — meaning **any
downstream Nucleus fine-tuning should be thought of as "re-training
the head on top of a V-JEPA 2 feature extractor," not as modifying a
brain-level representation.**

This is also the reason the in-house `AttentionProxyAnalyzer` is
architecturally feasible: V-JEPA 2 is commercially licensed
(Apache 2.0), and the brain-alignment head is the only piece that
needs to be retrained from scratch on permissive data.

### Subject handling is a "prediction block," not a full model

TRIBE v2's HuggingFace card reports that the default checkpoint
predicts the **average subject**. Individual-subject heads exist in
the code but require fMRI data from that subject to train. There is
no demographic conditioning, no persona injection, no cohort-level
head out of the box.

For Nucleus, this means cohort personalization ("predict for 24-
year-old women in APAC") requires either:

1. Collecting fMRI from a representative cohort (expensive,
   infeasible at marketing scale)
2. Adding behavioral conditioning after the neural prediction
   (the neuroforecasting layer)
3. Fine-tuning a head on neural data from a representative cohort
   (still requires the data)

The [research roadmap](research-roadmap.md) treats cohort
personalization as a Year 2+ project.

## Training data

The Meta FAIR release describes training on **"over 1,000 hours of
fMRI across more than 720 subjects"** drawn from naturalistic-
stimulus corpora. The two primary datasets visible in the repo
structure:

| Dataset | Description |
|---|---|
| **CNeuroMod / Courtois NeuroMod** | 6 subjects, scanned weekly for 5 years, ~500 h/subject target. Watching *Friends* S1–6, *The Bourne Supremacy*, *Hidden Figures*, *The Wolf of Wall Street*, *Life*, *Movie10*. Training corpus for v1. |
| **Algonauts 2025 challenge data** | ~65 h of training movies + held-out films, derived from CNeuroMod, 4 subjects, 1,000-parcel targets. |
| **Lahner2024** | Referenced in the repo as a dataset class; appears to be additional naturalistic-viewing fMRI from the BOLD Moments group. |

The jump from **"4 subjects × 80 h"** (v1) to **"720 subjects ×
~1.5 h mean"** (v2) is the story of v2: Meta stitched together many
smaller naturalistic fMRI datasets into a single training corpus.

The individual-subject data density is therefore *lower* in v2 than
in v1 on a per-subject basis. v2 wins on breadth, v1 wins on depth.

### What's NOT in the training data

This is the most important fact for Nucleus's use case:

> **Stimulus modality breakdown is not fully documented in public
> materials, but from the dataset list the training distribution is
> heavily skewed toward long-form scripted video (TV, feature film)
> with some podcast / audio-only content and text passages. There
> is zero advertising content, zero UGC, and zero vertical / mobile
> framing in the training set.**

Short-form UGC is out of distribution for TRIBE v2. The
[honest gaps page](honest-gaps.md) and the
[research roadmap](research-roadmap.md) both treat this as a
top-priority research question.

## Output and temporal resolution

| Property | Value |
|---|---|
| Spatial target | fsaverage5 cortical surface mesh, ~10,242 vertices per hemisphere (~20,484 total) |
| Temporal target | BOLD signal at 1 Hz |
| Hemodynamic offset | Predictions offset by 5 s in the past to absorb HRF delay |
| Modalities supported | Video, audio, text — independently or combined |
| Inference time | ~10–30 seconds per 30-second clip on A100 |

### What "1 Hz" means for Nucleus

fMRI is a hemodynamic signal. It is a low-pass filter of neural
activity with a characteristic rise-and-fall on the order of 4–6
seconds. **Even if TRIBE v2 spat out predictions every 100 ms, the
underlying biology would still smear sub-second events together.**

The practical implication: a UGC hook where a logo flashes at
t = 0.3s and a face appears at t = 0.8s cannot be disambiguated by
any fMRI-trained model — the two events will land inside the same
BOLD response.

**This is a ceiling, not a bug.** Any neural model trained on fMRI
inherits the same limit. EEG-based models (which have millisecond
resolution) get around it but at the cost of spatial resolution.

## Validation results — what the paper actually shows

The most rigorous public validation data is from the Algonauts 2025
paper (TRIBE v1):

| Metric | Result | Note |
|---|---|---|
| Mean Pearson r across 1,000 parcels (4 subjects, held-out *Friends* S7) | **0.3195** | In-distribution test (same show as training) |
| Mean Pearson r on held-out *Pulp Fiction* | **0.2604** | Out-of-distribution test (unseen film) |
| Overall Algonauts 2025 challenge score | **0.2146** | Noise-normalized |
| 2nd place (VIBE, MPI NCG team) | 0.2096 | Same backbone family |
| 3rd place (SDA) | 0.2094 | |
| Single-modality baselines | Video 0.25, Audio 0.24, Text 0.22 | Multimodal fusion gains were +30% in associative cortex |
| Normalized Pearson r on auditory / language cortex | **~0.54 ± 0.1** | The strongest regions — STG, angular gyrus, temporal pole |
| Normalized Pearson r on primary visual cortex | Lower than vision-only baseline | **Language / audio features hurt V1 prediction — known failure mode** |

For TRIBE v2 specifically, Meta's release states the model
*"accurately predicts high-resolution brain responses for novel
stimuli, tasks and subjects, superseding traditional linear encoding
models, delivering several-fold improvements in accuracy."*

The full v2 paper ("A Foundation Model of Vision, Audition, and
Language for In-Silico Neuroscience") is referenced on the Meta
research page, but **detailed per-region and zero-shot numbers are
not in the materials indexed by conventional search as of April
2026.** Anyone citing v2-specific numbers should cite the arXiv
paper directly once retrievable; this page deliberately does not.

### Three qualitative claims worth knowing

1. **Log-linear scaling.** Meta claims v2 follows a log-linear
   scaling law with dataset size, with "no performance plateau in
   sight." Caveat: Paul Scotti's Algonauts 2025 post-mortem notes
   the trend looks "sub-linear and plateauing" in his independent
   analysis. Treat the log-linear claim as marketing-adjacent.
2. **Group-averaged > individual.** Zero-shot predictions of the
   group-averaged brain are often more accurate than an individual
   human subject's own single-session recording. This is a
   consequence of averaging out measurement noise, not of the model
   transcending human neural variability.
3. **Cross-language and cross-modality generalization.** The same
   model generalizes after training without language-specific fine-
   tuning.

## License

**CC BY-NC 4.0** (Creative Commons Attribution-NonCommercial 4.0
International). Confirmed on both the HuggingFace model card
(`facebook/tribev2`) and the GitHub repo (`facebookresearch/tribev2`).

The license permits:

- Academic research use
- Non-commercial internal R&D
- Re-distribution of derivatives under a compatible non-commercial
  license, with attribution

The license blocks:

- Any commercial product use
- Any paid service that depends on TRIBE v2 outputs, even if the
  outputs are transformed
- Any B2B sale of derived artifacts where the derivation could not
  exist without TRIBE v2

The full license analysis lives on the
[compliance license page](../compliance/license-tribe-v2.md). The
short version: **Nucleus uses TRIBE v2 for benchmarking and research
only. The production loop runs on the in-house
`AttentionProxyAnalyzer`.**

## Known limitations

In rough order of severity for Nucleus's use case:

| Limitation | Why it matters for UGC ad scoring |
|---|---|
| **Average-brain prediction** | No ability to segment by demographic. "How does this ad resonate with 24-year-old women in APAC" cannot be asked directly — only "how does this ad resonate with the average CNeuroMod subject, who is a Quebec-resident adult who watched *Friends* for 80 hours." |
| **1 Hz temporal resolution + 5s HRF smoothing** | Sub-second creative moves (flash cut, beat drop, sudden face) cannot be resolved. Short-form UGC lives in that regime. |
| **Trained on naturalistic long-form stimuli** | 22-minute *Friends* episodes and 2-hour feature films. Not 9-second TikTok hooks. Distributional shift is severe and not characterized by any published number. |
| **Scanner context ecological validity** | Subjects in CNeuroMod are supine, stationary, head-fixed, socially isolated, and know they're being scanned for neuroscience. UGC viewers are vertical, thumb-scrolling, distracted, and in ambient social context. |
| **No cohort personalization** | No conditioning token for audience, brand category, product, or purchase intent. Adding one would require collecting your own fMRI data. |
| **V1 gap on primary visual cortex** | In v1, the text/audio stream hurt prediction in V1. If this persists in v2, low-level visual salience is better estimated from vision-only baselines. |
| **No behavioral labels** | TRIBE v2's loss is BOLD-signal reconstruction. It does not optimize for any downstream behavior (purchase, recall, share, view-duration). The neuroforecasting bridge has to be added on top. |
| **License** | CC BY-NC 4.0 blocks direct commercial use. |

A quote from the Algonauts 2025 paper makes the scope explicit:

> *"Our model is limited to perception and comprehension — we do
> not model behavior, memory, or decisions. It is also limited by
> fMRI's temporal resolution, which cannot resolve the precise
> neural timescales of cognition."*
> — d'Ascoli et al. 2025, arXiv:2507.22229 (paraphrased from the
> Limitations section)

## What this means for Nucleus

Three implications.

1. **TRIBE v2 is the right reference model but the wrong production
   model.** It's the SOTA for naturalistic neural prediction. It's
   also out-of-distribution for UGC, license-restricted, and tuned
   to a use case that doesn't match Nucleus's. Production needs a
   different model.
2. **The right production model is V-JEPA2-based.** The frozen
   backbones in TRIBE v2 do most of the representational work. A
   commercially-clean replacement only needs to retrain the
   prediction head — much less expensive than training from
   scratch.
3. **The honest "world's best" play is benchmark-driven.** The
   field has a clear evaluation suite (Algonauts, Brain-Score,
   noise-normalized Pearson r per region). Nucleus competes by (a)
   matching TRIBE v2 on the published benchmarks with a
   commercially-clean model, (b) extending the benchmark suite to
   UGC-style stimuli that the field doesn't yet evaluate, and (c)
   linking neural predictions to in-market behavioral outcomes
   nobody else has data for.

The next pages — [alternative models](alternative-models.md),
[evaluation methodology](evaluation-methodology.md), and the
[research roadmap](research-roadmap.md) — describe how each of
these implications becomes a concrete project.
