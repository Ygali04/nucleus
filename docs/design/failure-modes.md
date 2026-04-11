# Failure Modes

A catalog of what can go wrong inside the Nucleus engine, what each
failure looks like to the operator, what the engine does about it
automatically, and what the human in the loop is expected to do.

## Failure taxonomy

| Class | Example | Auto-recovery? | Operator action |
|---|---|---|---|
| Transient external | Provider 5xx, S3 throttle, DNS blip | Yes (retry) | None unless rate exceeds threshold |
| Permanent external | Provider 4xx (validation, auth, content policy) | No | Triage; may need to update brief or content |
| Transient internal | Celery worker crash, DB connection blip | Yes (retry) | None unless rate exceeds threshold |
| Permanent internal | Application bug, schema mismatch | No | Code fix, rollback if recent deploy |
| Tenant-induced | Quota exceeded, invalid brief, missing brand KB | No | None — tenant must adjust |
| Cross-tenant integrity | Data leak, RLS bypass, privilege escalation | No | Page on-call immediately |

## External provider failures

### Provider 5xx (transient)

| Provider | Symptom | Retry strategy |
|---|---|---|
| ElevenLabs | 503 Service Unavailable, 504 Gateway Timeout | 3 retries, 60s base backoff, jitter |
| Veo / Seedance / Sora 2 / Pika / Luma / Runway | 502 Bad Gateway, generation queue overflow | 4 retries, 120s base backoff, switch provider on 3rd retry |
| HeyGen | 503, render queue overflow | 3 retries, 90s base backoff |
| Lyria | 502, 504 | 3 retries, 30s base backoff |
| NeuroPeer scorer | 503, GPU OOM | 3 retries, 60s base backoff, fall back to `AttentionProxyAnalyzer` after 2 |

After exhausting retries, the candidate fails with `provider_error`
and the operator-facing alert fires if the per-provider error rate
exceeds 10% over 10 minutes.

### Provider 4xx (permanent)

| Code | Likely cause | Action |
|---|---|---|
| 400 Bad Request | Invalid parameters in our request | No retry; mark candidate failed; emit error to Sentry; fix the bug |
| 401 Unauthorized | Stale or rotated API key | No retry; page on-call immediately; rotate the key |
| 402 Payment Required | We've exceeded our provider account quota | No retry; page on-call; expand the account or stop the job |
| 403 Forbidden | Content policy violation | No retry; mark candidate failed; flag for review |
| 404 Not Found | We pointed at a stale model name | No retry; fix in code |
| 422 Unprocessable | Invalid JSON schema | No retry; fix in code |
| 451 Unavailable for Legal Reasons | Geographic block, IP block | No retry; check region, switch provider |

### Provider rate limit (429)

429 responses pause the per-provider semaphore for the value of
`Retry-After` and then retry. Three consecutive 429s switch us to a
backup provider where one is configured. Persistent 429s mean we need
to negotiate higher provider limits or reduce concurrency.

### Provider returned garbage

| Symptom | Action |
|---|---|
| Voice synthesizer returned silent audio | Detect via RMS check; mark iteration failed; retry once |
| Diffusion video returned a 1-frame still | Detect via frame count; mark failed; retry once |
| Avatar mouth doesn't move (lip-sync failure) | Hard to detect automatically; flag for review based on score collapse |
| LLM returned hallucinated content not in Brand KB | Detect via post-hoc grounding check; mark iteration as low-quality; let editor try a different angle |
| Music bed has no audio | Detect via RMS; retry once |
| Diffusion clip contains a watermark | Detect via OCR or trained watermark detector; mark failed |

The garbage-detection layer is a per-provider validator that runs
between the provider response and the persistence step. Anything that
fails validation never gets persisted as a successful artifact.

## Internal failures

### Worker crash

A worker dying mid-task is normal — spot instances get reclaimed,
deploys cycle workers, OOM kills happen. The orchestrator handles
this:

1. Celery's broker re-queues the task after the visibility timeout
2. The retry runs from scratch
3. Idempotency keys + iteration index uniqueness prevent duplicate work

If a worker is crashing repeatedly on the same task, an alert fires
and the task lands in the DLQ for inspection.

### Database connection pool exhausted

| Symptom | Auto-recovery |
|---|---|
| `nucleus_db_pool_in_use` gauge near max | Yes — slow queries get rejected by `pool_timeout`, callers retry |
| Long-held transactions | Hard to auto-recover — alert if any transaction lasts > 30s |

The pool is sized at `max_connections=20` per worker. If the pool is
saturated, the bottleneck is usually a slow Postgres query that needs
an index, or a transaction that's holding row locks too long.

### Postgres unavailable

Postgres going down is a critical incident. The orchestrator detects
this within 5 seconds:

1. All in-flight tasks fail with `db_unavailable`
2. New tasks are rejected at the API gateway (503)
3. The worker pool stops accepting new work
4. The on-call engineer is paged
5. When Postgres recovers, the workers resume; in-flight tasks retry
   automatically; the API gateway accepts requests again

The `nucleus_availability` SLO accommodates ~3.5 hours of downtime per
month. Postgres on Railway has historically delivered better than
this; the SLO is intentionally conservative.

### Redis unavailable

Redis going down is high-severity but not critical:

| Component | Impact |
|---|---|
| Celery broker | New tasks can't be enqueued; in-flight tasks finish |
| Rate limit counters | Falls back to "allow" (fail-open) for 60 seconds, then "deny" (fail-closed) |
| Cache | Falls back to direct DB queries (slower) |
| Tenant concurrency caps | Unenforceable; the orchestrator pauses new candidate dispatch until Redis is back |

Redis recovery is fast (typically seconds). The fallback behavior is
designed so that brief Redis blips don't cause cascading failures.

### S3 / MinIO unavailable

| Operation | Behavior |
|---|---|
| New uploads | Fail with `storage_unavailable`; tasks retry |
| Existing reads | Fail; affected candidates fail; alert |

S3 unavailability is rare but high-impact. Mitigation: Cloudflare R2
as a backup bucket configured per region. The application supports
multi-bucket reads (try primary first, fall back to backup).

## Tenant-induced failures

### Quota exceeded

| Quota | When checked | What returns |
|---|---|---|
| Variants per month | At brief submission + at delivery | 402 at submission; iteration finalizes with `quota_ceiling` warning if hit mid-job |
| Concurrent jobs | At brief submission | 429 |
| Cost per variant | At every iteration | Iteration finalizes with `cost_ceiling` |
| Cost per month | At every iteration | Job pauses; tenant is notified |

These are not failures the engine "fixes" — they require the tenant
to act (upgrade the plan or wait for the window to reset).

### Invalid brief

The Pydantic schema rejects invalid briefs at the API boundary:

```json
{
  "error": "validation_error",
  "details": [
    {"field": "icps[2]", "message": "ICP persona ID does not exist for this tenant"},
    {"field": "languages[0]", "message": "Language 'klingon' is not supported"}
  ]
}
```

No work is started until the brief validates.

### Empty Brand KB

A brief that targets a Brand KB with no documents is rejected with a
helpful error explaining how to ingest documents first.

### Source recording without a transcript

Source recordings need transcripts before semantic segment search
works. The ingestion pipeline auto-transcribes on upload. If a brief
arrives before transcription completes, the brief waits in `pending`
state until the transcript is ready (with a timeout of 5 minutes;
after that, the brief fails with `source_not_ready`).

## Cross-tenant integrity failures

These are the failures Nucleus is designed to make impossible. If one
of them happens, it's a critical incident.

### Cross-tenant data leak

Detected by:

- Nightly probe job that runs cross-tenant queries and asserts no leaks
- WAF and access log monitoring for unexpected tenant_id values
- Customer reports

When detected:

1. Page on-call immediately (CRITICAL severity)
2. Identify affected tenants
3. Quarantine the affected components
4. Notify affected tenants within 72 hours (GDPR requirement)
5. Post-incident review and remediation

This is the failure mode the entire [tenant isolation](tenant-isolation.md)
design exists to prevent.

### Privilege escalation

Detected by:

- Audit log review for unexpected role changes
- Failed-auth rate spikes
- Unexpected admin-role usage

When detected:

1. Page on-call
2. Revoke the compromised credential
3. Investigate scope
4. Rotate all related secrets

## Wedged loop detection

A "wedged" loop is one that runs indefinitely without producing a
deliverable variant. Wedged loops are prevented by the stop conditions,
but the orchestrator double-checks via the janitor:

```python
@celery_app.task(name="nucleus.janitor.detect_wedged")
def detect_wedged_candidates():
    threshold = now() - timedelta(minutes=30)
    wedged = Candidate.query(
        status__in=["generating", "scoring", "editing"],
        updated_at__lt=threshold,
    )
    for c in wedged:
        emit_event(c.job_id, "candidate.wedged", {"candidate_id": c.id})
        Candidate.update(c.id, status="failed", terminal_reason="wedged")
```

The janitor runs every minute. The threshold is 30 minutes — generous
enough to allow for slow GPU contention, tight enough to catch real
wedges.

## Cascading failures

A cascading failure is one where a single root cause produces a wave
of secondary failures. Common patterns and their mitigations:

| Pattern | Mitigation |
|---|---|
| Provider down → all candidates using it fail → DLQ floods | Per-provider semaphore + queue isolation per archetype |
| One bad brief produces 500 failed candidates → cost spike | Cost ceiling per candidate + per job |
| One slow query saturates the DB pool → all requests fail | Pool timeout + per-tenant query cost monitoring |
| One stuck loop wedges a worker → queue backlog | Janitor + per-worker timeout |
| One tenant's runaway job starves others | Fair-share scheduling + per-tenant concurrency cap |

The general principle: **every component has a circuit breaker.**
When something is failing, the engine stops trying to make it work
harder and isolates the failure.

## Postmortem template

Every CRITICAL incident gets a postmortem within 7 days. Template:

```markdown
# Incident: [short description]

## Summary
One paragraph: what happened, who was affected, how long, what fixed it.

## Timeline (UTC)
- 14:23 — Symptom first observed
- 14:25 — On-call paged
- 14:32 — Root cause identified
- 14:48 — Fix deployed
- 15:01 — Incident closed

## Impact
- Tenants affected: [list]
- Variants delayed/failed: [count]
- Customer-facing downtime: [duration]
- Data integrity: [unaffected | affected — describe]

## Root cause
What actually went wrong. Be specific. Code commits if relevant.

## What went well
Things that helped catch the issue or limit the blast radius.

## What went badly
Things that made the issue worse or harder to fix.

## Action items
Numbered list. Each item has an owner and a due date.

## Lessons learned
The takeaway for future engineering decisions.
```

Postmortems are blameless. They focus on system improvements, not
individual mistakes.
