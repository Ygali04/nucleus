# Incident Response

What to do when a page fires.

## When to use this runbook

A PagerDuty alert has fired against the Nucleus on-call rotation.
This runbook tells you what to check, in what order, to triage
and resolve the incident.

## Severity definitions

| Severity | Examples | Response time |
|---|---|---|
| **CRITICAL** | Cross-tenant data leak, Postgres unavailable, all workers stalled | < 15 minutes |
| **HIGH** | API 5xx rate > 5%, failed-candidate rate > 25%, single-tenant quota runaway | < 30 minutes |
| **MEDIUM** | Provider error rate > 10% on any provider, p95 latency breach | < 2 hours |
| **LOW** | Dashboard warnings, DLQ depth > 50 | Next business day |

## The triage sequence

Every incident, regardless of source, starts here.

### Step 1 — Acknowledge the page

PagerDuty → acknowledge within 5 minutes. If you can't, escalate
immediately.

### Step 2 — Read the alert

Alerts tell you what metric fired and on which dashboard. Read
the alert fully. Don't guess.

### Step 3 — Open the Engine Overview dashboard

`grafana.nucleus.dev/d/engine-overview`

Look for:

- Is there an obvious spike or drop?
- Is it affecting all tenants or one?
- Is it a new pattern or a regression from a recent deploy?

### Step 4 — Check recent deploys

```bash
git log --oneline -n 20 --pretty=format:"%h %ad %s" --date=short
```

Or the deploy dashboard. If a deploy landed in the last hour and
the incident started afterward, **strongly suspect the deploy**.

### Step 5 — Identify the affected scope

| Scope | Response |
|---|---|
| All tenants | Platform-level issue — check infra (Postgres, Redis, Railway) |
| One tenant | Tenant-level issue — check Tenant Detail dashboard |
| One provider | Provider-level issue — follow [provider failure runbook](provider-failure.md) |
| One archetype | Archetype-level — check recent changes to that archetype's generator |

### Step 6 — Identify the immediate action

The general principle: **stabilize before fixing**.

- **Stabilize:** turn off the thing making it worse (disable a
  provider, pause a tenant, roll back a deploy, drain a queue)
- **Fix:** understand the root cause and push a permanent fix

The on-call engineer's job is to get to stable within the response
time budget. The fix can take longer.

## Specific incident playbooks

### Playbook A — API 5xx rate > 5%

1. Open Engine Overview. Is the 5xx rate across all endpoints or
   one?
2. Open Tempo. Filter to traces with `status.code = error`.
3. Is there a common exception? A common endpoint? A common
   tenant?
4. If there's a common exception:
   - Check Sentry for the stack trace
   - Check if it's a regression from the latest deploy
   - If yes, **roll back** the deploy
5. If it's one endpoint:
   - Check that endpoint's recent deploy history
   - Check the endpoint's downstream dependencies (DB, Redis,
     providers)
6. If it's one tenant:
   - Check the tenant's settings (are they on an unusual config?)
   - Check their cost ceiling (are they hitting it?)
   - Consider temporarily suspending the tenant while you
     investigate

### Playbook B — Failed candidate rate > 25%

1. Open Engine Overview. What's the `terminal_reason` breakdown?
2. If the top reason is `provider_error`:
   - Check Provider Health dashboard
   - Identify which provider is failing
   - Follow [provider failure runbook](provider-failure.md)
3. If the top reason is `scorer_error`:
   - Check NeuroPeer health
   - Check GPU pool health on DataCrunch
   - Fall back to `AttentionProxyAnalyzer` if NeuroPeer is down
     for > 10 minutes
4. If the top reason is `unexpected_error`:
   - Check Sentry for the common exception
   - Check for a recent deploy
   - Check for schema drift or migration issues
5. If the top reason is `monotone_failure`:
   - Check editor agent output quality
   - Check for prompt regression
   - This is usually a quality issue, not an availability issue

### Playbook C — Postgres unavailable

This is CRITICAL. All workers will stop.

1. Check Railway dashboard for Postgres service status
2. If Railway shows it's down, their status page should confirm
3. Attempt to connect manually:

```bash
psql $NUCLEUS_DATABASE_URL -c "SELECT 1"
```

4. If the connection works but queries are slow:
   - Check `pg_stat_activity` for long-running queries
   - Check `pg_stat_statements` for recent query regressions
   - Consider killing the long-running queries
5. If the connection fails:
   - Page the database admin
   - Drain the worker pool so tasks stop retrying against a dead
     DB
   - Set the API to 503 mode so clients back off
6. After recovery:
   - Verify data integrity with the nightly probe job
   - Check for any candidates that were mid-task during the
     outage
   - Run the stuck job recovery janitor

### Playbook D — Cross-tenant data leak

This is the worst-case scenario. Page-escalate immediately.

1. **Do NOT delete anything.** Preserve evidence for forensics.
2. Page the project lead + legal + compliance
3. Identify the affected tenants via audit log:

```bash
nucleus-admin audit-log query \
  --event-type "cross_tenant_access" \
  --since "1 hour ago"
```

4. Quarantine the affected components:
   - If the leak is in a specific tenant's data, revoke that
     tenant's sessions
   - If the leak is in a provider response, pause that provider
   - If the leak is in a cache, flush the cache
5. Begin the formal incident response process:
   - Customer notification within 72 hours (GDPR Article 33)
   - Host-product notification within 24 hours (Nucleus
     commitment)
   - Forensic investigation
   - Postmortem within 7 days

### Playbook E — Cost spike

1. Open Cost & Margin dashboard
2. Is the spike isolated to one tenant, one provider, or one job?
3. If one tenant:
   - Check their cost ceiling configuration
   - If they're within their ceiling, it may be legitimate
   - If they're above, the enforcement failed — investigate
4. If one provider:
   - Check for a pricing change (provider emails, docs)
   - Check for an abuse pattern (unexpectedly large clips, etc.)
5. If one job:
   - Check the iteration count — is the loop stuck?
   - Check the candidate count — did the cross-product expand
     too wide?
6. Immediate mitigation options:
   - Pause the offending job
   - Apply a temporary cost ceiling override
   - Switch to cheaper provider tiers (Veo Lite instead of
     Veo Full, Seedance Lite instead of Pro)
7. Follow up:
   - Post-incident review of the cost-control mechanisms
   - Update the [rate limiting](../design/rate-limiting.md)
     design if needed

## Post-incident

After any incident of HIGH severity or above:

1. **Close out the page** in PagerDuty with a short summary
2. **Update the runbook** if any step was unclear or missing
3. **File a postmortem ticket** within 24 hours
4. **Complete the postmortem** within 7 days for CRITICAL, 14
   days for HIGH
5. **Publish a customer-facing status update** if customers were
   affected

## Postmortem template

See [design → failure modes → postmortem template](../design/failure-modes.md#postmortem-template)
for the full structure.

## Escalation

When to escalate:

- **After 15 minutes unacknowledged** — automatic via PagerDuty
- **If the on-call engineer can't make progress** — escalate to
  the project lead
- **If the incident spans Nucleus + host product** — page
  TruPeer engineering in the shared Slack channel
- **If the incident involves legal or compliance** — page legal
- **If the incident involves a sub-processor (Veo, HeyGen, etc.)**
  — contact that provider's support per the contact list in
  1Password

## After-hours

Nucleus is on-call 24/7 for CRITICAL incidents and business hours
for lower severities. After-hours pages for MEDIUM or LOW
severity should be acknowledged but can be deferred to the next
morning.

The on-call rotation is paid for on-call time per the standard
engineering compensation policy.
