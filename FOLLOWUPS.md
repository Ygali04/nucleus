# FOLLOWUPS — Nucleus

Future work parked intentionally. Audience: whoever (human or agent) picks this up next. One to two sentences per bullet, direction only, no code.

---

## Model + provider follow-ups

- **MiniMax M2.7 for Ruflo** — swap in as Ruflo's reasoning brain when preview access opens. GLM-4.7-flash is the current stand-in behind `GLM_KEY`.
- **New ComfyUI custom nodes as upstream ships them** — Suno once the audio node stabilizes, Kling 3.0 when released, plus any new fal-API model drops. Translator lives in `backend/nucleus/providers/comfyui_workflows.py`.
- **Direct-SDK paths per provider** — current default routes through ComfyUI; fill in native SDK clients behind `NUCLEUS_USE_DIRECT_SDK=true` for each provider so we have a real fallback when ComfyUI is down or a class_type breaks.

## Ruflo / agent follow-ups

- **Multi-agent sub-queens** — let the orchestrator delegate to archetype-specialist sub-agents (Demo-queen, Education-queen) instead of one monolithic queen prompt.
- **Long-running reasoningBank memory** — persist per-user preferences across campaigns (brand voice fingerprints, "this user prefers Kling over Veo", scoring-threshold biases).
- **A/B branching in the graph** — when multiple edit primitives could apply, Ruflo explores several in parallel and keeps the winning branch. Requires graph diffing + a "shadow variant" concept.
- **Real-time co-editing** — multiple users on the same canvas with cursor presence and live node locks. Needs a CRDT layer on top of the current persist debounce.
- **Per-campaign Ruflo brain** — expose model choice as a campaign setting (cheap/fast GLM-flash for drafts, Opus-class for premium campaigns) instead of the single global `GLM_KEY`.

## Media / node follow-ups

- **Brand voice cloning** — ElevenLabs supports it; needs a new `BrandVoice` node kind, a sample-upload modal, and an ElevenLabs voice-ID registry on the Campaign.
- **Stock media nodes** — Unsplash / Pexels b-roll as first-class node kinds, so non-generative footage doesn't burn provider credits.
- **Explicit `clip` node kind** — ffmpeg cut/trim/concat currently lives inside the Editor node. Pull it out for non-iterative straight cuts.
- **Music beat-matching** — detect beats server-side (librosa) and align cuts in the Editor automatically.

## UX follow-ups

- **Per-variant scheduling on delivery** — auto-push approved variants to Buffer / Hootsuite with per-platform copy.
- **Slack / Discord notifications** — ping on campaign complete, on scoring threshold hit, on failure.
- **Cost dashboard** — aggregate provider spend per campaign and per-month across campaigns.
- **"Undo last Ruflo action"** — chat-side undo button that reverts the most recent graph mutation.
- **Draggable / resizable chat panel** — currently fixed bottom-right; should be movable and collapsible.
- **Timeline view per variant** — show every iteration, score, and edit primitive applied, scrubbing through history.

## Infra follow-ups

- **NeuroPeer server-side API key issuance UI** — middleware exists; still need a DB-backed key registry + admin endpoint + rotation flow.
- **MinIO → S3 / R2** — MinIO is dev-only; production needs real object storage with presigned URL hygiene.
- **Postgres connection pool tuning** — SQLAlchemy async defaults are fine for dev, not for Celery worker fan-out.
- **Celery worker autoscaling** — scale on queue depth, not fixed replica count.
- **Observability** — Sentry for exceptions, Prometheus for queue / WS / tool-call metrics, a real dashboard.

## Security / multi-tenancy follow-ups (the deferred "batch after")

- **Google OAuth via NextAuth.js** — first real login flow. Drives everything below.
- **Multi-tenancy data model** — users, orgs, projects; scope every Campaign / Iteration / Candidate row.
- **Stripe billing + usage metering** — per-provider-call metering, monthly invoicing, plan tiers.
- **Content moderation** — run generated outputs through a moderation pass before delivery.
- **Rate limiting** — per-user and per-org on tool endpoints + WS connections.
- **GDPR delete endpoint** — cascade delete user + campaigns + iterations + storage objects on request.
