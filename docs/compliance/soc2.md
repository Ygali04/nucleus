# SOC 2 Inheritance

Nucleus runs inside a host product (TruPeer for the first
deployment) that holds SOC 2 Type II. Nucleus inherits the host's
certification through a shared-responsibility model. This page
describes the boundary between what the host is responsible for and
what Nucleus must own — and the controls Nucleus has to implement
to maintain SOC 2 inheritance.

## The shared-responsibility model

Inheriting SOC 2 from a host product is not automatic. The host's
certification covers the host's controls. Nucleus, as a sub-system
operating inside the host's product surface, has to:

1. Implement controls that match the host's commitments to its
   customers
2. Document those controls in a way auditors can verify
3. Be auditable as part of the host's annual SOC 2 audit
4. Meet the host's incident response requirements
5. Disclose all sub-processors the host's customers can see

The model is similar to AWS's shared responsibility model: AWS
secures the cloud, customers secure what they put in the cloud. The
host secures the platform, Nucleus secures what Nucleus does inside
the platform.

## The Trust Service Criteria mapping

SOC 2 audits against five Trust Service Criteria. For each, this is
what the host owns vs what Nucleus owns.

### Security

| Control area | Host owns | Nucleus owns |
|---|---|---|
| Identity and authentication | SSO, SCIM, password policy, MFA | JWT validation, scope enforcement |
| Network security | Cloudflare, WAF, DDoS protection | API rate limiting, per-tenant isolation |
| Endpoint security | Engineer laptop policies, MDM | Worker container hardening |
| Encryption at rest | Database disk encryption | PII column encryption |
| Encryption in transit | TLS at edge | TLS to providers |
| Access controls | RBAC for host users | Tenant context enforcement |
| Vulnerability management | Patch cadence, dependency scanning | Same for Nucleus services |
| Logging and monitoring | Application logs, alerting | Job event log, observability |
| Incident response | Incident response plan, postmortems | Same for Nucleus incidents |

### Availability

| Control area | Host owns | Nucleus owns |
|---|---|---|
| Uptime SLA | Host's customer-facing SLA | Nucleus engine availability metric |
| Disaster recovery | Database backups, region failover | Nucleus state recovery, worker resilience |
| Capacity planning | Host's overall infrastructure scaling | Nucleus per-tenant concurrency, GPU pool |
| Change management | Host's deploy process | Nucleus deploy process |

### Processing integrity

| Control area | Host owns | Nucleus owns |
|---|---|---|
| Data validation | Host's API validation | Nucleus brief schema validation |
| Output integrity | Host's UI rendering | Nucleus variant rendering, neural report accuracy |
| Audit logging | Host's user action log | Nucleus job event log |

### Confidentiality

| Control area | Host owns | Nucleus owns |
|---|---|---|
| Data classification | Host's data handling policy | Brand KB content classification |
| Access logging | Host's authentication logs | Nucleus tenant context audit |
| Secure deletion | Host's tenant deletion process | Nucleus tenant deletion cascade |
| Confidentiality agreements | Host's employee NDAs | Same for Nucleus contractors |

### Privacy

| Control area | Host owns | Nucleus owns |
|---|---|---|
| Privacy policy | Host's customer-facing policy | Nucleus's contribution to it |
| PII handling | Host's PII inventory | Nucleus's PII surfaces (Brand KB, voice clones) |
| Consent management | Host's consent UI | Nucleus's voice clone consent records |
| Right to erasure | Host's deletion endpoint | Nucleus's tenant deletion cascade |
| Cross-border data transfers | Host's data residency policy | Nucleus's tenant region selection |

## Concrete controls Nucleus implements

The Trust Service Criteria mapping above is abstract. The concrete
controls Nucleus has shipped or is shipping:

### CC6.1 — Logical access controls

- JWT validation on every API request (see [auth](../design/auth.md))
- Scope-based authorization on every endpoint
- Tenant context set from JWT claims, enforced via Postgres RLS
- Privileged "system" role only used for janitor tasks and admin
  CLI, never by HTTP-facing workers

### CC6.6 — Encryption at rest

- Postgres disk encryption (Railway-managed)
- PII columns encrypted with `pgcrypto`
- S3 SSE-S3 by default; SSE-KMS for tenants requiring CMK
- Brand KB stores on encrypted volumes

### CC6.7 — Encryption in transit

- TLS 1.3 on all external connections
- mTLS optional for worker-to-database connections
- TLS 1.3 on all provider API calls

### CC7.1 — Detection of security events

- Sentry for unhandled exceptions
- OpenTelemetry traces with anomaly detection
- Failed-auth rate alerting
- Cross-tenant probe job runs nightly

### CC7.2 — Monitoring of system performance

- Per-tenant cost dashboards
- Per-provider latency tracking
- SLO dashboards for the engine

### CC7.4 — Capacity management

- Per-tenant concurrency caps
- Fair-share scheduling across tenants
- Horizontal worker scaling

### CC7.5 — Backup and recovery

- Postgres daily snapshots, point-in-time recovery 7 days
- S3 versioned bucket with lifecycle to glacier
- Disaster recovery runbook tested quarterly

### CC8.1 — Change management

- All code changes through PR review
- All schema changes through Alembic migrations
- All deploys gated on test passing
- Rollback runbooks for code, schema, and data

### CC9.2 — Vendor management

- Sub-processor list maintained in customer-facing trust portal
- Vendor security review required for any new external API
- DPAs signed with all sub-processors

## Sub-processor disclosure

SOC 2 customers expect to see who handles their data. Nucleus
publishes a sub-processor list as part of the host's customer-facing
trust portal:

| Sub-processor | Purpose | Data flow | Region |
|---|---|---|---|
| OpenRouter | LLM routing | Prompts may include Brand KB excerpts | US |
| Anthropic / Google / OpenAI | Underlying LLM models (via OpenRouter) | Same | US |
| ElevenLabs | Voice synthesis | Scripts (text only) | US |
| Veo / Seedance / Sora 2 / Pika / Luma / Runway | Diffusion video | Scene prompts (text only); reference images for image-to-video | US, mixed |
| HeyGen | Avatar generation | Scripts + brand kit references | US |
| Lyria | Music generation | Mood prompts (text only) | US |
| NeuroPeer (TRIBE v2 host) | Neuro scoring (research-only after license fallback) | Generated variants only | US |
| Twelve Labs (Marengo embeddings) | Source segment indexing | Source recordings | US |
| Voyage AI | Brand KB embeddings | Brand KB content (text) | US |
| Railway | Application hosting | Everything | US (US-East default) |
| AWS S3 / Cloudflare R2 | Object storage | Everything | Tenant-selected region |
| Sentry | Error tracking | Stack traces, anonymized | US |
| Loki / Grafana Cloud | Logs and metrics | Logs (PII-scrubbed) | US |

The list updates whenever a new sub-processor is added. Customer
notification is required for material additions (30-day notice).

## Audit participation

Nucleus participates in the host's annual SOC 2 audit by:

1. Providing the auditor with documentation of Nucleus's controls
2. Walking the auditor through the Nucleus codebase as needed
3. Producing evidence (logs, configs, tickets) on request
4. Closing any audit findings within agreed timelines

The audit window for the first SOC 2 cycle (covering Nucleus inside
TruPeer) is October 2026 — the first full year of Nucleus
operation.

## Required reading for engineers

Engineers working on Nucleus need to understand the SOC 2
implications of their changes. Required reading:

- This page
- The host product's SOC 2 customer-facing summary
- The [security](../design/security.md) page
- The [tenant isolation](../design/tenant-isolation.md) page
- The host product's incident response runbook

A brief security review is part of every PR that touches:

- Authentication / authorization code
- Tenant isolation enforcement
- External provider calls
- PII handling
- Encryption code

## ISO 27001 inheritance

ISO 27001 is structurally similar to SOC 2 in terms of inheritance.
The host (TruPeer) holds ISO 27001. Nucleus inherits through the
same shared-responsibility model.

The mapping between SOC 2 Trust Service Criteria and ISO 27001
controls is roughly:

| SOC 2 | ISO 27001 |
|---|---|
| Security | A.5–A.18 (most of the standard) |
| Availability | A.17 (business continuity) |
| Processing integrity | A.14 (system development) |
| Confidentiality | A.13 (communications), A.18 (compliance) |
| Privacy | A.18 (compliance) |

The ISO 27001 audit cycle is similar to SOC 2's. Nucleus
participates the same way.

## What this page doesn't cover

- **The full SOC 2 audit report.** That's customer-facing material
  the host produces.
- **HIPAA / HITRUST.** Healthcare customers may need additional
  certifications. Treated as custom contracts.
- **PCI DSS.** Nucleus does not handle payment card data; PCI does
  not apply.
- **FedRAMP.** US federal customers may need FedRAMP. Treated as a
  separate product line; not in scope for the first deployment.
