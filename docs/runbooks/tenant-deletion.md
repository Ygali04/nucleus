# Tenant Deletion

How to permanently delete a tenant and all their data. This is
irreversible. Double-check before running.

## When to use this runbook

- Tenant has exercised right to erasure (GDPR Article 17)
- Tenant contract has ended and the host product has requested
  deletion
- Tenant is being deleted as part of an incident response
- Tenant was created in error

## Pre-deletion checklist

Before running any deletion commands:

- [ ] Confirm the request is legitimate (came from the tenant's
  authorized admin via the host product)
- [ ] Confirm the tenant ID is correct
- [ ] Confirm a backup exists if ever needed for audit
- [ ] Check if any active legal holds apply (if yes, stop)
- [ ] Notify the host product's support team
- [ ] Log the deletion request in the incident tracker

## Deletion scope

Tenant deletion removes:

- All Postgres rows scoped to the tenant (via CASCADE)
- All S3 prefixes under `tenants/$TENANT_ID/`
- All Brand KB storage directories
- All Redis keys matching `nucleus:$TENANT_ID:*`
- All voice clone records
- All pre-signed URLs (expire on delete)
- All webhook subscriptions
- All usage metering records
- All audit events (except a single "tenant deleted" summary row
  for the legal record)

Deletion does **not** remove:

- The single audit event recording that the tenant was deleted
  (kept indefinitely for the legal record)
- Logs in Loki (auto-expire per the 30-day retention policy)
- Traces in Tempo (same)
- Aggregated metrics in Grafana (per-tenant metrics become
  retroactively anonymous after delete)

## The deletion procedure

### Step 1 — Pre-deletion snapshot

Take a final snapshot of the tenant's state for audit purposes.

```bash
nucleus-admin tenants export \
  --tenant-id "$TENANT_ID" \
  --include documents,jobs,variants,usage \
  --output "/tmp/tenant-$TENANT_ID-final-snapshot.json.gz"
```

Store the snapshot encrypted in the audit archive for 1 year.

### Step 2 — Suspend the tenant

Suspending prevents new activity while deletion runs.

```bash
nucleus-admin tenants suspend \
  --tenant-id "$TENANT_ID" \
  --reason "erasure_request"
```

After this, the tenant cannot:

- Submit new jobs
- Query the Brand KB
- Access their variants via the API
- Log in through the host product's Nucleus panel

### Step 3 — Cancel in-flight jobs

Any jobs currently running for this tenant need to be killed.

```bash
nucleus-admin jobs list --tenant-id "$TENANT_ID" --status "briefed,planning,generating,delivering"
```

For each in-flight job:

```bash
nucleus-admin jobs cancel --job-id "$JOB_ID" --reason "tenant_deletion"
```

Wait until no jobs are in non-terminal states before proceeding.

### Step 4 — Delete from Postgres

This runs the full cascade.

```bash
nucleus-admin tenants delete \
  --tenant-id "$TENANT_ID" \
  --confirm-tenant-id "$TENANT_ID" \
  --yes-i-know-this-is-permanent
```

The command:

1. Starts a transaction
2. Writes a `tenant.deleted` event to the audit log with the
   timestamp, the reason, and a hash of the tenant's name
3. Cascades DELETE across all tenant-scoped tables (RLS is
   bypassed using the admin role)
4. Commits
5. Enqueues a background task for storage cleanup

Expected duration: a few seconds for Postgres, longer for the
background storage cleanup.

### Step 5 — Verify Postgres deletion

```bash
nucleus-admin tenants exists --tenant-id "$TENANT_ID"
```

Should return:

```
Tenant not found.
Deletion audit event: 2026-04-10T14:23:11Z (reason: erasure_request)
```

### Step 6 — Wait for storage cleanup

The background task handles the slower storage deletes:

```bash
nucleus-admin tenant-deletion-task status --tenant-id "$TENANT_ID"
```

Output evolves from:

```
Status: running
Stages:
  Postgres: complete
  S3 prefix: in progress (23% deleted)
  Brand KB directories: pending
  Redis namespace: pending
```

to:

```
Status: complete
Stages:
  Postgres: complete
  S3 prefix: complete (prefix tenants/$TENANT_ID/ verified empty)
  Brand KB directories: complete
  Redis namespace: complete
Completed at: 2026-04-10T14:27:42Z
Total objects deleted: 12,483
```

Typical completion time: 2–10 minutes for a typical tenant; longer
for Enterprise tenants with large variant histories.

### Step 7 — Verify storage deletion

Manual double-check on each storage layer:

#### S3

```bash
aws s3 ls "s3://nucleus-prod/tenants/$TENANT_ID/" --recursive
```

Should return no results.

#### Brand KB directories

```bash
ls /data/nucleus/brand-kbs/$TENANT_ID/
```

Should return:

```
ls: cannot access '/data/nucleus/brand-kbs/$TENANT_ID/': No such file or directory
```

#### Redis

```bash
redis-cli --scan --pattern "nucleus:$TENANT_ID:*" | head -10
```

Should return nothing.

### Step 8 — Update the host product

The host product needs to know the deletion completed so it can
update its own records.

```bash
nucleus-admin hosts notify-deletion \
  --host-tenant-id "$HOST_TENANT_ID" \
  --deleted-at "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

This posts a signed webhook to the host product's webhook
endpoint.

### Step 9 — Close the request

1. Update the incident tracker with "deleted"
2. Send a confirmation email to the tenant (if direct contact is
   appropriate) or to the host product
3. File the final snapshot in the audit archive
4. Mark the deletion complete in the GDPR request tracker

## Deletion timeline commitment

Nucleus commits to completing tenant deletion within **72 hours**
of receiving a valid request. In practice, most deletions complete
within 30 minutes, but the 72-hour window accounts for:

- Manual review by a human
- Pre-deletion snapshot creation
- Waiting for in-flight jobs to stop
- Background storage cleanup
- Host product notification

For GDPR purposes, the 72-hour commitment is conservative — the
regulation requires "without undue delay" and commonly interpreted
as 30 days. Nucleus beats that by an order of magnitude.

## Partial deletion (data subject, not whole tenant)

If the request is from an individual data subject whose data is
inside a tenant (not the whole tenant), use this instead:

```bash
nucleus-admin brand-kb data-subject-delete \
  --brand-kb-id "$KB_ID" \
  --identifier "$EMAIL_OR_NAME"
```

This deletes documents and variants referencing the identifier
while leaving the tenant and its other data intact.

Partial deletions complete in seconds.

## Legal holds

If the tenant is subject to a legal hold (litigation,
investigation, contract dispute), deletion must be paused:

1. Document the legal hold in the audit log:
   ```bash
   nucleus-admin tenants legal-hold \
     --tenant-id "$TENANT_ID" \
     --hold-id "$LEGAL_HOLD_ID" \
     --reason "litigation"
   ```
2. Deletion attempts will now return a legal-hold error
3. The hold must be released before deletion can proceed:
   ```bash
   nucleus-admin tenants release-legal-hold \
     --tenant-id "$TENANT_ID" \
     --hold-id "$LEGAL_HOLD_ID"
   ```

Only the legal team can place or release legal holds. Engineering
handles the execution, legal handles the decision.

## What happens if deletion fails mid-way

If the cascade succeeds in Postgres but the background storage
cleanup fails:

1. The tenant is logically deleted (no more app access)
2. Storage artifacts remain until cleanup succeeds
3. The background task retries every 10 minutes
4. After 3 retries, it alerts the on-call engineer
5. Manual intervention recovers:
   ```bash
   nucleus-admin tenant-deletion-task retry \
     --tenant-id "$TENANT_ID" \
     --stage s3_prefix
   ```

Under no circumstances is a tenant half-deleted and accessible.
Either they're fully active, suspended but intact, or logically
deleted with storage cleanup in progress.

## Audit requirements

Every tenant deletion produces these audit artifacts:

| Artifact | Location | Retention |
|---|---|---|
| Pre-deletion snapshot | Audit S3 bucket, encrypted | 1 year |
| Deletion event in `job_events` | Postgres | Indefinite |
| Deletion request source | Incident tracker | 7 years |
| Host product notification | Webhook log | 1 year |
| Storage cleanup completion log | Structured log (Loki) | 30 days |

For a compliance auditor asking "was this tenant deleted and
when," the answer is in the `job_events` row that persists
indefinitely.

## What this runbook doesn't cover

- **Tenant suspension** (without deletion) — use
  `nucleus-admin tenants suspend`
- **Account recovery** — impossible after deletion
- **Partial data recovery** — also impossible
- **Bulk deletion across multiple tenants** — requires approval
  from the engineering lead and is handled case-by-case
- **Deletion of the Nucleus service itself** — out of scope
