# ComfyUI service

ComfyUI is our backend execution engine for open-weights diffusion and audio
models (SVD, AnimateDiff, LTX-Video, SDXL, MusicGen, Whisper, ...). API-hosted
models (Kling, ElevenLabs, Lyria) keep their direct SDK paths — they are NOT
routed through ComfyUI.

## What's in this image

- Base: `python:3.11-slim` (CPU-only; fine for local dev on Mac)
- ComfyUI cloned from upstream `main`
- Custom nodes (cloned into `/app/comfyui/custom_nodes`):
  - `ComfyUI-Manager` — runtime node/model management UI
  - `ComfyUI-VideoHelperSuite` — video load / combine / save
  - `ComfyUI-AnimateDiff-Evolved` — AnimateDiff pipelines
  - `ComfyUI-Advanced-ControlNet` — extended ControlNet support
  - `ComfyUI_essentials` — general-purpose utility nodes

## Swapping in the GPU image for production

For production we run on an NVIDIA GPU host. Change the first line of
`Dockerfile` to:

```dockerfile
FROM nvidia/cuda:12.1-runtime-ubuntu22.04
```

and add the Ubuntu python install step before pip:

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3.11 python3.11-venv python3-pip \
    && ln -s /usr/bin/python3.11 /usr/local/bin/python
```

Then replace the CPU torch install with a CUDA build, e.g.:

```dockerfile
RUN pip install --index-url https://download.pytorch.org/whl/cu121 \
        torch torchvision torchaudio
```

The container must be launched with `--gpus all` (docker) or the equivalent
`deploy.resources.reservations.devices` block in compose.

## Where models go

ComfyUI expects model weights under `/app/comfyui/models/<category>/`.
Docker-compose mounts the named volume `nucleus-comfyui-models` there so
weights persist across rebuilds:

```
/app/comfyui/models/
  checkpoints/   # SDXL, SD1.5 .safetensors
  unet/          # standalone unets (LTX-Video, Flux)
  vae/
  clip/
  controlnet/
  animatediff_models/
  animatediff_motion_lora/
```

Drop files into the host's `nucleus-comfyui-models` volume (or bind-mount a
local directory) and restart the service — no image rebuild required.

## Outputs and inputs

- `/tmp/nucleus/comfyui-out` — final renders. Bind-mounted so the Nucleus
  worker can read them directly when we skip HTTP fetch.
- `/tmp/nucleus/comfyui-in` — inputs (init images, reference audio).
  Upload via `POST /upload/image` or drop files into the mount.

## Ports

- `8188` — HTTP API (`/prompt`, `/history`, `/view`, `/queue`, `/object_info`)
  and WebSocket (`/ws?clientId=...`).

## Authentication

ComfyUI is currently unauthenticated. The Nucleus Python client leaves a hook
for a future `COMFYUI_API_KEY` header once we wrap the service in an
auth proxy.
