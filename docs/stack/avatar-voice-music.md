# Avatar, Voice, Music

This page covers the three media-generation layers that turn a script
into a finished variant: avatars (talking-head video), voice
synthesis, and music. Each layer has 5–15 viable providers in 2026;
the page picks the primary, the backup, and explains why.

## Avatar / talking-head

### The decision

**Primary: HeyGen Avatar IV (via host's existing partnership).
Conversational fallback: Tavus.
Enterprise alternative: Synthesia.
Self-host: SadTalker / Hallo3 (research-grade only).**

### Why HeyGen

Three reasons.

1. **Scale and quality.** Avatar IV ships full-body motion, gesture,
   and hand movement — not just talking-head shots. 1,100+ stock
   avatars across genders, ethnicities, and styles. 175-language
   voice cloning. Batch generation (one script × N avatars = 25+
   variants in one pass).
2. **Brand governance.** Brand Hub 2.0 auto-imports brand colors and
   logos from a URL. Brand Glossary controls how product terms are
   pronounced and translated.
3. **Existing TruPeer partnership.** TruPeer already ships a public
   `/heygen` partnership page. Nucleus calls HeyGen through TruPeer's
   existing integration with no new contract required.

### Why Tavus is the backup

Tavus is the leader in **conversational** video AI — sub-600ms
latency, real-time persona-driven interactions, dedicated developer
API. For batch ad work, it's a fine alternative to HeyGen, but its
true differentiator is conversational use cases (live demos, lead
qualification flows, interactive product walkthroughs).

For Nucleus's marketing archetype today, HeyGen wins on per-call cost
and existing partnership. For a future use case where the variant
needs to feel interactive (e.g., embedded inside a customer's lead
form), Tavus is the answer.

### Why not Synthesia

Synthesia is excellent at the enterprise procurement game: 240+
avatars, ~140 languages, deep brand kits, SSO, customer-managed keys,
SOC 2 / ISO 27001. The downside is the avatars feel "boardroom"
rather than "TikTok" — they're optimized for L&D and internal
training, not for performance marketing.

For Nucleus knowledge-archetype variants going to a corporate LMS,
Synthesia is a credible option. For the marketing archetype going to
paid social, HeyGen is a better fit.

### Provider summary

| Provider | Latency | Cost | Quality | Best for | Notes |
|---|---|---|---|---|---|
| **HeyGen Avatar IV** | 1–3 min | ~$0.15/clip | Top tier | Marketing variants, batch UGC | Existing TruPeer partnership |
| **Tavus** | <600ms (live), 2–5 min (batch) | ~$0.20/min batch | Top tier | Conversational variants, lead qualification | RAG-powered personas |
| **Synthesia** | 2–8 min | $30–$90/mo per video minute | Top tier | Enterprise L&D, training, internal comms | Procurement-friendly |
| **D-ID** | 30–90 sec | $0.15–$0.30/clip | Mid-tier | Lower-cost talking heads | Quality lags HeyGen |
| **Akool** | 30–90 sec | Credit-based | Mid-tier | Face swap, lip sync | Good for video translation |
| **Hour One** | 2–5 min | Enterprise | Top tier | Enterprise virtual humans | Closest competitor to Synthesia |
| **Colossyan** | 1–3 min | Mid-tier | Mid-tier | Corporate explainers | Smaller library |
| **SadTalker / Hallo3 (open source)** | Variable | Self-host | Research-grade | Lab/research | Not production-ready |

## Voice synthesis

### The decision

**Primary: ElevenLabs IVC (Instant Voice Clone).
Backup: Cartesia Sonic 2.
Open-source fallback: F5-TTS.**

### Why ElevenLabs

Three reasons.

1. **Quality of voice cloning.** ElevenLabs IVC accepts a 1-minute
   sample and produces a usable clone. Professional Voice Clone
   (PVC) trains a higher-quality voice from longer samples. Both are
   the industry-standard voice clone quality bar.
2. **Multi-language support.** v3 ships with 30+ languages with
   accurate accent rendering. The Multilingual v2 model handles 28
   languages with prosody preservation.
3. **TruPeer already uses it.** TruPeer's existing "studio-quality
   voiceover" is built on ElevenLabs (or an equivalent — confirmed in
   the TruPeer research). Nucleus reuses the existing voice clones
   from each tenant's Brand Kit; no new onboarding step.

### Why Cartesia is the backup

Cartesia Sonic 2 is the lowest-latency commercial voice synthesizer
(<200ms first-byte for streaming). For real-time conversational use
cases, it's faster than ElevenLabs. For Nucleus's batch use case,
the latency difference doesn't matter — but if the engine ever needs
real-time voice (live narration during a demo), Cartesia is the swap.

### Open-source fallback

For tenants requiring fully self-hosted inference:

- **F5-TTS** — high-quality non-autoregressive TTS, MIT license,
  active development
- **Coqui XTTS** — multi-lingual, voice cloning, MPL 2.0
- **OpenVoice** — voice cloning with style control, MIT
- **Bark** (Suno) — generative speech with prosody, MIT
- **MaskGCT** — high-quality, AGPL (license caveat)

F5-TTS is the strongest commercial-friendly option in this set.

### Provider summary

| Provider | Per-1k chars | Languages | Voice clone | Best for |
|---|---|---|---|---|
| **ElevenLabs v3** | ~$0.30 | 30+ | IVC + PVC | Default, all archetypes |
| **Cartesia Sonic 2** | ~$0.20 | 15+ | Yes | Real-time / sub-200ms |
| **PlayHT 3.0** | ~$0.30 | 30+ | Yes | Mid-tier alternative |
| **Hume AI EVI / Octave** | ~$0.40 | 11 | Limited | Emotion-rich |
| **Resemble AI** | ~$0.30 | 60+ | Yes | Voice cloning specialist |
| **Google Gemini TTS / Chirp** | ~$0.10 | 100+ | Limited | Cost-optimized batch |
| **OpenAI gpt-4o-tts** | ~$0.15 | 50+ | No | OpenAI ecosystem |
| **Azure Neural TTS** | ~$0.16 | 140+ | Yes (custom) | Enterprise + compliance |
| **Amazon Polly** | ~$0.16 | 60+ | Yes (Brand) | AWS shops |
| **F5-TTS (OSS)** | Self-host | 10+ | Yes | Self-host |
| **Coqui XTTS (OSS)** | Self-host | 17 | Yes | Self-host |
| **Bark (Suno OSS)** | Self-host | 13 | Limited | Self-host |

## Music

### The decision

**Primary: Google Lyria 2.
Backup: Suno v4.
Open-source fallback: Stable Audio 2 / MusicGen.**

### Why Lyria

Three reasons.

1. **Brand safety.** Lyria is trained on licensed datasets and
   doesn't generate output that overlaps with copyrighted recordings.
   For paid ads where the brand needs clean rights, this matters.
2. **Cost.** ~$0.01/clip for a 30-second music bed is the cheapest
   commercial option that produces brand-safe output.
3. **Google integration.** Available through the same Vertex AI / 
   Gemini API the engine already uses for Veo. One auth, one
   billing line, one SDK.

### Why Suno is the backup

Suno v4 is the highest-quality consumer music generator. It produces
full songs with vocals, more emotionally rich than Lyria. The
trade-off is brand-safety: Suno's training data has been the subject
of multiple ongoing lawsuits, and brand customers are reasonably
nervous about using its output in paid ads.

For knowledge and education archetypes (where the music is a quiet
bed and not the centerpiece), Lyria is the right choice. For a
specific marketing variant where the brand wants vocal hooks and
explicit emotional rises, Suno is an option behind a per-tenant flag.

### Provider summary

| Provider | Cost | Vocal? | Brand safety | Best for |
|---|---|---|---|---|
| **Google Lyria 2** | ~$0.01/clip | Instrumental | Strong | Default music bed |
| **Suno v4** | $10–$30/mo subscription | Vocals | Concerns | Vocal-heavy creative |
| **Udio** | $10–$30/mo | Vocals | Concerns | Same as Suno |
| **Mubert** | API per-track | Instrumental | Strong | Royalty-free batch |
| **AIVA** | API per-track | Instrumental | Strong | Classical / orchestral |
| **SoundDraw** | API per-track | Instrumental | Strong | Mid-tier alternative |
| **Loudly** | API per-track | Instrumental | Strong | Genre-specific |
| **Stable Audio 2** | Self-host (OSS) | Instrumental | Self-host | Self-host fallback |
| **Meta MusicGen / AudioCraft** | Self-host (OSS) | Instrumental | Self-host | Self-host fallback |
| **Riffusion** | Self-host (OSS) | Instrumental | Self-host | Self-host fallback |

## Combined cost per variant

Voice + music cost per finished 60-second variant at Nucleus's target
volume:

| Layer | Per variant cost |
|---|---|
| Voice (ElevenLabs IVC, ~150 chars/sec × 60s = 9k chars) | $0.027 |
| Music (Lyria, 30s bed) | $0.01 |
| **Voice + music total** | **~$0.04** |

This is small relative to the diffusion video layer (~$0.40) and the
avatar layer (~$0.15). Voice and music are not where the cost
optimization lives — quality and consistency matter more here.

## Risk callouts

| Risk | Mitigation |
|---|---|
| ElevenLabs price increase | Cartesia is the swap; voice clones are portable |
| Suno lawsuit outcome forces a content takedown | Lyria is the default; Suno is gated behind a per-tenant flag |
| HeyGen partnership terms change | Direct HeyGen API contract as fallback; Tavus and Synthesia as alternatives |
| Open-source voice quality plateau | F5-TTS is improving fast; revisit quarterly |
| Lyria deprecation | Mubert / AIVA / Stable Audio as fallbacks |

## When to revisit

The avatar-voice-music layer should be revisited:

- Quarterly across all three categories
- Whenever a provider ships a new model version
- Whenever a brand-safety lawsuit affects a provider's output
- Whenever a customer requests a self-host deployment (triggers OSS
  evaluation)
