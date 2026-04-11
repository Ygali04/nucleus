# Output IP and Likeness

Who owns a Nucleus-generated variant? Whose voice can it use? When is
a likeness allowed? This page describes the IP chain of title for
Nucleus output, the voice clone consent model, and the watermarking
posture.

## Output ownership

The default rule:

> **The host product's customer (the tenant) owns every variant
> Nucleus produces from inputs the customer provided.**

Three components flow into the rule.

### Component 1 — Inputs the customer provides

The customer's inputs (Brand KB documents, source recordings,
brand kit assets, ICP definitions) are the customer's own
intellectual property. Nucleus does not claim any rights to them
beyond the limited license needed to process them.

### Component 2 — Provider terms

Each external generation provider has its own ownership terms:

| Provider | Customer owns output? | Notes |
|---|---|---|
| Veo 3.1 (Vertex AI / Gemini Enterprise) | Yes | Google indemnifies enterprise customers; pre-GA models prohibit commercial use |
| Sora 2 | Yes | Customer owns; must comply with IP/publicity laws |
| Runway Gen-4 | Yes | On all paid plans; no indemnity at API tier |
| Kling 3.0 | Yes | Per BytePlus enterprise TOS |
| Seedance 2.0 | Yes | Per BytePlus enterprise TOS |
| Pika 2.2 | Yes | On paid plans |
| Luma Ray 3 | Yes | On all paid plans |
| HeyGen | Yes | On paid tiers |
| Tavus | Yes | Per developer TOS |
| ElevenLabs | Yes | Per ElevenLabs commercial terms |
| Lyria | Yes | Per Vertex AI Generative AI terms |
| Suno | Yes (Pro+) | Concerns over training data |
| OpenRouter / underlying LLMs | Yes | Per provider terms |

Nucleus passes through the most restrictive provider's terms to the
customer. If any provider in the variant's generation chain
restricts commercial use, the variant is flagged with that
restriction.

### Component 3 — Nucleus's contribution

Nucleus's engine adds:

- The orchestration layer (no IP claim)
- The recursive scoring loop (no IP claim)
- The composition logic (no IP claim)
- The neural reports and GTM guides (no IP claim)

Nucleus does not claim copyright on the output of the orchestration.
The customer's variant is the customer's variant.

## What Nucleus does retain

Nucleus retains:

- The right to use anonymized, aggregated metadata about variants
  for product improvement (e.g., score distributions, iteration
  counts)
- The right to use the variant in case studies **with explicit
  customer permission**
- The right to display the variant in the customer's own Nucleus
  panel (the variants are stored in Nucleus's S3 for the customer's
  access)
- A non-exclusive license to make backup copies for disaster
  recovery

Nucleus does **not** retain:

- The right to use the variant in marketing without permission
- The right to share the variant with other customers
- The right to use the variant in training data for any future
  model
- The right to claim authorship

## Voice clone consent

Voice clones present a unique IP and privacy risk. Nucleus's
position:

### The consent record

Every voice clone in Nucleus has an associated consent record:

```python
@dataclass
class VoiceCloneConsent:
    voice_clone_id: str
    person_name: str
    consent_date: date
    consent_method: str           # 'in_person' | 'email' | 'signed_form' | 'recorded_video'
    consent_scope: str            # 'all_variants' | 'demo_only' | 'specific_brand'
    consent_artifact_path: str    # S3 path to the signed release or recording
    withdrawal_available: bool = True
    withdrawn_at: datetime | None = None
```

The consent record is checked before every variant generation that
uses the voice. If the consent has been withdrawn, the voice is
unusable until new consent is recorded.

### Consent collection

Nucleus does not collect consent itself. The host product is
responsible for the consent UX. The host's responsibilities:

1. Show the person being cloned a clear consent form
2. Capture their signature or recorded verbal agreement
3. Upload the consent artifact to Nucleus via the API
4. Refuse to clone voices without consent

Nucleus's API enforces this by requiring `consent_artifact_path` to
be set before a voice clone can be activated.

### State right-of-publicity laws

Several US states have right-of-publicity statutes that apply to
voice cloning:

- **Tennessee ELVIS Act** (2024) — broad right-of-publicity
  protection covering voice and likeness, including AI-generated
  content
- **California § 3344** — long-standing right-of-publicity
- **New York § 50-51** — privacy-based right-of-publicity
- **Illinois Right of Publicity Act**
- **Florida § 540.08**

Nucleus's consent model is designed to satisfy the most restrictive
of these (Tennessee). The consent must be specific, informed, and
documented.

### Provider-side consent

ElevenLabs has its own consent requirements built into the IVC
process:

1. The audio sample uploader must affirm they have the right to
   clone the voice
2. ElevenLabs runs voice fingerprinting against known protected
   identities (celebrities) and refuses cloning of detected matches
3. Voice samples are watermarked at the model level

Nucleus's consent model layers on top of ElevenLabs's. Both must
pass for a voice clone to be active.

## Likeness and avatar use

Avatars present similar issues. Nucleus's avatar use rules:

| Avatar source | Allowed? |
|---|---|
| Stock avatar from HeyGen / Synthesia / Tavus library | Yes (no consent needed; avatars are pre-licensed) |
| Avatar trained from a real person with consent | Yes (consent record required) |
| Avatar trained from a real person without consent | **No** (refused at brief submission) |
| Avatar that resembles a real person by accident | Yes (provider's public-figure detection handles this) |
| Avatar of a public figure (celebrity, politician) | **No** (refused unless explicit licensing exists) |
| Avatar of an internal employee | Yes with employment-context consent |

The provider-side public-figure detection (HeyGen, Tavus, Synthesia)
catches most cases. Nucleus's brief schema also requires
`avatar_consent_artifact_path` for any non-stock avatar.

## Image and visual likeness

Diffusion-generated B-roll occasionally produces faces. The risk:
the face accidentally resembles a real person.

Mitigations:

1. **Provider-side public-figure blocking.** Veo 3.1 and Sora 2
   block prompts that name public figures. Most providers have
   similar features.
2. **Post-hoc face detection.** Nucleus runs face detection on
   diffusion B-roll output and flags any prominent face for review
   if the variant uses the face for more than 1 second.
3. **Brand-policy override.** Tenants can configure their brief to
   reject any face appearance in B-roll output entirely.

## Watermarking and provenance

Nucleus embeds provenance information in every variant:

| Layer | Mechanism |
|---|---|
| C2PA Content Credentials | Embedded in every variant's metadata |
| SynthID | Embedded by Veo 3.1 automatically (invisible) |
| Visible label | Added for deepfake-class content (see [EU AI Act](eu-ai-act.md)) |
| Audio watermark | ElevenLabs adds a model-level watermark to all generated audio |
| Filesystem hash | Every variant's SHA256 is recorded in `artifacts.sha256` |

The combination provides multiple layers of provenance. A variant
that loses one layer (e.g., the visible label is cropped out for a
square crop) still has C2PA metadata and the audio watermark.

## Chain of title for paid ads

When a customer wants to use a variant in a paid ad on Meta, Google,
TikTok, or LinkedIn, the ad platform increasingly requires
documentation of:

1. Who owns the content
2. Who appears in the content
3. Whether anyone is impersonated
4. What rights the advertiser holds

Nucleus provides a **chain-of-title document** for any delivered
variant:

```json
{
  "variant_id": "...",
  "tenant_id": "...",
  "created_at": "...",
  "owned_by": "tenant",
  "providers_used": [
    {"name": "veo-3.1-fast", "license": "commercial"},
    {"name": "elevenlabs-ivc", "license": "commercial"},
    {"name": "lyria", "license": "commercial"}
  ],
  "personas_appearing": [
    {"type": "stock_avatar", "source": "heygen", "consent": "pre_licensed"}
  ],
  "voices_used": [
    {"clone_id": "...", "consent_artifact": "s3://.../consent.pdf"}
  ],
  "watermarks_present": ["c2pa", "elevenlabs_audio"],
  "ad_platform_compliance": {
    "meta": "compliant",
    "google_ads": "compliant",
    "tiktok": "compliant",
    "linkedin": "compliant"
  }
}
```

The chain-of-title document is auto-generated and accompanies every
delivered variant. Customers attach it to ad submissions where
required.

## What this page doesn't cover

- **Open-source model output rights.** Self-hosted models (LTX-2.3,
  CogVideoX) have different ownership terms. Covered in the
  [stack diffusion-video page](../stack/diffusion-video.md).
- **Trademark infringement.** Generating content that uses a
  competitor's trademarks is the customer's responsibility under
  the host's TOS.
- **Trade dress and product packaging.** Same as trademark.
- **Copyright in source recordings.** Source recordings are the
  customer's own IP; Nucleus assumes the customer has the rights to
  the recordings they upload.
- **Music royalties.** Lyria-generated music is royalty-free;
  Suno-generated music is subject to ongoing legal questions.

## When to revisit

This page should be re-read whenever:

- A provider changes its commercial terms
- A new state right-of-publicity law passes
- An ad platform changes its content provenance requirements
- A new watermarking standard gains adoption
- A customer requests a custom IP arrangement (e.g., joint
  ownership, NDAs on output)
