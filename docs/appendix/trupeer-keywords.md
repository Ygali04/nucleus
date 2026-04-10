# TruPeer Context & Keyword Inventory

> The full research pull (company overview, product surface, blog inventory, ICPs, pain-point clusters, keyword themes, languages, competitive positioning, pitch implications — ~2,500 words with all source URLs) lives in `research/trupeer-context.md`. This page is the condensed inventory that's most pitch-relevant.

## Company snapshot (April 2026)

- **Product:** "AI videos **and** docs for your product lifecycle" — Chrome extension captures a screen recording, TruPeer's pipeline produces a polished video + written SOP/guide + 65+ language re-syncs in parallel.
- **Co-founders:** Shivali Goyal and Pritish Gupta (both ex-BCG; Pritish from IIT Bombay)
- **HQ:** San Francisco (per LinkedIn); operating base Bengaluru (per press)
- **Funding:** $3M seed led by RTP Global, July 2025, with Salesforce Ventures (via Salesforce AI Pitchfield) and 20+ Fortune-500 CIO/CTO angels
- **Enterprise scale claim:** "Trusted by 30,000+ global teams"
- **Marquee customers (named on site):** Glean, Siigo, Zuora, LambdaTest, Hedrick Gardner, Fluid Networks, Ace Relocation Systems, Dextego, nSpire, Zetwerk, EMA
- **Compliance:** ISO 27001, SOC 2, GDPR, SSO, SCIM
- **Recent signals:** MCP server at `api.trupeer.ai/mcp` (for Claude/ChatGPT to query a customer's TruPeer knowledge base over OAuth 2.0); HeyGen partnership page; Consensus partnership for interactive demos

## Product surface Nucleus plugs into

The TruPeer platform that the "30–50 shots" refer to is this stack:

1. **AI Screen Recorder** (Chrome extension) — captures desktop, browser, tab, clicks, actions
2. **AI Scripting** — "AI perfected scripts: no uhms and ahs"; grammar/vocab enhancement; translate scripts across 30+ languages and 100+ styles; auto-sync video to edited script
3. **Studio-quality voiceover** — "100+ accents & styles, 150+ voices"; voice cloning; Custom Pronunciations; Custom Glossary
4. **Automated zoom effects** based on click location
5. **AI Avatars** — "1000+ avatars representing diverse genders, cultures, ethnicities"; deeper avatar support via HeyGen integration
6. **Brand Kits** — logos, custom wallpapers, intros/outros, custom voices ("Effortless Branding, Every Time")
7. **Video translation** — 65+ languages in one click; auto-resync pacing for the target language
8. **Step-by-step guides / manuals / SOPs** — same recording produces written output
9. **Knowledge Base** (paid add-on) with **AI Video Search** (video timestamps)
10. **Shared pages / analytics** — likes, comments, views
11. **Integrations:** Monday.com, Make, Medium, Google Analytics, Repurpose.ai, Bigtincan, Cal.com, Pipedrive, SurveyMonkey (plus Confluence/Intercom in blog)
12. **MCP server** for AI agents to query customer KBs

## Pricing (public)

| Tier | Price | Video minutes | Gating |
|---|---|---|---|
| Free | $0 (10-day trial) | 10 AI video min, 5 guides, 3 exports | 8-min max recording |
| Pro | $40/mo annual / $49 monthly | 20 AI video min, unlimited guides/exports | 12-min max; watermark removal |
| Scale | $199/mo annual / $249 monthly | 100 AI video min | 15-min max; 3-editor workspace, custom voices, custom backgrounds |
| Enterprise | Custom | Custom | SAML SSO, admin dashboard, forward-deployed engineering |
| Knowledge Base add-on | $150/mo | — | Custom branding, domain hosting |
| Knowledge Base + AI Search | $200/mo | — | 1,000 AI searches, video timestamp search |

**Critical pricing fact for Nucleus unit economics:** TruPeer's own page states translation "consumes credits just like creating a new AI video" based on length. A naive 20–100 videos/day × 65 languages deployment would detonate credit plans. Nucleus's cost model assumes batch/template re-render rather than per-video-per-language credit consumption — see [how it works → cost model](../how-it-works.md#cost-model).

## ICPs (from use-case pages)

| Use-case page | Named ICP roles | Core problem framed |
|---|---|---|
| **Product marketing** | Product marketers, sales enablement, PMMs | "Every product update requires fresh production cycles… localizing content means restarting production from scratch" |
| **Sales enablement** | Sales enablement leaders, sales marketers, AEs | "Reps waste hours re-recording demos for every prospect… content goes off-brand and inconsistent across regions" |
| **Pre-sales** | Solutions engineers, pre-sales, sales engineers | "Hours spent customizing demos for individual accounts… constant re-recording when products are updated" |
| **Customer success** | CSMs, support/success teams | "Endless hours spent re-recording when features change" |
| **Training videos** | L&D leaders, training managers, product-education directors | "Weeks spent scripting, recording, and editing… entire lessons re-recorded when features change" |
| **Change management** | Change leaders, IT Directors, PMMs | "Critical updates lost in long emails and slide decks… translation delays slow transformation rollouts" |

**Company types:** B2B SaaS (Glean, LambdaTest, Zuora, Dextego, Siigo) + enterprise IT (Hedrick Gardner [law firm], Fluid Networks [MSP], Ace Relocation Systems [logistics]) + global enterprise ops (Zetwerk "Sales and Ops Onboarding across 20+ Countries"). Siigo case story references "1M+ SMB training across Latin America."

## Pain-point clusters (grounded in direct quotes)

Seven clusters surfaced across the site. Each is a direct quote from a use-case page or blog intro.

**Cluster A — "Every update = re-record from scratch."**
- *"Every product update requires fresh production cycles"* (product-marketing)
- *"Entire lessons must be re-recorded when processes or features change"* (training-videos)
- *"Endless hours spent re-recording when features change"* (customer-success)
- *"Constant re-recording when products are updated"* (pre-sales)

**Cluster B — "Localization means starting over."**
- *"Localizing content means restarting production from scratch"* (product-marketing)
- *"Translation delays slow transformation rollouts"* (change-management)
- *"Over 51% of online shoppers say information in their own language matters more than price"* (video-localization blog)

**Cluster C — "Personalization at scale is impossible with humans in the loop."**
- *"Reps waste hours re-recording demos for every prospect"* (sales-enablement)
- *"Hours spent customizing demos for individual accounts"* (pre-sales)
- *"79% of sales professionals say personalized demos are more likely to convert"* (create-personalized-sales-demos blog)
- *"The buyer journey today is non-linear… no two prospects arrive at your demo with the same context"* (same blog)

**Cluster D — "Production is too expensive and too slow."**
- *"Video production services cost $2,000–$10,000 or more"* (personalized-sales-demos blog)
- *"Teams invest 8 to 12 hours crafting a single manual from scratch"* (user-guide best-practices blog)
- *"No more endless back-and-forth with designers or agencies"* (product-marketing)
- *"What usually took 5-6 hours is now down to 3-4 mins"* — Zuora customer testimonial

**Cluster E — "Content goes off-brand the moment it leaves the central team."**
- *"Content goes off-brand and inconsistent across regions"* (sales-enablement)
- *"Playbooks and product updates get lost in docs and Slack threads"* (sales-enablement)
- *"Inconsistent change messages across departments and regions"* (change-management)

**Cluster F — "Nobody watches the content once it's made."**
- *"Three out of four users never engage with features you've built"* (announce-saas-product-updates blog)
- *"Customers don't stick around when they feel lost"* (customer-education blog)
- *"Training videos quickly become outdated and underused"* (sales-enablement)

**Cluster G — "Documentation and video are separate workflows and both rot."**
- *"Modern teams want outcomes — self-updating documentation, scalable training, measurable usage analytics"* (tango-alternatives)
- *"Guides lack dynamic, evolving formats"* (tango-alternatives)

These clusters are the pains the [integration page](../integration.md) addresses when Nucleus is embedded inside TruPeer's product surface.

## Keyword themes

Inferred from the 1,470-URL sitemap per locale (10 locales = ~14,700 indexable pages total). Ten major themes:

1. **"[Competitor] alternatives"** (programmatic comparison SEO): loom, guidde, synthesia, tango, scribehow, camtasia, descript, veed, screenpal, vidyard, screenstudio, colossyan, reelmindai, livestorm, panopto
2. **"Best X for customer/client onboarding video"** (15+ slug variants)
3. **"Client onboarding automation"** (10+ variants)
4. **"User guide / user manual / SOP generator"** (15+ variants)
5. **"AI documentation / technical documentation"**
6. **"Product demo video / walkthrough"**
7. **"Training video / employee onboarding / L&D"** — Camtasia, Vyond, iSpring, Articulate adjacency
8. **"Screen recording / screen capture"**
9. **"How-to tutorials for adjacent SaaS tools"** (700+ programmatic SEO pages for Canva, Figma, Notion, GitHub, Jira, Slack, Teams, Excel, Zoom, Webflow, Ahrefs, Semrush, Moz, ChatGPT, LinkedIn — pure funnel bait)
10. **"Video localization / translation / multilingual product video"**

**Themes TruPeer is NOT targeting in any visible way:** UGC, influencer, TikTok, Reels, short-form social, ad creative, paid social, ad testing, creator economy, YouTube Shorts. TruPeer's SEO footprint is **100% in B2B SaaS enablement / documentation / training**, not in social-first ad UGC.

This is why Nucleus is framed as a **persona × language multiplier for TruPeer's existing asset base**, not as a "TikTok UGC factory." The product lives inside TruPeer's existing category, not beside it.

## Languages — real vs. marketing copy

Pritish said "hundreds of languages." The research says:

- **Marketing site: 10 locales** (en, es, de, fr, it, nl, zh, ja, ar, pt) with real translated copy and hreflang annotations
- **Product: 65+ languages** for video translation; 30+ for scripts; 100+ accents/styles; 150+ voices
- **Auto-resync** — videos automatically re-time to the target language's pacing

**The safer pitch framing:** "65+ languages for delivery, 10 locales for demand-gen." 20–100 videos/day × 65 languages is the honest ceiling.

## Competitive positioning — TruPeer's own words

| vs. | TruPeer's framing |
|---|---|
| **Loom** | "Video messaging tools like Loom have become a go-to for quick communication. But as teams scale and content expectations rise…" — Trupeer = studio-quality + AI noise removal + avatars + multilingual. Customer quote: *"We cancelled Loom for Trupeer"* (Fluid Networks) |
| **Guidde** | Guidde limitations: 100-step cap, weak integrations behind paywalls, limited editing. Trupeer: "handles both videos + documentation" from one recording |
| **Scribe** | Scribe = screenshot-based step guides. Trupeer = "unified video and text documentation from a single recording" |
| **Tango** | Tango = screen capture only. Trupeer = "outcomes… self-updating documentation, scalable training, usage analytics" |
| **Synthesia** | "Inflexible, limited avatars, steep pricing" vs Trupeer automating "the *entire* documentation process" |
| **HeyGen** | **Not a competitor — partnered.** TruPeer ships `/heygen` partnership page framed as a face-lift feature |
| **Camtasia / Descript / ScreenStudio / Vidyard / VEED / Screenpal** | "Too heavy / too manual for an AI-native workflow" |
| **Gong / Chorus** | Not addressed. Different category (sales-call recording vs. product-screen recording) |
| **Arcade / Supademo** | Not directly addressed. Trupeer has Consensus partnership for interactive demos instead |

**Core "in their own words" differentiation:** "AI videos **and** docs for your product lifecycle" — dual output from one recording — is the single line TruPeer repeats most. Second pillar: 65+ language re-sync. Third: Brand Kit consistency at scale.

## Pitch implications

Five specific framings the pitch adopts because of this research:

1. **Position Nucleus as "TruPeer × 10 output surface, same input."** Their existing wedge is "one recording → polished video + doc + 65 translations." Nucleus extends that to "one corpus of 30–50 shots → 20–100 persona-targeted variants per day." Pritish already believes in the 1-input-to-many-outputs model; Nucleus is adding ICP-personalization and format variance as new output axes. **Do not position this as "and now you also do TikTok."** Position it as "your existing asset library compounds 20× more."

2. **Lead with localization + personalization as the *combined* wedge.** TruPeer's site already screams both pain points. The combined wedge (ICP × language) is where "20–100 videos/day" naturally lives.

3. **Anchor to their existing Ahrefs/SEO blog farm.** They run a programmatic SEO factory (1,470 URLs per locale, 700+ tutorials). The pitch should show how a variant generation engine compounds *that existing muscle* — every keyword cluster becomes a persona-targeted video surface.

4. **Call out credit economics upfront.** Pritish will do the math in the first 60 seconds. The pitch beats him to it by proposing a batch/template cost model priced as an Enterprise add-on.

5. **Do not drag in Loom, Gong, or Chorus.** Loom is explicitly killed on TruPeer's site. Gong/Chorus is a different category. Stay in the TruPeer lane: product-lifecycle video + docs, now with persona × language variants. The one external name to lean on is **Consensus** (already partnered) as proof Pritish is comfortable plugging TruPeer into adjacent output surfaces.
