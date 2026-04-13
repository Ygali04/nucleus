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

(Skip this step when running Nucleus with `NUCLEUS_MOCK_PROVIDERS=true` —
mock scoring returns synthetic numbers and does not hit NeuroPeer.)

## 2. Set environment variables (optional, real mode only)

Create `ugc-peer/.env` (or export in your shell) if you want to exercise
real providers:

```bash
export FAL_KEY=...                 # Kling video provider
export ELEVENLABS_API_KEY=...      # TTS
export GOOGLE_CLOUD_PROJECT=...    # Lyria music (Vertex AI)
export ATLAS_CLOUD_API_KEY=...     # Seedance video
export WAVESPEED_API_KEY=...       # MagiHuman avatar video
export HF_TOKEN=...                # NeuroPeer only
```

All API keys are optional. If a key is missing for a requested provider,
that call fails loudly; the rest of the pipeline is unaffected.

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
