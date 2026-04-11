# Voice and Tone

Nucleus's writing voice is **direct, evidenced, and confident without
being arrogant**. Every page across the docs site, the marketing
surface, and the product UI follows the same rules.

## The voice in one paragraph

Nucleus speaks like a senior engineer briefing another senior engineer.
It does not pad. It does not hedge. It cites the source for every
non-obvious claim. It uses tables when a table is clearer than prose.
It uses code blocks when an example is clearer than an explanation.
It is comfortable being technical and assumes the reader is too.

## Five rules

### 1. Lead with the verb

Bad:

> Nucleus is a recursive neuromarketing video engine that takes brand
> knowledge and produces persona-targeted variants.

Good:

> Nucleus generates persona-targeted video variants from brand
> knowledge and recursively edits them against a neuro-predictive
> score until they pass.

The first sentence does the most work. Lead with what the product
does, not what category it's in.

### 2. Cite or don't claim

Every non-obvious factual claim either has a source citation or is
something the reader can verify themselves. Marketing copy that
relies on vague intensifiers ("revolutionary", "next-generation",
"cutting-edge") is forbidden. If we're claiming a 6.9× engagement
lift over branded posts, we cite the inBeat 2025 source. If we're
claiming TRIBE v2 predicts fMRI better than individual subjects, we
cite d'Ascoli et al. 2026.

### 3. Use tables for dense information

Tables are clearer than long sentence chains for any comparison
across more than two dimensions. The Nucleus voice prefers tables
over prose whenever the prose would otherwise be a list of "X is A,
Y is B, Z is C."

### 4. No filler words or phrases

Forbidden:

- "It's important to note that..."
- "In today's fast-paced..."
- "Leveraging the power of..."
- "World-class", "best-in-class", "industry-leading"
- "Revolutionary", "transformative", "game-changing"
- "Synergize", "ideate", "operationalize"
- "Robust", "scalable" (without specifics)
- "Easy to use" (show, don't tell)

Allowed but use sparingly:

- "Specifically"
- "In practice"
- "By default"
- "Importantly" (only when something is *actually* the load-bearing
  detail of a paragraph)

### 5. Concrete over abstract

Bad:

> Nucleus delivers high-quality video content at scale.

Good:

> Nucleus produces ~$0.70 per variant, runs at ~120 variants per hour
> on a single A100, and crosses the default neural threshold within
> 4 iterations on average.

Numbers, file paths, function names, exact configuration values —
these are the substance of good Nucleus copy. Vague qualitative
claims are not.

## Tone by surface

The voice is the same everywhere. The **tone** shifts slightly
depending on the surface.

### Marketing copy (the home page, the concept page)

- Slightly more declarative
- Uses the [hero block](../index.md) for a single big claim
- Heavier on visual elements (cards, diagrams)
- Still cites sources

### Documentation (this site)

- Most precise tone
- Code blocks for any non-trivial example
- Tables for any comparison
- Internal links for any cross-reference
- Footnotes for any tangential detail

### In-product UI (the Nucleus panel inside the host)

- Even more terse
- Sentence fragments are OK in micro-copy
- Action verbs in buttons ("Generate", not "Generate variants now")
- Status messages are factual, not friendly ("4 variants in queue",
  not "Hang tight! 4 variants are getting ready for you ✨")

### Error messages

- Tell the user what happened
- Tell the user why
- Tell the user what to do next

Bad:

> An error occurred. Please try again.

Good:

> Brand KB lookup failed: the document `acme-brand-guide.pdf` was
> deleted at 14:23 UTC. Re-upload it or remove it from the brief.

### Internal documentation (this site, the runbooks, the spec)

- Same voice as marketing, more verbose
- Captures rationale alongside facts ("we picked X because Y")
- Code blocks freely

## Brand voice examples

### Talking about the recursive loop

| ❌ | ✅ |
|---|---|
| "Nucleus uses cutting-edge AI to revolutionize video creation with our proprietary recursive optimization technology." | "Nucleus generates a candidate variant, scores it against a brain model, edits the underperforming slices, re-scores only what changed, and repeats until the variant passes a threshold or hits an iteration cap." |

### Talking about the neuro signal

| ❌ | ✅ |
|---|---|
| "We harness the power of neuroscience to predict what content will resonate with audiences." | "Nucleus runs every candidate through Meta FAIR's TRIBE v2, a transformer that predicts fMRI response across ~70k cortical voxels from raw video, audio, and text. The composite Neural Score is a weighted sum of 18 region-specific metrics calibrated against fifteen years of neuroforecasting research." |

### Talking about competition

| ❌ | ✅ |
|---|---|
| "Nucleus is unlike any other AI video tool on the market — we're the first to combine X with Y!" | "No tool in the AI video market uses neuromarketing as a recursive feedback loop inside generation. Opus Clip's Virality Score is a heuristic label applied after clipping. Realeyes and Neurons sell scoring APIs but they plug into finished assets, not into generators. The closed loop is the wedge." |

### Talking about cost

| ❌ | ✅ |
|---|---|
| "Nucleus is incredibly cost-efficient and delivers massive ROI for marketing teams." | "Per-variant cost runs ~$0.70 at 3 average loop iterations. At a $5/variant price point, gross margin on the engine is ~7×. The slice-scoring optimization is what makes this work — without it, per-iteration cost would be 70% higher." |

## Capitalization

- **Nucleus** is always capitalized
- Product features are sentence case, not title case ("Recursive edit
  loop", not "Recursive Edit Loop")
- Page titles are sentence case
- Code identifiers (function names, types, env vars) keep their
  source-code casing
- The four archetypes are lowercase in prose ("the marketing
  archetype") but title-cased when used as a label or page title

## Punctuation

- Em dashes are encouraged (`—`, not `--` or ` - `)
- Oxford comma always
- Code formatting for: function names, file paths, env vars, exact
  config values, exact URLs
- Inline citations as parentheticals: "(d'Ascoli et al., 2026)"
- Long quotes use blockquote syntax with attribution underneath

## Negative space

Whitespace and line breaks are part of the voice. A page with one
short paragraph and a table communicates more confidently than the
same content as four medium-length paragraphs of prose. When in
doubt, cut.

## What this guide does not cover

- **Localization.** Nucleus's docs and marketing site ship in English
  only at v1. Localization (matching the host product's 65+ languages)
  is a v2 item.
- **Legal language.** Privacy policies, terms of service, and DPAs
  use formal legal voice, not Nucleus voice. Drafted by counsel.
- **Trademark and copyright notices.** Standard format, not subject to
  voice rules.
