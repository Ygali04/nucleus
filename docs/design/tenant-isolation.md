# Tenant Isolation

Multi-tenant isolation in Nucleus is **structural, not procedural**.
We don't rely on application code to remember to filter by tenant.
Isolation is enforced at every layer that holds tenant data:

| Layer | Mechanism |
|---|---|
| Postgres | Row-level security policies on every tenant-scoped table |
| Object storage (S3 / MinIO) | Per-tenant key prefixes + per-tenant access signatures |
| Redis (cache + queue) | Per-tenant key namespacing |
| Brand KB stores (LightRAG / LlamaIndex) | Per-tenant storage directories |
| Inference services | Per-tenant request signing + audit log |
| Logs and traces | `tenant_id` attribute on every span and log line |
| Background jobs | Tenant context set at task entry |

A bug in application code cannot leak data across tenants because the
data layer refuses to let it. The application is the *consumer* of
isolation, not the *enforcer*.

## Postgres row-level security

Every tenant-scoped table has a `tenant_id UUID` column and an RLS
policy that filters every query to the tenant in scope.

### Enabling RLS

```sql
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs FORCE ROW LEVEL SECURITY;  -- enforce on table owners too

CREATE POLICY tenant_isolation_jobs ON jobs
    USING (tenant_id = current_setting('nucleus.tenant_id', true)::UUID)
    WITH CHECK (tenant_id = current_setting('nucleus.tenant_id', true)::UUID);
```

`USING` filters SELECT/UPDATE/DELETE. `WITH CHECK` filters INSERT and
the new state of UPDATE rows. Both are required to prevent a malicious
update from changing `tenant_id` to escape isolation.

### Setting tenant context per request

The application sets `nucleus.tenant_id` at the start of every request
from the JWT claims. The setting is connection-scoped, so concurrent
requests on different connections don't interfere.

```python
@asynccontextmanager
async def tenant_context(tenant_id: UUID):
    """Set the tenant context on the current connection for the duration of the block."""
    async with db.connection() as conn:
        await conn.execute(
            "SET LOCAL nucleus.tenant_id = $1",
            str(tenant_id),
        )
        yield conn
```

`SET LOCAL` is transaction-scoped: the setting reverts at commit/rollback,
so a leaked connection doesn't carry stale tenant context.

### Setting tenant context for background tasks

Celery workers set the context at task entry from a serialized claim
that travels with the task payload.

```python
@celery_app.task
def candidate_generate(candidate_id: str) -> None:
    candidate = Candidate.get_unscoped(candidate_id)  # bypass RLS to read tenant_id
    with tenant_context(candidate.tenant_id):
        # All subsequent queries are filtered to this tenant
        ...
```

The `unscoped` accessor uses a privileged "system" role that bypasses
RLS. It's used in exactly two places: the entry-point lookup of
tenant context, and observability/admin queries. Worker processes
that don't need cross-tenant visibility never use the system role.

### Privileged operations

A small set of operations need cross-tenant visibility:

- Cost rollups across all tenants for finance reporting
- Health-check queries on the orchestrator
- Admin operations triggered by the on-call engineer
- Janitor tasks (stuck-candidate recovery)

These run as a separate `nucleus_admin` Postgres role with `BYPASSRLS`
enabled. The admin role is only used by:

- The Celery beat scheduler for janitor tasks
- The admin CLI invoked manually by an authorized engineer
- The metrics exporter for the Grafana dashboards

The admin role is *never* assumed by an HTTP-facing worker.

## Object storage isolation

S3 / MinIO uses per-tenant key prefixes:

```
s3://nucleus-prod/tenants/{tenant_id}/jobs/{job_id}/candidates/{candidate_id}/iterations/{iteration_index}.mp4
s3://nucleus-prod/tenants/{tenant_id}/recordings/{recording_id}.mp4
s3://nucleus-prod/tenants/{tenant_id}/brand-kbs/{kb_id}/documents/{document_id}.pdf
s3://nucleus-prod/tenants/{tenant_id}/reports/{report_id}.pdf
```

Two layers of enforcement:

### 1. Path-prefix enforcement in the application

Every storage helper function takes a `tenant_id` argument and refuses
to accept paths that don't include the tenant's prefix.

```python
def upload_artifact(tenant_id: UUID, kind: str, content: bytes) -> str:
    key = f"tenants/{tenant_id}/artifacts/{kind}/{uuid4()}.mp4"
    s3.put_object(Bucket=NUCLEUS_BUCKET, Key=key, Body=content)
    return f"s3://{NUCLEUS_BUCKET}/{key}"


def download_artifact(tenant_id: UUID, key: str) -> bytes:
    expected_prefix = f"tenants/{tenant_id}/"
    if not key.startswith(expected_prefix):
        raise TenantBoundaryViolationError(
            f"Attempted cross-tenant access: tenant {tenant_id} → key {key}"
        )
    return s3.get_object(Bucket=NUCLEUS_BUCKET, Key=key)["Body"].read()
```

### 2. IAM scoping with pre-signed URLs

When the host product needs to render a video to its end user, Nucleus
issues a pre-signed URL that's scoped to a single object and a short
TTL (15 minutes). The IAM role used to sign the URL has read access
only to objects under the requesting tenant's prefix:

```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::nucleus-prod/tenants/${aws:RequestTag/tenant_id}/*"
    }
  ]
}
```

If the application accidentally tries to sign a URL for the wrong
tenant's object, IAM rejects the request before any data leaves the
bucket.

## Redis namespacing

Every Redis key includes the tenant ID:

```
nucleus:{tenant_id}:rate_limit:variant_per_hour
nucleus:{tenant_id}:cost_today_usd
nucleus:{tenant_id}:cache:icp_persona:{persona_id}
nucleus:{tenant_id}:lock:job:{job_id}
```

The Celery broker uses queue names that include the tenant only for
fair-sharing accounting; task payloads are scoped to a tenant via
the task's `tenant_id` argument, not via queue routing. (Per-tenant
queues would explode the queue count and break Celery's worker
balancing.)

## Brand KB store isolation

LightRAG and LlamaIndex use directory-based storage. Each Brand KB
gets its own directory:

```
/data/nucleus/brand-kbs/{tenant_id}/{brand_kb_id}/
    documents/
    embeddings/
    knowledge_graph/
    metadata.json
```

The application enforces that every KB query takes a `brand_kb_id`
that has been resolved through the RLS-protected `brand_kbs` table,
so a query for KB X is impossible if X belongs to a different tenant.

## Inference service isolation

External inference calls (TRIBE v2 via NeuroPeer, Veo 3.1, HeyGen,
ElevenLabs, Lyria) are made by Nucleus on behalf of a tenant. Two
isolation properties:

### Tenant tag in every request

Every outbound API call includes a `nucleus_tenant_id` header (or
metadata field, where supported). This is for audit logging and per-
tenant rate limiting on the provider side, not for security — but it
makes per-tenant cost attribution trivial.

### No cross-tenant request batching

A naive cost optimization would batch multiple tenants' inference
requests into a single provider call. Nucleus does not do this. Each
call is per-tenant. The cost of mixed batching (a bug leaks one
tenant's content to another's response) is not worth the savings.

## Logs and traces

Every log line and OpenTelemetry span carries a `tenant_id` attribute:

```python
logger.bind(tenant_id=tenant_id).info("candidate.delivered", candidate_id=candidate_id)

with tracer.start_as_current_span("nucleus.candidate.generate") as span:
    span.set_attribute("nucleus.tenant_id", str(tenant_id))
    span.set_attribute("nucleus.candidate_id", candidate_id)
    ...
```

This makes per-tenant debugging fast. When a tenant reports an issue,
the entire trace tree is filterable by their `tenant_id` in Grafana
Tempo.

## Tenant deletion

When a tenant is deleted (right-to-erasure under GDPR, contract end,
admin request), the deletion cascade hits every storage layer:

```python
def delete_tenant(tenant_id: UUID) -> None:
    with db.atomic():
        # Postgres CASCADE deletes everything tenant-scoped
        Tenant.delete(tenant_id)
    # Storage cleanup runs in a background task
    delete_tenant_storage.delay(str(tenant_id))


@celery_app.task
def delete_tenant_storage(tenant_id: str) -> None:
    # S3 prefix
    s3_delete_prefix(NUCLEUS_BUCKET, f"tenants/{tenant_id}/")
    # Brand KB directories
    shutil.rmtree(f"/data/nucleus/brand-kbs/{tenant_id}/", ignore_errors=True)
    # Redis namespace
    redis_delete_pattern(f"nucleus:{tenant_id}:*")
    emit_event(None, "tenant.deleted", {"tenant_id": tenant_id})
```

The deletion is irreversible. The `job_events` audit log retains a
single row recording that the tenant was deleted, with no further
detail.

## Auditing isolation

A nightly job runs a sample of cross-tenant probes against the live
Postgres instance:

1. Pick a random tenant T1
2. Pick a random tenant T2 (T1 ≠ T2)
3. Set context to T1 and run a query that *should* return only T1's
   data — assert nothing belonging to T2 leaks
4. Repeat with raw S3 reads, Redis pattern scans, and KB queries

If any probe returns cross-tenant data, the whole production
deployment is paged immediately and a postmortem starts.

## What this isolation does NOT cover

Two important caveats.

### Side-channel attacks

If two tenants happen to share a GPU during a scoring pass, in theory
one tenant could measure timing or memory patterns from the other.
This is mitigated by the GPU pool isolation policy: each scoring task
runs in a fresh container with its own GPU process, and the GPU is
not shared mid-task. But it's not zero — anyone with access to the
underlying hardware (the cloud provider) could attack. This is the
same threat model every multi-tenant SaaS has.

### Trusted insiders

A malicious or compromised employee with database admin access can
read any tenant's data. Standard mitigations apply: principle of
least privilege, audit logging on the admin role, periodic access
reviews, customer-managed keys for the highest-tier tenants.

## Multi-region

Tenant isolation includes data residency. A tenant marked as
`region=eu-west` has all its data stored in EU-region Postgres,
EU-region S3, EU-region Redis, and routes all inference requests
through EU-region provider endpoints where supported. The region
choice is locked at tenant creation and is not changeable post-hoc.
