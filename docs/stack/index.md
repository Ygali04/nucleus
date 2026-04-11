# Stack Evaluation

This section is the technical-stack evaluation for the components
Nucleus depends on. Each page evaluates the candidates, applies a
decision rubric, and locks in a recommendation. The recommendations
shape what gets built into the engine versus what gets called as a
service.

## What's in this section

| Page | Subject |
|---|---|
| [Composition](composition.md) | OSS video composition tools (Remotion, Revideo, MLT, FFmpeg, MoviePy, others) |
| [Diffusion video](diffusion-video.md) | Generative video providers (Veo 3.1, Seedance, Kling, Runway, Luma, Pika, others) |
| [Avatar, voice, music](avatar-voice-music.md) | HeyGen, Tavus, ElevenLabs, Lyria, Suno, and the 30+ alternatives |
| [Decisions per archetype](decisions.md) | The actual stack each Nucleus archetype runs |

## How the evaluations were done

Each page started with a 17-dimension rubric (license, paradigm,
quality, latency, cost, brand safety, etc.) applied uniformly to
every candidate. The methodology, the scoring, and the citations live
in the unabridged research files in `research/`:

- `research/stack-composition.md`
- `research/stack-diffusion-video.md`
- `research/stack-avatar-voice-music.md`

The pages in this section are the condensed conclusions, written for
operators making decisions, not for researchers compiling references.

## The TL;DR

| Layer | Pick | Backup |
|---|---|---|
| Composition | **Remotion** (programmatic React video) | Revideo (MIT license, slower momentum) |
| Fast-path composition | **FFmpeg + ffmpeg-python** | typed-ffmpeg |
| Pre-processor | **Auto-Editor** (silence removal, trim) | None |
| Educational diagrams | **Manim CE + Mermaid** | None |
| Diffusion B-roll (top quality) | **Google Veo 3.1** | Runway Gen-4.5 |
| Diffusion B-roll (cost-optimized) | **Seedance 2.0 Lite** | Veo 3.1 Lite |
| Character consistency across cuts | **Runway Gen-4 References** or **Kling 3.0** | Luma Ray 3 Modify |
| Self-host diffusion (commercial-clean) | **LTX-2.3** | CogVideoX |
| Avatar talking head | **HeyGen Avatar IV** (via TruPeer's existing partnership) | Tavus (for conversational), Synthesia (enterprise) |
| Voice cloning | **ElevenLabs IVC** | Cartesia Sonic 2 |
| Music | **Google Lyria 2** | Suno v4 |
| Open-source voice fallback | **F5-TTS** | Coqui XTTS |
| Open-source music fallback | **Stable Audio 2** | MusicGen |

The decisions page maps each archetype (demo, marketing, knowledge,
education) to the specific subset of these tools the engine actually
calls.

## Why a stack page exists

Three reasons.

### 1. Make the lock-in posture explicit

Every external dependency is a future migration risk. Documenting the
choice plus the backup makes that risk auditable.

### 2. Make the OEM conversation easy

When a host product asks "what AI does Nucleus use under the hood",
this section is the answer. No marketing handwaving.

### 3. Make the cost model legible

Every choice has a cost per call. The [pricing page](../gtm/pricing.md)
lives downstream of these decisions.

## What's not on the stack

A short list of things considered and rejected:

- **Sora 2.** OpenAI is shutting Sora 2's API down on September 24,
  2026. Any pipeline built on it has a ~5-month runway. Not a viable
  long-term dependency. (See [diffusion video](diffusion-video.md).)
- **Shotstack Studio SDK.** PolyForm Shield license explicitly
  prohibits competitive use. Disqualifying.
- **DaVinci Resolve scripting.** Headless server-farm use is
  legally fuzzy under Blackmagic's terms.
- **Editly.** Bus-factor-1 maintenance, no npm release in 2025.
  Quality is fine; sustainability is not.
- **Olive, Kdenlive (as compositors), OpenShot Qt.** GUI-first.
  Not viable as headless workers.
- **Motion Canvas (without Revideo).** Headless rendering is not
  first-class. Use Revideo instead if you want this paradigm.
