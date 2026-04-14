# ComfyUI service

ComfyUI here is an **orchestration layer** that proxies closed-source hosted
API providers. It gives us DAG execution, result caching, and WebSocket
progress streaming on top of custom nodes that call out to fal.ai,
ElevenLabs, and friends. **No GPU or model downloads required.**

## Installed custom nodes

- `ComfyUI-Manager` — runtime node/model management UI.
- `ComfyUI-fal-API` — fal.ai proxy. Provides Kling 1.6, Kling 2.1,
  Seedance 1 Pro, Veo 3, Runway Gen-3 / Gen-4, Luma Dream Machine,
  Hailuo 02, Flux, Stable Audio 2.
- `ComfyUI-ElevenLabs` — ElevenLabs TTS and voice cloning.
- `ComfyUI-IF_AI_tools` — OpenAI / Anthropic LLM nodes, useful for
  Ruflo-driven prompt refinement inside workflows.

## Required environment variables

Set these on the host; `docker-compose.yml` passes them into the container:

- `FAL_KEY` — fal.ai key (Kling, Seedance, Veo, Runway, Luma, Hailuo, Flux,
  Stable Audio).
- `ELEVENLABS_API_KEY` — ElevenLabs voice.

## Adding more providers

Open http://localhost:8188 and use the ComfyUI-Manager UI to install more
custom nodes. When you add a new API-proxy node, WU-X2's translators also
need updating so the backend emits the right workflow JSON for it.

## Outputs and inputs

- `/tmp/nucleus/comfyui-out` — final renders. Bind-mounted so the Nucleus
  worker can read them directly when we skip the HTTP fetch.
- `/tmp/nucleus/comfyui-in` — inputs (init images, reference audio).
  Upload via `POST /upload/image` or drop files into the mount.

## Ports

- `8188` — HTTP API (`/prompt`, `/history`, `/view`, `/queue`,
  `/object_info`) and WebSocket (`/ws?clientId=...`).

## Authentication

ComfyUI is currently unauthenticated. The Nucleus Python client leaves a hook
for a future `COMFYUI_API_KEY` header once we wrap the service in an
auth proxy.
