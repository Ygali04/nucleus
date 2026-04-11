# Provider Failure

What to do when an external provider (Veo, HeyGen, ElevenLabs,
Lyria, NeuroPeer, etc.) is returning errors.

## When to use this runbook

- Provider Health dashboard shows > 10% error rate on a specific
  provider for > 10 minutes
- Failed-candidate runbook (step B) pointed here
- Customer reports a specific feature failing (e.g., "avatar
  generation is broken")

## The provider list

For reference, the providers Nucleus depends on and their failure
impacts:

| Provider | Layer | Failure impact | Backup |
|---|---|---|---|
| Google Veo 3.1 | Diffusion video | Marketing archetype fails | Seedance 2.0, Runway Gen-4 |
| Seedance 2.0 | Diffusion video | Cost-optimized marketing fails | Veo 3.1 Lite, Kling 3.0 |
| Runway Gen-4 | Diffusion video | Character-consistent shots fail | Kling 3.0 (multi-shot) |
| Kling 3.0 | Diffusion video | Character-consistent shots fail | Runway Gen-4 |
| HeyGen | Avatar | Marketing archetype avatar fails | Tavus (conversational), Synthesia |
| Tavus | Avatar (conversational) | Interactive avatar fails | HeyGen |
| ElevenLabs | Voice | All archetypes fail (voice is in every variant) | Cartesia Sonic 2 (hot), F5-TTS self-host (cold) |
| Google Lyria | Music | All archetypes fail if music is required | Mubert, Stable Audio 2 self-host |
| NeuroPeer (TRIBE v2) | Scoring | Research-only, commercial path unaffected | `AttentionProxyAnalyzer` (always-on backup) |
| OpenRouter | LLM | Generator + editor agents fail | Direct Anthropic / OpenAI / Google API |
| Voyage AI | Embeddings | Brand KB search degrades | OpenAI text-embedding-3-small, BGE self-host |
| Twelve Labs Marengo | Segment embeddings | Demo / knowledge segment selection degrades | Transcript-only retrieval fallback |

## Triage steps

### Step 1 — Open the Provider Health dashboard

`grafana.nucleus.dev/d/provider-health`

Identify:

- Which provider is failing?
- What's the error rate (4xx vs 5xx)?
- Is it all endpoints or specific operations?
- How long has it been happening?

### Step 2 — Check the provider's public status page

Every provider has a status page. Links:

| Provider | Status page |
|---|---|
| Google Cloud (Veo, Lyria) | `status.cloud.google.com` |
| OpenAI | `status.openai.com` |
| ElevenLabs | `status.elevenlabs.io` |
| HeyGen | `status.heygen.com` |
| Tavus | `status.tavus.io` |
| Runway | `status.runwayml.com` |
| Luma | `status.lumalabs.ai` |
| Pika | `status.pika.art` |
| Anthropic | `status.anthropic.com` |
| OpenRouter | `status.openrouter.ai` |

If the provider is in a known incident, there's nothing to do
except wait and fall back to alternatives.

### Step 3 — Categorize the error

| Error code | Cause | Action |
|---|---|---|
| 401 Unauthorized | Auth key rotated or expired | Rotate key via secret manager |
| 402 Payment Required | Provider account over quota | Expand account or throttle |
| 403 Forbidden | Content policy violation | No action on provider side; flag candidate |
| 429 Too Many Requests | Rate limited | Back off and retry (automatic) |
| 5xx | Provider internal error | Retry with backoff, then fall back |
| Timeout | Provider slow | Retry, then fall back |

### Step 4 — Determine if this is transient or permanent

**Transient signals:**

- Sporadic errors (not constant)
- Recovery within minutes when retried
- Provider's status page shows green
- No recent deploy on their side

**Permanent signals:**

- Constant errors (100% or near 100%)
- No recovery on retry
- Provider's status page shows incident
- Auth errors (401)

## Specific provider playbooks

### Playbook A — Veo 3.1 failures

Failure impact: marketing archetype clips fail, especially hero
shots.

1. Check Vertex AI quota on the Google Cloud console
2. Check the provider's status page
3. If transient:
   - Let the automatic retry handle it
   - Monitor for recovery
4. If sustained (> 10 minutes):
   - **Failover to backup:** modify `nucleus/config/archetypes.yaml`
     to route marketing hero clips to Runway Gen-4.5 instead
   - Restart the workers to pick up the config change:
     ```bash
     nucleus-admin workers restart --queue nucleus.gen.marketing
     ```
   - Alert customers whose in-flight marketing jobs are affected
5. If auth error (401):
   - Check the Veo API key in the secret manager
   - Check if the key was rotated by Google (email notification)
   - Rotate if needed

### Playbook B — HeyGen failures

Failure impact: marketing archetype avatar shots fail.

1. Check HeyGen's status page
2. Check if the failure is TruPeer's HeyGen integration or
   Nucleus's direct fallback
3. If transient: retry
4. If sustained:
   - **Failover to Tavus:** config change to route to Tavus for
     talking-head shots
   - Tavus is more expensive and optimized for conversational
     use — it's a usable fallback but not a cost-neutral one
   - Alert the cost monitor that cost per variant will temporarily
     rise
5. If the failure is specifically through TruPeer's integration
   (not direct HeyGen):
   - Coordinate with TruPeer engineering on the shared Slack
     channel
   - The issue may be on TruPeer's side, not Nucleus's

### Playbook C — ElevenLabs failures

Failure impact: **all archetypes fail** because voice is in
every variant. This is the highest-impact provider failure.

1. Check ElevenLabs' status page
2. Check the error code
3. If transient: retry (automatic)
4. If sustained:
   - **Failover to Cartesia Sonic 2** (hot fallback)
   - Config change:
     ```bash
     nucleus-admin config set voice_provider cartesia_sonic_2
     nucleus-admin workers restart --queue nucleus.gen.*
     ```
   - Cartesia has different voice clones, so the **brand's voice
     will sound different** — notify the customer before they
     notice
   - This is a known trade-off; documented in the provider
     abstraction
5. If failure persists for > 1 hour:
   - Escalate to the engineering lead
   - Consider standing up the F5-TTS self-host fallback (slower
     but fully offline)

### Playbook D — NeuroPeer scoring failures

Failure impact: scoring fails, which means the recursive loop
can't iterate. Jobs still produce a first variant but it's
not scored.

1. Check NeuroPeer's status dashboard
2. Check DataCrunch spot GPU availability
3. If transient: retry
4. If sustained:
   - **Failover to `AttentionProxyAnalyzer`** (always-on
     backup)
   - This is automatic per the
     [pluggable analyzer design](../how-it-works.md#pluggable-analyzer)
   - Verify the fallback is being used:
     ```bash
     nucleus-admin analyzer status
     ```
   - Output should show `active: attention_proxy` during the
     outage
   - The fallback is lower-fidelity on neural prediction but
     comparable on behavioral outcome prediction, so the loop
     still converges

### Playbook E — OpenRouter failures

Failure impact: LLM calls fail, which affects the generator and
editor agents. No new variants can be scripted.

1. Check OpenRouter's status
2. Check which underlying provider is failing (OpenRouter
   routes to Anthropic, OpenAI, Google)
3. If transient: retry
4. If sustained:
   - **Direct-call fallback:** route LLM calls directly to
     Anthropic / OpenAI / Google APIs instead of through
     OpenRouter
   - This requires individual API keys, which are in the secret
     manager
   - Config change:
     ```bash
     nucleus-admin config set llm_provider anthropic_direct
     ```

## When to wake up engineering

Escalate beyond the on-call engineer when:

- Failure affects > 50% of active tenants
- Failure lasts > 1 hour with no resolution
- Failure is novel (no runbook covers it)
- Failover requires code changes, not just config changes
- The provider in question is a sole source with no hot backup

## When to wake up the customer success team

Notify customer success when:

- Sustained provider outage affects a specific named customer
- A customer is actively running a high-visibility campaign
  (product launch, seasonal moment)
- A customer's branded voice clone is affected (they'll notice
  within hours)

## After the incident

Close-out actions:

1. **Document the incident** in the incident log
2. **Update the provider's entry** in the dashboard if new
   failure modes were discovered
3. **Revert the config** if a failover was used temporarily
4. **Postmortem** if the incident was HIGH severity or higher
5. **Update this runbook** if any step was unclear

## Provider vendor management

Beyond incidents:

- **Monthly provider review** — are any providers trending
  worse on reliability? Should we switch defaults?
- **Quarterly pricing check** — did any provider change prices
  silently?
- **Annual contract renewal** — negotiate volume discounts as
  Nucleus's usage grows

These are handled by the engineering lead, not the on-call
engineer.
