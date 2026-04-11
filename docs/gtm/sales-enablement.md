# Sales Enablement

This page is the sales-enablement playbook for Nucleus when sold
through a host product. It's written for the host's account
executives, customer success managers, and solutions engineers — the
people on the front line of explaining Nucleus to a buyer.

## The 30-second pitch

> Nucleus is a closed-loop video engine. It takes your existing
> recordings and brand knowledge, generates persona-targeted
> variants across every ICP × language × format you target, and
> scores each variant with a brain model that predicts how a typical
> viewer will respond. The variants that score below threshold get
> automatically edited until they pass. You get the videos, a neural
> report explaining why each one works, and a GTM strategy guide
> mapping variants to ICPs and platforms.

That's the version that fits on a slide. The longer version is the
[concept page](../concept.md).

## What buyers will ask

A frequently-asked-question list to seed the AE's prep.

### "How is this different from HeyGen / Arcads / Descript?"

Three differences:

1. **Brand knowledge grounding.** Every script, every voiceover,
   every edit is grounded in the brand's actual documents. HeyGen's
   Brand Hub is logos and glossaries. Nucleus's Brand KB is a full
   semantic knowledge base.
2. **Neural reward loop.** Other tools generate then ask a human to
   pick the good ones. Nucleus generates, scores with a brain model,
   and edits the underperforming ones automatically. The score is
   the gradient the editor descends.
3. **Persona × language cross-product.** Other tools produce
   variants but don't fan out across the full ICP × language ×
   platform × archetype space. Nucleus does, and it's the only tool
   that delivers them with a quality signal that scales.

The longer dissection of each competitor is on the
[landscape page](../landscape.md).

### "Is this real or is it marketing?"

The neural model (Meta FAIR's TRIBE v2) was released in March 2026
under CC BY-NC. The academic literature it's built on goes back
fifteen years and includes published results showing 18-subject lab
fMRI predicting 63,617-shopper retail behavior. The
[research foundation page](../foundation.md) has the full citation
list. Anyone who wants to verify the science can read the papers.

### "What's the unit economics?"

Per-variant cost runs ~$0.70 at three average loop iterations. At a
$5/variant sticker price, gross margin is ~7×. The full breakdown is
on the [pricing page](pricing.md).

### "Who else is using it?"

The first design-partner deployment is inside TruPeer for TruPeer's
enterprise customers. Public references will be available once the
first paying customer is comfortable with attribution (target: late
May 2026). Pre-attribution conversations can reference the deployment
without naming the customer.

### "What's the integration cost?"

For TruPeer specifically: ~6 weeks of engineering to ship v1, with
the bulk of the work in three places — embedding the panel UI,
wiring the JWT exchange, and adding the slice-scoring endpoint to
the upstream NeuroPeer service. For new host products, similar.

### "What about TRIBE v2's CC BY-NC license?"

The default analyzer is TRIBE v2; the architecture supports a
pluggable fallback analyzer (`AttentionProxyAnalyzer` built on
V-JEPA2 features) for tenants where the CC BY-NC license is a
blocker. The fallback is in development as insurance. If a customer
needs commercial-clean inference today, they get the fallback; if
they're comfortable with the research-grade default, they get TRIBE
v2 with the option to switch later.

The detailed compliance position is in the
[compliance section](../compliance/license-tribe-v2.md).

### "What about FTC rules on synthetic UGC?"

The FTC's 2025 rule on undisclosed synthetic testimonials applies
when the AI-generated content is presented as a real person's
testimonial. Nucleus doesn't produce testimonials by default — it
produces persona-targeted variants of the brand's own content. For
customers who do want to use Nucleus's avatar layer to generate
testimonial-style content, the platform supports automatic disclosure
captions and metadata flags. See
[compliance → FTC](../compliance/ftc-synthetic-testimonials.md).

### "Can the variants be used in paid ads?"

Yes. The provider terms (Veo 3.1, HeyGen, ElevenLabs, Lyria) all
permit commercial use on paid plans. Nucleus passes that
commercialability through to the customer. The single open question
is the TRIBE v2 license posture (above), and that's about the scoring
loop, not the output.

### "What about EU AI Act labeling?"

The EU AI Act's Article 50 requires synthetic-content labels by
2026. Nucleus supports automatic C2PA metadata embedding, SynthID
watermarks where the underlying provider supports them, and visible
caption labels where the customer's deployment context requires
them. See [compliance → EU AI Act](../compliance/eu-ai-act.md).

### "What if I don't have a brand knowledge base yet?"

Nucleus's ingestion pipeline (built on DeepTutor's RAG components)
handles bootstrap. Point it at the brand's marketing site, blog,
product docs, and help center URLs and it builds a usable Brand KB
in under an hour. Customers with more sophisticated existing
knowledge bases (Notion, Confluence, Google Drive) can connect them
directly.

### "How do I onboard a new customer?"

1. Customer signs up through the host product
2. Host product calls Nucleus's auto-provision endpoint
3. Customer points Nucleus at one or more knowledge sources
4. Customer (or host CS) defines the ICP library
5. Customer hits "Multiply" on a recording
6. First variant lands in ~5 minutes

The full onboarding runbook is in
[runbooks → tenant onboarding](../runbooks/onboarding-tenant.md).

## Discovery questions

The questions an AE should ask to qualify a Nucleus opportunity.

### Volume

- How many videos does your team produce per month today?
- How many do you wish you could produce?
- How long does it take to produce one finished branded video?
- How many languages do you target?
- How many ICPs do you target?
- How many platforms do you publish to?

### Quality

- How do you currently know if a video is going to perform before you
  spend on paid media?
- Have you ever paid for pre-flight testing (Realeyes, Neurons,
  Attention Insight)?
- What does your current quality review process look like?
- How much variance do you see in the quality of your AI-generated
  videos today?

### Process

- Do you have a brand knowledge base or messaging document set
  somewhere centralized?
- Do you have a documented ICP / persona library?
- How does new product information get reflected in your existing
  videos? (The "every update means re-record" pain point.)
- Who reviews videos before they ship? How long does that take?

### Stack

- What AI video tools do you use today?
- What's your current cost per finished video?
- What's your monthly spend on video production (in-house + tools)?
- Are you currently a TruPeer customer? (If yes — Nucleus is one
  click away. If no — TruPeer is the path in.)

### Outcomes

- What metric would have to move for you to feel like AI video was
  paying off?
- What would a 2× lift on engagement / CTR / share rate be worth to
  you?

## Disqualifiers

Customers Nucleus is **not** for:

| Customer | Why not |
|---|---|
| Solo creators making podcasts | They want Descript |
| Brand teams producing < 10 videos/month | The pricing doesn't work; suggest a tool with no quality loop |
| Brands with no existing source material | The "30 platform shots" precondition matters; bootstrapping a recording library is the host product's job, not Nucleus's |
| Brands selling exclusively in one language to one ICP | The cross-product wedge isn't there; suggest a simpler tool |
| Anyone whose use case requires real human creators on camera | Nucleus is synthetic only |

If the customer fits one of these, redirect them to a better-fit
tool. Forced fits become churn.

## Common objections

### "We tried HeyGen / Arcads and the quality was inconsistent."

That's the quality variance problem the [foundation page](../foundation.md)
covers. The recursive loop is exactly the answer to inconsistent
quality. The engine produces the same variance any generator does
on the first pass — it then iterates until the variant crosses
threshold. Show them the iteration history of a real variant.

### "We can't afford another tool."

Nucleus is priced inside the host product, not as a separate
subscription. If the host is already in their stack, Nucleus is an
add-on, not a new vendor. If the host isn't in their stack — that's
the upsell conversation, not a Nucleus conversation.

### "We need GDPR / SOC 2 compliance."

The host product holds the certifications. Nucleus inherits them
through the embedded architecture. The
[compliance section](../compliance/index.md) has the formal
inheritance documentation.

### "We don't trust AI to make creative decisions."

Nucleus doesn't make creative decisions in a vacuum. It edits against
a measurable signal (the neural score) and against the brand's own
knowledge base (the Brand KB). The customer always reviews the
delivered variants before publishing. The neural report explains why
each variant works. The customer keeps creative control; Nucleus
removes the bottleneck of producing the variants in the first place.

### "We've never heard of TRIBE v2 / neuromarketing."

Show them the [foundation page](../foundation.md). Walk them through
two papers — Falk 2012 (anti-smoking PSAs predicting 1-800-QUIT-NOW
calls) and Tong 2020 (NAcc activation predicting YouTube views).
Most marketers haven't seen these but understand them immediately.

### "We need to talk to references."

Until the first design-partner customer is public (target: late
May 2026), references are available under NDA. The first public
case study unlocks open references.

### "Can we self-host?"

No. Nucleus is delivered as a service. A self-hosted version is a
separate product line (and a different commercial conversation).

## Sales tools

Material the AE should have in the sales deal room.

| Asset | Where it lives |
|---|---|
| One-page Nucleus overview | This site, exported as a one-pager PDF |
| Architecture diagram | [How it works](../how-it-works.md) |
| Competitive landscape | [Landscape](../landscape.md) |
| Cost model | [How it works → cost](../how-it-works.md#cost-model) |
| Compliance position | [Compliance section](../compliance/index.md) |
| Reference quotes | TBD post first paid customer |
| Demo recording | TBD post MVP |
| Pricing | [Pricing page](pricing.md) (negotiable for Enterprise) |
| First case study | TBD post v1 |
| Trust portal / DPA | TBD pre-launch |

## What this playbook does not cover

- **Cold outreach scripts.** Nucleus is sold through host products,
  not via cold outreach. The host's existing marketing and sales
  funnel is the entry point.
- **Demo recording script.** Built once the MVP is live (week 4 of
  Phase 1).
- **Battle cards.** Built per competitor as the field surfaces real
  competitive scenarios.
- **Customer success playbook.** Lives in the host product's CS team,
  with a Nucleus-specific addendum that the CS team owns.
