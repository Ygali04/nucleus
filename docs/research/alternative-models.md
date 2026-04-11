# Alternative Neuro-Predictive Models

A survey of every model adjacent to TRIBE v2 that could inform,
replace, or compete with Nucleus's scoring layer. Each entry is a
legitimate point of comparison for what a neural video scorer can
look like.

## The landscape at a glance

| Model | Year | Input → Output | Training data | License | Best use for Nucleus |
|---|---|---|---|---|---|
| **TRIBE v2** | 2026 | Video+audio+text → whole-brain BOLD (fsaverage5) | ~720 subjects, ~1,115 h naturalistic fMRI | CC BY-NC 4.0 | Reference model (benchmarking only) |
| **TRIBE v1** | 2025 | Video+audio+text → BOLD (1,000 parcels) | 4 subjects, ~80 h/subject (CNeuroMod) | Open (code), CC BY-NC (data) | Reproducible numbers for benchmarks |
| **VIBE (MPI NCG)** | 2025 | Video+audio+text → BOLD | Same Algonauts 2025 data | Research | Architectural comparator |
| **SDA** | 2025 | Video+audio+text → BOLD | Same Algonauts 2025 data | Research | Third-place comparator |
| **MindEye 2** | 2024 | fMRI → image (decoder) | NSD (8 subjects, ~30 h each) | MIT-ish | Proves cortical information is recoverable |
| **Brain-Score Vision** | 2018– | ANN features → neural + behavioral similarity | Multi-source primate + human | Open | Evaluation harness, not a model |
| **CORnet-S** | 2019 | Image → V1/V2/V4/IT | Brain-Score training | Open | Brain-plausible backbone baseline |
| **Kell et al. 2018** | 2018 | Audio → auditory cortex voxels | ~160 h audio, ~10 subjects | Open | Gold-standard audio-only scorer |
| **Algonauts 2021 winners (BMD)** | 2021 | 3 s clip → BOLD | 10 subjects, 1,102 × 3 s clips | Open | Closest precedent to short-clip scoring |
| **Algonauts 2023 winners (NSD)** | 2023 | Image → ventral stream | NSD (8 subjects, ~70k images) | Open | Image-only analogue |
| **THINGS-fMRI encoders** | 2023 | Image → object-selective cortex | 3 subjects, 8,740 images × 12 sessions | Open | Object-level channel |
| **THINGS-EEG encoders** | 2022 | Image → 64-channel EEG | 50 subjects, 22,248 images | Open | Cheap-hardware analogue |
| **DreamSim** | 2023 | Image pair → human similarity | 20k triplet judgments | Open | Perceptual similarity metric |
| **Rocha et al. EEG attention models** | 2020– | Video + EEG → attention score | Small panels | Research | Lab-scale attention prediction |
| **Neurons Inc Predict** | Closed | Image/video → attention + memory scalars | ~12,000 subjects (claimed) | Commercial | Main commercial incumbent |
| **Realeyes PreView** | Closed | Webcam → facial + attention | 6M+ respondents (claimed) | Commercial | Primary ad-testing incumbent |
| **Attention Insight** | Closed | Image/video → saliency heatmap | ~5.5M fixations (claimed) | Commercial | Bottom-up attention only |
| **Immersion Neuroscience** | Closed | HRV → immersion scalar | Proprietary | Commercial | Wearable signal, not model-based |

## Academic models worth a deep look

### TRIBE v1 — the reproducible anchor

**Paper:** d'Ascoli et al., *TRIBE: Trimodal Brain Encoder for
whole-brain fMRI response prediction* (2025, arXiv:2507.22229).
Algonauts 2025 winner.

TRIBE v1 is the version with all the numbers you can cite.
4 CNeuroMod subjects × ~80 hours each, predicting 1,000 brain
parcels. Same three-backbone architecture as v2 (V-JEPA 2 for
video, Wav2Vec-BERT for audio, LLaMA 3.2 for text), trained on
much less breadth but much more depth per subject.

Key numbers:

| Metric | Value |
|---|---|
| In-distribution Pearson r (held-out *Friends* S7) | 0.3195 |
| OOD Pearson r (*Pulp Fiction*) | 0.2604 |
| Algonauts 2025 noise-normalized score | 0.2146 |
| Best single-modality (video) | ~0.25 |
| Multimodal fusion gain in associative cortex | +30% |
| Normalized r on auditory / language cortex (STG, angular gyrus) | 0.54 ± 0.1 |
| Normalized r on V1 (with language features) | Lower than vision-only — known failure mode |

**Why Nucleus cares:** v1 is the paper Nucleus treats as ground
truth. Any v2 number that contradicts v1 without explanation should
be flagged.

### VIBE (MPI NCG) — the second-place comparator

**Team:** Max Planck Institute for Neurological Research,
Cognitive Neurogenetics lab. Algonauts 2025 runner-up.

Same backbone family as TRIBE, different fusion architecture. Score
0.2096 vs TRIBE's 0.2146. The closeness of the top-3 suggests that
architectural novelty was not the main driver of the challenge —
ensembling and multimodal-dropout strategies mattered more. This is
the lesson the Algonauts post-mortem (Scotti et al. 2025,
arXiv:2508.10784) explicitly calls out.

**Why Nucleus cares:** VIBE is the proof that you don't need
Meta FAIR's model to get within 3% of Meta FAIR's score. A
well-engineered in-house model can compete at the top of the
academic leaderboard.

### MindEye 2 — the decoder that proves the upper bound

**Paper:** Scotti et al., *MindEye2: Shared-Subject Models Enable
fMRI-To-Image With 1 Hour of Data* (2024, arXiv:2403.11207, ICML
2024).

MindEye 2 goes the opposite direction from TRIBE: it *decodes*
images from fMRI. MindEye 2 is notable because it introduced a
**shared-subject latent** that lets a new subject reach SOTA
reconstruction quality with just 1 hour of scanner time.

Architecture: contrastive alignment to CLIP latents + a fine-tuned
Stable Diffusion XL decoder on the NSD.

**Why Nucleus cares:**

1. It proves how much stimulus information is linearly recoverable
   from cortical activity. This upper-bounds what *any* encoder
   (including TRIBE) could predict.
2. The shared-subject latent technique is directly relevant if
   Nucleus ever collects small-panel fMRI data. The
   [research roadmap](research-roadmap.md)'s N-Data-1 project would
   use this technique to stretch a 24-subject scan into something
   with cohort-level generalization.

### Brain-Score Vision — the evaluation harness

**Paper:** Schrimpf, Kubilius, Hong et al., *Integrative benchmarking
to advance neurally mechanistic models of human intelligence*
(Neuron, 2020).

Brain-Score is not a model. It's an **open benchmark** that scores
ANN features against 100+ neural and behavioral datasets in primate
vision. The methodology:

1. Map the model's features to V1/V2/V4/IT neural recordings via
   regression
2. Compute noise-ceiling-normalized Pearson r
3. Weight across benchmarks

**Why Nucleus cares:** This is the template for
[`UGC-Brain-Score`](research-roadmap.md#project-n-bench-1-ugc-brain-score),
the open benchmark Nucleus intends to ship. Same methodology, new
stimulus domain.

### CORnet-S — the brain-plausible vision baseline

**Paper:** Kubilius et al., *Brain-Like Object Recognition with
High-Performing Shallow Recurrent ANNs* (NeurIPS 2019).

Four areas (V1, V2, V4, IT), compact architecture, recurrent
connectivity. CORnet-S has been passed on Brain-Score by many
deeper models, but it remains the simplest network that correlates
meaningfully with ventral-stream single-unit data.

**Why Nucleus cares:** CORnet is an **efficient, fully
commercially-licensed vision backbone** that could form the base of
a lightweight scorer. If Nucleus ever needs a secondary scorer for
cheap inference (e.g., a budget tier), CORnet is the starting
point.

### Kell et al. 2018 — the auditory-cortex baseline

**Paper:** Kell, Yamins, Shook, Norman-Haignere, McDermott, *A Task-
Optimized Neural Network Replicates Human Auditory Behavior,
Predicts Brain Responses, and Reveals a Cortical Processing
Hierarchy* (Neuron, 2018).

The auditory-cortex equivalent of CORnet. Task-optimized hierarchical
DNN for speech and music recognition, with separate late branches
that mirror cortical organization. Predicts auditory-cortex fMRI
voxels **substantially better than traditional spectrotemporal
filter models**.

**Why Nucleus cares:** This is the gold-standard reference for
audio-only brain prediction. If Nucleus wants to score a voiceover
independently of video (e.g., for a pure-audio training variant),
this is the natural fallback.

### Algonauts Challenges — the community benchmark series

The Algonauts Project is the community benchmark for brain-response
prediction. Annual challenges:

| Year | Challenge | Data | Winners |
|---|---|---|---|
| **2019** | Image → IT cortex | Simple image challenge | Early CNN entries |
| **2021** | 3 s clip → whole-brain BOLD | **BOLD Moments Dataset (BMD)**, 10 subjects × 1,102 × 3 s clips | Transformer-based video encoders |
| **2023** | Image → ventral stream | **NSD**, 8 subjects, ~73k images | DINO/CLIP/EVA feature regressions |
| **2025** | Movie → BOLD | **CNeuroMod subset**, 4 subjects × 65 h | **TRIBE (Meta FAIR)**, VIBE (MPI NCG), SDA |

The 2021 BMD challenge is the closest academic precedent to
"score a short clip." The 3 s clips were "a dog running," "a man
eating pizza," "waves crashing" — not TikTok hooks with selfie
framing, but still the shortest published video encoding work.

Winners in 2021 achieved peak Pearson r around 0.22 normalized on
held-out clips — a ceiling that suggests short-clip prediction is
harder even in distribution.

The **Algonauts 2025 post-mortem** (Scotti et al.,
arXiv:2508.10784) is required reading. The headline:
**architectural choices did not matter much**; ensembling and
multimodal-dropout strategies decided the winner. For Nucleus, this
means fine-tuning data + training tricks matter more than
architectural novelty.

### THINGS-fMRI and THINGS-EEG

**Papers:** Hebart et al. (eLife 2023, DOI 10.7554/eLife.82580);
Grootswagers et al. (Sci Data 2022, DOI 10.1038/s41597-021-01102-7).

The object-recognition counterpart to NSD. THINGS-fMRI has 3
subjects × 8,740 images × 12 sessions at 7T; THINGS-EEG has 50
subjects × 22,248 images. Small for a video encoder but ideal if
Nucleus wants an **object-level channel** — e.g., "which product in
the frame activates object-selective cortex?"

### DreamSim — the perceptual similarity metric

**Paper:** Fu, Tamir, Sundaram et al., *DreamSim: Learning New
Dimensions of Human Visual Similarity using Synthetic Data*
(NeurIPS 2023, arXiv:2306.09344).

DreamSim is the CLIP-era successor to LPIPS: a perceptual similarity
metric trained on ~20k human triplet judgments over diffusion-
generated image pairs. **Not neural** — it predicts behavioral
similarity, not brain response. But it's the cheapest way to ask
"do humans find these two frames similar?" and it's a required
ingredient in any generative-loop reward stack because it stops the
generator from collapsing onto a single frame.

**Why Nucleus cares:** DreamSim is a cheap "diversity signal" the
recursive loop uses to prevent mode collapse — independent of the
neural scoring.

### EEG attention literature — the sub-second complement

A scattered but active field publishes EEG-based attention and
engagement predictors for video ads:

- Rocha et al. (Frontiers in Human Neuroscience)
- Vecchiato et al. (Brain Topography)
- Boksem & Smidts (Journal of Marketing Research)

Most use 14–64 channel consumer EEG, ~20–40 subjects, ad exposure in
the 30–60 s range. Correlations with self-report attention land in
r ≈ 0.4–0.6.

**These are not foundation models** — they are small, supervised
regressors. Their main lesson is that frontal asymmetry and parietal
alpha suppression reliably index attention, which TRIBE v2 does not
directly predict (because fMRI can't resolve the sub-second
dynamics EEG sees).

**Why Nucleus cares:** EEG is the complement to fMRI. The
[research roadmap](research-roadmap.md)'s **Project N-Data-4**
proposes a small 100-subject EEG study specifically to cover the
sub-second blind spot in the fMRI-only TRIBE pipeline.

## Commercial players — what's actually under the hood

| Vendor | Product | Training data (claimed) | Architecture | What they really sell |
|---|---|---|---|---|
| **Neurons Inc** | "Predict" | ~12,000 eye-tracked subjects, multi-context (ads, packaging, apps) | "Deep learning" — CNN family, not disclosed | 95% claimed accuracy vs real eye-tracking; image + video scoring via API |
| **Realeyes** | "PreView" | 6M+ webcam-recorded viewers, 2B annotations, 93 countries | Proprietary CNN for facial action units + attention regressor | Pre-flight ad performance prediction; Nielsen Outcomes Marketplace partner |
| **Attention Insight** | Heatmap predictor | ~5.5M fixations, ~550M gaze points | Deep learning saliency model benchmarked on MIT/Tuebingen | 93–96% accuracy vs eye-tracking on static images |
| **Brainsight** | Predictive eye tracking + clarity score | Not disclosed | Saliency ML model | Faster / cheaper Attention Insight |
| **Immersion Neuroscience** | HRV-based immersion scalar | Opt-in wearable panels | HRV signal pipeline | Single scalar per viewer per moment |

**The pattern to notice.** Every commercial player is either (a) a
**behavioral proxy predictor** (Neurons, Realeyes, Attention
Insight — trained on eye-tracking or facial action units, not
neural data), or (b) a **measurement service** (Immersion, Nielsen).

None of them publish a model that predicts cortical responses to a
given video. **TRIBE v2 is in a different category — it is the
first public, multimodal, whole-brain video scorer.** Which is
exactly why Nucleus's thesis is defensible: the commercial
incumbents are all predicting *proxies* of neural activity, while
Nucleus is predicting *actual* neural activity (via TRIBE v2 or its
replacement) and then mapping that to behavior.

## What this means for Nucleus

Three implications.

### 1. There's no off-the-shelf commercial-clean replacement

If Nucleus can't use TRIBE v2 commercially (license risk), there's
nothing to swap in. Every commercial alternative is a behavioral
proxy predictor, which is a different product. Nucleus would have
to **build** the clean alternative, not **buy** it.

### 2. V-JEPA 2 is the right backbone for the in-house model

TRIBE v2's three backbones are all commercially licensed at the
backbone level:

- **V-JEPA 2** — Apache 2.0 (Meta, Assran et al. 2025)
- **Wav2Vec-BERT 2.0** — Apache-ish (Meta)
- **LLaMA 3.2** — Llama community license (permissible for most
  deployers)

Freezing these backbones and training a new prediction head from
scratch on permissive data is the architectural path for the
fallback analyzer. See the [fallback path](fallback-path.md) page.

### 3. The benchmark suite is the strategic asset

The academic field has a clear evaluation methodology (Brain-Score,
Algonauts, noise-normalized Pearson r per region). Nucleus
competes by:

1. **Matching TRIBE v2 on Algonauts benchmarks** with a commercially-
   clean model
2. **Extending the benchmark to UGC** (the UGC-Brain-Score project
   in the research roadmap)
3. **Linking neural predictions to in-market behavioral outcomes**
   that nobody else has data for

The next pages cover each of those in detail:
[benchmarks](benchmarks.md), [datasets](datasets.md),
[evaluation methodology](evaluation-methodology.md), and
[research roadmap](research-roadmap.md).
