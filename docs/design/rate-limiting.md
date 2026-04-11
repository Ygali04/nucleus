# Rate Limiting & Quotas

Per-tenant rate limits and quotas keep the engine fair, stable, and
cost-bounded. Three categories of limit operate at different layers.

## Layer 1 — Hard rate limits (per HTTP request)

Enforced at the API gateway, before any application code runs.

| Endpoint | Limit | Window | Reason |
|---|---|---|---|
| `POST /api/v1/jobs` | 60 / tenant | 1 minute | Prevent runaway brief submission |
| `POST /api/v1/brand_kbs/{id}/documents` | 100 / tenant | 1 hour | Prevent KB ingestion floods |
| `GET /api/v1/jobs/{id}` | 600 / tenant | 1 minute | Generous for polling clients |
| `GET /api/v1/variants/{id}/download` | 300 / tenant | 1 hour | Prevent download abuse |
| `POST /api/v1/session` (JWT exchange) | 60 / IP | 1 minute | Anti-credential-stuffing |
| Any endpoint | 1000 / tenant | 1 minute | Global per-tenant ceiling |

Returns `429 Too Many Requests` with a `Retry-After` header. Clients
are expected to back off with jitter.

Implementation: Redis-backed token bucket via `slowapi`.

## Layer 2 — Per-tenant concurrency caps

Enforced inside the orchestrator's `plan.expand` step. Independent of
HTTP rate limits because a single brief can fan out to hundreds of
candidates.

| Cap | Default | Configurable per tenant |
|---|---|---|
| Concurrent candidates in `generating` or `scoring` | 10 | Yes (1–50) |
| Concurrent candidates in `editing` | 5 | Yes (1–20) |
| Open jobs (any status before `complete`) | 100 | Yes |
| Total candidates per job | 1000 | Yes (capped at 5000) |
| Candidates per (ICP, language, archetype, platform) cell | 5 | Yes |

When a cap is hit, additional candidates wait in `pending` and are
dispatched as in-flight candidates finish. This is fair-share, not
strict FIFO — multiple jobs from the same tenant share the cap.

## Layer 3 — Quotas (per-tenant, per-window)

Enforced by the billing-handoff layer. These are the limits the host
product enforces against the tenant's plan.

| Quota | Starter | Growth | Enterprise add-on |
|---|---|---|---|
| Variants delivered per month | 100 | 1000 | 10000 |
| Variants delivered per day (rate cap) | 10 | 100 | 1000 |
| Brand KBs | 1 | 5 | unlimited |
| Brand KB total documents | 100 | 1000 | unlimited |
| Source recordings | 10 | 100 | unlimited |
| Concurrent jobs | 1 | 5 | 50 |
| Cost ceiling per variant ($) | $1.00 | $2.00 | $5.00 |
| Cost ceiling per month ($) | $50 | $500 | negotiated |
| API requests per minute | 30 | 120 | 600 |
| Languages | 5 | 25 | 65+ (all supported) |
| Archetypes | 1 (demo only) | 2 (demo + marketing) | All 4 |

These quotas are enforced as hard caps. Crossing one returns
`402 Payment Required` (or `403 Forbidden` for non-billing reasons)
with an `X-Quota-Exceeded` header naming the offending quota.

The host product is expected to surface quota-near-exhaustion warnings
in its UI.

## Implementation

### Redis-backed counters

Quotas use Redis hashes per tenant per window:

```
nucleus:{tenant_id}:quota:variants:202604        # monthly counter
nucleus:{tenant_id}:quota:variants:20260428      # daily counter
nucleus:{tenant_id}:quota:cost_usd:202604        # monthly cost
```

Each `usage_event` insert increments the relevant counters atomically
via `INCRBY`. Counters expire 30 days after the window closes.

### Concurrency caps

Concurrency caps use Redis sets per tenant:

```
nucleus:{tenant_id}:concurrency:generating       # set of candidate IDs in flight
```

`SADD` on enqueue, `SREM` on finish. The cap check is `SCARD` against
the configured limit.

### Cost ceilings

Cost ceilings are checked on every iteration's cost contribution
(not just on candidate completion):

```python
def check_cost_ceiling(candidate: Candidate, additional_usd: Decimal) -> None:
    new_total = candidate.cost_usd + additional_usd
    if candidate.job.cost_ceiling_usd and new_total > candidate.job.cost_ceiling_usd:
        raise CostCeilingExceeded(...)
```

Crossing the ceiling mid-iteration is one of the [terminal stop
reasons](state-machine.md#terminal-reasons) — the candidate finalizes
on whatever artifact exists at the time.

## Fair-share scheduling

Within a single tenant's concurrency cap, candidates are scheduled in
the order they were created. Across tenants, the worker pool runs a
weighted round-robin so that no single tenant can starve others even
if their cap is high and theirs is low.

The weights default to 1.0 per tenant. They can be tuned per tenant
to give priority customers higher throughput.

## Provider-side rate limits

External providers (ElevenLabs, Veo, Lyria, HeyGen) all have their
own rate limits. Nucleus respects them via per-provider semaphores:

```python
PROVIDER_LIMITS = {
    "elevenlabs": Semaphore(10),    # 10 concurrent calls
    "veo": Semaphore(5),
    "heygen": Semaphore(8),
    "lyria": Semaphore(15),
    "neuropeer": Semaphore(20),
}


async def call_provider(name: str, fn, *args, **kwargs):
    async with PROVIDER_LIMITS[name]:
        return await fn(*args, **kwargs)
```

If a provider returns a `429` despite the semaphore, the call retries
with exponential backoff per [orchestrator → retry policy](orchestrator.md#retry-policy).

## Burst handling

Quotas use rolling windows, not fixed windows, so a burst at the start
of the day doesn't burn the full daily allowance immediately. The
counter naturally rate-limits over the rolling 24-hour window.

The exception is the per-minute API rate limit, which is a fixed window
because the volumes don't justify the rolling-window overhead.

## What happens when a quota is exceeded

| Layer | Response |
|---|---|
| HTTP rate limit | `429 Too Many Requests`, `Retry-After` header |
| Concurrency cap | Candidate stays in `pending`, dispatched when slot opens |
| Quota | `402 Payment Required` or `403 Forbidden`, with `X-Quota-Exceeded: variants_per_month` |
| Cost ceiling | Candidate finalizes with `terminal_reason='cost_ceiling'`, variant delivered with warning |

The host product is responsible for showing the right UI for each
case. Nucleus's job is to enforce the limit and return a structured
error code; the user experience around it lives upstream.

## Customer-facing transparency

Tenants can read their current quota status via:

```http
GET /api/v1/tenants/me/quota
Authorization: Bearer <jwt>
```

Returns:

```json
{
  "tenant_id": "...",
  "quotas": [
    {
      "name": "variants_per_month",
      "limit": 1000,
      "used": 412,
      "remaining": 588,
      "window_resets_at": "2026-05-01T00:00:00Z"
    },
    {
      "name": "concurrent_jobs",
      "limit": 5,
      "used": 2,
      "remaining": 3
    }
  ],
  "cost_usd_today": 28.40,
  "cost_usd_month": 412.18
}
```

The host product polls this and surfaces the data in its admin UI.
