# AI Model Provider Pricing Research

**Last updated:** 2026-04-10

---

## Table of Contents

1. [Kling AI (Video Generation)](#1-kling-ai-video-generation)
2. [Seedance / ByteDance (Video Generation)](#2-seedance--bytedance-video-generation)
3. [MagiHuman / daVinci-MagiHuman (Human Video Generation)](#3-magihuman--davinci-magihuman-human-video-generation)
4. [ElevenLabs (Voice Synthesis + Cloning)](#4-elevenlabs-voice-synthesis--cloning)
5. [Music Generation APIs](#5-music-generation-apis)
6. [F5-TTS (Self-Hosted Text-to-Speech)](#6-f5-tts-self-hosted-text-to-speech)
7. [Cheapest Kling 3.0 Access Summary](#7-cheapest-kling-30-access-summary)
8. [Cheapest Seedance 2.0 Access Summary](#8-cheapest-seedance-20-access-summary)

---

## 1. Kling AI (Video Generation)

### Official API (Kuaishou / KlingAI)

| Detail | Info |
|--------|------|
| **Provider** | Kling AI (Kuaishou) |
| **URL** | https://klingai.com/global/dev/pricing |
| **Endpoint** | `https://api.klingai.com/v1/videos/...` |
| **Pricing model** | Credits per second of video |
| **Free tier** | 66 credits/day (replenished every 24h), ~3-6 short videos, 720p with watermark |
| **Paid plans** | Standard $6.99/mo (660 credits), Pro $25.99/mo (3,000), Premier $64.99/mo (8,000), Ultra $180/mo (26,000) |

**Kling 3.0 Official Credit Costs (per second of output video):**

| Mode | 720p | 1080p |
|------|------|-------|
| No Audio | 6 credits/s | 8 credits/s |
| Native Audio | 9 credits/s | 12 credits/s |
| Voice Control add-on | +2 credits/s | +2 credits/s |

Approximate credit-to-dollar rate: ~$0.028/credit (based on plan pricing analysis).

**Python SDK:**
- Package: `pip install kling` (community SDK by TechWithTy)
- GitHub: https://github.com/TechWithTy/kling
- Type-safe, async/await, Pydantic v2 validation
- Not an official Kuaishou SDK -- use REST API for official access

### fal.ai (Kling 3.0)

| Detail | Info |
|--------|------|
| **Provider** | fal.ai |
| **URL** | https://fal.ai/kling-3 |
| **Endpoint** | `fal-ai/kling-video/v3/pro/text-to-video` and `fal-ai/kling-video/v3/standard/text-to-video` |
| **Payment** | Pay-as-you-go, no subscription |
| **Free tier** | $10 free credits on signup |

**fal.ai Kling 3.0 Pricing (per second):**

| Model | Audio Off | Audio On | Audio + Voice Control |
|-------|-----------|----------|----------------------|
| V3 Standard | $0.084/s | $0.126/s | $0.154/s |
| V3 Pro | $0.112/s | $0.168/s | $0.196/s |
| O3 Standard | $0.084/s | $0.112/s | -- |

**Older Kling versions on fal.ai:**
- Kling 2.5 Turbo Pro: $0.07/s
- Kling 2.6 Pro: $0.07/s (audio off), $0.14/s (audio on)

**Python SDK:**
```bash
pip install fal-client
```
```python
import fal_client
result = fal_client.run("fal-ai/kling-video/v3/pro/text-to-video", arguments={
    "prompt": "A cat walking through a garden",
    "duration": 5
})
```
Set `FAL_KEY` environment variable for auth.

### Atlas Cloud

| Detail | Info |
|--------|------|
| **Provider** | Atlas Cloud |
| **URL** | https://www.atlascloud.ai/collections/kling |
| **Payment** | Pay-as-you-go with 15% volume discount |

**Atlas Cloud Kling Pricing (per second):**

| Model | Regular | Discounted (-15%) |
|-------|---------|-------------------|
| Kling v2.5 Turbo Pro | $0.07/s | $0.06/s |
| Kling v2.1 i2v Pro | $0.09/s | $0.076/s |
| Kling v2.1 Master | $0.26/s | $0.221/s |
| Kling v1.6 Standard | $0.045/s | $0.038/s |

Note: Kling 3.0 on Atlas Cloud was listed as "Coming Soon" at time of research, with projected pricing starting at $0.126/s for Pro tier.

### EvoLink

| Detail | Info |
|--------|------|
| **Provider** | EvoLink |
| **URL** | https://evolink.ai |
| **Pricing** | Kling 3.0 T2V/I2V: **$0.075/s**, O3 reference/edit: $0.1125/s |

This is the cheapest Kling 3.0 per-second rate found.

### PiAPI

| Detail | Info |
|--------|------|
| **Provider** | PiAPI |
| **URL** | https://piapi.ai/kling-api |
| **Notes** | Claims lower cost than official API, supports 20+ concurrent jobs (vs 5 on official) |

### Replicate

| Detail | Info |
|--------|------|
| **Provider** | Replicate |
| **URL** | https://replicate.com/kwaivgi/kling-v2.0 |
| **Pricing** | ~$0.25 per 5-second video (older models); Kling 3.0 availability unclear as of April 2026 |

---

## 2. Seedance / ByteDance (Video Generation)

### Is Seedance 2.0 Available via API?

**Yes.** Seedance 2.0 launched February 12, 2026. API access went live April 2, 2026 through Volcengine Ark. Available on fal.ai as of April 9, 2026.

Seedance 2.0 is the first major video model to accept four input modalities simultaneously (text, images, audio, video) with up to 12 reference files per request.

### BytePlus API (Official International)

| Detail | Info |
|--------|------|
| **Provider** | BytePlus (ByteDance international arm) |
| **URL** | https://www.byteplus.com/en/product/seedance |
| **Endpoint** | `POST https://api.byteplus.com/seedance/v1/videos` |
| **Status check** | `GET https://api.byteplus.com/seedance/v1/videos/{job_id}` |
| **Payment** | Pay-as-you-go |

**BytePlus Seedance Pricing (estimated):**

| Resolution | Cost/Second | 5-Second Video |
|------------|-------------|----------------|
| 720p | ~$0.01-$0.02/s | ~$0.05-$0.10 |
| 1080p | ~$0.05-$0.10/s | ~$0.25-$0.50 |
| 2K | ~$0.10-$0.15/s | ~$0.50-$0.75 |

### Volcengine (Official China)

| Detail | Info |
|--------|------|
| **Provider** | Volcengine (Ark platform) |
| **URL** | https://www.volcengine.com |
| **Pricing** | Starting at ~$0.10/min (~$0.0017/s at low end) |
| **Python SDK** | `pip install volcengine` or `pip install volcengine-python-sdk` |
| **Note** | Requires Chinese phone number / business entity for registration |

### fal.ai (Seedance 2.0)

| Detail | Info |
|--------|------|
| **Provider** | fal.ai |
| **URL** | https://fal.ai/seedance-2.0 |
| **Endpoint** | `bytedance/seedance-2.0/text-to-video` |
| **Live since** | April 9, 2026 |

**fal.ai Seedance 2.0 Pricing:**

| Tier | 720p |
|------|------|
| Standard | $0.3034/s |
| Fast | $0.2419/s |

Plus token-based charge: $0.014 per 1,000 tokens (tokens = height x width x duration x 24 / 1024).

Note: fal.ai pricing for Seedance 2.0 is significantly higher than BytePlus/third-party options.

### EvoLink (Seedance 2.0)

| Detail | Info |
|--------|------|
| **Provider** | EvoLink |
| **URL** | https://evolink.ai |

**EvoLink Seedance 2.0 Pricing:**

| Tier | 480p | 720p |
|------|------|------|
| Standard | $0.071/s | $0.153/s |
| Fast | $0.057/s | $0.124/s |

### Atlas Cloud (Seedance)

| Detail | Info |
|--------|------|
| **Provider** | Atlas Cloud |
| **Seedance 1.5 Pro (Fast)** | $0.022/s |
| **Seedance 2.0 Fast** | $0.022/s (claimed 91% cheaper than Pro tier) |

**Python SDK for Seedance:**
```bash
pip install volcengine          # Official Volcengine SDK
pip install volcengine-python-sdk  # Alternative
pip install requests            # For BytePlus REST API (no dedicated SDK)
```

Community wrapper: https://github.com/Anil-matcha/Seedance-2.0-API

**fal.ai access:**
```bash
pip install fal-client
```
```python
import fal_client
result = fal_client.run("bytedance/seedance-2.0/text-to-video", arguments={
    "prompt": "A woman walking through a park",
    "duration": 5,
    "resolution": "720p"
})
```

### Consumer Access (Dreamina)

- Dreamina Basic: 69 RMB/month (~$9.60 USD)
- Free tier: 225 daily tokens (shared across tools), ~1-2 short videos/day

---

## 3. MagiHuman / daVinci-MagiHuman (Human Video Generation)

### What Is MagiHuman?

**The correct name is "daVinci-MagiHuman"** by GAIR (in collaboration with Sand.ai). It is:
- A 15-billion parameter open-source model (Apache 2.0 license)
- Generates synchronized talking-head video + audio from a single image + text/audio prompt
- Produces lip-synced video with natural expressions and head motion
- Generates 5-second video in ~2 seconds on a single H100
- Available on Hugging Face: https://huggingface.co/GAIR/daVinci-MagiHuman
- GitHub: https://github.com/GAIR-NLP/daVinci-MagiHuman

Not to be confused with: MagiAnimate (Alibaba, image animation), MagicAvatar (different project), or Magic Human.

### WaveSpeedAI (Primary API Provider)

| Detail | Info |
|--------|------|
| **Provider** | WaveSpeedAI |
| **URL** | https://wavespeed.ai/models/wavespeed-ai/davinci-magihuman/image-to-video |
| **Auth** | Bearer token: `Authorization: Bearer ${WAVESPEED_API_KEY}` |

**Endpoints:**
- Image-to-Video: `POST https://api.wavespeed.ai/api/v3/wavespeed-ai/davinci-magihuman/image-to-video`
- Text-to-Video: `POST https://api.wavespeed.ai/api/v3/wavespeed-ai/davinci-magihuman/text-to-video`

**Pricing (per second):**

| Resolution | Image-to-Video | Text-to-Video |
|------------|----------------|---------------|
| 256p | $0.02/s | $0.03/s |
| 720p | $0.03/s | $0.04/s |
| 1080p | $0.04/s | $0.05/s |

Duration: 5-10 seconds in 1-second increments. A 5s 720p I2V video = $0.15.

**Python SDK:** WaveSpeedAI uses REST API with `requests`. No dedicated pip package found.

```python
import requests

response = requests.post(
    "https://api.wavespeed.ai/api/v3/wavespeed-ai/davinci-magihuman/image-to-video",
    headers={"Authorization": f"Bearer {WAVESPEED_API_KEY}"},
    json={
        "image": "https://example.com/portrait.jpg",
        "prompt": "Person speaking about technology",
        "duration": 5,
        "resolution": "720p"
    }
)
```

### fal.ai (MagiHuman)

| Detail | Info |
|--------|------|
| **Provider** | fal.ai |
| **URL** | https://fal.ai/models/fal-ai/davinci-magihuman/api |
| **Endpoint** | `fal-ai/davinci-magihuman` |
| **Pricing** | $0.05/s |

```python
import fal_client
result = fal_client.run("fal-ai/davinci-magihuman", arguments={
    "prompt": "A woman says 'Hello, welcome to our channel'",
    "image_url": "https://example.com/portrait.jpg"
})
```

### Self-Hosting (Open Source)

Since daVinci-MagiHuman is Apache 2.0, you can self-host:
- Model weights: https://huggingface.co/GAIR/daVinci-MagiHuman
- Requires ~1x H100 GPU for real-time inference
- 15B parameters

---

## 4. ElevenLabs (Voice Synthesis + Cloning)

### Provider Info

| Detail | Info |
|--------|------|
| **Provider** | ElevenLabs |
| **URL** | https://elevenlabs.io |
| **API Docs** | https://elevenlabs.io/docs/api-reference/introduction |
| **API Base** | `https://api.elevenlabs.io/v1/` |

### Python SDK

```bash
pip install elevenlabs
```
Latest release: April 7, 2026. Requires Python >= 3.8.

```python
from elevenlabs.client import ElevenLabs
from elevenlabs import play

client = ElevenLabs(api_key="YOUR_API_KEY")

# Text-to-Speech
audio = client.text_to_speech.convert(
    text="Hello world",
    voice_id="JBFqnCBsd6RMkjVDRZzb",
    model_id="eleven_multilingual_v2"
)

# Instant Voice Clone (IVC)
voice = client.voices.ivc.create(
    name="My Voice",
    description="Custom cloned voice",
    files=["./sample_0.mp3", "./sample_1.mp3", "./sample_2.mp3"],
)
```

### Consumer Plan Pricing

| Plan | Price | Credits/Month | IVC | PVC |
|------|-------|---------------|-----|-----|
| Free | $0 | 10,000 chars | No | No |
| Starter | $5/mo | 30,000 chars | Yes | No |
| Creator | $22/mo (first month, then $99) | 100,000 chars | Yes | Yes |
| Pro | $99/mo | 500,000 chars | Yes | Yes |
| Scale | $330/mo | 2,000,000 chars | Yes | Yes |

IVC = Instant Voice Clone (1-5 min audio sample)
PVC = Professional Voice Clone (30 min+ audio, 3 hrs optimal)

### API-Specific Pricing (Pay-As-You-Go)

| Model | Cost per 1,000 Characters |
|-------|--------------------------|
| Flash / Turbo v2.5 | $0.06 |
| Multilingual v2 / v3 | $0.12 |

**Credit system:** 1 credit = 1 character (Multilingual v2), or 1 credit = 2 characters (Flash/Turbo models).

### API Subscription Tiers

| Tier | Price | Credits |
|------|-------|---------|
| API Free | $0 | 10 credits/mo |
| API Pro | $99/mo | 100 credits |
| API Scale | $330/mo | 660 credits |

### Voice Cloning Costs

- **Instant Voice Clone (IVC):** No additional cost beyond the per-character TTS cost. Requires Starter plan ($5/mo) minimum. Upload 1-5 minutes of clean audio.
- **Professional Voice Clone (PVC):** No additional cost beyond plan, but requires Creator plan ($22-99/mo) minimum. Upload 30+ minutes of audio.

### Other Audio Services

| Service | Price |
|---------|-------|
| Speech-to-Text (Scribe v1/v2) | $0.22/hour |
| Speech-to-Text Realtime (Scribe v2) | $0.39/hour |

---

## 5. Music Generation APIs

### Google Lyria (Vertex AI) -- Cheapest Commercial Option

| Detail | Info |
|--------|------|
| **Provider** | Google Cloud (Vertex AI) |
| **URL** | https://cloud.google.com/vertex-ai/generative-ai/docs/music/generate-music |
| **Models** | Lyria 2 (GA), Lyria 3 (newer), Lyria 3 Pro (newest) |
| **Access** | Standard Vertex AI API -- requires GCP project + billing |

**Endpoint:**
```
POST https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/lyria-002:predict
```

**Pricing:**

| Model | Price |
|-------|-------|
| Lyria 2 | $0.06 per 30-second clip ($0.002/s) |
| Lyria 3 | Token-based, not yet publicly priced |
| Lyria 3 Pro | Enterprise-negotiated, not publicly priced |

**Output:** 30-second WAV clips at 48kHz sample rate.

**Python SDK:**
```bash
pip install google-cloud-aiplatform
```
```python
from google.cloud import aiplatform

aiplatform.init(project="your-project", location="us-central1")
# Use the prediction client for Lyria endpoint
```

**Free tier:** GCP offers $300 free credits for new accounts. No Lyria-specific free tier.

### ACE-Step 1.5 (Open Source / Self-Hosted -- Cheapest Overall)

| Detail | Info |
|--------|------|
| **Provider** | Self-hosted (open source) |
| **URL** | https://github.com/ace-step/ACE-Step-1.5 |
| **License** | Open source |
| **Cost** | Free (only GPU cost) |

**Setup:**
```bash
# Install uv package manager
curl -LsSf https://astral.sh/uv/install.sh | sh

# Clone and install
git clone https://github.com/ACE-Step/ACE-Step-1.5.git
cd ACE-Step-1.5
uv sync

# Launch Gradio UI
uv run acestep

# OR launch REST API server
uv run acestep-api
# API available at http://localhost:8001
```

**Hardware Requirements:**
- Minimum: ~4GB VRAM (2B model)
- Recommended: ~9GB VRAM (4B XL model for higher quality)
- Speed: <2 seconds per full song on A100, <10 seconds on RTX 3090
- Docker image available (~15 GB with pre-baked models)

**Capabilities:** Full songs up to 10 minutes, multiple genres, LoRA fine-tuning from a few songs, lyrics generation via Chain-of-Thought.

### ElevenLabs Music

| Detail | Info |
|--------|------|
| **Provider** | ElevenLabs |
| **URL** | https://elevenlabs.io |
| **Pricing** | Included in ElevenLabs plans (uses same credit pool) |
| **Python SDK** | `pip install elevenlabs` (same SDK as TTS) |

### Suno / Udio

Neither Suno nor Udio offers a public developer API as of April 2026. Consumer plans only:
- Suno: Free (limited), Pro $10/mo, Premier $30/mo
- Udio: Free (600 gen/mo), Standard $10/mo, Pro $30/mo

### Comparison Summary

| Provider | Cost per 30s clip | API Available | Self-Hostable |
|----------|-------------------|---------------|---------------|
| ACE-Step 1.5 | Free (GPU only) | Yes (local) | Yes |
| Lyria 2 (Vertex AI) | $0.06 | Yes | No |
| Lyria 3 | TBD (token-based) | Yes | No |
| ElevenLabs Music | Plan-based | Yes | No |
| Suno | N/A | No API | No |
| Udio | N/A | No API | No |

---

## 6. F5-TTS (Self-Hosted Text-to-Speech)

### Overview

F5-TTS is a fully open-source, self-hostable text-to-speech model. Zero-shot voice cloning from a short reference audio clip.

| Detail | Info |
|--------|------|
| **Provider** | Self-hosted |
| **GitHub** | https://github.com/SWivid/F5-TTS |
| **License** | Open source |
| **Cost** | Free (hardware only) |

### Installation

```bash
# Basic install
pip install f5-tts

# Development install (for training/finetuning)
git clone https://github.com/SWivid/F5-TTS.git
cd F5-TTS
pip install -e .

# Requirements
# Python 3.10+
# FFmpeg: conda install ffmpeg
# PyTorch with CUDA/ROCm/Apple Silicon
```

### Running

```bash
# Gradio web interface
f5-tts_infer-gradio --port 7860 --host 0.0.0.0

# CLI inference
f5-tts_infer-cli --model F5TTS_v1_Base \
  --ref_audio "reference.wav" \
  --ref_text "Transcription of reference audio" \
  --gen_text "Text you want to generate"
```

### Docker Deployment

```bash
docker container run --rm -it --gpus=all \
  --mount 'type=volume,source=f5-tts,target=/root/.cache/huggingface/hub/' \
  -p 7860:7860 ghcr.io/swivid/f5-tts:main
```

Docker Compose also available with GPU reservations.

### API Server

Community API server: https://github.com/ValyrianTech/F5-TTS_server (FastAPI wrapper)

### Performance

- Benchmarked on NVIDIA L20 GPUs
- TensorRT-LLM optimization available: ~0.04 RTF (real-time factor)
- MLX implementation available for Apple Silicon: https://github.com/lucasnewman/f5-tts-mlx

---

## 7. Cheapest Kling 3.0 Access Summary

| Rank | Provider | Price (per second) | Notes |
|------|----------|--------------------|-------|
| 1 | **EvoLink** | $0.075/s | Cheapest found. T2V and I2V both $0.075/s |
| 2 | **fal.ai (Standard)** | $0.084/s (no audio) | Pay-as-you-go, no subscription |
| 3 | **fal.ai (Pro)** | $0.112/s (no audio) | Higher quality tier |
| 4 | **Atlas Cloud** | ~$0.126/s (Pro, projected) | 15% volume discount available |
| 5 | **Official Kling** | ~$0.168/s (calculated) | Credit-based, ~$0.028/credit |

**Recommendation:** EvoLink at $0.075/s is the cheapest for Kling 3.0 API access. fal.ai at $0.084/s (Standard) is a close second with better SDK support via `fal-client`.

**For a 10-second Kling 3.0 video:**
- EvoLink: $0.75
- fal.ai Standard (no audio): $0.84
- fal.ai Pro (with audio + voice control): $1.96

---

## 8. Cheapest Seedance 2.0 Access Summary

| Rank | Provider | Price (per second, 720p) | Notes |
|------|----------|-----------------------------|-------|
| 1 | **Atlas Cloud (Fast)** | $0.022/s | 91% cheaper than Pro tier |
| 2 | **BytePlus (Official)** | ~$0.01-$0.02/s | Requires BytePlus account |
| 3 | **EvoLink (Fast)** | $0.057/s (480p), $0.124/s (720p) | |
| 4 | **fal.ai (Fast)** | $0.2419/s | Most expensive but best SDK |
| 5 | **fal.ai (Standard)** | $0.3034/s | Most expensive option |

**Recommendation:** BytePlus or Atlas Cloud for cheapest Seedance 2.0 access. fal.ai is 10-15x more expensive but offers the best developer experience with `fal-client` SDK.

**For a 5-second Seedance 2.0 video at 720p:**
- Atlas Cloud Fast: $0.11
- BytePlus: ~$0.05-$0.10
- EvoLink Fast: $0.62
- fal.ai Fast: $1.21

---

## Quick Reference: All Python SDKs

| Model/Provider | Package | Install Command |
|----------------|---------|-----------------|
| fal.ai (all models) | `fal-client` | `pip install fal-client` |
| ElevenLabs | `elevenlabs` | `pip install elevenlabs` |
| Kling (community) | `kling` | `pip install kling` (from GitHub) |
| Volcengine/Seedance | `volcengine` | `pip install volcengine` |
| Seedance (community) | -- | https://github.com/Anil-matcha/Seedance-2.0-API |
| Google Lyria (Vertex AI) | `google-cloud-aiplatform` | `pip install google-cloud-aiplatform` |
| F5-TTS | `f5-tts` | `pip install f5-tts` |
| ACE-Step | -- | `git clone` + `uv sync` (no pip package) |
| WaveSpeedAI (MagiHuman) | -- | REST API with `requests` |

---

## Sources

- [Kling AI Official Pricing](https://klingai.com/global/dev/pricing)
- [fal.ai Pricing](https://fal.ai/pricing)
- [fal.ai Kling 3.0](https://fal.ai/kling-3)
- [fal.ai Seedance 2.0](https://fal.ai/seedance-2.0)
- [Atlas Cloud Kling Collection](https://www.atlascloud.ai/collections/kling)
- [Atlas Cloud Seedance 2.0 Pricing](https://www.atlascloud.ai/blog/case-studies/seedance-2.0-pricing-full-cost-breakdown-2026)
- [EvoLink Kling 3.0 vs O3 Pricing](https://evolink.ai/blog/kling-3-o3-api-official-discount-pricing-developers)
- [EvoLink Seedance 2.0 Pricing](https://evolink.ai/blog/seedance-2-0-pricing-api-cost-guide)
- [BytePlus Seedance](https://www.byteplus.com/en/product/seedance)
- [NxCode Seedance 2.0 API Guide](https://www.nxcode.io/resources/news/seedance-2-0-api-guide-pricing-setup-2026)
- [ElevenLabs Pricing](https://elevenlabs.io/pricing)
- [ElevenLabs API Pricing](https://elevenlabs.io/pricing/api)
- [ElevenLabs Python SDK](https://github.com/elevenlabs/elevenlabs-python)
- [Google Lyria API Docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/lyria-music-generation)
- [Vertex AI Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)
- [ACE-Step 1.5 GitHub](https://github.com/ace-step/ACE-Step-1.5)
- [F5-TTS GitHub](https://github.com/SWivid/F5-TTS)
- [WaveSpeedAI MagiHuman](https://wavespeed.ai/models/wavespeed-ai/davinci-magihuman/image-to-video)
- [fal.ai MagiHuman](https://fal.ai/models/fal-ai/davinci-magihuman/api)
- [daVinci-MagiHuman GitHub](https://github.com/GAIR-NLP/daVinci-MagiHuman)
- [Kling Python SDK (Community)](https://github.com/TechWithTy/kling)
- [Volcengine Python SDK](https://pypi.org/project/volcengine/)
- [fal-client PyPI](https://pypi.org/project/fal-client/)
- [PiAPI Kling API](https://piapi.ai/kling-api)
