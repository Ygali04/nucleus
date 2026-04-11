# Case Study Template

Every customer Nucleus delivers measurable value to becomes a case
study. This page is the structure every case study follows so they're
comparable across customers and easy to read.

## Why a template

Three reasons.

1. **Consistency makes them comparable.** A buyer reading three case
   studies in a row should be able to compare the same metrics across
   them without translating.
2. **Structure prevents fluff.** A template forces concrete numbers
   and direct quotes instead of marketing prose.
3. **Speed.** A case study from a template takes a day to draft, not
   a week.

## The template

```markdown
# [Customer name] — [one-line outcome]

> "Direct quote from the customer that captures the headline outcome."
> — [Name, Title, Company]

## Snapshot

| Field | Value |
|---|---|
| Industry | [SaaS / FinTech / e-commerce / etc.] |
| Company size | [employee count] |
| Use cases | [demo / marketing / knowledge / education] |
| Tenant since | [Month YYYY] |
| Variants delivered to date | [number] |
| Headline metric | [e.g. +47% engagement, 8× variant volume] |

## The challenge

Two paragraphs maximum. What problem the customer was trying to solve
before Nucleus. What approaches they had tried. Why those didn't work
at the volume or quality they needed.

## The Nucleus deployment

Three short subsections:

### Brand KB

What was ingested. How many documents. From what sources.

### Source recordings

How many. Average length. What kind of content (product demos, founder
talks, customer calls, etc.).

### Brief shape

What ICPs they target. What languages. What archetypes. What scoring
threshold. What max iterations.

## What changed

The substance of the case study. Three to five concrete changes,
each with a metric.

### 1. [Concrete change]

[What changed in the workflow]

> [Direct quote about this change from the customer]

**Metric:** [the number that proves it]

### 2. [Concrete change]

[Same structure]

### 3. [Concrete change]

[Same structure]

## The neural story

A specific story from the data. Pick one variant or one ICP × language
cell where the iteration history is dramatic. Show the score
trajectory. Show what the editor changed. Show the final variant.

> Example: "The marketing variant for the 'Sales Enablement Lead at a
> Series B SaaS' ICP started at a Hook Score of 41. The editor's first
> pass rewrote the opening 2 seconds with a pain-point question
> instead of a feature claim, lifting Hook to 56. The second iteration
> swapped a slow zoom for a hard cut, lifting Sustained Attention from
> 51 to 64. The third iteration tightened the CTA, pushing Memory
> Encoding from 48 to 67. Final composite score: 73, above the 72
> threshold. Iteration count: 3. Cost: $0.74."

## In-market results

Whatever data the customer is willing to share from their own
analytics. The honest version, not a cherry-picked best case.

| Metric | Pre-Nucleus baseline | With Nucleus | Lift |
|---|---|---|---|
| [e.g. Engagement rate] | [number] | [number] | [%] |
| [e.g. Time to publish] | [number] | [number] | [%] |
| [e.g. Cost per UGC variant] | [number] | [number] | [%] |
| [e.g. CTR on paid social] | [number] | [number] | [%] |
| [e.g. Variants produced per week] | [number] | [number] | [%] |

If a row's baseline doesn't exist, leave it blank. Don't fabricate.

## Quotes

Two or three direct quotes from people in different roles at the
customer:

> "Quote from the brand marketing lead."
> — [Name, Title]

> "Quote from a sales or success leader who saw the downstream
> impact."
> — [Name, Title]

> "Quote from a technical lead about the integration experience."
> — [Name, Title]

## What's next

What the customer is doing with Nucleus going forward. New use cases
they're exploring. Their feedback for the roadmap.

## Footer

| | |
|---|---|
| Customer | [Name + URL] |
| Host product | TruPeer |
| Published | [Date] |
| Customer review status | [Approved on Date] |
```

## Source-of-truth rules

Every case study must conform to a small set of rules so the brand
voice stays honest.

### Numbers must be verifiable

Every metric in a case study must be:

1. Measured by the customer (not by Nucleus)
2. Reproducible if asked
3. Reviewed by the customer before publication

If a number can't be verified, it doesn't appear. The case study is
softer for it but more credible.

### Quotes must be reviewed

Every quote is reviewed and approved by the named person before
publication. The review is in writing.

### Comparisons must have a baseline

Saying "Acme Corp produced 47 variants in their first month" is
weaker than "Acme Corp produced 47 variants in their first month, up
from 4 per month before Nucleus." Always show the baseline if one
exists. If no baseline exists, say so explicitly: "Acme Corp had not
previously produced UGC variants at scale."

### No competitive comparisons

Case studies never compare Nucleus to a named competitor by name.
Comparisons can be made obliquely ("Acme Corp had previously
evaluated three other AI video tools") but the competitor names are
not used. Two reasons:

1. The customer doesn't want to alienate the other vendors they
   evaluated
2. Nucleus's differentiation is structural (the closed loop, the
   neural reward signal), not feature-by-feature, and side-by-side
   feature comparisons obscure that

### One outcome, not five

Every case study has one headline outcome. The other metrics are
supporting evidence. A case study with five competing headlines is a
weak case study.

## The first case study

The first case study is the design-partner deployment inside TruPeer.
The expected shape:

> **TruPeer's first design-partner customer — [TBD: Glean / LambdaTest / Zuora / Siigo class] — produced [X] persona-targeted variants in their first month and saw a [Y]% lift in [metric] vs their pre-Nucleus baseline.**

The specific customer, numbers, and quotes will be filled in after
the v1 phase completes (target: late May 2026).

## Distribution

Case studies are distributed in three places:

1. **The TruPeer website** — TruPeer publishes the case study as a
   customer success story under their existing marketing surface
2. **The Nucleus website** — when one exists, with the customer's
   permission, as a "customers" section
3. **The Nucleus blog** — a longer technical write-up of the
   integration with code samples and architecture detail

The customer always sees the final version before any of these
publications go live.

## What case studies are not

Case studies are **not**:

- Sales pitches with a quote attached
- Marketing copy that happens to name a customer
- Speculative numbers ("Nucleus could produce X for you")
- Generic "AI video" success stories that could apply to any tool

A case study is a measured, verifiable, customer-approved story
about a specific deployment. The template enforces that. Anything
that fails the template doesn't get published.
