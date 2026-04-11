# Benchmark Datasets

The public dataset landscape for neural encoding from video is
small but well-structured. This page is the reference for every
dataset Nucleus either trains against, benchmarks on, or might
contribute to.

## Dataset summary

| Dataset | Modality | Subjects | Hours | Stimulus type | Public? | Citation |
|---|---|---|---|---|---|---|
| **Human Connectome Project 7T (movies)** | fMRI 7T | 184 | ~1 h each (~184 h) | Four movies of CC clips + Hollywood | Yes (ConnectomeDB) | Van Essen et al. 2013 |
| **StudyForrest / Forrest Gump fMRI** | fMRI 3T + 7T | 20 | ~2 h each | Audio-visual *Forrest Gump* | Yes (OpenNeuro, GIN) | Hanke et al. 2014 |
| **Sherlock fMRI** | fMRI 3T | 17 | ~50 min each | BBC *Sherlock* ep. 1 | Yes (Princeton DataSpace) | Chen et al. 2017 |
| **BOLD Moments Dataset (Algonauts 2021)** | fMRI 3T | 10 | ~1 h each | 1,102 × 3 s clips of everyday events | Yes | Lahner et al. |
| **NSD (Natural Scenes Dataset)** | fMRI 7T | 8 | 30–40 sessions, ~40+ h each | 9,000–10,000 color natural scenes per subject | Yes (AWS) | Allen et al. 2022 |
| **THINGS-fMRI** | fMRI 7T | 3 | 12 sessions each | 8,740 images × 720 concepts, 4.5 s each | Yes | Hebart et al. 2023 |
| **THINGS-EEG / THINGS-MEG** | EEG + MEG | 50+ | ~1–2 h | 22,248 images via RSVP | Yes | Grootswagers et al. 2022 |
| **CamCAN** | fMRI + MEG | ~700 (CC700 subset) | Varies | Hitchcock "Bang! You're Dead" + other tasks | Yes (DUA) | Shafto et al. 2014, Taylor et al. 2017 |
| **BOLD5000** | fMRI 3T | 4 | ~20 h each | ~5,000 images from SUN/COCO/ImageNet | Yes | Chang et al. 2019 |
| **CNeuroMod / Courtois NeuroMod** | fMRI 3T | 6 | Up to 500 h/subject target | *Friends* S1–6, 4 films, *Shinobi* game | Yes (DUA) | Bellec et al. (ongoing) |
| **CNeuroMod-THINGS** | fMRI 3T | 6 | Subset of above | THINGS images | Yes | CNeuroMod subset |
| **Algonauts 2025 Challenge Data** | fMRI 3T | 4 | ~80 h/subject | *Friends* + 4 films + held-out | Yes (Algonauts portal) | d'Ascoli et al. 2025 |
| **OpenNeuro** | Federated | 1000s across datasets | Varies | Varies | Yes | N/A |

## The datasets Nucleus uses

Not all of these are equally useful. The ones Nucleus actually
plans to train against or benchmark on:

### CNeuroMod (the TRIBE training base)

**Citation:** Bellec et al. (ongoing), github.com/courtois-neuromod

**Why it matters:** The training corpus for TRIBE v1 and a
significant portion of TRIBE v2. 6 subjects, scanned weekly for 5
years, target 500 h/subject. Subjects watch *Friends* seasons 1–6,
*The Bourne Supremacy*, *Hidden Figures*, *The Wolf of Wall
Street*, *Life*, *Movie10*, and play the *Shinobi III* video game.

This is the deepest per-subject dataset in naturalistic fMRI. The
fact that 80 hours per subject was enough to get TRIBE v1 to
r = 0.3195 on a held-out episode of the same show says a lot about
how much signal dense per-subject data provides.

**Nucleus use:** benchmark Nucleus's in-house fine-tuned model
against the CNeuroMod holdouts. Compare performance to TRIBE v1's
published numbers.

### NSD (Natural Scenes Dataset)

**Citation:** Allen, St-Yves, Wu et al. (2022). *A massive 7T fMRI
dataset to bridge cognitive neuroscience and artificial
intelligence.* Nature Neuroscience 25:116–126. DOI 10.1038/s41593-
021-00962-x.

**Why it matters:** The largest and most heavily-used fMRI-image
dataset in the world. 8 subjects × 30–40 sessions × 7T scanner.
~9,000–10,000 color natural scenes per subject, including shared
images across subjects for cross-subject analysis.

Powered MindEye 2 and the Algonauts 2023 challenge winners.

**Nucleus use:** NSD is image-only, not video. Relevant as a
training-data signal for image-level features (product shots, key
frames). The [research roadmap](research-roadmap.md) proposes a
multi-task fine-tuning setup where NSD contributes the image
channel.

### BOLD Moments Dataset (Algonauts 2021)

**Why it matters:** The closest academic precedent to
"short-clip brain encoding." 10 subjects, 1,102 clips at 3 seconds
each. Stimuli are generic naturalistic events — a dog running, a
man eating pizza, waves crashing — not UGC ads, but short enough
that the encoding task has the right shape.

Algonauts 2021 winners achieved peak Pearson r around 0.22
normalized on held-out clips. That's a useful ceiling to measure
against when Nucleus tests on its own short clips.

**Nucleus use:** benchmark short-clip encoding. Sanity-check that
Nucleus's fine-tuned model doesn't regress on the general
short-clip case.

### Algonauts 2025 Challenge Data

**Citation:** algonautsproject.com; d'Ascoli et al. 2025,
arXiv:2507.22229.

**Why it matters:** This is the dataset TRIBE v1 won on. 4 CNeuroMod
subjects, ~65 hours of training movies (subsets of CNeuroMod),
held-out test films including *Pulp Fiction*. 1,000-parcel targets.

**Nucleus use:** the canonical public benchmark for Nucleus's
in-house model. Run the Algonauts 2025 test suite against the
in-house model and report side-by-side with TRIBE v1's published
numbers.

### THINGS-fMRI

**Citation:** Hebart, Contier, Teichmann et al. (2023). *THINGS-
data, a multimodal collection of large-scale datasets for
investigating object representations in human brain and behavior.*
eLife 12:e82580.

**Why it matters:** 3 subjects × 8,740 images × 12 sessions at 7T,
covering 720 object concepts. Focused on object-selective cortex
(LOC, FFA, PPA). Companion datasets THINGS-EEG and THINGS-MEG cover
larger subject counts at lower spatial resolution.

**Nucleus use:** an optional **object-level channel** for scoring
specific product shots. If Nucleus wants to ask "does the product
reveal at t=5 s activate object-selective cortex as strongly as a
reference shot?", THINGS is the tuning corpus.

### HCP 7T Movie Watching

**Citation:** Van Essen, Ugurbil, Auerbach et al. (2013). *The
WU-Minn Human Connectome Project: An overview.* NeuroImage 80:62–79.

**Why it matters:** 184 subjects watching ~1 hour each of mixed CC
clips + Hollywood clips at 7T. The subject-count leader in
naturalistic viewing fMRI. Cross-subject encoding work largely
started here.

**Nucleus use:** cross-subject generalization tests. The 184-subject
panel is the best public dataset for "how well does your model
predict a subject it hasn't seen?"

## The critical gap

**Every public dataset has the wrong format for short-form UGC
ads.** The closest is the BOLD Moments Dataset — 3-second clips —
but the content is "a dog running," "a man eating pizza," "waves
crashing," not TikTok hooks with selfie framing, lower-thirds text,
and product CTAs.

**There is no publicly-released fMRI dataset of subjects watching
actual short-form vertical ads.** The commercial incumbents
(Neurons, Realeyes) have massive behavioral datasets on ads but no
brain data.

The gap between "what TRIBE v2 was trained on" and "what Nucleus is
being asked to score" is exactly the gap where new data collection
should happen. See the [research roadmap](research-roadmap.md) for
the projects that close this gap.

## The datasets Nucleus will build

Four new datasets are planned in the [research roadmap](research-roadmap.md):

| Dataset | Subjects | Hours | Stimulus | Timeline |
|---|---|---|---|---|
| **N-Data-1: Nucleus UGC-fMRI corpus** | 24 | ~50 h total | 200 short-form UGC ads, 5 DTC verticals | Phase 1, 3 months |
| **N-Data-2: Behavioral parallel panel** | 500 (remote) | N/A | Same 200 ads, eye-tracking + self-report + 24h recall | 4 weeks |
| **N-Data-3: In-market outcomes column** | Paid-media | N/A | Same 200 ads, run as real paid campaigns | 8–12 weeks |
| **N-Data-4: UGC-native EEG** | 100 | ~30 h total | 100 ads × 64-channel EEG | Phase 2, 6 weeks |

Total cost estimate: ~$2–4M, dominated by N-Data-3's media spend
(which can often be shared with a customer brand). Without N-Data-3,
the data collection for N-Data-1+2+4 is ~$250–300k, feasible within
the v1 timeline.

## Where data lives

| Source | What lives there |
|---|---|
| [OpenNeuro](https://openneuro.org) | Most public fMRI datasets in BIDS format |
| [HuggingFace](https://huggingface.co) | Model weights + increasingly datasets |
| [Zenodo](https://zenodo.org) | DOI-citable data releases |
| [ConnectomeDB](https://db.humanconnectome.org) | HCP data, requires free registration |
| [Algonauts portal](https://algonautsproject.com) | Challenge datasets |
| [CNeuroMod repo](https://github.com/courtois-neuromod) | CNeuroMod release notes + access |
| Princeton DataSpace | Sherlock fMRI |
| GIN | StudyForrest multimodal releases |

Nucleus's own datasets will release on OpenNeuro (for fMRI),
HuggingFace (for preprocessed features), and Zenodo (for behavioral
panel data), with academic-use licenses after a 6-month commercial
head start.

## Ethics and consent

Every public dataset in this section was collected under IRB-
approved protocols with informed consent. Nucleus's own datasets
will follow the same standard:

1. IRB approval from a partner academic institution (most likely
   Stanford or Penn via the lab partnerships)
2. Informed consent covering data release under the planned license
3. Right to withdraw with data deletion
4. Anonymization where feasible
5. Data use agreements for sensitive subsets

The [compliance GDPR page](../compliance/gdpr.md) covers the
tenant-data side. The dataset side is handled through the academic
IRB process, not through Nucleus's commercial compliance
infrastructure.
