# Security

This page describes how Nucleus protects tenant data, customer
content, and the engine itself. The threat model assumes a
production B2B SaaS environment where the host product holds SOC 2,
ISO 27001, and GDPR — Nucleus inherits those obligations and must not
weaken them.

## Threat model

| Threat | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Cross-tenant data leak via app bug | Medium | Critical | Row-level security in Postgres, per-tenant S3 prefixes, nightly probe job |
| Compromised provider API key | Low | High | Per-provider keys in secret manager, quarterly rotation, scoped IAM |
| Compromised database admin | Very low | Critical | Principle of least privilege, audit logging on admin role, customer-managed keys for top tier |
| DoS against the API | Medium | Medium | Per-tenant rate limits, fair-share scheduling, queue isolation |
| Prompt injection in Brand KB content | High | Medium | Sandbox the agent, never expose tool-call output to other tenants |
| Malicious source-recording upload (bombs, malware in metadata) | Low | Medium | File-type validation, ffmpeg in sandboxed container, virus scan optional |
| Compromised dev environment leaking prod credentials | Medium | High | No prod credentials in dev environments; SSO + 2FA on all engineering accounts |
| Supply-chain attack via Python dependency | Medium | High | Pinned dependency hashes, dependabot, periodic audit |
| Cookie / session theft | Low | Medium | HttpOnly + Secure + SameSite=Strict on session cookies, short TTLs |
| Replay of expired JWT | Very low | Low | JWT expiry verified, optional jti uniqueness for high-security tenants |

## Encryption

| Data | At rest | In transit |
|---|---|---|
| Postgres | Disk-level encryption (Railway-managed) + row-level encryption for PII fields | TLS 1.3 |
| S3 / MinIO | SSE-S3 (AES-256) by default; SSE-KMS for tenants requiring customer-managed keys | TLS 1.3 |
| Redis | Disk-level encryption + AUTH password | TLS 1.3 within VPC |
| Brand KB stores | Disk-level encryption on the worker volume | N/A (local) |
| Logs | Loki at-rest encryption | TLS 1.3 |
| Backups | Encrypted snapshots | TLS 1.3 |

### Customer-managed keys

Top-tier tenants can supply their own KMS key for S3 encryption. The
tenant settings hold a reference to the key ARN, and the upload helpers
use it for SSE-KMS. Key rotation is the customer's responsibility once
they opt into CMK.

## Secret management

Secrets are stored in Railway's secret manager (or 1Password Connect
for engineering-managed secrets). The application reads them from
environment variables at boot. Three categories:

| Category | Examples | Rotation |
|---|---|---|
| Provider API keys | ElevenLabs, Veo, HeyGen, Lyria, NeuroPeer | Quarterly |
| Internal signing keys | JWT signing key (host-shared), webhook HMAC | Quarterly |
| Database credentials | Postgres URL, Redis URL, S3 IAM | On compromise; otherwise yearly |
| TLS certificates | Auto-managed by Railway / Cloudflare | Auto |

### Secret rotation workflow

1. Generate new secret (provider dashboard or KMS)
2. Add as a new env var with `_NEW` suffix in Railway
3. Deploy the application — it now reads both `KEY` and `KEY_NEW`
4. Verify the new secret works
5. Swap: rename `KEY` → `KEY_OLD`, rename `KEY_NEW` → `KEY`
6. Deploy again
7. Wait 24 hours
8. Remove `KEY_OLD` from Railway and revoke the old secret at the
   provider

This ladder prevents zero-downtime rotation from breaking in-flight
requests.

### What never goes in source control

- Provider API keys
- Database URLs
- Signing keys
- Webhook secrets
- Customer data (test fixtures use synthetic data only)

A pre-commit hook (`detect-secrets`) blocks commits containing patterns
that look like API keys.

## PII handling

### What Nucleus considers PII

| Data | PII? | Why |
|---|---|---|
| Brand KB document content | Sometimes | If it contains customer names, sales call transcripts, support tickets |
| User identifier in JWT | Yes | Used for audit attribution |
| Email in JWT | Yes | Optional but used for notifications |
| Source recording video | Sometimes | If it contains identifiable people on screen or in audio |
| Generated variant video | Sometimes | If it contains a cloned voice tied to a real person |
| Job event log | No | Internal, no personal data |
| Cost / usage metrics | No | Aggregated, tenant-scoped only |

### PII storage rules

- PII fields in Postgres use `pgcrypto` for column-level encryption
- The encryption key is held in the secret manager, separate from the
  database credentials, so a leaked DB dump alone is not sufficient to
  decrypt
- PII is never logged in structured logs (the logging processor strips
  fields named `email`, `name`, `phone`, `address`, `ip`)
- PII is never written to traces (the OTel processor strips the same
  fields)

### Right to erasure (GDPR Article 17)

When a customer requests deletion:

1. The host product calls `DELETE /api/v1/tenants/{id}` on Nucleus
2. Nucleus runs the [tenant deletion cascade](tenant-isolation.md#tenant-deletion)
3. The deletion is logged in `job_events` with `event_type='tenant.deleted'`
4. The audit log entry is the only thing that survives — it contains
   no PII, only the tenant ID and timestamp

The deletion completes within 24 hours of the request.

### Data subject access requests

A customer asking "what data do you hold about me?" gets a JSON
export of:

- Their `tenants` row
- Their `brand_kbs` and `kb_documents` rows
- Their `jobs`, `candidates`, `iterations`, `neural_reports`, `gtm_guides`
- Their `usage_events`
- Their `source_recordings`

The export is generated by an admin tool, signed, and delivered via
the host product's existing data export channel.

## Network security

| Boundary | Mechanism |
|---|---|
| Public API | Cloudflare in front of Railway, WAF rules, DDoS protection |
| API to workers | Internal Railway network, no public exposure |
| Workers to DB | Internal Railway network, mTLS optional |
| Workers to Redis | Internal Railway network, AUTH password |
| Workers to S3 | TLS, IAM-scoped per environment |
| Workers to providers | Public TLS, IP allowlist where supported |
| Admin access | SSO + 2FA + IP allowlist |

## API rate limiting

See [rate limiting](rate-limiting.md) for the full per-tenant limits.
The security-relevant limits:

| Limit | Window | Threshold |
|---|---|---|
| Failed auth attempts | 1 minute | 10 per IP, then 1-hour ban |
| New tenant creation | 1 hour | 100 per host product |
| Brief submission | 1 minute | 60 per tenant default |
| Brand KB document upload | 1 hour | 1000 documents per tenant |

Rate limit responses use `429 Too Many Requests` with a `Retry-After`
header.

## Input validation

Every input from the host product is validated by a Pydantic schema
at the API boundary. Invalid input is rejected with `400 Bad Request`
and a structured error code that the host product can show to the
user.

Specific validation rules:

| Input | Rule |
|---|---|
| `brief.icps[]` | Each ICP ID must exist in the tenant's persona library |
| `brief.languages[]` | Each language must be in the host product's supported set |
| `brief.archetypes[]` | Each archetype must be enabled for the tenant |
| `brief.threshold` | 0 ≤ threshold ≤ 100 |
| `brief.max_iterations` | 1 ≤ max_iterations ≤ 10 (no wedged loops) |
| `brief.cost_ceiling_usd` | Optional, max $100 per candidate |
| Source recording URL | Must point to a tenant-owned recording |
| Brand KB ID | Must point to a tenant-owned KB |
| File upload size | < 500 MB per file |
| File MIME type | Whitelist: `video/mp4`, `video/quicktime`, `application/pdf`, `text/markdown`, `text/plain` |

## Output validation

Outputs back to the host product are also validated. The API never
returns partially-rendered objects or null fields where a non-null
schema requires.

## Audit logging

Every state-changing operation appends to the `job_events` table
([data model](data-model.md#job_events)):

```sql
INSERT INTO job_events (job_id, candidate_id, iteration_id, event_type, payload)
VALUES ($1, $2, $3, $4, $5);
```

Event types:

- `brief.submitted`
- `plan.expanded`
- `candidate.generated`
- `candidate.scored`
- `iteration.evaluated`
- `edit.planned`
- `edit.applied`
- `candidate.delivered`
- `candidate.failed`
- `tenant.deleted`
- `auth.session_created`
- `auth.session_revoked`
- `provider.error`
- `quota.exceeded`

The event log is append-only — no updates, no deletes. It's the
canonical "what happened" source of truth.

## Provider sub-processor disclosure

Every external provider Nucleus calls is a GDPR sub-processor and
must be disclosed in the customer-facing trust portal. The current
list:

| Sub-processor | Purpose | Data flow | Region |
|---|---|---|---|
| OpenRouter (LLM routing) | Generator + editor agent calls | Prompts may include Brand KB excerpts | US |
| Anthropic / Google / OpenAI | Underlying LLM models (via OpenRouter) | Same | US |
| ElevenLabs | Voice synthesis | Scripts (text only) | US |
| Veo / Seedance / Sora 2 / Pika / Luma / Runway | Diffusion video | Scene prompts (text only); reference images for image-to-video | US, mixed |
| HeyGen | Avatar generation | Scripts + brand kit references | US |
| Lyria | Music generation | Mood prompts (text only) | US |
| NeuroPeer (TRIBE v2 host) | Neuro scoring | Generated variants only | US |
| Twelve Labs (Marengo embeddings) | Source segment indexing | Source recordings | US |
| Railway | Application hosting | Everything | US (US-East default) |
| AWS S3 / Cloudflare R2 | Object storage | Everything | Tenant-selected region |

Adding a new sub-processor requires:

1. Vendor security review
2. DPA signature
3. Update to the trust portal
4. Customer notification (30-day notice for material additions)

## Vulnerability disclosure

A `SECURITY.md` in the repo describes how to report a vulnerability:

- Email: `security@nucleus.dev` (or routed through the host product
  initially)
- Encrypted with PGP key (fingerprint published)
- Acknowledgment within 24 hours, fix within 7 days for high-severity,
  30 days for medium

Public disclosure happens after a coordinated fix, not before.

## Incident response

When a security incident is detected:

1. **Identify the scope.** Which tenants are affected? What data is
   at risk?
2. **Contain.** Disable the affected component, rotate keys, block
   the malicious actor.
3. **Notify.** Affected tenants within 72 hours (GDPR requirement).
   Host product first, end customers via the host product.
4. **Investigate.** Pull traces, logs, audit events. Determine root
   cause.
5. **Remediate.** Fix the bug, ship the fix, verify in production.
6. **Postmortem.** Internal write-up within 7 days. Publish customer-
   facing summary if material.

The incident response runbook lives in [runbooks → incident response](../runbooks/incident-response.md).

## What this design intentionally doesn't include

- **No customer-managed encryption keys for Postgres or Redis.** Cost
  vs. value didn't justify it for the first design partner; revisit
  for tier above enterprise add-on.
- **No HSM-backed signing.** JWT signing keys are in the secret
  manager. Move to KMS-backed signing if a customer requires it.
- **No air-gapped deployment.** Nucleus is multi-tenant SaaS. A single-
  tenant on-prem deployment is a separate product line.
