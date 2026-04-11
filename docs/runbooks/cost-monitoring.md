# Cost Monitoring

How to track, investigate, and respond to cost anomalies in
Nucleus.

## When to use this runbook

- Daily cost review (every morning)
- Monthly finance close
- Alert fires: cost per variant p99 > $3, daily tenant cost > 10×
  projected
- Customer asks about their usage
- CFO asks "why is compute up this month"

## The canonical dashboards

| Dashboard | Purpose |
|---|---|
| Cost & Margin | Daily cost across all tenants, broken out by category |
| Tenant Detail (Cost tab) | Per-tenant cost over time |
| Provider Health (Cost tab) | Per-provider cost contribution |

## Daily cost review (5 minutes)

Run this every morning. It's the fastest check that nothing is
bleeding money.

### Step 1 — Open Cost & Margin dashboard

Look at the last 24 hours. Compare to the trailing 7-day average.

- **Normal:** within ±20% of trailing average
- **Worth investigating:** 20–50% above
- **Alarming:** > 50% above (usually paged)

### Step 2 — Check the top-line numbers

```
Total cost (last 24h):           $X
Variants delivered (last 24h):   Y
Cost per variant:                $X / Y
Gross margin at $5 sticker:      (5 - cost/variant) / 5
```

Thresholds:

- Cost per variant > $1.50: investigation required
- Cost per variant > $3.00: paged
- Gross margin < 50%: pricing review required

### Step 3 — Check per-tenant breakdown

Any tenant spending > 10× their rolling average gets flagged.
Common causes:

- New large brief submitted
- Loop stuck on a high-iteration candidate
- Provider pricing change
- Genuine scaling (legitimate)

### Step 4 — Check per-provider breakdown

Any provider suddenly more expensive gets flagged. Common causes:

- Provider pricing change (check their status page / email)
- Increased usage of a specific archetype that routes to that
  provider
- Routing table change

## Per-tenant cost investigation

When a specific tenant's cost looks off:

### Step 1 — Get the tenant's detail view

```bash
nucleus-admin tenants cost --tenant-id "$TENANT_ID" --days 7
```

Output:

```
Tenant: Acme Corp (ID: ...)
7-day cost:                   $412.18
Daily average:                $58.88
Variants delivered (7d):      487
Cost per variant:             $0.85

Breakdown by category:
  LLM:           $12.20  (3%)
  Voice:         $24.35  (6%)
  Music:         $4.87   (1%)
  Diffusion:     $195.60 (47%)
  Avatar:        $73.20  (18%)
  GPU scoring:   $39.50  (10%)
  Infra:         $62.46  (15%)
```

### Step 2 — Identify the anomaly

Compare to the tenant's baseline:

- Diffusion spiked? → check which archetype they're running
- Avatar spiked? → check if they switched to a more expensive
  provider
- GPU scoring spiked? → check iteration counts (loop may be
  stuck)
- LLM spiked? → check generator prompt length (regression?)

### Step 3 — Check the tenant's recent jobs

```bash
nucleus-admin jobs list --tenant-id "$TENANT_ID" --limit 20 --order cost_desc
```

The most expensive recent jobs often tell the story. Open the
Job Detail dashboard for the top 3–5.

### Step 4 — Check for stuck iterations

```bash
nucleus-admin candidates list \
  --tenant-id "$TENANT_ID" \
  --status "generating,scoring,editing" \
  --older-than "30 minutes"
```

Any candidate stuck > 30 minutes is probably wedged. Follow the
[stuck job recovery runbook](stuck-job-recovery.md).

### Step 5 — Apply mitigation

Options, in order of aggressiveness:

1. **Do nothing** — if the cost spike is legitimate (scaling)
2. **Notify the tenant** — if the spike is driven by their own
   brief changes
3. **Apply a temporary per-tenant cost ceiling**:

```bash
nucleus-admin tenants set-setting \
  --tenant-id "$TENANT_ID" \
  --key "cost_ceiling_per_variant_usd" \
  --value 1.00
```

4. **Switch the tenant to cheaper provider routing**:

```bash
nucleus-admin tenants set-setting \
  --tenant-id "$TENANT_ID" \
  --key "diffusion_provider" \
  --value "seedance-2.0-lite"
```

5. **Pause the tenant's active jobs** (CRITICAL only):

```bash
nucleus-admin jobs pause --tenant-id "$TENANT_ID" --all
```

## Per-provider cost investigation

When a specific provider is suddenly expensive:

### Step 1 — Verify the pricing

Check the provider's current pricing page. Compare to the rate
Nucleus is being billed. A mismatch means either:

- The provider raised prices without notice → contact support
- Nucleus's routing isn't respecting the quota tier
- Nucleus's billing integration has drifted

### Step 2 — Check the usage pattern

```bash
nucleus-admin providers usage --provider "$PROVIDER" --days 7
```

Look for:

- Sudden volume increase
- Shift to a more expensive tier (e.g., Full instead of Fast)
- Longer clip durations (diffusion providers charge per second)
- Retry storms inflating calls

### Step 3 — Mitigate

Options:

1. **Switch to the backup provider** (via the routing table in
   `nucleus/config/archetypes.yaml`)
2. **Temporarily rate-limit the provider** to prevent further
   spend
3. **Contact the provider** if pricing seems wrong

## Monthly finance close

End-of-month cost reconciliation:

### Step 1 — Pull the month's total

```bash
nucleus-admin cost report --month "$YYYY-MM"
```

### Step 2 — Reconcile against provider invoices

Each provider sends an invoice. Compare Nucleus's recorded cost
to the provider's invoice. Discrepancies > 5% need investigation.

### Step 3 — Roll up per-tenant

```bash
nucleus-admin cost report --month "$YYYY-MM" --by-tenant
```

Hand this to finance for billing against the host product's
revenue-share agreement.

### Step 4 — Check the gross margin

At the monthly level, gross margin should match the projected
target (7× at $5/variant sticker, ~5× at enterprise discount).
If it's drifting down, revisit provider routing.

### Step 5 — Publish the monthly cost report

Internal report to:

- Engineering (for cost optimization priorities)
- Finance (for billing)
- Leadership (for business metrics)

## Cost optimization projects

When costs need to come down, the levers in order of
effectiveness:

### Lever 1 — Slice scoring (70% GPU cost reduction)

Already built. The slice-scoring endpoint on NeuroPeer cuts
per-iteration GPU cost by ~70%. If the benefit isn't showing up,
verify that the endpoint is being called on iterations ≥ 2.

### Lever 2 — Provider routing (20–50% diffusion cost reduction)

Shift default diffusion to cheaper providers for non-hero clips.
Seedance 2.0 Lite ($0.010/sec) vs Veo 3.1 Full ($0.40/sec) is a
40× difference per second. Use Full only for hero shots; Lite
for everything else.

### Lever 3 — Remotion composition (removes diffusion for demo/knowledge)

Demo and knowledge archetypes don't need diffusion for most
variants. Remotion-only composition is ~$0 marginal cost.

### Lever 4 — Caching (10–20% reduction for repeated queries)

Brand KB queries that hit the cache save embedding + retrieval
cost. Tenants with high cache hit rates are cheaper to serve.

### Lever 5 — GPU spot (25–40% scoring cost reduction)

DataCrunch spot A100s are ~$0.45/hour vs on-demand at ~$1.80.
Already the default; verify the spot pool is healthy.

### Lever 6 — Per-archetype cost ceilings

Lower the cost ceiling for low-revenue archetypes. Education
archetype at a higher ceiling makes sense; demo at a lower
ceiling keeps the margin high.

## What this runbook doesn't cover

- **Pricing changes for the host product** — that's a business
  decision, not an ops task
- **Contract renegotiation with providers** — handled by
  engineering lead + legal
- **Billing disputes with customers** — handled by TruPeer
  customer success
- **Long-term cost forecasting** — handled by finance with
  engineering input
