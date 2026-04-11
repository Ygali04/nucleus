# TRIBE v2 License

This page is the load-bearing legal analysis for Nucleus's
relationship to Meta FAIR's TRIBE v2 model. It is the most
important page in the compliance section because TRIBE v2 is the
default scoring engine and its CC BY-NC license is the largest
single legal risk to commercial deployment.

The full research lives in `research/compliance-legal.md`. This
page is the operator-facing summary.

## The license in one paragraph

TRIBE v2 ships under
[Creative Commons Attribution-NonCommercial 4.0 International](https://creativecommons.org/licenses/by-nc/4.0/legalcode.en).
The license grants worldwide, royalty-free, irrevocable rights to
reproduce, share, and adapt the work — but only for **non-commercial
purposes**. Commercial use is forbidden absent a separate license
from Meta. The license has no academic exception, no notification
requirement, and no patent grant.

## What's allowed and what's not

### Allowed under CC BY-NC 4.0

- Downloading and using the model weights for personal research
- Running inference for academic publications
- Fine-tuning for non-commercial benchmarks
- Sharing modified versions, with attribution, for non-commercial use
- Internal-only research at a non-profit institution
- Educational use (classroom, tutorials, blog posts that are not
  themselves monetized)

### Not allowed under CC BY-NC 4.0

- Running inference inside a commercial SaaS product
- Producing scores that drive paid customer-facing decisions
- Using the model as the reward signal in a generative pipeline that
  ships output to paid media
- Charging customers for access to TRIBE v2-derived metrics
- Marketing a commercial product as "powered by TRIBE v2"
- Embedding the model in a paid mobile or desktop application
- Building a paid API on top of TRIBE v2 inference

The CC 2009 *Defining Noncommercial* study established that three
factors determine whether a use reads as commercial: **monetization**
(paywalls, SaaS subscriptions, ad revenue), **purpose** (research
aimed at shipping a commercial product vs openly published results),
and **context** (university lab vs corporate R&D on the critical
path to ship). For-profit internal R&D that feeds a shipping product
is, per CC's own guidance, on the commercial side of the line.

## The specific risk for Nucleus

Nucleus is, by design, a paid commercial pipeline. Using TRIBE v2 to
produce a reward signal that selects which generated video a paying
brand ships to paid media is, under any honest reading of the
license, commercial use. There is no "we host it for research"
framing that survives contact with how the score is actually used.

Two secondary risks:

1. **Derivative exposure.** Fine-tuning TRIBE v2 produces "Adapted
   Material" that inherits the NC restriction. A fine-tuned
   variant can't be commercially shipped either.
2. **Distillation exposure.** Training a smaller reward model from
   TRIBE v2's outputs is the classic derivative-work question. Case
   law is essentially nonexistent. Meta has historically treated
   model-to-model distillation as a licensing question, not a fair-
   use one.

## Meta FAIR's track record on commercial relicensing

A consistent pattern across Meta's CC BY-NC research releases:

| Release | Date | Original license | Commercial path |
|---|---|---|---|
| Llama 1 | Feb 2023 | Custom non-commercial | Case-by-case research access; no commercial licenses granted |
| Llama 2 | Jul 2023 | Llama Community License | One-time strategic shift; free commercial use under 700M MAU cap |
| DINO v2 | 2023 | Non-commercial | Re-licensed to Apache 2.0 after ~18 months of community pressure |
| SAM | 2023 | Apache 2.0 (code) / Research-only (dataset) | Dataset never re-licensed |
| ImageBind | 2023 | CC BY-NC 4.0 | Not re-licensed |
| MMS | 2023 | CC BY-NC 4.0 | Not re-licensed |
| V-JEPA | 2024 | CC BY-NC 4.0 | Not re-licensed |
| Seamless | 2024 | CC BY-NC 4.0 | Not re-licensed |
| TRIBE v1 | 2024 | CC BY-NC 4.0 | Not re-licensed |
| TRIBE v2 | March 2026 | CC BY-NC 4.0 | Not re-licensed (yet) |

**Meta FAIR does not run a standing commercial-license desk for CC
BY-NC releases.** Bespoke grants are extremely rare and historically
reserved for strategic partners (large enterprises, named customers,
significant investment relationships).

## The path to a commercial license

The theoretical process:

1. Email `fair_licensing@meta.com` (or `opensource@meta.com`)
2. Describe the use case and projected volume
3. Wait for Meta legal + FAIR leadership review
4. Negotiate terms

There is no published SLA, no public fee schedule, and historical
response time is "weeks to months, many requests go unanswered." A
seed-stage SaaS is not Meta's priority.

**Do not treat "we'll email Meta" as a plan.** Build assuming the
request is ignored; be pleasantly surprised if it isn't.

## Defensible workarounds, ranked

### 1. Train a Nucleus-owned reward model on public datasets (RECOMMENDED)

Several large public neural datasets exist that can be used to train
a video-scoring model under permissive licenses:

- **Natural Scenes Dataset (NSD)** — 8 subjects, 70 hours of natural
  image fMRI, CC BY 4.0
- **Courtois NeuroMod** — long-form naturalistic stimuli, ODC-By
- **BOLD5000** — 4 subjects, ~5000 unique images, CC BY 4.0
- **HCP Movies** — Human Connectome Project, multi-subject movie
  watching, free for research
- **THINGS-fMRI** — 1854 object categories, CC BY 4.0
- **THINGS-EEG2** — same stimulus set, EEG, CC BY 4.0
- **Sherlock fMRI** — single episode, multi-subject, free
- **Forrest Gump fMRI** — 7T scans of movie watching, CC BY-SA

Aggregated, these provide ~2,000+ hours of stimulus-paired neural
data. A trained reward model on this corpus would lag TRIBE v2 by
6–12 months on raw accuracy but would be commercially clean.

**Cost estimate:** 2 engineers × 6 months. Budget ~$300K all-in.
**Performance target:** 85% of TRIBE v2's group-average accuracy on
the Algonauts benchmark.

This is the recommended long-term destination. The
[research roadmap](../research/research-roadmap.md) treats this as
the central R&D project.

### 2. Offline distillation

Use TRIBE v2 only in a walled-off research phase to label public
video datasets, then train a production reward model on the labels
and discard TRIBE v2 from the production stack.

Pros:
- Faster than training from scratch
- The production model has no TRIBE v2 dependency at runtime

Cons:
- Still has derivative-work risk (the labels are TRIBE v2 outputs)
- Needs outside-counsel review before relying on it
- Meta could plausibly claim the labeled dataset is a derivative

### 3. Pure research-preview tier

Ship a free, non-commercial Nucleus tier for academic users only.
This is defensible as long as the research-preview tier really is
non-commercial — no paid upgrade path, no ad spend driven by the
outputs, no marketing material.

Pros:
- Cleanly within the license
- Builds research goodwill

Cons:
- Not a business
- Can't be the only product

### 4. "Research lab" separate entity

Spin up a separate legal entity that runs TRIBE v2 inference and
sells a generic "neuro scoring" API to anyone, including the main
Nucleus business.

This is cosmetic. The CC test is the *purpose* of the use, not the
*topology* of who does the using. Will not survive scrutiny.

### 5. Ship and ignore the license

Run TRIBE v2 in production and hope Meta doesn't notice or doesn't
care.

Not recommended. The downside risk is operational (an injunction
ripping TRIBE v2 out of production with a 30-day cure window) more
than financial.

## The recommendation

**Scope TRIBE v2 to internal benchmarking and research publications
only. Ship the production engine on the in-house
`AttentionProxyAnalyzer` from day one.**

Specifically:

1. **Treat TRIBE v2 as a benchmark target, not a production
   dependency.** It's the gold standard the in-house model is
   evaluated against.
2. **Start the in-house reward model immediately.** Two engineers
   for six months. Target 85% of TRIBE v2's group-average accuracy
   on Algonauts. The [neuro models page](../research/alternative-models.md)
   covers the architectural choices.
3. **Run TRIBE v2 only in a walled-off research environment** for
   benchmarking and dataset labeling. Never call it from a
   production worker that handles paid customer data.
4. **Email `fair_licensing@meta.com` in parallel** with no
   expectation. Document the email and Meta's response (or lack
   thereof) for the legal record.
5. **Publish TRIBE v2 attribution on a research / benchmarks page.**
   Do not market Nucleus as "powered by TRIBE v2." Marketing copy
   should say "neuro-predictive scoring" without naming TRIBE v2.
6. **Outside-counsel review is mandatory** before GA. CC license
   enforcement in an AI context has effectively no case law yet, and
   the situation is changing.

## Exposure if Meta sues

No public lawsuit yet against a commercial user of a CC BY-NC FAIR
release. Historical pattern is cease-and-desist plus private
negotiation.

In a hypothetical lawsuit, Meta would allege copyright infringement
on the model weights. US statutory damages can reach $150K per work
under 17 USC §504(c), plus fees under §505. Realistic damages
calculation would be a reasonable royalty.

The scarier exposures are non-monetary:

- **Injunctive relief.** A court could order TRIBE v2 ripped out of
  production with a 30-day cure window.
- **Discovery exposure.** Litigation discovery would expose training
  data, customer lists, and internal architecture.
- **Cascading enterprise customer DPA pauses.** Customers required
  to maintain their own compliance posture (especially regulated
  industries) would pause Nucleus contracts during the dispute.

**Financial exposure is manageable. Operational exposure is what
actually matters.** The pluggable analyzer architecture is
specifically designed to make TRIBE v2 removable in <30 days if
needed.

## Attribution requirements

Even for non-commercial / benchmarking use, CC BY-NC requires:

1. Preserve the copyright notice
2. Preserve the warranty disclaimer
3. Provide a URI or hyperlink to the license text
4. Attribute the creator (Meta FAIR / d'Ascoli et al. 2026)
5. Indicate if any modifications were made

Sample attribution block for a research blog post:

> *"This benchmark uses Meta FAIR's TRIBE v2, released under
> [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
> The model and training methodology are described in d'Ascoli et al.,
> 'TRIBE v2: A tri-modal brain encoding model for video, audio, and
> text' (Meta FAIR, 2026). We did not modify the released weights."*

## What this page does not cover

- **Whether Meta would actually sue.** Legal speculation is outside
  the scope; the architecture is designed to make the question moot.
- **The full Algonauts benchmark methodology.** Covered in the
  [research benchmarks page](../research/benchmarks.md).
- **The detailed `AttentionProxyAnalyzer` architecture.** Covered
  in the [alternative models page](../research/alternative-models.md).

## When to revisit

This page should be re-read whenever:

- Meta releases a new version of the TRIBE family
- Meta publishes a commercial-licensing program
- A court rules on CC BY-NC enforcement in an AI context
- A competitor publicly takes a position on TRIBE v2 commercial use
- The in-house `AttentionProxyAnalyzer` reaches production parity
