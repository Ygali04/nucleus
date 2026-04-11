# FTC — AI-Generated Testimonials

The FTC's 2024 Trade Regulation Rule on Consumer Reviews and
Testimonials (16 CFR Part 465) is the most directly applicable US
regulation to Nucleus's output. This page describes the rule, what
counts as a forbidden testimonial vs an allowed disclosed
synthetic, and the disclosure pattern Nucleus implements.

## The rule

**16 CFR Part 465** was finalized August 14, 2024 and took effect
October 21, 2024. The text relevant to Nucleus:

> **§465.2 Fake or false consumer reviews or testimonials.** It is an
> unfair or deceptive act or practice and a violation of this part
> for a business to write, create, or sell consumer reviews or
> testimonials that:
>
> *(i) is attributed to a person who does not exist, such as an
> AI-generated fake;*
>
> *(ii) is attributed to a person who did not have the represented
> experience with the business or its products or services; or*
>
> *(iii) misrepresents, expressly or by reasonable implication, that
> it represents the experience or opinions of a person.*

The rule reaches any person who *"knows or should have known"* the
testimonial is fake — which explicitly includes platforms, not just
the brands that commission the creative.

## What's forbidden

- AI-generated testimonials attributed to nonexistent people
- AI content misrepresenting a real person's experience
- Buying, selling, or procuring fake reviews
- Compensating reviewers conditioned on sentiment
- Suppressing honest negative reviews

## What's allowed with disclosure

- Testimonials from compensated real people, with disclosure of the
  compensation
- AI-generated personas where the AI nature is disclosed
- Dramatizations and re-creations, when clearly labeled
- AI-narrated content that is not framed as a personal experience
- Synthetic spokespeople in roles that are clearly not testimonials
  (e.g., a brand-owned avatar narrating a product walkthrough)

The rule bans **synthetic spokespeople passed off as authentic
consumer experience**, not synthetic spokespeople in general.

## How "clear and conspicuous" disclosure works

§465.1(c) defines clear and conspicuous as:

> *"difficult to miss (i.e., easily noticeable) and easily
> understandable by ordinary consumers."*

In practice, drawing from the rule plus the Endorsement Guides
(16 CFR Part 255):

| Surface | Required disclosure pattern |
|---|---|
| Visual content | On-screen text overlay, large enough to read at typical viewing distance |
| Audio-only content | Verbal disclosure at the start of the content |
| Both | Both disclosures, plus structured metadata (C2PA) |

A common compliant pattern: a short caption at the start of the
video reading **"AI-generated content"** or **"This video features
an AI-generated avatar."**

A non-compliant pattern: disclosure buried in the description box
under a YouTube video, or in fine print at the end of an Instagram
caption.

## How this affects Nucleus

Nucleus's output is **not testimonial by default**. The four
archetypes:

| Archetype | Testimonial? | Disclosure required? |
|---|---|---|
| **Demo** | No — re-narrated product walkthrough | No |
| **Marketing** | Sometimes — depends on the script | Maybe (see below) |
| **Knowledge** | No — internal-facing explainer | No |
| **Education** | No — long-form learning content | No |

The marketing archetype is the only one where the FTC rule may
apply. The rule applies when the script positions the content as a
personal experience or testimonial — for example, "I tried Acme
Widgets and they changed my life" delivered by an avatar.

## What Nucleus does

Three behaviors enforce compliance.

### 1. Default to non-testimonial framing

The marketing archetype's default script template avoids first-person
testimonial framing. It speaks in second person ("You'll see how
Acme Widgets...") or third person ("Acme Widgets reduce
deployment...") rather than first person ("I love Acme Widgets...").

Tenants who want first-person testimonial framing have to explicitly
opt into it via a brief flag: `framing: "first_person_testimonial"`.

### 2. Auto-disclosure when first-person testimonial framing is enabled

When `framing: "first_person_testimonial"` is set, Nucleus
automatically:

- Adds an on-screen text overlay: "AI-generated content" in the
  first 2 seconds
- Adds a C2PA metadata field flagging the content as
  AI-generated
- Adds a SynthID watermark where the underlying provider supports
  it (Veo 3.1, for example)
- Adds an "AI-generated" tag to the variant's metadata in the
  delivered output

The on-screen overlay is large, high-contrast, and unavoidable. It
satisfies the "difficult to miss" standard.

### 3. Refuse impersonation of real people

If a brief specifies an avatar that resembles a named real person,
the generator agent refuses unless the tenant has uploaded
documented consent (a signed model release). The consent record is
stored with the variant's audit log.

This is enforced at two layers:

1. The generator agent's prompt includes a refusal instruction
2. The avatar provider (HeyGen, Tavus, Synthesia) has its own
   public-figure detection that runs on every request

Both layers are belt-and-braces — neither is sufficient alone.

## Penalties

The FTC can impose civil penalties for rule violations under the
FTC Act. Per 15 USC §45(m), penalties can be up to ~$50K per
violation per day. The FTC has been more aggressive about consumer
review and testimonial enforcement since the rule took effect.

A "violation" in this context is typically each piece of misleading
content that's shipped — so a single Nucleus job that produces 50
misleading variants could in theory trigger 50 violation counts.

## Provider-side handling

The avatar providers Nucleus uses have their own positions on this:

| Provider | FTC stance |
|---|---|
| HeyGen | Enterprise customers warned to disclose AI nature; HeyGen does not enforce disclosure on output |
| Tavus | Same |
| Synthesia | Stricter enterprise terms; explicit prohibition on testimonial impersonation |
| D-ID | Same as HeyGen |
| Akool | Same |

None of the providers automatically watermark or disclose. The
disclosure is the responsibility of whoever publishes the content —
which, for Nucleus's deployment pattern, is the brand using the
host product.

## What the host product is responsible for

The host product (TruPeer for the first deployment) shares
responsibility for compliance. Specifically:

- The host's terms of service must require tenants to comply with
  applicable testimonial regulations
- The host's UI must not encourage tenants to disable Nucleus's
  default disclosures
- The host must provide a clear way for tenants to upload model
  release documents when they want to use named personas
- The host's customer support must handle disclosure questions

These obligations are negotiated as part of the deployment contract
with each host.

## What this page doesn't cover

- **State-level review and testimonial laws.** Some US states have
  additional rules. These are addressed at contract time per
  jurisdiction.
- **EU consumer protection law on testimonials.** Covered partially
  in the [EU AI Act page](eu-ai-act.md); the EU's UCPD also applies
  but is not currently enforced as aggressively as the FTC rule.
- **Defamation risk.** A variant that depicts a fictional person
  saying something defamatory about a real competitor creates
  defamation risk. The generator agent's refusal logic also covers
  this.
- **Right of publicity claims.** Covered on the
  [output IP page](output-ip.md).

## When to revisit

This page should be re-read whenever:

- The FTC issues new enforcement actions under 16 CFR Part 465
- A state passes a stricter rule
- An industry-specific regulator (FDA, FCC, FINRA) issues guidance
  on AI testimonials
- A material product change adds testimonial-format generation as a
  default
