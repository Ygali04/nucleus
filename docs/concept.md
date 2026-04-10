# Concept

## What Nucleus is

Nucleus is a **recursive neuromarketing video engine**. It takes a brand's
knowledge — documents, product copy, ICP definitions, Brand Kit assets,
existing recordings — and produces persona-targeted video variants across the
ICP × language × platform × archetype cross-product. Every variant is scored
by a neuro-predictive model, recursively edited against that score, and
delivered with a neural report and a GTM strategy guide.

The product collapses two things that have existed in parallel for years and
never been joined: **generative video**, which can produce 100 candidates at
the cost of 3 human videos, and **neuromarketing**, which can predict which
of those candidates will actually land before a dollar of paid media is
spent. Nucleus is the first system that uses the second as the reward
function of the first.

## What Nucleus is not

This matters as much as what it is. Nucleus is deliberately bounded:

- **Not a long-form video editor.** Nucleus does not replace a creator's
  script-first editing workflow. It consumes finished or raw source
  footage and fans out persona variants at volume.
- **Not a one-shot UGC generator.** Every other AI video tool in the market
  (HeyGen, Arcads, Creatify, Captions, Descript) is a single-pass generator
  with no quality signal beyond human review. Nucleus's distinguishing move
  is the closed loop, not the generation step itself.
- **Not a neuromarketing measurement service.** Nielsen Consumer
  Neuroscience, iMotions, Realeyes, Neurons Inc., and Attention Insight all
  sell post-hoc scoring of finished creative. Nucleus uses the same class of
  predictive signal but as a gradient inside generation, not as a measurement
  report on top of it.
- **Not a creator marketplace.** The product has no human creators in it.
  Every frame, every voice, every caption is generated from the brand's own
  knowledge base.
- **Not a generic SaaS.** Nucleus is designed to live inside an existing
  product surface as a capability, not as a standalone destination. The
  [integration](integration.md) page explains how the embed pattern works.

## The core insight

Two observations that together explain why Nucleus exists:

### 1. Generative UGC has a quality-variance problem

Tools like HeyGen, Arcads, and Creatify can produce 100 variants at ~1% the
unit cost of human UGC. Early adopters report AI-UGC engagement rates 3–5×
above human-made baselines on the same accounts. But **80 of those 100
variants are still mediocre**, and there is no scalable, non-human way to
know which two will perform before spending on paid media. Brand marketers
become the quality filter — which does not scale and does not improve.

### 2. Neural response predicts behavior better than self-report

Fifteen years of neuroforecasting research ([full citations](foundation.md#academic-spine))
have repeatedly shown that lab-scale neural response — from as few as 18–40
subjects — predicts **population-level** behavioral outcomes better than
self-report and often better than the participants' own behavioral ratings.
Specifically: nucleus accumbens activation in the first seconds of a video
forecasts YouTube view frequency, mPFC activation during article reading
forecasts 117,611 real NYT shares, and 18-subject fMRI forecasts chocolate
sales across 63,617 shoppers.

Until March 2026 the catch was that you had to recruit humans and put them
in scanners. **Meta FAIR's TRIBE v2** removed that catch: zero-shot
predictions of group-averaged neural response to unseen video with accuracy
that, in many cortical regions, beats an individual subject's own fMRI
recording.

### The product that falls out

When you put these two observations next to each other, the product
designs itself:

1. Use a generative pipeline to produce N candidate variants
2. Use a TRIBE v2-class model to score each candidate neurally
3. Feed the score as a reward signal to an editor agent that issues
   targeted edits on the underperforming time slices
4. Re-score only the changed slices (cost optimization that makes the loop
   financially viable at volume)
5. Deliver the variants that cross a score threshold, together with a
   neural report and a GTM strategy guide

That loop is Nucleus. The rest of this site describes it in detail.

## What's novel

Three architectural properties distinguish Nucleus from everything else in
the AI video market:

### The closed loop

Existing neuromarketing tools score finished assets. Existing AI video
tools generate without a quality signal. Nucleus is the only system where
the scoring model is inside the same pipeline that generates the video, and
where the output of scoring is new edits, not a final report. See
[how it works → the loop](how-it-works.md#the-loop).

### Brand-KB grounding

Every generation call — script, voiceover, scene selection, edit
instruction — is grounded against a brand-specific RAG store. The Brand KB
is a first-class object: persistent, tenant-scoped, updatable, auditable.
HeyGen's "Brand Hub" and Synthesia's "Brand Kit" stop at logos, colors, and
glossaries. Nucleus's Brand KB is a full semantic knowledge base ingested
through a production RAG pipeline. See
[features → brand knowledge ingestion](features.md#brand-knowledge-ingestion).

### Slice-scoring optimization

A naive implementation would re-score the full video on every iteration,
which would blow out GPU cost. Nucleus computes scores incrementally: when
the editor changes a 3-second slice, only the changed slice is re-run
through TRIBE v2 and the per-metric parent values are reused for the rest
of the video. This single optimization is what makes the closed loop
financially viable at ~$0.70 per variant at 3-iteration average depth. See
[how it works → continuous scoring](how-it-works.md#continuous-scoring-principle).

## Who uses Nucleus

Nucleus is built to be embedded inside an existing brand-facing product
rather than sold as a standalone SaaS. The canonical shape of a tenant is a
B2B SaaS company that already owns:

- A library of product recordings or brand video assets
- A documented set of ICPs (customer personas)
- A keyword or pain-point corpus (SEO, positioning, sales enablement)
- A Brand Kit (logos, colors, cloned voices, brand glossary)
- A distribution channel to end customers (a marketing site, an enablement
  portal, an LMS, an in-app surface)

When all five exist, Nucleus is additive: the variants, reports, and GTM
guides plug into the tenant's existing surfaces and compound the asset base
they already produce. The first design-partner tenant is
[TruPeer](https://trupeer.ai/); the [integration](integration.md) page covers
the specifics of how Nucleus embeds.

## Three sentences for the reader in a hurry

> Nucleus is a closed-loop video engine: it generates persona variants
> from a brand's knowledge base, scores each variant with a brain model
> that predicts how a typical viewer will respond, and recursively edits
> the ones that underperform until they pass a neural threshold. Every
> delivery includes the variants that crossed threshold, a neural report
> showing exactly where attention and emotion peak and fade, and a GTM
> strategy guide pairing variants to ICPs, platforms, and launch cadences.
> The moat is not the generator and not the scorer — both are
> commoditizing — but the loop between them, and the brand-specific
> learning that the loop accumulates per tenant over time.
