# Local Development — Running Nucleus End-to-End

This guide takes you from a clean checkout to a working local stack that
can submit a brief and run the closed-loop recursive generation pipeline.

## Prerequisites

- Docker & Docker Compose
- Node 20+ (for the UI if running outside Docker)
- Python 3.11+ (for running the smoke test against the containerised API)
- ffmpeg (only needed when exercising the real clipping tools)

## 1. Start NeuroPeer (scoring service)

Nucleus expects a running NeuroPeer instance for `score_neuropeer`. It
lives in the sibling repo:

```bash
cd ../video-brainscore
docker compose up -d
```

(Skip this step when running Nucleus with `NUCLEUS_MOCK_PROVIDERS=true`
or `NUCLEUS_MOCK_SCORE=true` — mock scoring returns synthetic numbers
and does not hit NeuroPeer.)

### Per-provider mock toggles

The single `NUCLEUS_MOCK_PROVIDERS=true` kill-switch has been split into
per-provider flags so you can mix real and mock providers in one run.
Each defaults to `NUCLEUS_MOCK_PROVIDERS` when unset:

```bash
export NUCLEUS_MOCK_VIDEO=false   # real Kling/Seedance/Veo (needs FAL_KEY)
export NUCLEUS_MOCK_AUDIO=false   # real ElevenLabs (needs ELEVENLABS_API_KEY)
export NUCLEUS_MOCK_IMAGE=false   # real flux/SiliconFlow (needs SILICONFLOW_KEY)
export NUCLEUS_MOCK_MUSIC=true    # Lyria off (no Vertex creds)
export NUCLEUS_MOCK_SCORE=true    # NeuroPeer off (no local service)
export NUCLEUS_MOCK_RUFLO=true    # GLM brain off (no GLM_KEY)
```

Common dev setup: mock just the services you don't have creds for, run
everything else real. The orchestrator always routes through the Ruflo
bridge — when `NUCLEUS_MOCK_RUFLO=true` the bridge falls back to its
deterministic fallback graph instead of calling GLM.

## 2. Set environment variables (optional, real mode only)

Create `ugc-peer/.env` (or export in your shell) if you want to exercise
real providers:

```bash
export FAL_KEY=...                 # Kling, Seedance, Veo, Runway, Luma, Hailuo (via ComfyUI fal-API node)
export ELEVENLABS_API_KEY=...      # TTS (only used in direct-SDK mode)
export GOOGLE_CLOUD_PROJECT=...    # Lyria music (Vertex AI)
export ATLAS_CLOUD_API_KEY=...     # Seedance direct SDK (opt-in)
export WAVESPEED_API_KEY=...       # MagiHuman avatar video (direct SDK only)
export HF_TOKEN=...                # NeuroPeer only
```

All API keys are optional. If a key is missing for a requested provider,
that call fails loudly; the rest of the pipeline is unaffected.

### Provider routing

By default every video / audio / music request routes through a running
ComfyUI instance that calls fal.ai via the `ComfyUI-fal-API` custom-node
pack.  That means:

- `get_provider("video", "kling")` → `ComfyUIVideoProvider(subtype="kling")`
- `get_provider("video", "seedance")` → `ComfyUIVideoProvider(subtype="seedance")`
- Same for `veo`, `runway`, `luma`, `hailuo`
- `get_provider("audio", "elevenlabs")` → ComfyUI
- `get_provider("music", "stable_audio")` → ComfyUI

To fall back to the old direct-SDK path (e.g. bypass ComfyUI entirely and
call `fal_client` from the Python backend), set:

```bash
export NUCLEUS_USE_DIRECT_SDK=true
```

`MagiHuman` stays on direct-SDK regardless — there is no ComfyUI-fal-API
node for it as of 2026-04-12.

## Enabling NeuroPeer API key auth

By default, NeuroPeer's server is open. To require API keys (recommended for
production), drop this middleware into your NeuroPeer FastAPI backend at
`backend/api/main.py`:

```python
from fastapi import HTTPException, Request
from fastapi.middleware.base import BaseHTTPMiddleware

class APIKeyMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, *, allowed_keys: set[str]):
        super().__init__(app)
        self.allowed = allowed_keys

    async def dispatch(self, request: Request, call_next):
        # Skip health check
        if request.url.path in ("/health", "/api/v1/health"):
            return await call_next(request)
        key = request.headers.get("X-API-Key") or request.query_params.get("api_key")
        if not key or key not in self.allowed:
            raise HTTPException(status_code=401, detail="Missing or invalid X-API-Key")
        return await call_next(request)

# Use it
keys = set(os.environ.get("NEUROPEER_API_KEYS", "").split(",")) - {""}
if keys:
    app.add_middleware(APIKeyMiddleware, allowed_keys=keys)
```

Set `NEUROPEER_API_KEYS=key1,key2,key3` (comma-separated) in the NeuroPeer
backend's env. On the Nucleus side, set `NEUROPEER_API_KEY=<one-of-those>`.

A future enhancement would add a `/keys/issue` admin endpoint + a simple
database-backed key registry. See FOLLOWUPS.md.

## 3. Bring up the Nucleus stack

```bash
cd ugc-peer
docker compose up -d --build
```

This starts `postgres`, `redis`, `minio`, the `api` service on port
`8000`, the Celery `worker`, and the `ui` on port `3100`. The default
docker-compose.yml sets `NUCLEUS_MOCK_PROVIDERS=true` so the stack works
with no API keys.

## 4. Run database migrations

```bash
docker compose exec api python -m nucleus.db.migrate
```

(Safe to run repeatedly; migrations are idempotent.)

## 5. Kick off a smoke test

Mock mode — no API keys required:

```bash
python backend/scripts/smoke_test.py
```

Real mode — requires the env vars from step 2:

```bash
python backend/scripts/smoke_test.py --real
```

### Expected output (mock mode)

```
Using MOCK providers (NUCLEUS_MOCK_PROVIDERS=true).
API base: http://localhost:8000
Brief submitted — job_id=<hex>, candidates=1
Streaming events from ws://localhost:8000/ws/job/<hex> ...
  [event] job.planning: {...}
  [event] candidate.generating: {...}
  [event] candidate.scored: {...}
  [event] candidate.edited: {...}
  ...
  [event] job.complete: {...}

✓ job COMPLETE, final_score=72.4, variants=1, cost=$0.230
```

The script exits with status 0 on success and 1 if the job failed,
timed out, or the backend was unreachable.

### ComfyUI smoke test

End-to-end run against a real ComfyUI instance and the real fal.ai Kling
endpoint.

```bash
# In one terminal, start the stack:
docker compose up -d postgres redis minio comfyui api worker

# In another:
export FAL_KEY=your_fal_key
python backend/scripts/smoke_test.py --real-comfyui
```

Expected output: `tool.comfyui.*` events stream, ~60s later:

```
✓ job COMPLETE, final_score=73.1, variants=1, cost=$0.42
```

To inspect the Kling workflow JSON without hitting the network:

```bash
python backend/scripts/smoke_test.py --build-only
```

## 6. Open the UI

Navigate to <http://localhost:3100> — the Nucleus web app streams job
state live over the same WebSocket the smoke test uses.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `could not reach http://localhost:8000` | `docker compose ps` — is the `api` container healthy? Check `docker compose logs api`. |
| WebSocket disconnects immediately | The job probably failed during planning. Inspect `docker compose logs api` for the stack trace. |
| `FAL_KEY environment variable is required` | You asked for a real provider that needs a key you haven't exported. Either set it or fall back to mock mode. |
| Smoke test hangs without events | The worker isn't consuming jobs — `docker compose logs worker`. |
| Mock tests pass but real mode gives empty video_url | Some real providers depend on S3 uploads; make sure `minio` is reachable from `api`/`worker` containers. |

## What the smoke test does not cover

- Auth (the local stack runs unauthenticated)
- Email delivery (separate Resend config)
- Remotion render (hit via `/api/v1/tools/compose_remotion` if you want
  to exercise it explicitly)
