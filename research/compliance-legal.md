# Compliance & Legal Deep Dive — Nucleus

*Recursive neuromarketing video generation, running inside TruPeer (SOC 2 / ISO 27001 / GDPR / SSO / SCIM host). Last reviewed April 2026.*

This document is a working legal/compliance map for shipping Nucleus as a commercial sub-product of TruPeer. It is meant to drive engineering, product, and contract decisions, not to replace outside-counsel review before go-live. Sections flag where a lawyer is genuinely load-bearing; elsewhere the goal is to be specific enough that the team can act.

---

## 1. TRIBE v2 license (CC BY-NC 4.0)

### 1.1 What CC BY-NC 4.0 actually allows and forbids

TRIBE v2 ships under **Creative Commons Attribution-NonCommercial 4.0 International** (`creativecommons.org/licenses/by-nc/4.0/legalcode.en`). The load-bearing terms:

- **Grant (Section 2(a)(1)):** worldwide, royalty-free, irrevocable license to reproduce, share, and adapt "for NonCommercial purposes only."
- **NonCommercial definition (Section 1(i)):** *"not primarily intended for or directed towards commercial advantage or monetary compensation."* It is a single holistic test applied to the purpose and context of the use, not to who the user is.
- **Attribution (Section 3(a)):** preserve the copyright notice, the warranty disclaimer, and a URI to the license; attribute the creator; flag modifications.
- **No ShareAlike.** Derivatives are allowed and do not have to be republished. A fine-tuned internal model need not be released.
- **No additional restrictions (2(a)(5)(B)):** no DRM or downstream restrictions beyond what the license permits.
- **Termination (Section 6(a)):** automatic on breach, reinstated if cured within 30 days of discovery.
- **No warranty, no patent grant.** Unlike Apache 2.0, no explicit patent retaliation clause.

Two things the license does *not* do that people assume it does: there is no "academic exception" (academic vs industry is irrelevant), and attribution does not require notifying Meta.

### 1.2 The specific risk for Nucleus

Nucleus is a paid commercial pipeline. TRIBE v2 is used to produce a reward signal that selects which generated video a paying brand ships to paid media. That is, under any honest reading of Section 1(i), use "primarily intended for or directed towards commercial advantage." There is no "we host it for research" framing that survives contact with how the score is actually used.

Secondary risks:

- **Derivative exposure.** Fine-tuning TRIBE v2 produces "Adapted Material" that inherits the NC restriction.
- **Output-distillation.** Training a smaller reward model *from TRIBE v2 outputs* is the classic derivative question. Case law is nonexistent; Meta has historically treated model-to-model distillation as a licensing question, not a fair-use one.
- **Attribution hygiene.** "Powered by TRIBE v2" marketing without the CC BY-NC notice is a separate, cheap-to-fix breach.

### 1.3 What "non-commercial research" means in academia vs industry

The CC 2009 *Defining Noncommercial* study established that three factors determine whether use reads as commercial: **monetization** (paywalls, SaaS subscriptions, ad revenue); **purpose** (research aimed at shipping a commercial product vs openly published results); and **context** (university lab vs corporate R&D on the critical path to ship). For-profit internal R&D that feeds a shipping product is, per CC's own guidance, on the commercial side of the line. Industry research is not automatically non-commercial, and "we only use it internally" is not a safe harbor when the internal use drives revenue.

### 1.4 Meta FAIR's track record on commercial relicensing

A consistent pattern:

- **Llama 1 (Feb 2023)** — non-commercial, case-by-case research access; no commercial licenses granted.
- **Llama 2 (July 2023)** — shipped under the bespoke Llama Community License with free commercial use under a 700M MAU cap. This was a one-time strategic policy shift, not a per-requester process.
- **DINOv2 (2023)** — originally non-commercial weights; re-licensed to Apache 2.0 after ~18 months of community pressure.
- **SAM (2023)** — Apache 2.0 code, research-only SA-1B dataset; dataset never re-licensed.
- **ImageBind, MMS, V-JEPA, Seamless, TRIBE v1 (2023–2025)** — all CC BY-NC 4.0; none re-licensed as of April 2026.

Meta FAIR does not run a standing commercial-license desk for CC BY-NC releases. Bespoke grants are extremely rare and historically reserved for strategic partners.

### 1.5 Path to a commercial license

The theoretical flow: email `fair_licensing@meta.com` (or `opensource@meta.com`), describe the use case and volume, wait for Meta legal plus FAIR leadership review. No published SLA and no public fee schedule; historical response time is weeks to months, many requests go unanswered. A seed-stage SaaS is not Meta's priority. **Do not treat "we'll email them" as a plan.** Build assuming the request is ignored; be pleasantly surprised if it isn't.

### 1.6 Defensible workarounds, ranked

1. **Train a Nucleus-owned reward model on public neuro datasets** (Natural Scenes Dataset, Courtois-NeuroMod, BOLD5000, HCP Movies, THINGS-fMRI — together ~2000 hours of video-paired fMRI under permissive terms). Performance will lag TRIBE v2 by 6–12 months, but this is the only cleanly commercial path. **This is the recommended long-term destination.**
2. **Offline distillation.** Use TRIBE v2 only in a walled-off research phase to label public video datasets, then train a production reward model on the labels and discard TRIBE v2 from the prod stack. Still has derivative-work risk; needs outside-counsel review before relying on it.
3. **Pure research-preview tier.** Free, non-commercial, no paid upgrade path, no ad spend driven by the outputs. Defensible only if it really is non-commercial; not a business.
4. **"Research lab" separate entity running inference via API.** Cosmetic; the CC test is the purpose of the use, not corporate topology. Will not hold.
5. **Ship and ignore the license.** Not recommended.

### 1.7 Exposure if Meta sues

No public lawsuit yet against a commercial user of a CC BY-NC FAIR release. Historical pattern is cease-and-desist plus private negotiation. In a real suit, Meta would allege copyright infringement on the weights; US statutory damages can reach $150K per work under 17 USC §504(c), plus fees under §505, but realistic damages are a reasonable-royalty calculation. The scarier exposures are non-monetary: injunctive relief ripping TRIBE v2 out of prod with a 30-day cure window, discovery exposing training data and customer lists, and cascading enterprise-customer DPA pauses while the dispute is live. Financial exposure is manageable; operational exposure is the thing that actually matters.

### 1.8 Recommendation: fall back, don't ship TRIBE v2 in the commercial loop

1. Scope TRIBE v2 to internal benchmarking and research publications only; exclude it from every production path.
2. Start the in-house reward model immediately, targeting ~85% of TRIBE v2's group-average accuracy on the Algonauts benchmark. Budget 2 engineers for 6 months.
3. For the interim, run the offline distillation path with outside counsel sign-off.
4. Email `fair_licensing@meta.com` in parallel; zero expectation.
5. Publish TRIBE v2 attribution on a research/benchmarks page. Do not market Nucleus as "powered by TRIBE v2."

*Outside-counsel review is mandatory before GA on this section. CC license enforcement in an AI context has effectively no case law yet.*

---

## 2. FTC rules on AI-generated testimonials and synthetic UGC

### 2.1 The rule (2024, enforced 2025–2026)

The FTC's **Trade Regulation Rule on the Use of Consumer Reviews and Testimonials**, 16 CFR Part 465, was finalized August 14, 2024 and took effect October 21, 2024. Industry shorthand calls it "the 2025 rule" because the bulk of enforcement-adjacent activity landed in 2025; the underlying rulemaking is 2024.

The text most relevant to Nucleus is 16 CFR §465.2, which prohibits any business from writing, creating, or selling a testimonial that:

> *"(i) is attributed to a person who does not exist, such as an AI-generated fake … (ii) is attributed to a person who did not have the represented experience with the business or its products or services, or (iii) misrepresents … that it represents the experience or opinions of a person."*

The rule reaches any person who "knows or should have known" the testimonial is fake — which explicitly includes platforms, not just the brand that commissioned the creative. The FTC's Q&A document repeats this point.

### 2.2 What's forbidden vs allowed-with-disclosure

**Forbidden:** AI-generated testimonials attributed to nonexistent people; AI content misrepresenting a real person's experience; buying, selling, or procuring fake reviews; compensation conditioned on sentiment; suppression of honest negative reviews.

**Allowed with clear and conspicuous disclosure:** testimonials from compensated real people; AI-generated personas where the AI nature is disclosed; dramatizations and re-creations. The rule bans synthetic spokespeople *passed off as authentic consumer experience*, not synthetic spokespeople in general.

### 2.3 "Clear and conspicuous" disclosure

16 CFR §465.1(c) defines it as *"difficult to miss (i.e., easily noticeable) and easily understandable by ordinary consumers."* In practice, drawing from the rule plus the Endorsement Guides (16 CFR Part 255):

- **Video:** on-screen, readable at ordinary mobile size, shown long enough to understand.
- **Audio:** delivered at a volume, speed, and cadence ordinary consumers can understand.
- **Language:** matches the content language.
- **Placement:** unavoidable. "#ad" in a scrollable caption is not enough. Hover or "see more" disclosures are presumed inadequate.
- **Metadata-only is not sufficient.** C2PA manifests and invisible watermarks are provenance, not consumer-facing disclosure.

The practical reading for Nucleus: the synthetic nature must be visible in the same viewing context where the testimonial is played.

### 2.4 Penalties and enforcement

Civil penalties under the rule are **$51,744 per violation** as of the 2025 inflation adjustment; each fake review or testimonial counts separately. December 22, 2025 was the first enforcement wave — warning letters to 10 unnamed companies. No public case against an AI-UGC platform yet, but the warning-letter language specifically flagged "platforms that knowingly facilitate."

### 2.5 How Arcads, HeyGen, Creatify handle it

All three push the disclosure obligation to the customer in ToS. None bakes a persistent on-screen disclosure into the render by default:

- **Arcads** labels actors as "AI UGC actors" in marketing and ToS; no baked-in on-video label on paid exports.
- **HeyGen** requires customer disclosure via policy; added in-app compliance checks in 2025 but still leaves the render to the customer.
- **Creatify** pushes obligations to customer ToS; no in-render disclosure.
- **Captions / Mirage** ships a "Made with Captions AI" badge on free exports and strips it on paid plans.

This "platform is the gun, customer is the finger" posture is legally untested and the December 2025 FTC warning letters imply the Commission does not share it.

### 2.6 Recommended disclosure pattern for Nucleus

Nucleus lives inside TruPeer's enterprise perimeter; one customer misuse event can poison the SOC 2 posture. Be more defensive than the category:

1. **Baked-in on-video label** — "AI-generated" (localized), legible at mobile size, rendered in the first ~1.5 seconds and the final ~1.5 seconds of every export. This is the FTC-satisfying layer.
2. **Caption text disclosure** auto-inserted into generated copy and captions intended for paid social.
3. **C2PA Content Credentials manifest** on every export (see §8). Machine-readable provenance, satisfies platform AI-labeling readers.
4. **Attestation-gated disable.** Enterprise customers can suppress the on-screen label only after signing a written attestation that they carry the disclosure obligation directly and have documented alternative disclosure. The attestation moves the compliance risk to the customer and creates an audit trail.
5. **Product-layer block on impersonation.** Nucleus must refuse to generate a video where the persona is named or described as a specific real-world customer, employee, or public figure.

---

## 3. EU AI Act labeling for AI-generated video

### 3.1 Article 50 — the obligations that matter

Regulation (EU) 2024/1689 was adopted June 13, 2024 and entered into force August 1, 2024. Article 50 transparency obligations apply from **August 2, 2026**. The relevant subsections:

- **Art 50(2) — provider obligation.** Providers of AI systems generating synthetic audio, image, video, or text must ensure outputs are "marked in a machine-readable format and detectable as artificially generated or manipulated," using solutions "effective, interoperable, robust and reliable as far as technically feasible."
- **Art 50(4) — deployer obligation for deepfakes.** Deployers of AI that generates or manipulates image, audio, or video content constituting a "deep fake" must "disclose that the content has been artificially generated or manipulated."
- **Art 50(5) — AI-generated text of public-interest.** Requires disclosure unless a natural or legal person holds editorial responsibility.

Article 3(60) defines deepfake as AI-generated or manipulated content that "resembles existing persons, objects, places, entities or events and would falsely appear to a person to be authentic or truthful." Synthetic-UGC brand testimonial videos fall squarely inside this definition. Narrow exceptions exist for criminal investigation and for "artistic, creative, satirical, fictional" works; neither applies to commercial advertising.

### 3.2 Code of Practice and enforcement timeline

The AI Office published the first draft of the **Code of Practice on Transparency of AI-Generated Content** on December 17, 2025. A second draft landed in March 2026; final version expected June 2026. Signing the final Code grants a **presumption of conformity** with Article 50 — legally cheap insurance.

Key Code provisions for Nucleus:

- **Recorded video:** visible label or disclaimer at the start; machine-readable marker throughout.
- **Live video:** persistent visual indicator plus opening disclaimer.
- **Audio:** audible disclaimer at start, machine-readable marker throughout.
- **Technical provenance:** C2PA (or equivalent) is the preferred machine-readable marker. SynthID and Meta Video Seal are named as acceptable invisible-watermark complements.

**Timeline:** Art 50 applies August 2, 2026; national enforcement authorities must be designated and operational by August 2, 2027. Many member states (AESIA in Spain, CNIL in France, Garante in Italy, BfDI in Germany, AP in the Netherlands) already have designated authorities running. France and Germany are the likely first-movers on enforcement; Italy is aggressive on AI generally; Ireland is typically slower.

**Penalties (Art 99):** up to €15M or 3% of worldwide annual turnover, whichever is higher, for transparency violations.

### 3.3 Provider vs deployer for Nucleus

Under Art 3(3)–(4): TruPeer is the **provider** because it puts Nucleus on the market under its own brand. Enterprise customers are **deployers** when they use Nucleus to generate ads. TruPeer therefore carries both the 50(2) provider obligation (machine-readable marking) *and* a share of the 50(4) deployer obligation, because TruPeer sets the product defaults.

### 3.4 Risk posture and recommended technical approach

If Nucleus generates a synthetic UGC video for a German DTC brand and the brand posts it to Instagram without disclosure, both parties are in scope: the brand as deployer, TruPeer/Nucleus as provider. Expect Article 50 representations to appear in EU-customer DPAs from Q2 2026.

Recommended stack (same render covers §2, §3, and §8):

1. **Visible on-screen label**, localized per export language (same as §2.6).
2. **C2PA Content Credentials manifest** signed by a TruPeer-managed key, with origin = AI-generated, generator, model identifiers, timestamp.
3. **Meta Video Seal invisible watermark** as a tamper-resistant second layer (open source, third-party applicable — cheaper to ship than SynthID).
4. **Add SynthID** later if Google opens the API broadly.
5. **Sign the Code of Practice** when finalized in June 2026 to lock in the presumption of conformity.

*Freeze the technical approach on the final Code of Practice (June 2026), not on the current draft.*

---

## 4. SOC 2 inheritance and shared-responsibility model

### 4.1 Inheritance

SOC 2 is not transitive. Nucleus does not automatically inherit TruPeer's Type II report. Two paths under AICPA AT-C §205:

- **Inclusive method** — expand next audit scope to cover Nucleus directly. The System Description must describe Nucleus; the auditor tests Nucleus controls.
- **Carve-out method** — treat Nucleus as a sub-service organization with its own attestation; customers review both reports.

**Recommendation:** fold Nucleus into TruPeer's existing SOC 2 scope at the next audit cycle (inclusive method). Align infrastructure, logging, and change management to TruPeer standards from day one so the auditor has nothing surprising to test. Bridge with a Type I or a §205 bridge letter if GA lands before the next Type II window.

### 4.2 Shared-responsibility boundary

| Control family | TruPeer (host) | Nucleus (sub-product) |
|---|---|---|
| Infrastructure (VPC, k8s, IAM) | Owns | Inherits |
| Tenant isolation | Owns host boundary | Owns per-brand KB scoping |
| Authentication / SSO | Owns SAML/OIDC/SCIM | Inherits identity; owns per-feature RBAC |
| Encryption at rest / KMS | Owns | Must use host KMS for all new storage |
| TLS in transit | Owns termination | Must enforce TLS on every sub-processor call |
| Logging / SIEM | Owns central pipeline | Must ship to same pipeline — no local logs |
| Incident response | Owns IR process | Raises incidents through host channel |
| Change management | Owns CAB | Routes prod changes through CAB |
| Model inference sub-processors | — | **Owns** — every external API (OpenAI, Anthropic, Google, ElevenLabs, Replicate, fal.ai) is a Nucleus sub-processor |
| Content moderation | — | **Owns** — brand KB, generated video, prompts |
| Consent management (voice, likeness) | — | **Owns** |
| Provenance markers (C2PA, Video Seal) | — | **Owns** |

Nucleus-owned rows are the gap that must close before GA; missing rows become material weaknesses at audit.

### 4.3 Trust Service Criteria mapping

All five TSC are in scope once Nucleus ingests brand KBs with PII. Key criteria:

- **Security:** CC6.1 per-tenant scoping on every inference call; CC6.6 SSO enforcement for admin; CC6.7 TLS 1.3 minimum; CC7.2 full logging per call (tenant, user, prompt hash, sub-processor, cost); CC7.4 runbooks for prompt injection and sub-processor breach.
- **Availability:** A1.2 brand-KB backup and recovery; A1.3 per-tenant rate limits and prompt budgets.
- **Confidentiality:** C1.1 no sub-processor training on customer data (contractual); C1.2 demonstrable deletion including cached embeddings.
- **Processing Integrity:** PI1.1 output attribution to model + prompt + KB snapshot; PI1.5 version history on prompts.
- **Privacy:** P3.2 minimum-necessary collection; P4.2 purge on demand; P5.1 DSAR support; P6.3 sub-processor disclosure.

A Security-only report is insufficient once brand KBs contain PII.

### 4.4 Sub-processor disclosure

**Every external API call is a sub-processor.** Day-one Nucleus list: OpenAI (or Azure OpenAI — different residency), Anthropic (direct or Bedrock — different DPA), Google (Gemini, Veo), ElevenLabs, Replicate/fal.ai/Modal, Meta Video Seal / Google SynthID, vector DB (Pinecone, Weaviate, pgvector host), embedding provider if separate, CDN, transcoder, object store.

For each: signed DPA, public listing (name, category, region of processing), change-notification flow (GDPR Art 28(2) plus SCC Module Two require prior or general written authorisation plus notice), and a Transfer Impact Assessment if data leaves the EU.

### 4.5 Customer-facing trust portal

Publish at GA: SOC 2 Type II (NDA-gated); Trust Center page with certifications, sub-processors, data residency, DPA, model card, pentest summary; shared-responsibility doc; sub-processor change-notification subscription; model cards for every Nucleus model; incident disclosure page. Enterprise procurement questionnaires are the #1 sales slowdown — a good trust portal shaves weeks off the cycle.

---

## 5. GDPR for brand knowledge bases

### 5.1 Brand KB content is personal data

Almost any brand KB Nucleus ingests contains Art 4(1) personal data:

- Sales call transcripts (named buyers, titles, companies).
- Support ticket exports (customer emails, device IDs).
- Customer reviews and testimonials with authors.
- CRM exports (always).
- Analytics exports (IP addresses and user IDs are personal data under GDPR).

Nucleus is a **processor** under Art 4(8) for any KB with personal data. TruPeer is the processor vis-à-vis the brand customer; Nucleus inherits that role. Every LLM or voice API is a **sub-processor**.

### 5.2 DPA requirements with the host product

Nucleus must be explicitly in-scope in the TruPeer customer DPA (or added by amendment), listed under sub-processors per Art 28(2), with flow-down DPAs for every sub-processor (Art 28(4)) and clear data retention and deletion terms. OpenAI, Anthropic, Google, and ElevenLabs all publish standard DPAs that can be accepted electronically; retain the signed versions.

### 5.3 Right to erasure

Art 17 obliges the controller (the brand) to erase personal data on request; the processor (Nucleus) must support that. Implementation requirements:

- **Tenant-level erasure:** deleting a brand KB removes every vector, chunk, cached embedding, and RAG index. Undeletable logs (billing, audit) must be de-identified.
- **Row-level erasure:** deleting a single document finds and removes the corresponding embeddings without a full re-index. Engineering requirement, not an afterthought.
- **Sub-processor propagation.** OpenAI API has zero data retention by default when the flag is set; Anthropic defaults to 30 days, zero under enterprise agreement; Google Gemini is 0–30 days depending on the product. These flags must be explicitly selected.
- **Evidence:** audit trail proving deletion ran.

### 5.4 Cross-border data transfers (Schrems II / III)

Nucleus will process data through US sub-processors. For EU customers this is an Art 44–50 transfer. Available mechanisms:

- **EU-US Data Privacy Framework (DPF).** Adequacy decision of July 10, 2023. Operational in April 2026 but legally precarious — the *noyb* Schrems III challenge is pending; a CJEU ruling is expected 2026–2027.
- **Standard Contractual Clauses (2021).** Module Two for controller-to-processor, Module Three for processor-to-sub-processor. The canonical fallback.
- **Binding Corporate Rules.** Internal only, not helpful for third-party sub-processors.

Post-Schrems II, SCCs alone are not enough. Under EDPB Recommendation 01/2020 we must run a Transfer Impact Assessment per transfer and apply supplementary measures. Accepted measures: importer-inaccessible encryption (impractical for inference, which requires decrypted input); pseudonymization before transfer (practical for some KB content); contractual measures (disfavored by French CNIL and Austrian DSB but still most common).

Realistic posture:

1. Execute SCCs with every sub-processor.
2. Maintain a TIA per sub-processor.
3. Pseudonymize sensitive KB content (sales call transcripts with identified speakers).
4. Offer EU residency as an enterprise tier (Azure EU for OpenAI, Anthropic Frankfurt, or Mistral as an EU-native fallback).
5. Monitor the Schrems III timeline quarterly; pre-build a DPF-invalidation escalation plan.

*Outside counsel should review the TIA template and the sub-processor DPA flow-down chain before GA. Schrems II practice is the messiest area of GDPR and it is still moving.*

---

## 6. Output IP ownership and chain of title

### 6.1 Provider ToS on output ownership

All four major providers assign output IP to the user:

- **OpenAI Services Agreement §3(a):** *"you retain your ownership rights in Input and own the Output. We hereby assign to you all our right, title, and interest, if any, in and to Output."* Caveat: outputs are not guaranteed unique; similar outputs may be generated for others.
- **Anthropic Commercial Terms:** *"we assign to you all of our right, title, and interest—if any—in Outputs."* Anthropic provides IP indemnity on enterprise plans.
- **Google (Gemini API / Vertex AI):** customer owns output; Google provides indemnification for generative output under Vertex AI subject to specific constraints.
- **ElevenLabs Commercial Terms:** paid-plan output is commercially usable and owned by the user; free-plan output requires attribution; clones from unauthorized audio are terminable.

### 6.2 Copyrightability

- **US.** The Copyright Office's 2023 guidance and the *Zarya of the Dawn* and *Théâtre D'opéra Spatial* decisions: pure AI output is not copyrightable; human authorship is required; human-curated or edited AI output may be copyrightable in the human-contributed parts. The Office's 2024 Part 2 report reaffirmed this.
- **EU.** The CJEU has not ruled directly; consensus reads Berne as requiring human authorship. Practical result is the same.
- **UK.** CDPA §9(3) explicitly covers "computer-generated works" with a 50-year term; authorship goes to "the person by whom the arrangements necessary for the creation of the work are undertaken."

The brand customer can use output commercially but cannot claim exclusive ownership against the world.

### 6.3 Chain of title for paid ad platforms

Meta Ads, Google Ads, YouTube, and TikTok have all tightened AI disclosure and rights warranties through 2024–2026. Meta requires advertisers to disclose realistic AI content and warrants "right to use"; YouTube requires creators to disclose "meaningfully altered or synthetically generated" content; TikTok Ads rejects ads that misrepresent the nature of a speaker.

For Nucleus, chain-of-title means the customer must be able to demonstrate: (1) they own or have licensed brand assets; (2) they have consent for every voice and persona in the output; (3) the output does not include third-party content (songs, clips, trade dress); (4) the output complies with applicable disclosure rules.

### 6.4 Recommended ToS clauses

1. **Ownership assignment.** TruPeer assigns any rights in outputs to the customer; TruPeer retains a license for product improvement (opt-out for enterprise) and legal/audit requirements.
2. **Customer warranties.** Customer warrants ownership or license of uploaded assets; consent for every voice and likeness; compliance with FTC / EU AI Act / platform disclosure rules; no third-party infringement from customer inputs.
3. **TruPeer warranties.** No training general models on customer KB content; maintained sub-processor DPAs; default on-screen disclosure and C2PA manifest unless attestation-gate disable is used.
4. **IP indemnity.** TruPeer indemnifies customer against third-party IP infringement from Nucleus outputs where the infringement arises from model behavior within stated parameters. Carve out: customer-supplied inputs, customer modifications, and breaches of (2).
5. **No exclusivity.** Customer acknowledges similar outputs may be generated for others.
6. **Voice/likeness consent attestation** with retention for life-of-output plus ~4 years.
7. **Provenance retention.** Customer agrees not to strip C2PA manifests or Video Seal watermarks; stripping is material breach.

*The indemnity in (4) is the clause that matters most and costs the most. Outside counsel should draft and review it line by line before GA.*

---

## 7. Voice cloning consent and likeness rights

### 7.1 ElevenLabs IVC consent

ElevenLabs Instant Voice Cloning (IVC) consent, per current product docs and `elevenlabs.io/terms-of-use`:

- **Pre-upload click-through** confirming "necessary rights and permissions" to clone the voice.
- **Account-exclusive voices** — IVC clones cannot be shared across accounts.
- **No voice captcha** for IVC. Professional Voice Cloning (PVC) adds a read-a-sentence-on-camera captcha; IVC does not. This is the biggest gap in the IVC consent model.
- **Commercial use** permitted on paid plans with consent; misuse leads to account termination.
- **Policy** bans cloning without consent, minors, public figures for deception, and harassment content.

IVC is only safe when the cloned voice belongs to a consenting party with documented permission. Brand founder cloning their own voice with a signed release is the safe case; cloning a random influencer is not.

### 7.2 State right-of-publicity laws

Right of publicity is state law in the US. Most relevant for Nucleus as of April 2026:

- **Tennessee ELVIS Act** (effective July 1, 2024). Amends TN Code §47-25-1101 et seq. to add "voice" as a protected property right, alongside name/photograph/likeness. **Extends liability to anyone providing AI technology whose primary purpose is to enable unauthorized voice clones** — without an audit trail, Nucleus itself is a potential defendant. Remedies: injunction, actual damages, punitive damages, attorney fees, no cap. Standing extends post-mortem.
- **California** — Cal. Civ. Code §§3344, 3344.1. Covers name/voice/signature/photo/likeness for commercial use without consent. §3344.1 post-mortem 70 years. Statutory minimum $750 plus actual damages plus disgorgement. AB 2602 (2024) requires explicit consent for digital replicas in entertainment contracts.
- **New York** — N.Y. Civ. Rights Law §§50–51, amended by §50-f (post-mortem) and **S.8420-A (signed December 11, 2025)**, which specifically covers AI-generated synthetic performers in advertising and requires AI-persona disclosure. NY reaches any use with a "substantial nexus" to the state — ads shown to NY consumers trigger the law regardless of where the brand is based.
- **Illinois** — Right of Publicity Act (765 ILCS 1075) for name/likeness; BIPA is a separate, expensive exposure surface for voiceprints ($1K–$5K per violation, each capture a violation).
- **Texas, Washington, Ohio, Florida, Nevada** have statutes of varying scope; none with ELVIS-style voice coverage as of April 2026, several with bills pending.

### 7.3 Required audit artifacts per clone

1. Consent record (signed attestation from customer, timestamped, IP-logged).
2. Voice owner identity and relationship to the brand.
3. Scope of consent (use cases, channels, duration).
4. Source audio provenance.
5. Revocation mechanism with downstream propagation.
6. Retention: life-of-clone plus ≥4 years (longest applicable right-of-publicity statute of limitations).

### 7.4 Recommendation

1. Gate voice cloning behind a consent-capture workflow; no clone without a form plus signed release or self-attestation with indemnity.
2. Prefer ElevenLabs PVC (with voice captcha) for any high-profile voice; reserve IVC for clearly documented internal voices with written consent.
3. Prompt-filter celebrity names and refuse renders.
4. Keep a per-output audit trail linking output ID, voice ID, consent record, and customer user.
5. On revocation, disable regeneration and notify customers with existing outputs.
6. Do not store voiceprints as a separate biometric identifier to stay clear of BIPA in Illinois.

*The ELVIS Act "technology provider" liability theory is untested in court. Outside counsel should review the voice-clone architecture specifically before GA.*

---

## 8. Synthetic media watermarking

### 8.1 C2PA / Content Credentials in 2026

The C2PA Content Credentials spec (v2.2, April 2025) binds cryptographically signed provenance manifests to media files. Adoption as of April 2026:

- **Adobe** — Creative Cloud apps and Firefly outputs embed by default.
- **Google** — Nano Banana Pro, Veo, Google Ads embed C2PA alongside SynthID; Gemini has a verification tool that reads third-party manifests.
- **OpenAI** — DALL·E and Sora outputs embed C2PA.
- **Microsoft** — Bing Image Creator and Copilot Designer embed C2PA.
- **Meta** — joined the C2PA steering committee September 2024; Instagram and Facebook read manifests as a signal for AI content labeling.
- **TikTok** — announced reading, partial rollout.
- **Cameras** — Sony, Leica, Nikon, Canon firmware for select models.

C2PA is the de facto provenance standard for 2026. Shipping without it is a red flag in enterprise procurement. Limitations: manifests can be stripped by re-encoding; signing key management is non-trivial; C2PA records provenance but does not by itself tell a consumer the content is AI-generated (on-video disclosure is still required).

### 8.2 Google SynthID

DeepMind's invisible watermark, applied at generation time. Current coverage: Imagen / Nano Banana (images), Lyria (audio), Gemini text (when enabled), Veo (video). Designed to survive crop, compression, and color adjustment. Detection is Google-side with partner API access in controlled beta. Practical constraint: SynthID is generation-time and tied to Google's own models — hard to retrofit onto outputs from non-Google models.

### 8.3 Meta Video Seal

Released December 2024 as open source. Frequency-domain invisible watermark robust to compression, cropping, and re-encoding. Third-party applicable (can be added post-generation to any video, regardless of generator). Detector is published separately. **This is the most practical invisible-watermark layer Nucleus can actually ship without begging Google for access.**

### 8.4 Recommended Nucleus stack

Every Nucleus export carries:

1. **Visible on-screen label** (same render as §2 and §3 — one render, three compliance jobs).
2. **C2PA Content Credentials manifest**, signed with a TruPeer-managed key, containing origin = AI-generated, generator = "Nucleus by TruPeer," model IDs and versions, timestamp, customer brand, prompt-bundle hash.
3. **Meta Video Seal invisible watermark**.
4. **Content hash registry** so TruPeer can later verify "yes, we generated this."
5. **SynthID later** if Google opens the API broadly — stretch goal, not a GA gate.

What not to do: rely on metadata-only disclosure (always stripped); allow a simple toggle to disable watermarking (attestation-gate only); assume C2PA survives aggressive re-encoding (it doesn't — Video Seal is the durable layer).

---

## Actionable recommendations

| # | Action | Owner | Gate for GA? |
|---|---|---|---|
| 1 | Start in-house reward model on public neuro datasets | Research | No — long-term |
| 2 | Pull TRIBE v2 out of the commercial path | Research | **Yes** |
| 3 | Baked-in on-video AI disclosure label (render default) | Product eng | **Yes** |
| 4 | C2PA Content Credentials manifest per export | Platform eng | **Yes** |
| 5 | Meta Video Seal invisible watermark | Platform eng | **Yes** |
| 6 | Voice-clone consent workflow + per-output audit trail | Product eng | **Yes** |
| 7 | Gate IVC behind consent capture; prefer PVC for high risk | Product eng | **Yes** |
| 8 | Fold Nucleus into TruPeer SOC 2 at next audit cycle | Security | No — next cycle |
| 9 | Publish sub-processor list on trust portal | Legal + SecOps | **Yes** |
| 10 | Execute SCCs with every sub-processor; maintain TIAs | Legal | **Yes** |
| 11 | Zero-retention flags on all LLM sub-processor APIs | Platform eng | **Yes** |
| 12 | Brand-KB row-level + tenant-level erasure with audit log | Platform eng | **Yes** |
| 13 | Customer ToS addendum with warranties + IP indemnity | Legal | **Yes** |
| 14 | Attestation flow to disable default disclosure | Legal + Product | **Yes** |
| 15 | Sign EU Code of Practice when finalized (June 2026) | Legal | Post-GA |
| 16 | Outside counsel review: CC workaround, TIA, indemnity, voice-clone | Legal | **Yes** |

The four items that materially gate GA: **kill TRIBE v2 in prod (#2), ship the watermarking stack (#3–5), ship voice consent architecture (#6–7), and close the enterprise DPA posture (#9–12)**. Everything else is background work or lives in the trust portal.

Outside-counsel review is mandatory before GA on items 2, 10, 13, 14, and 7.

---

*This document reflects regulatory and provider-term state as of April 9, 2026. The CC BY-NC analysis, EU AI Act Code of Practice, FTC enforcement pattern, and Schrems III trajectory are all moving targets — re-review quarterly or on any material regulatory update.*
