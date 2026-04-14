# Nucleus ComfyUI execution service
#
# Runs ComfyUI's HTTP + WebSocket API on port 8188 so the Nucleus backend
# can drive open-weights diffusion/audio workflows (SVD, AnimateDiff,
# LTX-Video, SDXL, MusicGen, Whisper, ...).
#
# This image uses the python:3.11-slim base for CPU-only dev on Mac. For
# production GPU inference, swap the FROM line to:
#
#     FROM nvidia/cuda:12.1-runtime-ubuntu22.04
#
# and add `apt-get install -y python3.11 python3-pip` + install torch with
# CUDA wheels before the ComfyUI requirements install.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        ffmpeg \
        ca-certificates \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Pin ComfyUI to a specific commit in production; for now track main.
RUN git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git /app/comfyui

# Torch CPU wheels (swap for CUDA wheels in the GPU image).
RUN pip install --index-url https://download.pytorch.org/whl/cpu \
        torch torchvision torchaudio \
    && pip install -r /app/comfyui/requirements.txt

# Widely-used custom nodes. These load at ComfyUI startup; any missing deps
# in their own requirements.txt are installed here too.
RUN set -eux; \
    cd /app/comfyui/custom_nodes; \
    for repo in \
        https://github.com/ltdrdata/ComfyUI-Manager.git \
        https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git \
        https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved.git \
        https://github.com/Kosinkadink/ComfyUI-Advanced-ControlNet.git \
        https://github.com/cubiq/ComfyUI_essentials.git ; do \
        git clone --depth 1 "$repo" || true; \
    done; \
    for req in */requirements.txt; do \
        [ -f "$req" ] && pip install -r "$req" || true; \
    done

RUN mkdir -p /tmp/nucleus/comfyui-out /tmp/nucleus/comfyui-in

EXPOSE 8188

# NOTE: ComfyUI is currently unauthenticated. When we add an API key later,
# wire it through here (e.g. a reverse-proxy sidecar) and in the client.
CMD ["python", "/app/comfyui/main.py", \
     "--listen", "0.0.0.0", \
     "--port", "8188", \
     "--output-directory", "/tmp/nucleus/comfyui-out", \
     "--input-directory", "/tmp/nucleus/comfyui-in"]
