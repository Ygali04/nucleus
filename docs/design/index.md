# System Design

This section is the engineering design reference for Nucleus. It is the
expansion of the [how-it-works](../how-it-works.md) page from the concept
slice into the level of detail an engineer can implement against.

## What's in this section

| Page | Subject |
|---|---|
| [Data model](data-model.md) | Postgres schema, table relationships, indexes, partitioning strategy |
| [Orchestrator](orchestrator.md) | Celery task graph, retry policy, dead-letter queues, idempotency |
| [State machine](state-machine.md) | Loop orchestrator state transitions, persistence, recovery semantics |
| [Tenant isolation](tenant-isolation.md) | Row-level security, S3 prefixes, Redis namespacing, KB scoping |
| [Authentication](auth.md) | Host-product token exchange, JWT validation, scope mapping |
| [Observability](observability.md) | Metrics, logs, traces, per-tenant dashboards, alerting |
| [CI/CD](cicd.md) | Repo structure, test strategy, deploy pipeline, preview environments |
| [Security](security.md) | Secret management, encryption, PII handling, retention, audit logging |
| [Rate limiting & quotas](rate-limiting.md) | Per-tenant throttles, quota enforcement, fair-share scheduling |
| [Dataflow](dataflow.md) | Per-archetype data flow diagrams, edge cases, failure points |
| [Failure modes](failure-modes.md) | Catalog of what breaks and how each failure surfaces |

## Design principles

Five rules the design pages all conform to.

### 1. The orchestrator owns state, the workers own work

State lives in Postgres and is touched only by the orchestrator. Workers
read state, perform a bounded task, return a result, and never write to
shared state directly. This makes the system easy to reason about: when
you need to know "what's happening with job X right now," you read one
row.

### 2. Every task is idempotent

Workers may be killed mid-task. Tasks may be retried. Tasks may be
duplicated. Every task is written so that running it twice produces the
same result as running it once. This is not a nice-to-have — it's the
property that lets us scale workers, recover from crashes, and use
spot GPU instances.

### 3. Tenant isolation is structural, not procedural

We do not rely on application code to "remember to filter by tenant."
Tenant isolation is enforced at the database (row-level security in
Postgres), at the storage layer (per-tenant S3 prefixes), at the cache
layer (per-tenant Redis namespaces), and at the inference layer
(per-tenant request signing). A bug in application code cannot leak
data across tenants because the data layer refuses to let it.

### 4. Every external call is a sub-processor

The compliance boundary includes every API call to an external provider:
LLMs, voice synthesis, music generation, diffusion video, avatars,
embedding models. Each is documented as a sub-processor with its own
data flow, its own retention policy, its own DPA, and its own audit
log entry.

### 5. The minimal-code thesis applies to design too

The design reuses architectural patterns from the existing repos in the
ecosystem (NeuroPeer's task queue, DeepTutor's RAG pattern, Roto's
streaming endpoints, GlassRoom v1's LangGraph orchestration). New
design only happens where existing patterns don't fit.

## Reading order

If you're new to the engine, read in this order:

1. [Data model](data-model.md) — what objects exist and how they relate
2. [State machine](state-machine.md) — the lifecycle of a candidate
3. [Orchestrator](orchestrator.md) — how the engine moves candidates
4. [Tenant isolation](tenant-isolation.md) — what makes it safe for
   multi-tenant
5. The remaining pages can be read in any order
