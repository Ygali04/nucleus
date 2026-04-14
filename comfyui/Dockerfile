# Nucleus ComfyUI orchestration service
#
# ComfyUI here is an API-proxy layer: it runs the DAG executor, caching, and
# progress streaming, and delegates all generation to closed-source hosted
# providers (fal.ai, ElevenLabs, ...) via custom nodes. No GPU, no model
# weights — the image stays small and starts fast.
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

RUN git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git /app/comfyui \
    && pip install -r /app/comfyui/requirements.txt

# API-proxy custom nodes only. See comfyui/README.md for what each provides.
RUN set -eux; \
    cd /app/comfyui/custom_nodes; \
    for repo in \
        https://github.com/ltdrdata/ComfyUI-Manager.git \
        https://github.com/gokayfem/ComfyUI-fal-API.git \
        https://github.com/GiusTex/ComfyUI-ElevenLabs.git \
        https://github.com/if-ai/ComfyUI-IF_AI_tools.git ; do \
        git clone --depth 1 "$repo"; \
    done; \
    for req in */requirements.txt; do \
        [ -f "$req" ] && pip install -r "$req" || true; \
    done

RUN mkdir -p /tmp/nucleus/comfyui-out /tmp/nucleus/comfyui-in

EXPOSE 8188

CMD ["python", "/app/comfyui/main.py", \
     "--listen", "0.0.0.0", \
     "--port", "8188", \
     "--cpu", \
     "--output-directory", "/tmp/nucleus/comfyui-out", \
     "--input-directory", "/tmp/nucleus/comfyui-in"]
