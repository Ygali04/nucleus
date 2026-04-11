# GDPR

Nucleus processes personal data on behalf of host product tenants
operating in the EU. This page describes how Nucleus handles GDPR
obligations: data classification, sub-processor disclosure, right
to erasure, cross-border transfers, and the DPA template Nucleus
signs with each tenant.

## The data Nucleus processes

Three categories of data flow through Nucleus, with different GDPR
implications:

### Category 1 — Brand KB content

When a Brand KB document contains:

- Customer names
- Sales call transcripts
- Support ticket text
- Personal email addresses or phone numbers
- Identifiable employee testimonials

...the document holds personal data. Nucleus is a **data processor**
under GDPR Article 4(8); the host product (or the tenant under the
host) is the **controller**.

The processor's obligations under Article 28:

1. Process only on documented instructions from the controller
2. Ensure persons processing data are bound by confidentiality
3. Take security measures pursuant to Article 32
4. Use sub-processors only with the controller's authorization
5. Assist the controller in responding to data subject requests
6. Make available all information necessary to demonstrate
   compliance

Nucleus's DPA template (below) covers all six.

### Category 2 — Voice clones

ElevenLabs voice clones are biometric data under GDPR Article 9
when they identify a specific natural person. Two cases:

| Case | Personal data? |
|---|---|
| A clone of a known employee or executive | **Yes** — biometric, identifies a person |
| A clone of a generic actor (with consent) | Yes, but with documented consent |
| A purely synthetic voice (no human source) | No |

For the first two cases, Nucleus stores documented consent as part
of the voice clone record. The consent record includes:

- The person's name
- The date and method of consent
- The scope of permitted use
- A copy of the signed model release
- The person's right to withdraw consent

Nucleus does not generate voice clones from people who haven't
explicitly consented. The host product is responsible for collecting
consent before uploading audio samples.

### Category 3 — Source recording content

When a source recording shows or names identifiable people, the
recording itself is personal data. Same processor/controller
distinction as Brand KB content. The recording is stored encrypted,
indexed by transcript (which may itself contain personal data), and
accessible only via the tenant context.

## Sub-processor disclosure

Every external API call Nucleus makes is a sub-processor under
GDPR. The full list is on the [SOC 2 page](soc2.md#sub-processor-disclosure)
and is republished in customer-facing trust portals.

Adding a new sub-processor requires:

1. Vendor security review
2. DPA signature with the new sub-processor
3. Update to the trust portal
4. **30-day notice to all tenants** (right of objection under
   Article 28(2))

The 30-day notice is the load-bearing GDPR requirement. Nucleus
cannot add a new sub-processor without giving customers time to
object.

## Right to erasure (Article 17)

When a data subject (an end customer of the brand) exercises their
right to erasure, the request flows up the chain:

1. End customer asks the brand to delete their data
2. Brand asks the host product to delete the data
3. Host product calls Nucleus's deletion API
4. Nucleus runs the targeted deletion

Nucleus supports two granularities of deletion:

### Tenant-level deletion

A whole tenant gets deleted. The cascade described in
[tenant isolation → tenant deletion](../design/tenant-isolation.md#tenant-deletion)
runs:

- All Postgres rows scoped to the tenant
- All S3 prefixes
- All Brand KB directories
- All Redis keys
- All audit log entries (with one summary row retained for the
  legal record)

### Record-level deletion

A specific data subject's data inside a tenant. Harder because the
data subject's information is spread across many records:

- Brand KB documents that mention the person
- Source recordings that show or name the person
- Generated variants that include the person's voice or likeness
- Audit log entries that reference the person

Nucleus exposes a `DELETE /api/v1/data-subject/{identifier}` endpoint
that the host product calls when a data subject erasure request
arrives. The endpoint:

1. Searches the Brand KB for documents matching the identifier
2. Searches source recordings for transcript matches
3. Searches variants for matching voice clones or named avatars
4. Marks all matches for deletion
5. Runs the deletion cascade in a background task
6. Returns a confirmation receipt with the affected record count

The deletion is irreversible. The receipt is the only record that
survives.

The completion target is **30 days** from request, well within the
GDPR Article 12(3) timeline.

## Data subject access requests (Article 15)

A data subject asking "what data do you hold about me?" follows the
same path as deletion. The response is a JSON export of:

- Brand KB documents matching the identifier
- Source recording IDs and metadata (the recordings themselves are
  not returned because they may contain other people's data)
- Variant IDs that include the person's voice or likeness
- Voice clone records, if any
- Audit log summary of when and how the person's data was used

The export is signed and delivered through the host product's
existing data export channel. Completion target: 30 days.

## Cross-border data transfers

Nucleus is hosted on Railway in the US (US-East by default).
Several aspects of GDPR cross-border data transfer rules apply:

### Schrems II / SCCs

The 2020 Schrems II decision invalidated Privacy Shield and requires
either Standard Contractual Clauses (SCCs) or another lawful
mechanism for EU-to-US transfers.

Nucleus's posture:

1. **SCCs in the DPA.** Nucleus's DPA includes the latest EU SCCs
   (Module Two for processor-to-controller) signed by both Nucleus
   and the controller (the host product or its EU customer).
2. **Transfer Impact Assessment (TIA).** Nucleus provides a TIA
   document on request describing the data flow, the destination
   country (US), the technical and organizational measures applied,
   and the assessed risk.
3. **Encryption in transit and at rest.** Combined with the SCCs,
   provides supplementary measures under EDPB guidance.

### EU data residency

For tenants who require EU-only data residency (typically Enterprise
tier customers in regulated industries), Nucleus offers an
**EU-region deployment**:

- Postgres in eu-west (Railway EU region)
- S3 / R2 in eu-central
- Inference providers routed through their EU endpoints where
  available
- No US-region replication

The EU region is locked at tenant creation. Tenants cannot mix
EU and non-EU data in a single deployment.

Not every provider has an EU endpoint. For tenants on the EU
region:

| Provider | EU endpoint? | Action if no |
|---|---|---|
| OpenRouter | Yes | Use EU |
| Anthropic | Yes | Use EU |
| Google Veo / Lyria | Yes (eu-west) | Use EU |
| OpenAI | Yes (eu-west) | Use EU |
| ElevenLabs | Limited | Document risk in TIA |
| HeyGen | No | Document risk; opt-out per tenant |
| Tavus | No | Document risk; opt-out per tenant |
| Pika / Luma / Runway | No | Document risk; opt-out per tenant |
| Twelve Labs | Yes | Use EU |
| Voyage AI | No | Document risk |
| NeuroPeer (research-only) | Configurable | Use EU |

For EU-tier tenants, providers without EU endpoints are disabled by
default. Tenants can opt back in on a per-provider basis after
acknowledging the cross-border risk.

## DPA template

Nucleus signs a Data Processing Agreement with each host product
that covers:

1. Roles (Nucleus = processor, host = controller)
2. Subject matter, duration, nature, purpose
3. Categories of personal data
4. Categories of data subjects
5. Processor obligations under Article 28
6. Sub-processor list and the 30-day notice mechanism
7. Data subject rights handling
8. Security measures (Article 32)
9. Personal data breach notification (within 24 hours)
10. Audit rights
11. Return / deletion at end of processing
12. Standard Contractual Clauses (Module Two)

The template is reviewed by EU counsel before signature. Customers
who require additional clauses (member state-specific provisions,
sector-specific rules) negotiate addendums.

## Personal data breach notification

Under Article 33, Nucleus must notify the controller of a personal
data breach **without undue delay and, where feasible, within 72
hours**. Nucleus's commitment to host products is **24 hours** —
faster than the regulation requires, because the host needs time to
notify their own customers within the 72-hour window.

The breach notification process:

1. Detect the breach (via the [security incident response runbook](../runbooks/incident-response.md))
2. Triage severity and scope within 4 hours
3. Notify the host product within 24 hours with:
   - Nature of the breach
   - Categories and approximate number of data subjects
   - Categories and approximate number of records
   - Contact for follow-up
   - Likely consequences
   - Measures taken or proposed
4. Cooperate with the host on customer notification
5. Update the host with new information as the investigation
   progresses

## What this page doesn't cover

- **National implementations of GDPR.** Some EU member states have
  additional rules (Germany's BDSG, France's Loi Informatique et
  Libertés). Negotiated per tenant.
- **Other privacy regimes.** California CCPA/CPRA, Brazil's LGPD,
  India's DPDP Act, etc. Nucleus follows the strictest applicable
  rule by default.
- **The full SCC text.** Available in the customer-facing trust
  portal.
- **DPIA support.** Nucleus provides documentation for tenants
  conducting their own Data Protection Impact Assessments under
  Article 35.

## When to revisit

This page should be re-read whenever:

- The EU updates the SCCs
- A new EDPB guidance affects Nucleus's transfer mechanism
- A tenant requires data residency in a new region
- A new sub-processor is added (triggers the 30-day notice)
- A customer raises a Schrems-style challenge
