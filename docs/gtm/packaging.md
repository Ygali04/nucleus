# Packaging

This page is the operator's reference for what each pricing tier
contains, what's gated, and how the upgrade path works. The
[pricing](pricing.md) page covers the dollar amounts; this page
covers the feature surface.

## Tier matrix

| | Starter | Growth | Enterprise |
|---|---|---|---|
| **Volume** | 100 var/mo | 1,000 var/mo | 10,000+ var/mo |
| **Sticker** | $199/mo | $1,499/mo | Custom |
| **Cost per variant (effective)** | $1.99 | $1.50 | $1–$2.50 |
| **Concurrent jobs** | 1 | 5 | 50 |
| **Brand KBs** | 1 | 5 | Unlimited |
| **Source recordings** | 10 | 100 | Unlimited |
| **Languages** | 5 | 25 | All 65+ |
| **Archetypes** | Demo only | Demo + Marketing | All 4 |

## Per-feature gating

### Engine features

| Feature | Starter | Growth | Enterprise |
|---|---|---|---|
| Recursive edit loop | ✅ | ✅ | ✅ |
| Slice scoring (per-iteration cost optimization) | ✅ | ✅ | ✅ |
| 18-metric neural taxonomy | ✅ | ✅ | ✅ |
| Default scoring weights per archetype | ✅ | ✅ | ✅ |
| Custom scoring weights | ❌ | ✅ | ✅ |
| Brand-learned weights (auto-tune from in-market data, v2) | ❌ | ❌ | ✅ |
| Pluggable analyzer (TRIBE v2 default) | ✅ | ✅ | ✅ |
| Backup analyzer (`AttentionProxyAnalyzer` fallback) | ✅ (auto) | ✅ (auto) | ✅ (auto) |
| Slice-scoring optimization | ✅ | ✅ | ✅ |

### Generation features

| Feature | Starter | Growth | Enterprise |
|---|---|---|---|
| Demo archetype | ✅ | ✅ | ✅ |
| Marketing archetype | ❌ | ✅ | ✅ |
| Knowledge archetype | ❌ | ❌ | ✅ |
| Education archetype | ❌ | ❌ | ✅ |
| Avatar layer (HeyGen / Tavus) | ❌ | ✅ (1 provider) | ✅ (multi) |
| Diffusion B-roll | ❌ | ✅ (1 provider) | ✅ (multi) |
| Voice cloning (ElevenLabs IVC) | ✅ | ✅ | ✅ |
| Music bed (Lyria) | ✅ | ✅ | ✅ |
| Manim/Mermaid diagrams | ❌ | ❌ | ✅ |
| Custom archetype templates | ❌ | ❌ | ✅ |

### Ingestion features

| Feature | Starter | Growth | Enterprise |
|---|---|---|---|
| PDF upload | ✅ | ✅ | ✅ |
| Markdown upload | ✅ | ✅ | ✅ |
| URL ingestion | ✅ | ✅ | ✅ |
| Notion connector | ❌ | ✅ | ✅ |
| Confluence connector | ❌ | ✅ | ✅ |
| Google Drive connector | ❌ | ✅ | ✅ |
| MCP server integration | ❌ | ❌ | ✅ |
| Custom connectors | ❌ | ❌ | ✅ |
| Auto-refresh on source change | ❌ | ✅ | ✅ |

### Reporting features

| Feature | Starter | Growth | Enterprise |
|---|---|---|---|
| Per-variant neural report | ✅ | ✅ | ✅ |
| Iteration history | ✅ | ✅ | ✅ |
| 3D brain heatmap | ❌ | ✅ | ✅ |
| Multi-variant comparison | ❌ | ✅ | ✅ |
| GTM strategy guide | ❌ | ✅ | ✅ |
| Doc delta (paired SOP/manual output) | ❌ | ❌ | ✅ |
| PDF export | ✅ | ✅ | ✅ |
| Customer-facing white-label PDF | ❌ | ❌ | ✅ |

### Operational features

| Feature | Starter | Growth | Enterprise |
|---|---|---|---|
| API access | ❌ | ✅ | ✅ |
| Webhooks | ❌ | ✅ | ✅ |
| Per-tenant analytics | ❌ | ✅ | ✅ |
| Per-tenant cost tracking | ❌ | ✅ | ✅ |
| Audit log export | ❌ | ❌ | ✅ |
| Customer-managed encryption keys | ❌ | ❌ | ✅ |
| Tenant-region selection | ❌ | ❌ | ✅ |
| Dedicated GPU pool | ❌ | ❌ | ✅ |
| 99.9% SLA | ❌ | ❌ | ✅ |
| 24/7 incident response | ❌ | ❌ | ✅ |

### Support features

| Feature | Starter | Growth | Enterprise |
|---|---|---|---|
| Documentation | ✅ | ✅ | ✅ |
| Community forum | ✅ | ✅ | ✅ |
| Email support | ❌ | ✅ (24h SLA) | ✅ (4h SLA) |
| Slack channel | ❌ | ❌ | ✅ |
| Dedicated success manager | ❌ | ❌ | ✅ |
| Quarterly business review | ❌ | ❌ | ✅ |
| Onboarding white-glove | ❌ | ❌ | ✅ |
| Roadmap input | ❌ | ❌ | ✅ |

## What's intentionally not in any tier

Three things every tier explicitly does not include:

1. **Free unlimited usage.** No tier has uncapped variants. Every tier
   has a delivery cap and a cost ceiling per month.
2. **Long-term variant retention.** All tiers have a 90-day variant
   retention; older variants are archived (still accessible, but
   slower to retrieve). Enterprise can negotiate longer retention.
3. **Right to redistribute the engine.** Nucleus is delivered as a
   service. No tier includes a license to self-host or redistribute
   the engine.

## The upgrade ladder

The natural upgrade path:

1. **Starter → Growth.** Triggered when the tenant hits the 100/month
   variant cap or wants to add the marketing archetype. Upgrade is
   immediate; pricing prorates from the upgrade date.
2. **Growth → Enterprise.** Triggered when the tenant hits the
   1,000/month variant cap, wants the knowledge or education
   archetypes, needs custom scoring, needs SSO, or wants a dedicated
   pool. Upgrade triggers a sales conversation (custom pricing).
3. **Enterprise renewal.** Annual renewal with quarterly true-ups for
   overage volume.

The downgrade path is symmetric. Tenants can downgrade between
billing periods. Variant counts that exceeded the new tier's cap stay
delivered; new jobs respect the new cap immediately.

## Custom contracts

Beyond the three published tiers, three patterns of custom contract
are common:

### Pattern 1 — White-label OEM

A host product wants to brand Nucleus as its own feature with no
visible Nucleus attribution anywhere. This is a custom contract.
Pricing includes:

- A one-time integration fee
- A per-variant rate (no margin shown to the OEM customer)
- A minimum monthly volume commitment
- A revenue share or flat margin agreement

White-label OEM is the natural growth path for the second and third
host products beyond TruPeer.

### Pattern 2 — Agency reseller

An agency producing brand video for multiple clients wants to use
Nucleus internally and resell results under its own brand. Pricing:

- Per-variant rate at the Enterprise floor
- Multi-tenant access (one Nucleus tenant per agency client)
- White-label PDF report option

### Pattern 3 — Sponsored deployment

A company that wants Nucleus deployed for a specific cause or audience
(e.g., a non-profit campaign) sponsors the engine usage. Pricing:

- Flat sponsorship fee that covers a defined volume
- Public attribution on delivered variants

These three custom patterns are not advertised on the marketing site.
They emerge from sales conversations and are negotiated case-by-case.
