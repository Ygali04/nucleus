# Stuck Job Recovery

What to do when a job or candidate is stuck in a non-terminal
state.

## When to use this runbook

- The janitor task flagged a candidate as stuck
- A customer reports a job that's been "pending" for too long
- Dashboard shows `nucleus_candidates_in_flight` higher than
  expected without throughput

## The state machine refresher

See [design → state machine](../design/state-machine.md) for the
full reference. The relevant non-terminal states:

| State | Expected duration | Stuck if |
|---|---|---|
| `pending` | < 30 seconds | > 5 minutes |
| `generating` | < 3 minutes | > 10 minutes |
| `scoring` | < 1 minute | > 5 minutes |
| `evaluating` | < 10 seconds | > 1 minute |
| `editing` | < 2 minutes | > 10 minutes |
| `delivering` | < 1 minute | > 5 minutes |

The janitor task auto-recovers candidates stuck for > 30 minutes
(see [orchestrator → stuck-state recovery](../design/state-machine.md#stuck-state-recovery)).
This runbook is for candidates stuck less than 30 minutes, or for
manual investigation of auto-recovered ones.

## Triage steps

### Step 1 — Identify the stuck candidates

```bash
nucleus-admin candidates list \
  --status "pending,generating,scoring,editing" \
  --older-than "5 minutes" \
  --order updated_at_asc
```

Output:

```
candidate_id                          status     updated_at           tenant_id    archetype
--------------------------------------+----------+--------------------+------------+----------
8f4a1c7d-...                          generating 2026-04-10T14:23:11Z acme_corp    marketing
9e2f8b6a-...                          scoring    2026-04-10T14:25:02Z acme_corp    demo
1c3d5e7f-...                          editing    2026-04-10T14:18:45Z beta_co      marketing
```

### Step 2 — Check the candidate's event log

```bash
nucleus-admin candidate events --candidate-id "8f4a1c7d-..."
```

The event log shows every state transition and the payload. Look
for:

- Which task last executed successfully
- Whether there's a pending task that never ran
- Whether there's an error that wasn't retried

### Step 3 — Identify the stuck stage

Based on the event log and current state, determine what's stuck:

| Current state | Likely stuck stage |
|---|---|
| `pending` | Worker pool isn't picking up the task |
| `generating` | Generator agent or provider call is slow/hung |
| `scoring` | NeuroPeer or GPU pool is slow/down |
| `evaluating` | Orchestrator evaluator isn't running |
| `editing` | Editor agent or edit execution is slow/hung |
| `delivering` | Report renderer or strategist agent is slow/hung |

## Specific stuck-stage playbooks

### Stuck in `pending`

The candidate was created but no worker picked it up.

1. Check Celery queue depth:
   ```bash
   celery -A nucleus.worker.celery_app inspect active
   celery -A nucleus.worker.celery_app inspect reserved
   ```
2. Check worker count for the relevant queue:
   ```bash
   nucleus-admin workers list --queue "nucleus.gen.$ARCHETYPE"
   ```
3. If no workers are running, check Railway service status for
   the worker pool
4. If workers are running but not picking up tasks:
   - Check Redis broker health
   - Check if the queue name matches the task routing
   - Restart the workers:
     ```bash
     nucleus-admin workers restart --queue "nucleus.gen.$ARCHETYPE"
     ```
5. If the candidate is stuck for > 15 minutes with workers
   available, it's probably poisoned — manually fail it:
   ```bash
   nucleus-admin candidates fail --candidate-id "$CANDIDATE_ID" --reason "pending_stuck"
   ```

### Stuck in `generating`

The generator agent is running but hasn't finished.

1. Check the candidate's trace in Tempo:
   ```
   nucleus.candidate_id = "$CANDIDATE_ID"
   ```
2. Identify which provider call is hanging (Veo, HeyGen,
   ElevenLabs, etc.)
3. If a provider is hanging:
   - Check provider health
   - Follow the [provider failure runbook](provider-failure.md)
4. If the generator is stuck on its own (no provider call in
   progress):
   - Check the LLM call latency (maybe OpenRouter is slow)
   - Check generator prompt size (maybe a bug is producing huge
     prompts)
5. If the generator has been stuck > 10 minutes:
   - Kill the worker process running the task:
     ```bash
     nucleus-admin candidates kill --candidate-id "$CANDIDATE_ID"
     ```
   - The candidate will be retried automatically
   - If it gets stuck again after retry, mark it failed

### Stuck in `scoring`

The scoring call is slow or hung.

1. Check NeuroPeer's dashboard
2. Check DataCrunch GPU pool health
3. If NeuroPeer is down:
   - Verify `AttentionProxyAnalyzer` is active as the fallback
   - If not, switch manually:
     ```bash
     nucleus-admin config set analyzer attention_proxy
     ```
4. If the GPU pool is saturated:
   - Check GPU queue depth:
     ```bash
     nucleus-admin gpu-pool status
     ```
   - Consider scaling the pool temporarily
5. Kill the candidate if stuck > 5 minutes:
   ```bash
   nucleus-admin candidates kill --candidate-id "$CANDIDATE_ID"
   ```

### Stuck in `evaluating`

The orchestrator's `evaluate.iteration` task isn't running.

1. This is rare — the task is a pure function with no external
   dependencies
2. Check Sentry for exceptions in `nucleus.evaluate.iteration`
3. Check that the orchestrator's worker queue has capacity
4. Manually re-enqueue the evaluation:
   ```bash
   nucleus-admin candidates re-evaluate --candidate-id "$CANDIDATE_ID"
   ```

### Stuck in `editing`

The editor agent is stuck — either planning the edit or applying
it.

1. Check which sub-stage: edit.plan or edit.apply
2. `edit.plan` stuck → editor agent LLM call is slow:
   - Check OpenRouter latency
   - Check prompt size
   - Kill and retry
3. `edit.apply` stuck → a specific edit primitive is hanging:
   - Usually a provider call (visual substitution = diffusion,
     music swap = Lyria, etc.)
   - Follow provider failure playbook for the specific provider
4. If the candidate has been in editing > 10 minutes:
   ```bash
   nucleus-admin candidates kill --candidate-id "$CANDIDATE_ID"
   ```

### Stuck in `delivering`

Final delivery is stuck. This is usually fast (report rendering +
GTM synthesis).

1. Check which sub-stage: report.render or gtm.synthesize
2. `report.render` stuck:
   - Check the PDF rendering worker
   - Check for large neural report payloads that break the
     renderer
3. `gtm.synthesize` stuck:
   - Check the strategist agent LLM call
   - Check that all candidates in the job are actually complete
4. If stuck > 5 minutes, mark the candidate delivered with a
   warning and proceed:
   ```bash
   nucleus-admin candidates force-deliver \
     --candidate-id "$CANDIDATE_ID" \
     --terminal-reason "delivery_timeout"
   ```

## Manual intervention commands

### Kill a stuck candidate

Forces the candidate to fail with a manual kill reason. Safe but
irreversible.

```bash
nucleus-admin candidates kill --candidate-id "$CANDIDATE_ID"
```

### Re-enqueue a stuck candidate

Requeues the most recent task for the candidate. Safe; the task
is idempotent so double-execution is OK.

```bash
nucleus-admin candidates reenqueue --candidate-id "$CANDIDATE_ID"
```

### Force-deliver a stuck candidate

Marks the candidate as delivered on whatever the latest
iteration's artifact is. Use when the candidate is in `delivering`
and the final steps are stuck.

```bash
nucleus-admin candidates force-deliver \
  --candidate-id "$CANDIDATE_ID" \
  --terminal-reason "manual_override"
```

### Mark a whole job as failed

Rare. Use when a whole job is unrecoverable.

```bash
nucleus-admin jobs fail --job-id "$JOB_ID" --reason "manual_override"
```

## The janitor task

The automatic janitor runs every 60 seconds and catches
candidates stuck > 30 minutes. Its job is to prevent wedged
candidates from eating worker slots and to ensure nothing is
left hanging forever.

You can trigger the janitor manually:

```bash
nucleus-admin janitor run
```

## After resolving a stuck candidate

1. **Document it** in the incident log if it was part of a
   broader incident
2. **Check for a pattern** — are candidates getting stuck at the
   same stage repeatedly?
3. **Update the runbook** if a new failure mode was discovered
4. **Improve the automatic recovery** if the manual intervention
   was obvious
5. **Notify the customer** if their job was affected and failed
   or was manually force-delivered

## Root causes worth investigating

If you're seeing repeated stuck candidates in the same state, the
root cause might be:

| State | Root cause candidates |
|---|---|
| `pending` | Worker pool underscaled, Celery broker flaky, queue routing bug |
| `generating` | Provider contract drift, LLM prompt regression, memory leak in worker |
| `scoring` | GPU pool undersized, NeuroPeer degradation, slice-scoring bug |
| `editing` | Edit primitive bug, LLM token-limit regression, provider slowness |
| `delivering` | Report renderer memory, strategist agent prompt issue |

Repeated stuck candidates are a quality issue that needs an
engineering investigation, not just ops intervention.
