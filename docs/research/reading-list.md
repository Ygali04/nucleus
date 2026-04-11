# Reading List

An interactive reading list for deep study of the fields Nucleus
sits on top of — **computational neuroscience**, **consumer
neuroscience / neuroforecasting**, **generative ML**, and the
**benchmark methodology** that connects them.

## How to use this page

Every paper below has a **clickable checkbox** next to it. Check
it off as you read. Your progress is stored in your browser's
local storage, so it persists across visits as long as you use
the same browser.

<div class="reading-list-progress-card">
  <div class="label">
    <span>Reading progress</span>
    <span id="reading-list-progress">0 / 0 read (0%)</span>
  </div>
  <div class="bar-track">
    <div class="bar-fill" id="reading-list-bar"></div>
  </div>
</div>

### The tier system

- <span class="tier-badge tier-1">Tier 1</span> **Core** — the
  papers directly cited in the Nucleus docs and the Claude chat.
  If you read nothing else, read these. ~15 papers.
- <span class="tier-badge tier-2">Tier 2</span> **Foundational
  background** — papers that make Tier 1 legible. Textbook-style
  anchors.
- <span class="tier-badge tier-3">Tier 3</span> **Frontier &
  adjacent** — deeper on specific angles: decoder side,
  benchmark methodology, ad measurement.
- <span class="tier-badge tier-4">Tier 4</span> **Practical
  engineering** — ML infrastructure, RLHF, video generation,
  saliency prediction.
- <span class="tier-badge tier-5">Tier 5</span> **Datasets &
  references** — read when you need them, not cover-to-cover.

### Difficulty legend

- 🟢 — approachable with a CS / ML background
- 🟡 — requires some neuroscience familiarity
- 🔴 — heavy methodology, only worth it if you're building
  something specific against it

---

## Tier 1 — The 15 papers you have to read

### Brain encoders for naturalistic video

- [ ] 🟡 **d'Ascoli, Rapin, Benchetrit, Brooks et al. (2025).**
  *TRIBE: Trimodal Brain Encoder for whole-brain fMRI response
  prediction.* Meta FAIR. **arXiv:2507.22229.** —
  The Algonauts 2025 winning paper. Reproducible numbers
  (in-distribution r = 0.3195, OOD r = 0.2604 on *Pulp Fiction*).
  This is the version with all the validation detail. Free on
  arXiv.

- [ ] 🟡 **d'Ascoli, Banville, Rapin et al. (2026).** *A
  Foundation Model of Vision, Audition, and Language for
  In-Silico Neuroscience* (TRIBE v2). Meta FAIR. HuggingFace:
  `facebook/tribev2`. GitHub: `facebookresearch/tribev2`. —
  The 2026 release that scaled v1 from 4 subjects / 80 h to
  ~720 subjects / ~1,115 h. The model Nucleus currently depends
  on.

- [ ] 🟢 **Assran, Duval, Misra, Bojanowski, Vincent, LeCun,
  Ballas et al. (2025).** *V-JEPA 2: Self-Supervised Video Models
  Enable Understanding, Prediction and Planning.* Meta FAIR.
  **arXiv:2506.09985.** —
  The video backbone inside TRIBE v2 and the basis for the
  `AttentionProxyAnalyzer` fallback. Understand V-JEPA 2's
  joint-embedding predictive objective.

- [ ] 🟢 **Scotti, Tripathy, Torrico, Kneeland, Chen, Narang et
  al. (2024).** *MindEye2: Shared-Subject Models Enable fMRI-
  To-Image With 1 Hour of Data.* ICML 2024. **arXiv:2403.11207.** —
  The decoder side. Shows how much stimulus information is
  recoverable from cortex and introduces the shared-subject
  latent — directly relevant to Nucleus's small-panel collection
  strategy.

- [ ] 🟢 **Scotti, Banerjee, Goode, Shabalin et al. (2023).**
  *Reconstructing the Mind's Eye: fMRI-to-Image with Contrastive
  Learning and Diffusion Priors.* **arXiv:2305.18274.** —
  The MindEye predecessor. Read for the CLIP-to-fMRI alignment
  technique.

- [ ] 🟢 **Scotti et al. (2025).** *Insights from the Algonauts
  2025 Winners.* **arXiv:2508.10784.** —
  The post-mortem. Read after d'Ascoli 2025. Headline finding:
  architectural novelty didn't decide the competition; ensembling
  + multimodal dropout did. Critical methodological reading.

### The neuroforecasting literature

- [ ] 🟢 **Knutson, Katovich & Suri (2014).** *Inferring affect
  from fMRI data.* *Trends in Cognitive Sciences* 18(8):
  422–428. **DOI: 10.1016/j.tics.2014.04.006.** —
  The Affect–Integration–Motivation (AIM) framework. The
  theoretical spine of every neuroforecasting paper that follows.
  Start here.

- [ ] 🟢 **Tong, Acikalin, Genevsky, Shiv & Knutson (2020).**
  *Brain activity forecasts video engagement in an internet
  attention market.* *PNAS* 117(12): 6936–6941.
  **DOI: 10.1073/pnas.1905178117.** —
  The direct scientific basis for Nucleus's hook score. NAcc +
  AIns at video onset forecasts YouTube view frequency. Free on
  PMC.

- [ ] 🟢 **Falk, Berkman & Lieberman (2012).** *From neural
  responses to population behavior: Neural focus group predicts
  population-level media effects.* *Psychological Science*
  23(5): 439–445. **DOI: 10.1177/0956797611434964.** —
  The foundational neuroforecasting paper. 31 smokers' mPFC
  response predicted real 1-800-QUIT-NOW call volume nationally.
  If you don't believe small-sample → population-level
  forecasting is real, read this first.

- [ ] 🟢 **Genevsky & Knutson (2015).** *Neural affective
  mechanisms predict market-level microlending.* *Psychological
  Science* 26(9): 1411–1422.
  **DOI: 10.1177/0956797615588467.** —
  30 lab subjects' brain signal predicted Kiva microloan
  outcomes across the entire internet. The result that made
  neuroforecasting credible commercially.

- [ ] 🟡 **Genevsky, Yoon & Knutson (2017).** *When Brain Beats
  Behavior: Neuroforecasting Crowdfunding Outcomes.* *Journal of
  Neuroscience* 37(36): 8625–8634.
  **DOI: 10.1523/JNEUROSCI.1633-16.2017.** —
  "Only NAcc (not mPFC, not self-report) generalized." The
  "early-affect generalizes, late-integration doesn't" principle.
  Single most important empirical paper for Nucleus's reward
  weighting.

- [ ] 🟡 **Scholz, Baek, O'Donnell, Kim, Cappella & Falk (2017).**
  *A neural model of valuation and information virality.*
  *PNAS* 114(11): 2881–2886. **DOI: 10.1073/pnas.1615259114.** —
  mPFC value signal predicted 117,611 real NYT article shares.
  The scientific basis for using mPFC as the "will this be
  shared" substrate.

- [ ] 🟡 **Chan, Boksem, Venkatraman, Dietvorst, Scholz, Vo,
  Falk & Smidts (2024).** *Neural signals of video advertisement
  liking: Insights into psychological processes and their
  temporal dynamics.* *Journal of Marketing Research.*
  **DOI: 10.1177/00222437231194319.** —
  The most ad-specific paper on the list. 113 subjects × 85 ads.
  First-3-second emotion + memory neural signatures are the
  strongest predictors of ad liking. Directly relevant to
  Nucleus's hook-scoring rationale. Paywalled via SAGE.

### Benchmark & methodology

- [ ] 🟢 **Schrimpf, Kubilius, Hong et al. (2020).** *Integrative
  benchmarking to advance neurally mechanistic models of human
  intelligence.* *Neuron* 108(3): 413–423.
  **DOI: 10.1016/j.neuron.2020.07.040.** —
  The Brain-Score platform paper. Read this before designing
  the UGC-Brain-Score benchmark — it's the methodological
  template.

- [ ] 🟢 **Kubilius, Schrimpf, Kar, Rajalingham et al. (2019).**
  *Brain-Like Object Recognition with High-Performing Shallow
  Recurrent ANNs* (CORnet-S). NeurIPS 2019. —
  The simplest brain-plausible vision network with strong
  Brain-Score results. Read if you're considering a
  commercially-clean lightweight scorer.

---

## Tier 2 — Foundational background

### Naturalistic fMRI methodology

- [ ] 🟡 **Hasson, Nir, Levy, Fuhrmann & Malach (2004).**
  *Intersubject synchronization of cortical activity during
  natural vision.* *Science* 303: 1634–1640.
  **DOI: 10.1126/science.1089506.** —
  The paper that launched the "watching movies in a scanner"
  field. Shows that naturalistic stimuli produce reliable
  cross-subject brain activity. Foundational.

- [ ] 🟡 **Huth, Nishimoto, Vu & Gallant (2012).** *A continuous
  semantic space describes the representation of thousands of
  objects and actions in the human brain.* *Neuron* 76(6):
  1210–1224. **DOI: 10.1016/j.neuron.2012.10.014.** —
  The Gallant lab's landmark. Natural movies + voxel-by-voxel
  semantic tuning. Methodological ancestor of TRIBE v2.

- [ ] 🟡 **Nishimoto, Vu, Naselaris, Benjamini, Yu & Gallant
  (2011).** *Reconstructing visual experiences from brain
  activity evoked by natural movies.* *Current Biology* 21(19):
  1641–1646. **DOI: 10.1016/j.cub.2011.08.031.** —
  The famous "reconstructing video from brain activity" paper.
  Read for the encoder-decoder duality that MindEye 2 later
  perfects.

- [ ] 🟢 **Van Essen, Ugurbil, Auerbach et al. (2013).** *The
  WU-Minn Human Connectome Project: An overview.* *NeuroImage*
  80: 62–79. **DOI: 10.1016/j.neuroimage.2013.05.041.** —
  Background on HCP — read if you want to use the HCP 7T
  movie-watching data.

### fMRI and aesthetic / memory / attention regions

- [ ] 🟢 **Vessel, Starr & Rubin (2012).** *The brain on art:
  intense aesthetic experience activates the default mode
  network.* *Frontiers in Human Neuroscience* 6:66.
  **DOI: 10.3389/fnhum.2012.00066.** —
  The foundational aesthetic-neural paper. mPFC and DMN
  activate during "being moved" experiences. Open access.

- [ ] 🟡 **Vessel, Isik, Belfi, Stahl & Starr (2019).** *The
  default-mode network represents aesthetic appeal that
  generalizes across visual domains.* *PNAS* 116(38):
  19155–19160. **DOI: 10.1073/pnas.1902650116.** —
  The follow-up. Aesthetic signal is domain-general — same
  region codes beauty for landscapes, architecture, artwork. A
  single aesthetic channel works for any visual.

- [ ] 🟡 **Kell, Yamins, Shook, Norman-Haignere & McDermott
  (2018).** *A Task-Optimized Neural Network Replicates Human
  Auditory Behavior, Predicts Brain Responses, and Reveals a
  Cortical Processing Hierarchy.* *Neuron* 98(3): 630–644.
  **DOI: 10.1016/j.neuron.2018.03.044.** —
  The auditory cortex equivalent of CORnet. Gold-standard
  reference for voice-over-only scoring.

- [ ] 🟡 **Berns & Moore (2012).** *A neural predictor of
  cultural popularity.* *Journal of Consumer Psychology* 22(1):
  154–160. **DOI: 10.1016/j.jcps.2011.05.001.** —
  27 adolescents' NAcc response to unknown songs predicted 3
  years of future album sales. The "brain beats behavior" angle
  applied to music.

- [ ] 🟡 **Kühn, Strelow & Gallinat (2016).** *Multiple "buy
  buttons" in the brain: Forecasting chocolate sales at
  point-of-sale based on functional brain activation using
  fMRI.* *NeuroImage* 136: 122–128.
  **DOI: 10.1016/j.neuroimage.2016.05.021.** —
  18-subject lab fMRI forecast real chocolate sales across
  63,617 shoppers. Hard proof lab neural signal scales to real
  retail outcomes.

- [ ] 🟡 **Genevsky, Tong, Knutson et al. (2025).**
  *Neuroforecasting reveals generalizable components of choice.*
  *PNAS Nexus* 4(2): pgaf029.
  **DOI: 10.1093/pnasnexus/pgaf029.** —
  The most recent neuroforecasting paper. Confirms NAcc
  ICC ≈ 0.41 across subjects while mPFC is not reliable at
  population scale. Open access.

- [ ] 🟢 **Knutson & Genevsky (2018).** *Neuroforecasting
  Aggregate Choice.* *Current Directions in Psychological
  Science* 27(2): 110–115.
  **DOI: 10.1177/0963721417737877.** —
  Short overview of the entire neuroforecasting paradigm. The
  "what's happened since AIM" update.

### Memory encoding and attention

- [ ] 🟡 **Hasson, Chen & Honey (2015).** *Hierarchical process
  memory: memory as an integral component of information
  processing.* *Trends in Cognitive Sciences* 19(6): 304–313.
  **DOI: 10.1016/j.tics.2015.04.006.** —
  How the brain accumulates and encodes narrative over time.
  Relevant to Nucleus's memory-encoding metric.

- [ ] 🟡 **Chen, Honey, Simony, Arcaro, Norman & Hasson (2017).**
  *Shared memories reveal shared structure in neural activity
  across individuals.* *Nature Neuroscience* 20: 115–125.
  **DOI: 10.1038/nn.4450.** —
  The Sherlock fMRI paper. Event segmentation and memory
  encoding in naturalistic viewing.

- [ ] 🟡 **Corbetta & Shulman (2002).** *Control of goal-directed
  and stimulus-driven attention in the brain.* *Nature Reviews
  Neuroscience* 3: 201–215. **DOI: 10.1038/nrn755.** —
  The dorsal/ventral attention network paper that defined how
  the field thinks about attention.

---

## Tier 3 — Frontier and adjacent

### Algonauts and short-clip encoding

- [ ] 🟡 **Allen, St-Yves, Wu et al. (2022).** *A massive 7T
  fMRI dataset to bridge cognitive neuroscience and artificial
  intelligence* (NSD). *Nature Neuroscience* 25: 116–126.
  **DOI: 10.1038/s41593-021-00962-x.** —
  The NSD paper. Largest fMRI-image dataset, basis for
  Algonauts 2023 and MindEye 2. Foundational for image-side work.

- [ ] 🟡 **Hanke, Baumgartner, Ibe et al. (2014).** *A
  high-resolution 7-Tesla fMRI dataset from complex natural
  stimulation with an audio movie* (StudyForrest). *Scientific
  Data* 1: 140003. **DOI: 10.1038/sdata.2014.3.** —
  Foundational for long-form naturalistic encoding.

- [ ] 🟡 **Hebart, Contier, Teichmann et al. (2023).**
  *THINGS-data: a multimodal collection of large-scale datasets
  for investigating object representations in human brain and
  behavior.* *eLife* 12: e82580. **DOI: 10.7554/eLife.82580.** —
  THINGS-fMRI + THINGS-EEG + THINGS-MEG. Useful if you want an
  object-level channel in Nucleus.

- [ ] 🟡 **Chang, Pyles, Marcus et al. (2019).** *BOLD5000, a
  public fMRI dataset while viewing 5000 visual images.*
  *Scientific Data* 6: 49.
  **DOI: 10.1038/s41597-019-0052-3.** —
  An earlier image-viewing dataset. Less used than NSD but good
  for cross-dataset comparisons.

### Image decoding (MindEye lineage)

- [ ] 🟢 **Takagi & Nishimoto (2023).** *High-resolution image
  reconstruction with latent diffusion models from human brain
  activity.* CVPR 2023. —
  The image-decoding-via-diffusion paper that inspired a lot of
  MindEye-era work.

- [ ] 🟡 **Fu, Tamir, Sundaram et al. (2023).** *DreamSim:
  Learning New Dimensions of Human Visual Similarity using
  Synthetic Data.* NeurIPS 2023. **arXiv:2306.09344.** —
  The perceptual similarity metric Nucleus uses as a diversity
  guard. Behavioral, not neural, but required for any generative
  loop.

### EEG-based attention and advertising

- [ ] 🟡 **Boksem & Smidts (2015).** *Brain Responses to Movie
  Trailers Predict Individual Preferences for Movies and Their
  Population-Wide Commercial Success.* *Journal of Marketing
  Research* 52(4): 482–492.
  **DOI: 10.1509/jmr.13.0572.** —
  The Erasmus team's canonical EEG-based ad-forecasting paper.
  Required reading for the EEG side of what Nucleus might use.

- [ ] 🟡 **Venkatraman, Dimoka, Pavlou et al. (2015).**
  *Predicting Advertising Success Beyond Traditional Measures:
  New Insights from Neurophysiological Methods and Market
  Response Modeling.* *JMR* 52(4): 436–452.
  **DOI: 10.1509/jmr.13.0593.** —
  Canonical head-to-head study comparing fMRI, EEG,
  eye-tracking, biometrics against ad-success prediction.

- [ ] 🟡 **Vecchiato, Astolfi, De Vico Fallani et al. (2011).**
  *On the use of EEG or MEG brain imaging tools in
  neuromarketing research.* *Computational Intelligence and
  Neuroscience* 2011: 643489. **DOI: 10.1155/2011/643489.** —
  A good EEG-based ad research overview from the Italian
  neuromarketing school.

### Computational models of vision and the ventral stream

- [ ] 🟡 **Yamins, Hong, Cadieu, Solomon, Seibert & DiCarlo
  (2014).** *Performance-optimized hierarchical models predict
  neural responses in higher visual cortex.* *PNAS* 111(23):
  8619–8624. **DOI: 10.1073/pnas.1403112111.** —
  The paper that first showed deep CNNs trained on ImageNet
  classification accurately predict IT cortex responses.
  Foundational for the entire Brain-Score ecosystem.

- [ ] 🟡 **Cadieu, Hong, Yamins et al. (2014).** *Deep neural
  networks rival the representation of primate IT cortex for
  core visual object recognition.* *PLoS Computational Biology*
  10(12): e1003963. **DOI: 10.1371/journal.pcbi.1003963.** —
  Companion to Yamins 2014. Free on PMC. Read together.

- [ ] 🟡 **Kriegeskorte (2015).** *Deep neural networks: a new
  framework for modeling biological vision and brain
  information processing.* *Annual Review of Vision Science* 1:
  417–446. **DOI: 10.1146/annurev-vision-082114-035447.** —
  The review paper that situates the whole "CNNs as brain
  models" line of research.

### Video foundation models and representation learning

- [ ] 🟢 **Assran, Duval, Misra et al. (2023).**
  *Self-Supervised Learning from Images with a Joint-Embedding
  Predictive Architecture* (I-JEPA). CVPR 2023.
  **arXiv:2301.08243.** —
  The predecessor to V-JEPA — read to understand the
  joint-embedding predictive objective from first principles.

- [ ] 🟢 **Oquab, Darcet, Moutakanni et al. (2023).** *DINOv2:
  Learning Robust Visual Features without Supervision.* Meta
  FAIR. **arXiv:2304.07193.** —
  Meta's other major self-supervised visual backbone. DINOv2 +
  video is a credible alternate backbone for the Nucleus
  fallback analyzer.

### Large-scale consumer neuroscience

- [ ] 🟡 **Ariely & Berns (2010).** *Neuromarketing: the hope
  and hype of neuroimaging in business.* *Nature Reviews
  Neuroscience* 11: 284–292. **DOI: 10.1038/nrn2795.** —
  The canonical "what is neuromarketing" review from a neutral
  academic perspective. Read for how the field was framed before
  the neuroforecasting wave.

- [ ] 🟡 **Plassmann, Venkatraman, Huettel & Yoon (2015).**
  *Consumer Neuroscience: Applications, Challenges, and Possible
  Solutions.* *JMR* 52(4): 427–435.
  **DOI: 10.1509/jmr.14.0048.** —
  The "what we've learned so far" synthesis from the
  consumer-neuroscience academic community.

- [ ] 🟡 **Karmarkar & Plassmann (2019).** *Consumer
  neuroscience: Past, present, and future.* *Organizational
  Research Methods* 22(1): 174–195.
  **DOI: 10.1177/1094428117730598.** —
  More recent overview. Good for understanding how the academic
  field thinks vs. how commercial neuromarketing firms position
  themselves.

### Atlas and parcellation references

- [ ] 🟡 **Glasser, Coalson, Robinson, Hacker et al. (2016).**
  *A multi-modal parcellation of human cerebral cortex.*
  *Nature* 536: 171–178. **DOI: 10.1038/nature18933.** —
  The HCP-MMP1 atlas paper. Read if you're going to work with
  cortical parcellations seriously.

- [ ] 🟡 **Schaefer, Kong, Gordon, Laumann et al. (2018).**
  *Local-Global Parcellation of the Human Cerebral Cortex from
  Intrinsic Functional Connectivity MRI.* *Cerebral Cortex*
  28(9): 3095–3114. **DOI: 10.1093/cercor/bhx179.** —
  The Schaefer atlas. The other common parcellation, used by
  TRIBE v1 in 1,000-parcel form. Open access.

---

## Tier 4 — Practical engineering

### RLHF and reward-model-driven generation

- [ ] 🟢 **Ouyang, Wu, Jiang et al. (2022).** *Training language
  models to follow instructions with human feedback*
  (InstructGPT). **arXiv:2203.02155.** —
  The original RLHF paper. The conceptual parallel to Nucleus's
  recursive loop — the reward model Nucleus uses is a neural
  predictor instead of a human-preference predictor, but the
  optimization structure is the same.

- [ ] 🟢 **Christiano, Leike, Brown et al. (2017).** *Deep
  Reinforcement Learning from Human Preferences.* NeurIPS 2017.
  **arXiv:1706.03741.** —
  The earlier, more general paper that InstructGPT is built on.
  Read first if RLHF is new to you.

- [ ] 🟢 **Rafailov, Sharma, Mitchell et al. (2023).** *Direct
  Preference Optimization: Your Language Model is Secretly a
  Reward Model* (DPO). NeurIPS 2023. **arXiv:2305.18290.** —
  Relevant if Nucleus ever wants to fine-tune its generator
  against the neural reward signal directly, without a full
  PPO-style RL loop.

- [ ] 🟢 **Schulman, Wolski, Dhariwal, Radford & Klimov (2017).**
  *Proximal Policy Optimization Algorithms.*
  **arXiv:1707.06347.** —
  PPO paper. Background for any RLHF-style work.

### Generative video and diffusion

- [ ] 🟢 **Ho, Jain & Abbeel (2020).** *Denoising Diffusion
  Probabilistic Models.* NeurIPS 2020. **arXiv:2006.11239.** —
  The paper that launched the modern diffusion era. Required
  background for any generative video work.

- [ ] 🟢 **Rombach, Blattmann, Lorenz, Esser & Ommer (2022).**
  *High-Resolution Image Synthesis with Latent Diffusion Models*
  (Stable Diffusion). CVPR 2022. **arXiv:2112.10752.** —
  The latent-diffusion paper. Foundational for understanding
  how modern video generators work.

- [ ] 🟢 **Blattmann, Dockhorn, Kulal et al. (2023).** *Stable
  Video Diffusion: Scaling Latent Video Diffusion Models to
  Large Datasets.* **arXiv:2311.15127.** —
  The open-weights video-diffusion paper from Stability AI.
  Worth reading for the data-scaling discussion.

- [ ] 🟢 **Brooks, Peebles, Holmes et al. (2024).** *Video
  generation models as world simulators* (Sora technical
  report). OpenAI. —
  Short but rich. Read for the architectural vocabulary even
  though Sora 2 is being discontinued.

- [ ] 🟢 **Genmo team (2024).** *Mochi 1: A Production-Ready
  Open-Weight Video Generation Model.* genmo.ai. —
  The cleanest open-weights video generator as of late 2025.

### Attention prediction and saliency

- [ ] 🟡 **Itti, Koch & Niebur (1998).** *A model of
  saliency-based visual attention for rapid scene analysis.*
  *IEEE PAMI* 20(11): 1254–1259. **DOI: 10.1109/34.730558.** —
  The canonical bottom-up attention / saliency model.
  Historical reference for the Attention Insight and Brainsight
  lineage.

- [ ] 🟢 **Kümmerer, Wallis & Bethge (2015).** *Deep Gaze I:
  Boosting Saliency Prediction with Feature Maps Trained on
  ImageNet.* ICLR 2015. **arXiv:1411.1045.** —
  The deep-saliency paper that's the direct ancestor of
  contemporary attention prediction APIs.

- [ ] 🟢 **Kümmerer, Wallis, Gatys & Bethge (2017).**
  *Understanding Low- and High-Level Contributions to Fixation
  Prediction* (DeepGaze II). ICCV 2017. —
  Better read than Deep Gaze I.

### Multi-modal foundation models

- [ ] 🟢 **Radford, Kim, Hallacy et al. (2021).** *Learning
  Transferable Visual Models From Natural Language Supervision*
  (CLIP). ICML 2021. **arXiv:2103.00020.** —
  Required background for understanding any multi-modal
  embedding work. The TRIBE fusion pattern is closer to CLIP
  than to any classical multi-modal encoder.

- [ ] 🟢 **Alayrac, Donahue, Luc et al. (2022).** *Flamingo: a
  Visual Language Model for Few-Shot Learning.* NeurIPS 2022.
  **arXiv:2204.14198.** —
  Multi-modal fusion at scale. Useful conceptual parallel to
  TRIBE's trimodal fusion transformer.

### Evaluation and benchmarking

- [ ] 🟢 **Heusel, Ramsauer, Unterthiner, Nessler & Hochreiter
  (2017).** *GANs Trained by a Two Time-Scale Update Rule
  Converge to a Local Nash Equilibrium* (FID). NeurIPS 2017. —
  The FID paper. Foundational for video/image quality
  evaluation. Still the dominant metric for generative video
  despite its flaws.

- [ ] 🟢 **Unterthiner, van Steenkiste, Kurach et al. (2018).**
  *Towards Accurate Generative Models of Video: A New Metric &
  Challenges* (FVD). **arXiv:1812.01717.** —
  The video-FID equivalent. Read for how the field currently
  measures video quality.

---

## Tier 5 — Datasets, tooling, and institutional references

Things to know about but not necessarily "read" cover-to-cover.

### Datasets (data papers, read when you need them)

- [ ] 🟢 **CNeuroMod / Courtois NeuroMod** — Bellec et al.,
  ongoing. github.com/courtois-neuromod. The TRIBE training base.

- [ ] 🟢 **Algonauts 2025 Challenge Data** — via
  algonautsproject.com. The dataset TRIBE v1 won on.

- [ ] 🟢 **Shafto, Tyler, Dixon et al. (2014).** *The Cambridge
  Centre for Ageing and Neuroscience (Cam-CAN) study protocol.*
  *BMC Neurology* 14: 204. —
  For aging baselines.

- [ ] 🟢 **Taylor, Williams, Cusack et al. (2017).** *The
  Cambridge Centre for Ageing and Neuroscience (Cam-CAN) data
  repository.* *NeuroImage* 144(Part B): 262–269. —
  Companion to the Cam-CAN protocol paper.

- [ ] 🟢 **Grootswagers, Zhou, Robinson, Hebart, Carlson (2022).**
  *Human EEG recordings for 1,854 concepts presented in rapid
  serial visual presentation streams* (THINGS-EEG). *Scientific
  Data* 9: 3. **DOI: 10.1038/s41597-021-01102-7.** —
  The THINGS-EEG companion.

### Benchmarks (no "read," just be aware)

- [ ] 🟢 **Brain-Score.org** — the reference benchmark platform.
  Browse the leaderboard; don't try to read every submission
  paper.

- [ ] 🟢 **Algonauts Project** — algonautsproject.com. Annual
  challenge papers.

- [ ] 🟢 **MTEB** (Massive Text Embedding Benchmark) — for
  evaluating the embedding models Nucleus uses for Brand KB
  retrieval.

### Institutional context (no need to read deeply)

- [ ] 🟢 **MSI (Marketing Science Institute)** — `msi.org` —
  where marketing-science research priorities are set.

- [ ] 🟢 **Society for Neuroeconomics** — `neuroeconomics.org` —
  where Knutson, Genevsky, Smidts, Falk all present annually.

- [ ] 🟢 **Cognitive Computational Neuroscience (CCN)** —
  `ccneuro.org` — where the Algonauts community meets.

---

## Suggested 6–8 week reading order

A structured path through roughly 35 of the papers above. By the
end you can walk into a meeting with Brian Knutson or Emily Falk
and hold the conversation.

### Week 1 — Orient yourself in the field

- [ ] Knutson, Katovich & Suri (2014) — AIM framework
- [ ] Falk, Berkman & Lieberman (2012) — neural focus group
- [ ] Ariely & Berns (2010) — neuromarketing overview
- [ ] Plassmann, Venkatraman, Huettel & Yoon (2015) — consumer
  neuroscience overview

By the end of Week 1 you have the vocabulary for the rest.

### Week 2 — The neuroforecasting core

- [ ] Tong, Acikalin, Genevsky, Shiv & Knutson (2020) — YouTube
- [ ] Genevsky & Knutson (2015) — Kiva microloans
- [ ] Genevsky, Yoon & Knutson (2017) — Kickstarter
- [ ] Scholz, Baek, O'Donnell et al. (2017) — NYT virality
- [ ] Berns & Moore (2012) — music sales
- [ ] Kühn, Strelow & Gallinat (2016) — chocolate sales

By the end of Week 2 you understand why the reward model is
weighted the way it is.

### Week 3 — Ad-specific neuroforecasting

- [ ] Chan, Boksem, Venkatraman et al. (2024) — ad liking
- [ ] Boksem & Smidts (2015) — movie trailers
- [ ] Venkatraman, Dimoka, Pavlou et al. (2015) — method
  comparison

By the end of Week 3 you understand what the commercial
neuromarketing literature has and hasn't proven.

### Week 4 — Naturalistic fMRI and the encoder side

- [ ] Hasson, Nir, Levy et al. (2004) — intersubject sync
- [ ] Huth, Nishimoto, Vu & Gallant (2012) — semantic space
- [ ] Chen, Honey, Simony et al. (2017) — Sherlock fMRI
- [ ] Nishimoto, Vu, Naselaris et al. (2011) — video
  reconstruction

By the end of Week 4 you understand how the field measures
brain responses to video.

### Week 5 — The TRIBE line

- [ ] Yamins, Hong, Cadieu et al. (2014) — ancestor of
  brain-encoding CNNs
- [ ] Schrimpf, Kubilius, Hong et al. (2020) — Brain-Score
- [ ] Kubilius et al. (2019) — CORnet-S
- [ ] Assran et al. (2025) — V-JEPA 2
- [ ] d'Ascoli, Rapin et al. (2025) — TRIBE v1
- [ ] d'Ascoli, Banville et al. (2026) — TRIBE v2
- [ ] Scotti et al. (2025) — Algonauts 2025 post-mortem

By the end of Week 5 you can reproduce a conversation about
TRIBE v2 with the people who built it.

### Week 6 — The decoder side and MindEye

- [ ] Scotti et al. (2023) — MindEye
- [ ] Scotti et al. (2024) — MindEye 2

By the end of Week 6 you understand why MindEye 2's
shared-subject latent technique is important for small-panel
Nucleus work.

### Week 7 — Generative ML for the loop

- [ ] Christiano et al. (2017) — RLHF foundation
- [ ] Ouyang et al. (2022) — InstructGPT
- [ ] Rafailov et al. (2023) — DPO
- [ ] Ho, Jain & Abbeel (2020) — DDPM
- [ ] Rombach et al. (2022) — latent diffusion / Stable
  Diffusion

By the end of Week 7 you can defend the architectural choices
in the Nucleus loop against an ML audience.

### Week 8 — Aesthetic and attention side channels

- [ ] Vessel, Starr & Rubin (2012) — aesthetic DMN
- [ ] Vessel, Isik, Belfi et al. (2019) — aesthetic
  generalization
- [ ] Kell, Yamins, Shook et al. (2018) — auditory cortex
- [ ] Kümmerer, Wallis & Bethge (2015) — deep saliency

By the end of Week 8 you can defend every one of the 18 metrics
in the Nucleus scoring taxonomy.

---

## If you only have a weekend

Read these four in order:

- [ ] **Knutson, Katovich & Suri (2014)** — AIM framework
- [ ] **Tong, Acikalin, Genevsky, Shiv & Knutson (2020)** —
  YouTube forecasting
- [ ] **d'Ascoli, Rapin et al. (2025)** — TRIBE v1
- [ ] **Scotti et al. (2025)** — Algonauts 2025 post-mortem

Those four will give you 80% of the conceptual groundwork.
Everything else is depth.

---

## How to actually read these

Practical tips from someone who has read most of them:

1. **For the fMRI papers (🟡 / 🔴):** skim the figures and tables
   first, then read the methods, then the discussion. Skip the
   detailed preprocessing sections until you need them.
2. **For the ML papers (🟢):** read the abstract, introduction,
   and experimental results. Skim the appendix.
3. **For the review papers:** read front-to-back. These are the
   ones worth highlighting.
4. **Keep a running glossary.** fMRI and ML papers use
   overlapping-but-incompatible vocabularies. Write down what
   BOLD, HRF, ICC, Pearson r, parcellation, voxel, vertex, and
   ROI mean in your own words after the first three fMRI papers
   and you'll save yourself hours of re-learning.
5. **Use Connected Papers.** `connectedpapers.com` builds
   citation-graph visualizations of any paper. Extremely useful
   for finding the "next" paper.
6. **Use Semantic Scholar.** Better search and citation tracking
   than Google Scholar for the cognitive-neuroscience literature.

## Where to find things

| Paper type | Where to find |
|---|---|
| arXiv preprints | `arxiv.org` — free |
| NeurIPS / ICML / CVPR | paper sites, often free PDFs |
| *Neuron* / *NeuroImage* / *Nature Neuro* | PMC (National Library of Medicine) — often free after embargo |
| *PNAS* / *PNAS Nexus* | pnas.org — often free |
| *Journal of Marketing Research* | SAGE — paywalled; library or ResearchGate |
| *Nature* / *Science* | often paywalled; email the authors (they almost always send PDFs) |
| *eLife* / *Frontiers* | open access, free |
| Meta FAIR papers | meta.com/research + HuggingFace model cards |

**Many of these authors will send you PDFs if you email them.**
Academics love it when an industry person cites their work.
Brian Knutson, Emily Falk, Ed Vessel, Ale Smidts — all of them
reply to thoughtful emails. If you're reading their papers and
want to build a product on top of them, it's worth saying hello.

## Progress tracking

The checkboxes on this page save your progress in your browser's
local storage. Your reading progress is visible in the counter at
the top and persists across visits, as long as you use the same
browser on the same device.

If you want to reset your progress, open your browser's
developer console on this page and run:

```javascript
Object.keys(localStorage)
  .filter(k => k.startsWith('nucleus:tasklist:'))
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

## Adding your own papers

This reading list is a snapshot. As the field moves, new papers
will be worth adding. To suggest a paper:

1. It should be either directly cited by a Tier 1 paper or
   published in a venue the Tier 1 authors respect (NeurIPS,
   *Nature*, *PNAS*, *Neuron*, *JMR*, *JCR*, *ICML*, CCN,
   Society for Neuroeconomics annual meeting)
2. It should meaningfully extend one of the tiers — not a
   duplicate of something already here
3. Open a PR against `docs/research/reading-list.md` with the
   new entry and a one-sentence "why it matters"

The list will be revisited quarterly as new TRIBE releases,
MindEye versions, and Algonauts challenges come out.
