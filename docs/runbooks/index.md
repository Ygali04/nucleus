# Runbooks

Operational playbooks for running Nucleus in production. Written
for the on-call engineer, the customer success team, and anyone
who needs to do something specific without rereading the full
design docs.

Every runbook is step-driven. Commands are copy-pasteable.
Dashboard links are direct. Decision trees are explicit.

## What's in this section

| Runbook | Audience | When to use |
|---|---|---|
| [Onboard a new tenant](onboarding-tenant.md) | Customer success | New TruPeer customer wants Nucleus enabled |
| [Ingest a Brand KB](brand-kb-ingestion.md) | Customer success + engineering | Tenant needs their brand knowledge loaded |
| [Incident response](incident-response.md) | On-call engineer | Page fires, something is broken |
| [Cost monitoring](cost-monitoring.md) | Engineering + finance | Cost spike investigation |
| [Provider failure](provider-failure.md) | On-call engineer | A provider (Veo, HeyGen, ElevenLabs, etc.) is returning errors |
| [Stuck job recovery](stuck-job-recovery.md) | On-call engineer | A job is stuck in a non-terminal state |
| [Tenant deletion](tenant-deletion.md) | Engineering + compliance | Tenant has exercised right-to-erasure |

## The runbook philosophy

Five rules.

### 1. Numbered steps, not prose

Every runbook is a numbered list of actions. Prose is for the
design docs, not the runbooks.

### 2. Copy-pasteable commands

Every command is ready to run. Variables are named clearly
(`$TENANT_ID`, not "the tenant's ID"). If a command needs a
password or token, the runbook says exactly where to get it.

### 3. Decision trees for branching

When a runbook branches ("if the job is in state X, do this;
if in state Y, do that"), the branch is explicit and labeled
clearly. No "it depends" without specifying what.

### 4. Rollback for everything risky

If a step could make things worse, the runbook includes the
rollback for that specific step inline.

### 5. Update after every use

When an engineer uses a runbook and finds a step that's unclear
or outdated, they update the runbook as part of closing out the
incident. Runbooks rot if they're not maintained.

## On-call structure

Nucleus's on-call rotation is weekly. The on-call engineer:

- Carries the pager (PagerDuty)
- Responds to high-severity alerts within 15 minutes
- Triages lower-severity alerts within 1 hour during business
  hours
- Follows the incident response runbook when something breaks
- Closes out any incident within 24 hours of resolution
- Writes a postmortem for any CRITICAL-severity incident within
  7 days

Escalation goes to the project lead after 15 minutes of
unacknowledged page.

## Dashboard links

The on-call engineer's first stops when something fires:

| Dashboard | URL | What it shows |
|---|---|---|
| Engine Overview | `grafana.nucleus.dev/d/engine-overview` | Top-level pulse, aggregate over all tenants |
| Tenant Detail | `grafana.nucleus.dev/d/tenant-detail?var-tenant=$TENANT_ID` | Per-tenant deep dive |
| Job Detail | `grafana.nucleus.dev/d/job-detail?var-job=$JOB_ID` | Per-job replay |
| Provider Health | `grafana.nucleus.dev/d/provider-health` | Per-provider error rates and latencies |
| Cost & Margin | `grafana.nucleus.dev/d/cost-margin` | Daily cost, projected month-end |
| Sentry | `sentry.io/organizations/nucleus/issues` | Unhandled exceptions |
| Loki logs | `grafana.nucleus.dev/explore?datasource=loki` | Structured log search |
| Tempo traces | `grafana.nucleus.dev/explore?datasource=tempo` | Distributed traces |

(The actual URLs will be set at deploy time; this is the shape.)

## Emergency contacts

| Who | When to call | How |
|---|---|---|
| Project lead | After 15 min unacknowledged | PagerDuty escalation |
| Database admin | Postgres crash or corruption | Slack #incidents |
| TruPeer engineering | Host-product integration issue | Shared Slack channel |
| Provider support (per provider) | Repeated 5xx from a specific provider | Per-provider contact list in 1Password |
| Legal | Cross-tenant data leak or compliance incident | Email + phone in 1Password |

## Runbook maintenance

Runbooks are reviewed and updated quarterly. The review checks:

1. Are all the commands still valid?
2. Are all the URLs still live?
3. Are the decision trees still accurate?
4. Have there been incidents where the runbook was insufficient?
5. Does the runbook cover any new failure modes that have
   emerged?

Stale runbooks are worse than missing runbooks. A missing runbook
makes an engineer think; a stale runbook makes them act wrong.
