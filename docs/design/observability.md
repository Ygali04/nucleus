# Observability

The Nucleus engine is observed through three pillars: structured logs,
metrics, and traces. All three are tenant-scoped, all three are
queryable, and all three roll up into operator dashboards that make
"what's happening right now" answerable in seconds.

## Stack

| Pillar | Tool | Why |
|---|---|---|
| Logs | Loki + Promtail | Structured JSON logs, label-indexed, cheap retention, integrates with Grafana |
| Metrics | Prometheus + Grafana Cloud | Industry-standard pull model, cheap cardinality control |
| Traces | Tempo (Grafana) | OTel-native, low-cost long retention, joinable to logs by trace_id |
| Errors | Sentry | First-class deduplication, release tracking, source maps |
| Uptime | Better Stack (or Grafana Synthetic) | External probes for the public API |

All four feed into a single Grafana instance for unified querying.

## Structured logging

Every log line is JSON. Every log line carries the standard set of
attributes:

```json
{
  "timestamp": "2026-04-28T14:23:11.482Z",
  "level": "info",
  "service": "nucleus.worker",
  "env": "production",
  "tenant_id": "tenant_acme_corp",
  "job_id": "8f4a1c7d-...",
  "candidate_id": "9e2f8b6a-...",
  "iteration_id": "1c3d5e7f-...",
  "trace_id": "0123456789abcdef0123456789abcdef",
  "span_id": "fedcba9876543210",
  "event": "candidate.scored",
  "score_composite": 73.4,
  "score_delta": 4.2
}
```

The application uses `structlog` with a fixed processor chain that
adds `service`, `env`, `tenant_id` (from the current tenant context),
`trace_id`, and `span_id` automatically.

### Log levels

| Level | Use |
|---|---|
| `debug` | Verbose stepping through agent logic. Off in production. |
| `info` | State transitions, task lifecycle, normal operations |
| `warning` | Recoverable errors, soft-stop conditions, retries |
| `error` | Hard failures, terminal states, anything that requires investigation |
| `critical` | Pages on-call. Reserved for cross-tenant data integrity issues. |

### Log retention

Loki holds 30 days of structured logs. Cold storage in S3 for
audit-required logs (job_events table is the canonical source — Loki
is for live debugging).

## Metrics

Prometheus metrics expose the engine's health and the per-tenant cost
structure. Every metric is labeled with `tenant_id` (low cardinality
because the tenant count grows slowly) plus other relevant axes.

### Engine health metrics

| Metric | Type | Labels | What it tells us |
|---|---|---|---|
| `nucleus_jobs_total` | Counter | `tenant_id`, `archetype`, `status` | Total jobs by terminal state |
| `nucleus_candidates_total` | Counter | `tenant_id`, `archetype`, `status` | Total candidates |
| `nucleus_candidates_in_flight` | Gauge | `tenant_id`, `archetype` | Live concurrency |
| `nucleus_iteration_count` | Histogram | `tenant_id`, `archetype` | Loop depth distribution |
| `nucleus_iteration_duration_seconds` | Histogram | `archetype`, `task_name` | Per-task latency |
| `nucleus_score_composite` | Histogram | `archetype` | Final score distribution |
| `nucleus_score_delta_per_iteration` | Histogram | `archetype` | How much each edit moves the score |
| `nucleus_terminal_reason_total` | Counter | `tenant_id`, `terminal_reason` | Why candidates end |
| `nucleus_provider_calls_total` | Counter | `provider`, `status` | External API call success rate |
| `nucleus_provider_latency_seconds` | Histogram | `provider`, `operation` | Per-provider latency |
| `nucleus_celery_queue_depth` | Gauge | `queue_name` | Backlog per queue |
| `nucleus_celery_workers` | Gauge | `queue_name`, `state` | Live worker count |
| `nucleus_db_pool_in_use` | Gauge | — | Postgres connection pool saturation |

### Cost metrics

| Metric | Type | Labels | What it tells us |
|---|---|---|---|
| `nucleus_cost_usd_total` | Counter | `tenant_id`, `cost_category` | Cost by category (LLM, voice, music, diffusion, avatar, GPU, infra) |
| `nucleus_cost_per_variant_usd` | Histogram | `tenant_id`, `archetype` | Distribution of per-variant cost |
| `nucleus_provider_credits_consumed` | Counter | `tenant_id`, `provider` | Provider-specific units (ElevenLabs characters, Veo seconds, etc.) |

### Quality metrics

| Metric | Type | Labels | What it tells us |
|---|---|---|---|
| `nucleus_passed_threshold_total` | Counter | `tenant_id`, `archetype` | Variants that crossed threshold |
| `nucleus_under_threshold_total` | Counter | `tenant_id`, `archetype` | Variants that hit max iterations without crossing |
| `nucleus_avg_iterations_to_pass` | Gauge | `archetype` | Mean iteration count to pass |

### SLO metrics

| Metric | SLO | Alert if |
|---|---|---|
| `nucleus_availability` | 99.5% over 30 days | < 99% over 1 hour rolling |
| `nucleus_p95_brief_to_first_variant_seconds` | < 600s | > 1200s for 5 minutes |
| `nucleus_failed_candidate_ratio` | < 2% over 1 hour | > 5% for 10 minutes |
| `nucleus_cost_per_variant_p99` | < $1.50 | > $3.00 for 10 minutes |

## Tracing

Every API request opens a root span. Every Celery task opens a child
span linked through `trace_id`. Every external provider call opens a
child span. The result is a complete trace tree from "user clicked
generate" through "delivered variant" with timing on every link.

### Span attributes

Standard set on every span:

```
nucleus.tenant_id
nucleus.job_id
nucleus.candidate_id
nucleus.iteration_id
nucleus.archetype
nucleus.task_name
```

Operation-specific:

```
nucleus.score.composite
nucleus.score.delta
nucleus.cost.usd
nucleus.provider.name
nucleus.provider.endpoint
nucleus.provider.status_code
nucleus.edit.action_type
```

### Sampling

100% sampling for the first 30 days post-launch. After volume grows,
switch to 10% head-based sampling with full retention for any trace
containing an `error` or `critical` log line (tail-based sampling).

## Dashboards

Five canonical Grafana dashboards.

### 1. Engine Overview

Top-level pulse. Aggregate over all tenants.

- Candidates in flight (gauge)
- Brief throughput per minute (rate)
- p50 / p95 / p99 brief-to-delivered latency
- Top 5 tenants by candidate volume (table)
- Cost per minute, broken out by category (stacked area)
- Failed candidate rate (percentage line)
- Top 5 terminal reasons (table)

### 2. Tenant Detail

Per-tenant deep dive. Tenant selector at the top.

- Active jobs (table linking to job detail)
- Variant volume over time (24h, 7d, 30d)
- Score distribution histogram
- Average iterations per archetype
- Cost per variant histogram
- Quota consumption against the tenant's limit
- Recent failures (table linking to traces)

### 3. Job Detail

Per-job replay. Job ID parameter at the top.

- Brief contents (JSON view)
- Cross-product expansion table (ICP × language × archetype × platform)
- Per-candidate state with iteration count
- Per-iteration score timeline (line chart per candidate)
- Cost breakdown
- Event timeline from `job_events` (table)
- Linked traces (one click → Tempo)

### 4. Provider Health

Per-external-provider rolling health.

- Call rate per provider per minute
- Error rate per provider
- p50 / p95 / p99 latency per provider per operation
- Cost per provider per day
- Provider quota / rate limit headroom

### 5. Cost & Margin

Finance-facing dashboard.

- Daily cost by tenant
- Daily revenue (from billing system)
- Per-variant gross margin
- Cost variance from budget
- Projected month-end totals

## Alerts

Three classes of alert.

### Page (immediate response required)

- Cross-tenant data leak detected by the nightly probe → CRITICAL
- Postgres unavailable → CRITICAL
- All worker queues stalled (no candidate state transitions in 5 min) → CRITICAL
- Failed candidate ratio > 25% over 5 min → HIGH
- API 5xx rate > 5% over 5 min → HIGH
- Tenant cost > 10× projected daily budget in 1 hour → HIGH (possible runaway)

### Notify (Slack channel, no page)

- Cost per variant p99 > $3 for 10 min
- Provider error rate > 10% on any provider for 10 min
- Brief-to-delivered p95 > 20 min for 30 min
- DLQ depth > 50 entries
- Disk usage on any service > 80%

### Track (no alert, just visible on dashboards)

- Stuck-state recovery events
- Slow scoring iterations (> 5 min)
- Edit primitive that didn't move the score

## Sentry

Errors and unhandled exceptions go to Sentry with source maps and
release tracking. Every Sentry issue auto-creates a linked issue in
the Nucleus issue tracker.

The Sentry SDK is configured to:

- Tag every event with `tenant_id`, `service`, `env`, `release`
- Capture breadcrumbs from the structured logger
- Suppress known transient errors (provider 5xx already retried)
- Auto-resolve when the same error stops occurring for 24 hours

## On-call

A single rotating on-call engineer per week. Pages route through
PagerDuty.

### On-call runbook

When paged, the on-call engineer:

1. Checks the **Engine Overview** dashboard for the immediate symptom
2. Identifies the affected tenants from the **Tenant Detail** dashboard
3. Pulls the relevant traces in Tempo
4. Reads the linked logs in Loki
5. If the root cause is in an external provider, switches the
   pluggable interface to a backup (where one exists)
6. If the root cause is in Nucleus code, files an incident ticket and
   triages whether to revert the latest deploy

The on-call rotation lives in PagerDuty. Escalation goes to the
project lead after 15 minutes unacknowledged.

## Customer-facing transparency

A subset of the engine health metrics is exposed at `status.nucleus.dev`
(or wherever the public status page lives) for customers and tenants.
Per-tenant metrics are exposed inside the host product's admin UI via
a Nucleus API endpoint:

```http
GET /api/v1/tenants/me/health
Authorization: Bearer <jwt>
```

Returns the tenant's last 24 hours of variant volume, average score,
average iteration count, and any active incidents that affect them.
