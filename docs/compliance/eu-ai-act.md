# EU AI Act

The EU AI Act's transparency obligations for synthetic content are
the second-largest compliance surface for Nucleus (after the TRIBE
v2 license). This page describes the relevant Articles, the
labeling pattern Nucleus implements, and the implementation
timeline.

## The relevant text

The EU AI Act (Regulation (EU) 2024/1689) entered into force August
1, 2024. The provisions most relevant to Nucleus are:

### Article 50 — Transparency obligations

Article 50(2) requires deployers of AI systems that generate
"synthetic audio, image, video or text content" to:

> *"clearly and distinguishably mark the outputs as artificially
> generated or manipulated and ensure that the content is detectable
> as such by appropriate technical solutions, such as watermarks,
> metadata identifications, cryptographic methods for proof of origin
> and authenticity, fingerprinting or other suitable techniques."*

Article 50(3) extends this specifically to deepfakes:

> *"Deployers of an AI system that generates or manipulates image,
> audio or video content constituting a deep fake, shall disclose
> that the content has been artificially generated or manipulated."*

### What counts as a "deep fake"

Article 3(60) defines deepfake as:

> *"AI generated or manipulated image, audio or video content that
> resembles existing persons, objects, places, entities or events
> and would falsely appear to a person to be authentic or truthful."*

Two conditions: it must resemble something real, AND it must be
mistakable for authentic content. A clearly stylized animation of a
generic avatar narrating a product walkthrough probably doesn't
qualify. A photorealistic AI-generated avatar of "a customer named
Sarah" testifying about her experience definitely does.

## Implementation timeline

| Date | Provision | Applies to |
|---|---|---|
| Aug 1, 2024 | Act enters into force | All |
| Feb 2, 2025 | Prohibitions on prohibited AI practices | Already in effect |
| Aug 2, 2025 | GPAI (general-purpose AI) rules | Foundation model providers |
| Aug 2, 2026 | High-risk AI rules | High-risk system providers |
| Aug 2, 2026 | **Article 50 transparency rules** | **AI content generators including Nucleus** |
| Aug 2, 2027 | Annex III high-risk AI rules | Specific high-risk systems |

The August 2, 2026 date is the one that matters for Nucleus. From
that date forward, every AI-generated piece of content shipped to a
user in the EU must be labeled.

## What Nucleus does

Three layers of compliance.

### 1. C2PA metadata on every variant

Every Nucleus-generated variant gets a [C2PA Content Credentials](https://c2pa.org)
metadata block embedded in the file. The block records:

- That the content was AI-generated
- Which provider(s) generated which components (Veo, HeyGen,
  ElevenLabs, etc.)
- The Nucleus job ID (for audit traceability)
- The tenant ID (hashed)
- The timestamp of generation
- The model versions used

C2PA is becoming the industry-standard provenance format. It's
already adopted by Adobe, Google, Microsoft, OpenAI, and the BBC.
EU regulators have signaled that C2PA-compliant metadata satisfies
the Article 50 detectability requirement.

### 2. SynthID watermarks where supported

For variants that use Google Veo 3.1 as the diffusion provider,
SynthID invisible watermarks are automatically embedded. SynthID is
Google's neural watermarking system that survives common
transformations (compression, cropping, color adjustment).

For variants that use other diffusion providers, Nucleus does not
add a SynthID watermark — those providers either don't support it
or use their own watermarking standards. The C2PA metadata is the
fallback.

### 3. On-screen labels for deepfake-class content

For variants that match the deepfake definition (a recognizable
person, photorealistic, mistakable for authentic), Nucleus
automatically adds an on-screen "AI-generated" label. The label is:

- Placed in the first 2 seconds
- High contrast (white text on a dark badge)
- Large enough to read at typical viewing distance
- Includes the text "AI-generated" in the variant's target language

The label can be customized by tenants on the Enterprise tier (e.g.,
"Synthetic content" or "AI demonstration"), but it cannot be removed.

## How Nucleus detects deepfake-class content

The generator agent classifies each variant as it's produced:

```python
class DeepfakeClassification(Enum):
    NOT_DEEPFAKE = "not_deepfake"             # Generic avatar, stylized, clearly synthetic
    AMBIGUOUS = "ambiguous"                    # Could be mistaken for authentic
    DEEPFAKE = "deepfake"                      # Photorealistic person, named identity, etc.

def classify_deepfake(variant: Variant) -> DeepfakeClassification:
    if variant.has_named_persona:
        return DeepfakeClassification.DEEPFAKE
    if variant.avatar_realism_score >= 0.85:
        return DeepfakeClassification.AMBIGUOUS
    if variant.avatar_realism_score >= 0.95:
        return DeepfakeClassification.DEEPFAKE
    return DeepfakeClassification.NOT_DEEPFAKE
```

`AMBIGUOUS` and `DEEPFAKE` get the on-screen label. `NOT_DEEPFAKE`
gets only the C2PA metadata (still required for transparency, but
not the visible label).

The classification is conservative — when in doubt, label.

## Tenant configuration

Tenants on the Enterprise tier can configure:

- Custom label text (within compliant constraints)
- Label position (top-center vs bottom-center vs corner)
- Label duration (must be ≥ 2 seconds)
- Whether to add the label to all variants or only deepfake-class
  ones

Starter and Growth tiers get the default behavior with no
configuration.

Tenants cannot disable labels entirely. Attempts to disable are
returned as `400 Bad Request` with a compliance error message.

## What about non-EU customers

The EU AI Act applies to AI systems whose output is "placed on the
market or put into service in the Union" or whose output "is used in
the Union." This means:

- A US-based brand publishing variants on TikTok that are visible
  to EU users **is in scope**
- A US-based brand publishing variants only to a US-only audience
  **is technically not in scope**

In practice, social media has no geofencing. Any content published to
a global platform is potentially visible in the EU. Nucleus's
default is to apply the disclosure pattern to **all variants
globally**, regardless of the tenant's region.

A tenant who can demonstrate that their content is only published
to non-EU surfaces (e.g., a private LMS deployment in the US) can
opt out of the visible labels — but C2PA metadata is always
embedded.

## Enforcement and penalties

The EU AI Act provides for fines up to:

- **€35 million or 7% of global annual turnover** for prohibited AI
  practices
- **€15 million or 3% of global annual turnover** for non-compliance
  with most other obligations
- **€7.5 million or 1% of global annual turnover** for providing
  incorrect information

Article 50 violations fall in the middle band (€15M / 3%). Member
states are responsible for enforcement; some (Spain, France) have
been more aggressive than others.

For Nucleus's purposes: penalties hit the host product's parent
company first, not the Nucleus engine. Compliance protects the host
from regulatory exposure.

## Provider-side support

Not all of Nucleus's providers support the same set of compliance
features:

| Provider | C2PA | SynthID | On-screen label | Notes |
|---|---|---|---|---|
| Veo 3.1 | Yes (auto) | Yes (auto) | No (Nucleus adds) | Best provider for EU compliance |
| Sora 2 | Yes (auto) | No | No (Nucleus adds) | Shutting down |
| Runway Gen-4 | Optional | No | No | Tenant-configurable |
| Kling 3.0 | Optional | No | No | Tenant-configurable |
| Seedance 2.0 | No documented | No | No | Less mature on compliance |
| Pika 2.2 | No | No | No | Worst on compliance |
| HeyGen | C2PA in beta | No | No | Enterprise-only |
| Tavus | C2PA for Replica | No | No | Conversational mode handles disclosure differently |
| Synthesia | C2PA | No | No | Strongest enterprise terms |

For tenants in regulated industries (financial services, healthcare,
political ads), Nucleus's provider routing biases toward Veo 3.1 +
HeyGen + Synthesia — the providers with the strongest compliance
features.

## What this page doesn't cover

- **Deepfake-specific criminal law in individual member states.**
  Some EU countries (Germany, France) have criminal penalties for
  malicious deepfake creation. These apply to bad-faith use, not to
  brand-marketing variants.
- **The forthcoming AI Liability Directive.** Will affect civil
  liability for AI-caused harm; not yet in force.
- **GDPR overlaps.** Covered on the [GDPR page](gdpr.md).
- **DSA (Digital Services Act) obligations.** Apply to platforms
  hosting the content, not to Nucleus directly.

## When to revisit

This page should be re-read whenever:

- A new AI Act delegated act or implementing regulation is published
- A member state adopts stricter national rules
- C2PA standards evolve
- A new compliance technology (e.g., a competing watermarking
  standard) gains adoption
