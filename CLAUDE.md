# CLAUDE.md — Nucleus

Guidance for agents working in this repo. Read this first; the architecture is load-bearing and a surprising amount of it was earned through pain.

## What Nucleus is

A recursive neuromarketing video generation platform. One user, one account, many **campaigns**. Each campaign seeds a DAG of generation/scoring/edit nodes that execute via Ruflo (a Node-side agent orchestrator) which drives ComfyUI workflows (which proxy closed-source APIs like Kling/Seedance/Veo/Runway/ElevenLabs) and scores variants against NeuroPeer (a separate neural-analysis service). The dream feature: **Ruflo builds and mutates the pipeline graph live** as it decides what edits to apply, and the UI materializes those nodes on the canvas in real time.

Design docs live at https://ygali04.github.io/nucleus and under `docs/`. Read them when in doubt about product intent.

---

## 1. Think Before Coding

### Architecture at a glance

```
┌──────────────────────────┐      ┌───────────────────────────┐
│  UI (Next.js 15 / React  │──WS──│   Nucleus API (FastAPI)   │
│  / XYFlow on /canvas)    │──────│   Postgres + Celery+Redis │
└──────────────────────────┘      └────────┬──────────────────┘
                                           │ httpx+SSE
                                           ▼
                           ┌──────────────────────────────┐
                           │  Ruflo bridge (Node/Express) │
                           │  agent/src/ruflo-bridge.ts   │
                           └────────┬─────────────────────┘
                                    │ HTTP to tool endpoints
                                    ▼
                ┌────────────────────────────────────────┐
                │   /api/v1/tools/* (FastAPI)            │
                │   generate_video / score_neuropeer /   │
                │   edit_variant / run_comfyui_workflow  │
                └─────────┬──────────────────────────────┘
                          │
         ┌────────────────┼─────────────────┬───────────────┐
         ▼                ▼                 ▼               ▼
   ┌───────────┐   ┌────────────┐   ┌───────────┐   ┌─────────────┐
   │ ComfyUI   │   │ NeuroPeer  │   │ Remotion  │   │ Direct SDKs │
   │ (fal-API  │   │ (neural    │   │ (comp     │   │ (fallback)  │
   │ custom    │   │ scoring)   │   │ render)   │   │             │
   │ nodes)    │   │            │   │           │   │             │
   └───────────┘   └────────────┘   └───────────┘   └─────────────┘
```

### Where things live

| Concern | Path |
| --- | --- |
| FastAPI entry + lifespan | `backend/nucleus/app.py` |
| Central settings (pydantic-settings singleton) | `backend/nucleus/config.py` |
| Persistent store (SQLAlchemy 2.0 async) | `backend/nucleus/store.py` + `backend/nucleus/db/` |
| Orchestrator loop (Ruflo-driven + mock) | `backend/nucleus/orchestrator/loop.py` |
| Event bus (in-process + Redis pubsub) | `backend/nucleus/events.py` |
| Tool endpoints | `backend/nucleus/tools/` + `routes/tools.py` |
| Provider registry + adapters | `backend/nucleus/providers/` |
| NeuroPeer client | `backend/nucleus/clients/neuropeer.py` |
| ComfyUI client + workflow translators | `backend/nucleus/clients/comfyui.py` + `providers/comfyui_workflows.py` |
| Ruflo bridge (Node) | `agent/src/ruflo-bridge.ts` + `src/workflow-builder.ts` |
| UI canvas + typed handles | `ui/components/canvas/` |
| Per-kind node modals | `ui/components/panels/node-modals/` |
| Zustand stores | `ui/store/campaigns-store.ts` (main), `canvas-store.ts`, `events-store.ts`, `pipeline-store.ts` |
| Archetype seed graphs | `ui/lib/campaign-archetypes.ts` |
| Data-type → color map | `ui/lib/node-data-types.ts` |

### Before you change anything

- **Read `backend/nucleus/models.py` + `ui/lib/types.ts`** to understand the Campaign/Candidate/Iteration shape. Snake_case on the backend (`brand_name`, `last_executed_at`), mirrored verbatim on the frontend because `ui/lib/types.ts` re-exports `Campaign` from `ui/lib/api-client.ts`.
- **Check `NODE_IO_MAP` in `ui/lib/node-data-types.ts`** before adding a new node kind. It drives handle colors, seed-edge routing, and the dynamic-socket behavior. Getting it wrong produces "wrong-colored edge into wrong-colored socket" tearing.
- **Trace event names end-to-end.** The orchestrator publishes to `nucleus.events.publish_event(job_id, event_type, data)` → Redis pubsub → `usePipelineEvents` hook → `campaigns-store.updateNodeExecutionState` → node card re-renders. If you add a new event type it needs handlers at both ends.

---

## 2. Simplicity First

### Canonical toggles

- `NUCLEUS_MOCK_PROVIDERS=true` — the *single* mock switch. When set, every provider returns fixture data regardless of which provider name was requested. Honor this in any new provider. Read it live via `nucleus.config.is_mock()`, NOT from the cached `settings` singleton (see "Common traps").
- `NUCLEUS_USE_DIRECT_SDK=true` — opt back into direct Kling/ElevenLabs SDK calls instead of routing through ComfyUI. Default is ComfyUI-routed.
- `NUCLEUS_NO_REDIS=1` — in-process event bus only, no Redis publish. Tests set this in `backend/tests/conftest.py`.
- `NUCLEUS_EAGER_TASKS=1` — Celery runs synchronously in-process. Useful for the local smoke test without a Redis broker.
- `TEST_DATABASE_URL=<url>` — optional override for the pytest DB. Default is ephemeral SQLite via aiosqlite.

### Storage path convention

Every artifact URI follows `s3://nucleus-media/jobs/{job_id}/{kind}/{filename}` where `kind ∈ {raw, composed, edited, delivered, audio, music}`. Don't invent new path shapes without updating `backend/nucleus/storage/__init__.py`'s `make_key` helper.

### Z-index hierarchy (UI)

Documented in the header of `ui/components/panels/node-modals/NodeModalShell.tsx`. Don't invent new values:

- Canvas + floating UI: 0–30
- Node option popover (3-dots menu): `z-[45]`
- Modal shells: `z-[60]`
- Modal-internal dropdowns/popovers: `z-[70]`
- Media lightbox: `z-[100]`

### Don't reach for

- A new state library — Zustand already carries everything (campaigns/canvas/events/pipeline). Add a slice if you need a new domain.
- A new event format — re-use `{job_id, event_type, ...data}` everywhere. The orchestrator, bridge, UI hook, and persisted events store all assume this shape.
- A second config singleton — extend `backend/nucleus/config.Settings` with your new field + a module-level live-reading helper that matches `neuropeer_base_url()` / `comfyui_base_url()`.

---

## 3. Surgical Changes

### File ownership

- **Do not edit `backend/nucleus/store.py`'s public async interface** (`save_job`, `get_candidate`, `list_iterations`, etc.). Tests hammer it directly. Add new functions; don't rename existing ones.
- **Do not change node handle ID format** (`in-<type>-<idx>` / `out-<type>-<idx>`). `annotateEdges` in `campaign-archetypes.ts`, `TypedHandle`, and the `onConnect` router in `ArchitectureCanvas.tsx` all depend on it. Break the format and seed archetypes silently disconnect.
- **Do not add fields to `Campaign` without updating** both `backend/nucleus/models.py` + Alembic migration + `ui/lib/api-client.ts` + the mock fixture in `ui/fixtures/neuropeer-reports.ts` (if it ships sample data). They're a set.
- **Do not wrap `useCampaignsStore(s => ...)` selectors that return new objects.** This is infinite-loop territory (see traps).

### Common traps

1. **Zustand selector returning a new object → infinite render loop.**
   ```ts
   // BAD — fresh object every call, fails Object.is, re-renders forever
   useCampaignsStore(s => ({ id: s.currentCampaignId, open: s.openNodeModalId }));
   // GOOD — select primitives separately, compose in render body
   const id = useCampaignsStore(s => s.currentCampaignId);
   const open = useCampaignsStore(s => s.openNodeModalId);
   ```

2. **Pydantic `Settings` lru_cache + monkeypatch in tests breaks.** The singleton is built once at import time; `monkeypatch.setenv("NUCLEUS_MOCK_PROVIDERS", ...)` won't invalidate it. The helpers in `config.py` (`is_mock`, `fal_key`, `neuropeer_base_url`, `comfyui_base_url`) read `os.environ` live first and fall back to `settings`. Any new env-driven toggle must follow this pattern.

3. **ReactFlow `getBoundingClientRect()` + CSS transforms put popovers in the wrong place.** Don't use viewport-fixed coords for node-anchored popovers. Use `position: absolute` inside a positioned parent that lives inside the node card. See `NodeContextMenuWrapper` for the pattern.

4. **Handle labels *inside* the node card collide with the header row.** Kept colored dots + tooltip only; edge type is shown at the edge midpoint chip (`TypedEdge`). Don't reintroduce per-handle text labels.

5. **Worktree agents can finish before commits hit remote.** When dispatching workers via the Agent tool with `isolation: "worktree"`, the worker's commits live only on the feature branch. If the worktree cleans up before `git push`, the work is lost. Always have workers `gh pr create` at the end — the PR preserves the commits.

6. **Campaign `graph` field is persisted differently from node positions.** Node drag positions write to both `canvas-store.nodePositions` (fast local cache) AND `campaign.graph.nodes[i].x/y` (backend sync via `campaigns-store.updateCampaign`). Don't remove either path.

7. **ComfyUI workflow class names are fragile.** Translators in `comfyui_workflows.py` are best-guesses against the upstream custom node pack. First real run is the validation; until then every class_type is marked `# TODO: verify against <repo>@main`.

8. **Mock-HTTP tests ≠ integration tests.** 200+ backend tests all run against `httpx.MockTransport`. They verify code shape, not real wire behavior. A separate `backend/scripts/smoke_test.py --real-comfyui` validates the live path. Don't treat pytest green as "end-to-end working."

### Before claiming done

- `cd backend && pytest` — all green.
- `cd ui && npm run build` — zero TypeScript errors.
- `cd agent && npx tsc --noEmit` — clean.
- Acceptance grep: `grep -rn -iE "deploy|deliverable|workstream|engagement|consulting|agency|mycelium|placeholder|lorem|dummy" ui/ --exclude-dir=node_modules --exclude-dir=.next` → 0 user-facing hits.

---

## 4. Goal-Driven Execution

### The user's loop

1. User opens `/campaigns`, clicks **New Campaign**, picks one of 4 archetypes (Demo / Marketing / Knowledge / Education) and enters a brand name.
2. Backend creates a Campaign with a seeded graph matching the archetype — closed-loop by design: **BrandKB + ICP fan out → generators → composition → scoring → editor (fed by both source video AND the scoring report as action items) → re-scoring → delivery**.
3. User edits node data via per-kind modals (BrandKB gets file uploads; VideoGen picks provider + prompt; etc.). Nodes support drag, Run button, right-click menu, hover-popover with Edit/Retry/Duplicate/Bypass/Pin/Swap/Delete.
4. User clicks **Run**. Backend enqueues a Celery task → orchestrator loop → POSTs to Ruflo bridge → Ruflo queen drives generate/score/edit cycles, emitting `tool.comfyui.*` events (progress percent, node complete, cached, failed) + `canvas.node_added` / `canvas.edge_added` when Ruflo decides to extend the pipeline.
5. Events stream back via WebSocket to the UI. Each node's progress bar fills live; Ruflo-added nodes appear with a violet "✦ Ruflo" arrival glow; scored iterations write `AnalysisResult` JSON into `iterations.analysis_result_json` so the Reports page can visualize them.
6. When all variants pass the neural-score threshold, delivery node shows URLs. User can compare variants side-by-side on `/reports`.

### Architectural intents

- **Ruflo orchestrates, ComfyUI executes, Nucleus is the shell.** Ruflo picks edit primitives using agent reasoning; ComfyUI runs the workflow (DAG execution, caching, progress streaming); Nucleus owns the product shell, auth (future), billing (future), and the user-facing canvas. Don't mix layers.
- **ComfyUI proxies closed-source APIs.** User refuses to self-host weights. Every model call goes through ComfyUI-fal-API, ComfyUI-ElevenLabs, etc. CPU-only image, no GPU. If a future model has no ComfyUI custom node, either (a) write one, (b) add a direct SDK provider behind `NUCLEUS_USE_DIRECT_SDK=true`, or (c) skip the model.
- **The closed loop is load-bearing.** Scoring → Editor is not just "next step in a chain" — the scoring's `report` edge carries NeuroPeer action items that tell the Editor *what to fix*. Editor's output goes back through scoring. This is the core product differentiator. Don't break it when adding new archetypes or edit primitives.
- **Persistence happens in 3 layers.** (1) React state for live UI. (2) Zustand `persist` → localStorage for offline/reload survival. (3) Backend `apiClient.updateCampaign` debounced 600ms for cross-device sync. All three are live simultaneously. When adding a new graph mutation, call `schedulePersist` in `campaigns-store.ts` alongside the `set(...)`.

### What NOT to build (yet)

These are explicitly deferred — the `feedback_autonomous_operations` memory notes that auth/billing are future batch work:

- Google OAuth / NextAuth.js
- Multi-tenancy (users table, organization scoping)
- Stripe billing / usage metering
- GDPR delete endpoint / rate limiting / content moderation
- Vercel + Railway deploy configs

The product is single-user local until this batch of concerns is explicitly opened.

### How to ship work (observed conventions)

- The user's `/batch` workflow is how big changes land: plan → decompose into 5–12 parallel work units → spawn workers in isolated worktrees → merge in dependency order, reconciling conflicts at shared files (`campaigns-store.ts`, `types.ts`, `pyproject.toml` are the usual ones).
- Per-worker verification is mock-HTTP + unit tests. A single coordinator smoke test at the end validates real-service integration.
- Don't ask for permission to commit/push/PR (saved in user memory). Commit as you go; push branches; open PRs with `gh pr create`. Only pause for genuinely destructive ops.
- When a worker finishes, it ends with a single line: `PR: <url>` so the coordinator can parse.

---

## Quick reference — local dev

```bash
# Backend + frontend without Docker (mock mode, zero services required)
cd backend && pip install -e ".[dev]"
DATABASE_URL=sqlite+aiosqlite:////tmp/nucleus.db python -m nucleus.db.migrate

# Terminal A — API
NUCLEUS_MOCK_PROVIDERS=true NUCLEUS_NO_REDIS=1 NUCLEUS_EAGER_TASKS=1 \
  DATABASE_URL=sqlite+aiosqlite:////tmp/nucleus.db \
  uvicorn nucleus.app:app --port 8000

# Terminal B — UI
cd ui && npm run dev   # Node 20+, Next 15

# Smoke test (mock mode)
python backend/scripts/smoke_test.py
# With real fal.ai Kling via ComfyUI
FAL_KEY=xxx python backend/scripts/smoke_test.py --real-comfyui

# Full Docker stack (Postgres + Redis + MinIO + api + worker + ui + remotion + agent + comfyui)
docker compose up -d --build
```

See `LOCAL_DEV.md` for more.
