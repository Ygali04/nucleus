# The Honest Gaps

This is the page where Nucleus is honest about what its scoring
layer can't do. Every bullet is a known limitation of the current
state of the art. Most of them are why the [research roadmap](research-roadmap.md)
exists.

## Where TRIBE v2 likely falls short for short-form UGC

Seven limitations, in rough order of severity for Nucleus's use
case.

### 1. Short-duration dynamics

TRIBE v2's temporal target is BOLD, which smooths everything below
~4 seconds. A 9-second UGC ad has **two effective fMRI time
points**. Most of what matters — the hook cut, the face reveal,
the product shot — lives inside a single BOLD sample.

TRIBE can tell you "this ad evoked stronger NAcc than that one,"
but it cannot tell you "the spike happened at 0.4 s vs 1.1 s."

**This is biology, not a bug.** Any neural model trained on fMRI
inherits the same limit. EEG-based models (which have millisecond
resolution) get around it but at the cost of spatial resolution.
Nucleus's **N-Data-4** project proposes a 100-subject EEG study
specifically to cover this blind spot.

### 2. Vertical framing

All TRIBE training stimuli were horizontal film / TV. There is no
published evaluation of whether cortical encoders care about
aspect ratio, but the V-JEPA 2 backbone itself was trained on
mostly horizontal internet video, so the features are likely
under-calibrated on 9:16 content.

**Mitigation:** Fine-tune the prediction head on vertical UGC
(Project N-Data-1). Expected improvement: unknown, but non-zero
because the backbone features are generic enough to transfer.

### 3. Direct-address selfie framing

UGC creators look directly into camera. This engages social / face-
processing regions (FFA, STS) in a specific way that is under-
represented in naturalistic film training data, where first-person
direct address is rare.

**Mitigation:** Same — fine-tune on direct-address UGC data. FFA /
STS are well-known regions with strong single-subject reliability,
so even small fine-tuning datasets should help here.

### 4. Ad-specific semantic structure

Hooks, lower-thirds, CTAs, product reveals, price overlays — none
of these are present in the training distribution. The fusion
transformer may generalize, but cannot be assumed to.

The strongest case for where the gap bites: a TikTok ad that opens
with "POV: you're a busy parent" (a pattern specific to ad content)
activates a combination of theory-of-mind (TPJ) + personal
relevance (mPFC) regions in a way the model was never trained to
predict.

**Mitigation:** Fine-tuning on UGC data will partially help.
Bigger wins come from adding **ad-specific supervision signals**:
training the head to predict not just BOLD but also behavioral
engagement scores on the same ad.

### 5. Scanner context ecological validity

Subjects in CNeuroMod are **supine, stationary, head-fixed,
socially isolated, and know they are being scanned for
neuroscience.** UGC viewers are **vertical, thumb-scrolling,
distracted, and in ambient social context.**

The ecological validity gap here is enormous and largely
unaddressed in the academic literature. No cortical encoder has
been validated against "viewing in the wild" conditions.

**Partial mitigation:** The **N-Data-4** EEG study can be run in
more naturalistic conditions (subjects holding a phone, not in a
scanner). This is closer to real viewing but still not
naturalistic.

**Honest answer:** The ecological validity gap is the biggest
unresolved scientific question in the whole Nucleus thesis. It's
also why the commercial neuroforecasting literature (Tong 2020,
Genevsky 2015, etc.) is so important — those studies at least
measured lab brain signals against real-world outcomes, which
sidesteps the scanner-context worry.

### 6. Average-brain prediction

No ability to segment by demographic. TRIBE v2 predicts the
"average" subject response. Cannot be asked "how does this ad
resonate with 24-year-old women in APAC."

**Mitigation paths:**

| Path | Feasibility | Cost |
|---|---|---|
| Collect fMRI from a representative cohort | Low — expensive, slow | Millions of dollars per cohort |
| Add behavioral conditioning after the neural prediction | Medium — the neuroforecasting layer does this | Included in N-Data-2 |
| Fine-tune a head on neural data from a representative cohort | Medium — requires smaller cohort data | $200–500k per cohort |
| Use MindEye 2-style shared-subject latent | Medium — requires at least a minimal cohort scan | $100–200k for 20-subject scan |

The [research roadmap](research-roadmap.md) treats cohort
personalization as a **Year 2+ project**.

### 7. V1 gap on primary visual cortex

In TRIBE v1, the text / audio stream **hurt** prediction in V1
(the earliest visual cortex). This is a known failure mode — the
model's fusion transformer injects non-visual information into a
region that should only track low-level visual features.

**Unknown for v2:** The v2 paper may have fixed this, but the
public numbers don't confirm.

**Mitigation:** For V1 specifically, Nucleus could use a vision-
only baseline (CORnet-S or V-JEPA 2 directly) instead of TRIBE's
multimodal prediction.

## Is there a UGC-specific dataset for fine-tuning?

**No, not publicly.** The closest is the Algonauts 2021 BOLD
Moments Dataset (3 s naturalistic clips), and it has the wrong
content — generic events, not TikTok hooks.

Commercial players (Neurons, Realeyes) have ad-specific behavioral
data but no neural data. Nucleus either **commissions its own
fMRI** (expensive, slow) or **builds a behavioral proxy at scale**
(cheap, fast, less defensible scientifically).

The [research roadmap](research-roadmap.md) picks both: collect
fMRI on a small panel (**N-Data-1**) AND collect behavioral data
on a larger panel (**N-Data-2**) AND build a proxy model on the
behavioral data that the fMRI data validates.

## What a Nucleus-specific evaluation suite would look like

The ingredients:

1. **A panel of 200–500 real UGC ads** with known CTR, view-
   through, conversion, and brand-lift from paid-media runs
2. **A 20–30 subject fMRI session** at 3T, watching those ads in
   naturalistic order with interleaved fixations, following the
   Chan / Boksem / Smidts 2024 JMR protocol. Budget ~$200k total.
3. **A concurrent 200–500 subject behavioral panel** (eye-
   tracking + webcam + self-report) on the same ad set. Budget
   ~$50k.
4. **An out-of-sample generative loop test:** take 50 NEW ads,
   score them with Nucleus's model, rank them, run them in paid
   media, and measure whether the top-decile by neural score
   outperforms the bottom-decile by behavioral KPI.

That fourth experiment is the bet-the-company validation of the
entire product thesis. If it works, Nucleus has publishable proof
that neural-scored generation beats baseline. If it doesn't, the
product thesis needs revision.

## Where academic ground truth breaks down

*"The Forrest Gump movie has nothing to do with TikTok scrolling"*
is not an exaggeration. The concrete gap:

| Dimension | StudyForrest / CNeuroMod | TikTok UGC |
|---|---|---|
| Duration | 120+ min | 9–30 s |
| Narrative arc | Full 3-act structure | Hook → payoff → CTA |
| Audio | Film score + Hollywood dialog | Voiceover + trending audio |
| Framing | Horizontal, cinematic | Vertical, selfie |
| Production value | Studio | Handheld |
| Viewer posture | Supine, scanner-immobilized | Thumb-scrolling |
| Social context | Isolated | In-feed, with comments |
| Ad intent | None | Purchase conversion |
| Viewer attention | Full | Seconds before next scroll |

**No paper in the encoding literature has quantified the accuracy
degradation along any of these axes.** It is an open research
question how much a movie-trained cortical encoder transfers to
short-form vertical commercial content, and Nucleus is probably
the first organization in position to measure it.

## The "it might not work" caveat

Honest reading: there is a non-trivial chance that the
distributional shift from long-form film to short-form vertical
UGC is severe enough that even a fine-tuned TRIBE v2 is only
marginally better than a behavioral proxy like Realeyes.

If that's the outcome:

1. **The product still works** — the neuroforecasting layer can
   map whatever neural signal is available to behavioral outcomes.
2. **The moat shifts** — from "we have the best neural scorer" to
   "we have the best loop over a competent scorer."
3. **The marketing story simplifies** — "we predict attention and
   iterate against it" is still a unique position.
4. **The research story stays valuable** — the paper quantifying
   the gap is publishable regardless of which direction it goes.

The honest research roadmap is **not** "TRIBE v2 will work if we
fine-tune it," it's **"we will measure how much TRIBE v2 degrades
and build the commercial path that makes Nucleus work
regardless."**

## What this page doesn't cover

- **The commercial license risk.** Covered on the
  [compliance license page](../compliance/license-tribe-v2.md).
- **The alternative model options.** Covered on the
  [alternative models page](alternative-models.md).
- **The specific experiments to close the gaps.** Covered on the
  [research roadmap](research-roadmap.md) and
  [internal experiments](internal-experiments.md) pages.
- **The fallback if TRIBE v2 is blocked.** Covered on the
  [fallback path](fallback-path.md) page.
