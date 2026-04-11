# Compliance & Legal

This section is the compliance and legal reference for Nucleus.
Every page here is written to drive engineering, product, and
contract decisions — not to replace outside-counsel review before
go-live.

## What's in this section

| Page | Subject |
|---|---|
| [TRIBE v2 license](license-tribe-v2.md) | CC BY-NC 4.0, the commercial-use risk, the fallback path |
| [FTC synthetic testimonials](ftc-synthetic-testimonials.md) | 16 CFR Part 465 and what it means for Nucleus output |
| [EU AI Act](eu-ai-act.md) | Article 50 transparency obligations and the labeling pattern |
| [SOC 2 inheritance](soc2.md) | How Nucleus inherits SOC 2 from the host product |
| [GDPR](gdpr.md) | Brand KB as personal data, sub-processor disclosure, right to erasure |
| [Output IP and likeness](output-ip.md) | Who owns the output, voice cloning consent, watermarking |

## The compliance posture in one paragraph

Nucleus runs inside a host product (TruPeer for the first deployment)
that already holds SOC 2, ISO 27001, GDPR, SSO, and SCIM. Nucleus
inherits the host's compliance boundary and is responsible for
maintaining the controls inside that boundary. The two real legal
risks are (1) the TRIBE v2 CC BY-NC license, which the engine is
designed to fall back from via a pluggable analyzer, and (2) the
FTC's 2024 rule on AI-generated testimonials, which Nucleus handles
by defaulting to non-testimonial output and requiring explicit
disclosure for any testimonial-style variant.

## The biggest risk

**The TRIBE v2 license is the biggest legal risk and the engine is
designed around it.**

TRIBE v2 ships under CC BY-NC 4.0. Nucleus's commercial use of TRIBE
v2 in a paid pipeline is, under any honest reading of the license,
on the commercial side of the line. Meta FAIR has historically not
granted commercial relicenses for CC BY-NC research releases, and
the compliance research recommends building the production engine
around an in-house alternative analyzer rather than waiting for a
license.

The architectural response is the [pluggable analyzer interface](../how-it-works.md#pluggable-analyzer):

| Analyzer | License | Commercial path | Status |
|---|---|---|---|
| `TribeV2Analyzer` | CC BY-NC 4.0 | Research / benchmarking only | Default for non-commercial use |
| `AttentionProxyAnalyzer` | Internally trained | Cleanly commercial | **Recommended for production** |
| `BehavioralProxyAnalyzer` | Per-vendor SaaS terms | Cleanly commercial | Available for tenants who prefer a third-party |

The recommendation from the legal research is to **scope TRIBE v2
to internal benchmarking only** and ship the production loop on the
in-house analyzer. The full reasoning is on the
[license page](license-tribe-v2.md).

## The compliance ladder for go-live

Before Nucleus is generally available, the following must be true:

| Item | Owner | Status |
|---|---|---|
| Outside-counsel review of TRIBE v2 use scope | Legal | Pending |
| Production analyzer (`AttentionProxyAnalyzer`) shipped or alternative confirmed | Engineering | In flight |
| FTC disclosure pattern implemented for any avatar archetype | Engineering + Product | Pending |
| EU AI Act watermarking pattern (C2PA + SynthID) implemented | Engineering | Pending |
| SOC 2 control inheritance documented in trust portal | Compliance | Pending |
| GDPR DPA template ready for tenants | Legal | Pending |
| Sub-processor list published | Compliance | Pending |
| Vulnerability disclosure policy published | Engineering | Pending |
| Incident response runbook tested | Engineering | Pending |
| Voice clone consent pattern implemented | Engineering + Product | Pending |

The full launch checklist is in the [launch sequence](../gtm/launch.md).
This section is the source-of-truth for what each item means.
