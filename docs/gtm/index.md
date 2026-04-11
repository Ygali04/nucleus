# Go-to-Market

This section covers how Nucleus is priced, packaged, launched, and
sold. It is the operator-facing complement to the
[concept](../concept.md) page — same product, viewed through the
business lens.

## What's in this section

| Page | Subject |
|---|---|
| [Pricing](pricing.md) | Unit economics, tier structure, the case for batch pricing |
| [Packaging](packaging.md) | What's in each tier, what's gated, what's included |
| [Launch sequence](launch.md) | Design partner → private beta → GA |
| [Case study template](case-studies.md) | The shape of a successful customer story |
| [Sales enablement](sales-enablement.md) | How a host product's account team sells Nucleus |

## The GTM thesis in one paragraph

Nucleus is sold as a premium capability inside a host product, not as
a standalone SaaS. The host product owns the customer relationship,
the billing, and the support; Nucleus owns the engine and the brand.
Pricing is metered on **delivered variants**, not credits, because
credit-based pricing penalizes the recursive editing pattern at the
core of the product. The first design-partner deployment is inside
TruPeer, with TruPeer's enterprise customers as the first paying end
users. The roadmap to a multi-host architecture is built into the
engine from day one but is not the first product surface.

## The two-sided market

Nucleus has a B2B2C structure:

```
Nucleus (engine)
   ↓
Host product (e.g. TruPeer)
   ↓
Host's customers (brands)
   ↓
Brand's audience (end viewers)
```

Each layer has its own buyer, its own value proposition, its own
metric of success. The GTM strategy threads through all four.

| Layer | Buyer | Value | Metric |
|---|---|---|---|
| Nucleus | Host product team | Differentiated capability that nobody else can offer | Hosts onboarded |
| Host | Brand marketing leader | Persona × language variant production at scale, with neuro-validated quality | Variants delivered |
| Brand | Brand marketer / CMO | Higher-performing creative at lower cost | Engagement / CTR / conversion lift |
| End viewer | End consumer | Content that matches their persona and language | Watch time, share rate |

The GTM has to make all four layers a winner. If any layer feels
extracted-from rather than served, the chain breaks.

## Why metered, not credit-based

The host product (TruPeer) currently uses credit-based pricing. A
naive Nucleus deployment would inherit that model — every variant in
every language consumes credits. At 100 variants/day × 65 languages,
credits would burn out in hours.

Nucleus is priced on **delivered variants** instead of inputs:

- **Delivered variants** are the unit. A variant that hits the
  iteration cap without crossing threshold counts as half a variant
  (configurable).
- **Failed variants** are free.
- **Iterations are not metered.** The whole point of the recursive
  loop is to iterate; metering iterations would punish the customer
  for the engine doing its job.
- **Languages are not metered separately.** Producing 10 variants in
  3 languages is 10 × 3 = 30 deliveries, not 30 × the credit cost of
  one language.
- **Reports and GTM guides are included.** Free per variant.

This is the only pricing model that makes the recursive loop
financially viable for the customer. It also forces Nucleus to keep
per-variant cost low, which is good engineering discipline.

## The first deployment

The first deployment is inside TruPeer for TruPeer's enterprise
customers. Three reasons this is the right starting point:

1. **TruPeer already has the asset base.** Their customers are
   already producing screen recordings, brand kits, and ICPs through
   TruPeer's existing pipeline. Nucleus is additive, not a replacement.
2. **TruPeer has the distribution.** 30,000+ teams per their
   enterprise page. Marquee customers (Glean, LambdaTest, Zuora,
   Siigo) are exactly the buyers Nucleus targets.
3. **TruPeer has the integration precedent.** Their existing HeyGen
   and Consensus partnerships show they're comfortable plugging
   external engines into their product surface.

The [launch sequence](launch.md) page has the specific timeline.

## Success criteria

The GTM is a success if, by the end of v1 (May 26, 2026):

- One paid TruPeer customer is producing 20+ variants per day
- Average gross margin per variant is ≥ 7×
- The TruPeer team is willing to act as a reference and help close
  the next 3 paid customers
- Nucleus is producing at least one customer-facing case study with
  measurable in-market lift

By the end of v2 (July 14, 2026):

- Five or more paid TruPeer customers are on Nucleus
- Aggregate throughput ≥ 100 variants per day
- At least one brand has shown a >20% in-market lift on a social
  metric vs their pre-Nucleus baseline
- The engineering team has the data to start the second host
  integration conversation
