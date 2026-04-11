# Pricing

Nucleus is priced on **delivered variants**, with cost ceilings,
fair-share concurrency, and a credits-don't-roll-over feature
explicitly missing. The pricing model is the consequence of the
unit economics, not the other way around.

## Unit economics

Per the [how-it-works → cost model](../how-it-works.md#cost-model),
the per-variant cost of running the engine at 3 average loop
iterations is approximately **$0.70**. Distribution by category:

| Cost line | Per variant | Daily (100 variants) | Monthly |
|---|---|---|---|
| LLM (generator + editor agents) | ~$0.02 | $2 | $60 |
| Voice (ElevenLabs IVC) | ~$0.05 | $5 | $150 |
| Music (Lyria) | ~$0.01 | $1 | $30 |
| Diffusion video (where used) | ~$0.40 | $40 | $1,200 |
| Avatar (where used) | ~$0.15 | $15 | $450 |
| GPU scoring (A100 spot, slice-optimized) | ~$0.08 | $8 | $240 |
| Infra baseline (Railway + Vercel + Postgres + Redis + S3) | — | ~$5 | $150 |
| **Total** | **~$0.70** | **~$76** | **~$2,280** |

These numbers are for marketing-archetype variants (the most expensive
class). Demo and knowledge archetypes drop to ~$0.30/variant because
they skip the diffusion + avatar layers in favor of Remotion-only
composition.

## Margin targets

| Tier | Cost basis | Sticker price | Gross margin |
|---|---|---|---|
| Internal cost target | $0.70 | — | — |
| Cost ceiling per variant (default) | $1.50 | — | — |
| Recommended sticker (host's customer-facing rate) | — | **$5–$8 per variant** | **6–10×** |
| Enterprise volume sticker (10,000+ variants/month) | — | **$2–$4 per variant** | **3–5×** |
| Hero discount (design-partner) | — | **$2/variant** | 2–3× |

The 6–10× gross margin number is generous because Nucleus is the
expensive component in the value chain — most of what the brand pays
for is the engine, not the host's overhead. As volumes grow and the
slice-scoring optimization compounds, margin improves further.

## Why per-variant, not per-credit

| Pricing model | Why not |
|---|---|
| **Per credit** (TruPeer current model) | Credits-don't-roll-over creates friction that punishes iteration. The recursive loop is the product; credits make the loop expensive for the customer. |
| **Per minute of video** | Doesn't account for the iteration count — 5 iterations to produce 1 minute is 5× the cost of 1 iteration. Customers will self-select to lower iteration caps and produce worse content. |
| **Per second of video** | Same problem as per-minute. |
| **Per LLM token** | Hides the GPU cost of scoring, which is the dominant non-diffusion cost. Misleading. |
| **Flat seat** | Doesn't scale with usage; a heavy user pays the same as a light one. Nucleus is built for high-volume customers. |
| **Per delivered variant** ✅ | Aligns the customer's spend with their value. Iterations and edits are free. Failed candidates are free. Languages are not multipliers. Customers pay for the result, not the work. |

## Tier structure

Three tiers, named with host-product conventions where applicable.

### Tier 1 — Starter

| Field | Value |
|---|---|
| Target | Solo brand marketers, agencies, small teams |
| Variants delivered per month | 100 |
| Variants per day (rate cap) | 10 |
| Brand KBs | 1 |
| Brand KB documents | 100 |
| Source recordings | 10 |
| Concurrent jobs | 1 |
| Cost ceiling per variant | $1.00 |
| Cost ceiling per month | $50 |
| API requests per minute | 30 |
| Languages | 5 |
| Archetypes | Demo only |
| **Sticker price** | **$199/month** |
| Effective price per variant | $1.99 |
| Gross margin per variant | ~2.8× |

### Tier 2 — Growth

| Field | Value |
|---|---|
| Target | Mid-market B2B SaaS marketing teams |
| Variants delivered per month | 1,000 |
| Variants per day (rate cap) | 100 |
| Brand KBs | 5 |
| Brand KB documents | 1,000 |
| Source recordings | 100 |
| Concurrent jobs | 5 |
| Cost ceiling per variant | $2.00 |
| Cost ceiling per month | $500 |
| API requests per minute | 120 |
| Languages | 25 |
| Archetypes | Demo + marketing |
| **Sticker price** | **$1,499/month** |
| Effective price per variant | $1.50 |
| Gross margin per variant | ~2.1× |

### Tier 3 — Enterprise add-on

| Field | Value |
|---|---|
| Target | Enterprise SaaS, global brand teams, agencies serving multiple brands |
| Variants delivered per month | 10,000+ (negotiated) |
| Variants per day (rate cap) | 1,000 |
| Brand KBs | Unlimited |
| Brand KB documents | Unlimited |
| Source recordings | Unlimited |
| Concurrent jobs | 50 |
| Cost ceiling per variant | $5.00 |
| Cost ceiling per month | Negotiated |
| API requests per minute | 600 |
| Languages | All 65+ supported |
| Archetypes | All 4 (demo, marketing, knowledge, education) |
| **Sticker price** | **Custom**, baseline $10,000–$25,000/month |
| Effective price per variant at floor | $1–$2.50 |
| Gross margin per variant at floor | ~1.5–3× |
| **Enterprise extras** | SSO, dedicated success manager, CMK encryption, tenant-region selection, custom archetypes, white-glove onboarding |

## How tiers gate features

| Feature | Starter | Growth | Enterprise |
|---|---|---|---|
| Recursive edit loop | ✅ | ✅ | ✅ |
| Neural reports | ✅ | ✅ | ✅ |
| GTM strategy guide | ✅ | ✅ | ✅ |
| Doc delta | ❌ | ✅ | ✅ |
| Custom scoring weights | ❌ | ✅ | ✅ |
| In-market A/B feedback (v2) | ❌ | ❌ | ✅ |
| Brand-learned weights (v2) | ❌ | ❌ | ✅ |
| Custom archetypes | ❌ | ❌ | ✅ |
| White-label removal | ❌ | ❌ | ✅ |
| Customer-managed encryption keys | ❌ | ❌ | ✅ |
| Dedicated GPU pool | ❌ | ❌ | ✅ |
| SLA | None | 99% | 99.9% |
| Support | Community | Email (24h) | Slack channel + dedicated SM |

## Discount structure

| Discount | Trigger | Magnitude |
|---|---|---|
| Annual prepay | Pay 12 months upfront | 15% off |
| Volume break #1 | 5,000+ variants/month | 10% off marginal |
| Volume break #2 | 25,000+ variants/month | 25% off marginal |
| Volume break #3 | 100,000+ variants/month | Custom |
| Design partner | First 3 customers per host product | 50% off, 12 months |
| Non-profit | Verified non-profit | 50% off |
| Education | Verified academic institution | Free up to Starter limits |

## Pricing the host's cut

Nucleus and the host product share revenue per delivered variant.
Two models considered:

### Model A — Flat margin per variant

Nucleus charges the host a flat $0.70/variant cost-recovery + a fixed
margin (e.g., $0.30). Host marks up to its end customer at any rate.

| | |
|---|---|
| Pros | Simple. Host keeps all upside. |
| Cons | Nucleus has no skin in the game on the host's pricing decisions. |

### Model B — Revenue share

Host charges its end customer; Nucleus takes a percentage of the
revenue (e.g., 40%).

| | |
|---|---|
| Pros | Aligns incentives — Nucleus benefits from the host raising prices. |
| Cons | Requires reporting visibility into the host's billing. |

**Recommendation:** Model B for the first design-partner deployment
(40/60 split favoring the host), Model A for additional hosts where
revenue visibility is harder.

## Free tier

There is no free tier of Nucleus delivered to end customers. Two
reasons:

1. The compute cost is non-trivial. A free tier at 10 variants/month
   would cost ~$7/user/month with no upside.
2. The product is sold through a host. The host can offer a trial as
   part of its own free tier — that's the host's UX decision, not
   Nucleus's.

The exception: a 7-day free trial of the Growth tier for any
verified company. This is mostly a host-product UX surface; Nucleus
provides the trial mechanism but doesn't market it directly.

## Annual contracts

The Enterprise tier is sold as an annual contract with quarterly true-
ups. The contract specifies:

- Minimum monthly variant volume
- Maximum monthly variant volume (overage rate per variant above this)
- SLA targets and penalties
- Data residency
- Sub-processor list as of contract date
- Renewal terms (auto-renew with opt-out 60 days before term end)

The standard contract is 12 months. Enterprise customers can negotiate
24- or 36-month terms with additional discount in exchange for the
longer commitment.

## When to revisit pricing

The pricing model should be revisited when:

- Per-variant cost drops by ≥ 30% (slice-scoring v2, cheaper diffusion
  providers, etc.)
- The first 5 paying customers have settled and we have real ARPU data
- A second host product onboards and changes the multi-tenant economics
- A competitor enters with a defensible pricing model that beats ours

The first revisit checkpoint is built into the v2 milestone: by July
14, 2026, we expect to have enough data to validate or revise these
numbers.

## Pricing transparency

Public pricing for Starter and Growth is published on the Nucleus
marketing site (when one exists). Enterprise pricing is negotiated.
The published numbers are anchors, not floors — discounts and
custom terms are normal for any tier.
