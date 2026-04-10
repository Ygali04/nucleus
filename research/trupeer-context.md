# Trupeer.ai — Pitch Research Context

_Compiled April 2026. Sources: trupeer.ai (homepage, product, pricing, blog, use-cases, enterprise, sitemap, localized pages), LinkedIn company page, press/funding coverage._

---

## 1) Company overview

Trupeer is an AI platform that turns rough Chrome-extension screen recordings into studio-quality product videos **and** step-by-step written guides, in parallel, automatically. The homepage headline is **"AI videos & docs for your product lifecycle"**, with the subhead **"Create studio quality product videos and guides in 65+ languages. Instant generation from a simple screen recording."** (https://trupeer.ai/). They describe themselves as **"The content partner for all your teams"** and specifically call out **"Marketing, Sales, L&D and CX teams"** as the core audience (https://trupeer.ai/video).

**Founders / company:** Co-founded in 2025 by **Shivali Goyal** (ex-BCG digital transformation) and **Pritish Gupta** (ex-BCG, IIT Bombay; previously led teams at fast-growing startups). LinkedIn lists HQ as San Francisco with ~28 employees; press coverage lists Bengaluru as the operating base.

**Traction signals:** Enterprise page claims **"Trusted by 30,000+ global teams"** (https://trupeer.ai/enterprise); LinkedIn/press coverage cites 10,000+ teams earlier in the year. Named customers visible across the site: **Glean, Siigo, Zuora, LambdaTest, Hedrick Gardner, Fluid Networks, Ace Relocation Systems, Dextego, nSpire, Zetwerk, EMA**. Repeated marquee quotes:

- "What usually took 5-6 hours is now down to 3-4 mins" — Eszter Voros, Director Product Education, Zuora
- "Saved us $125k… smoothest ever IT migration across 100s of employees" — Jeremy DeHart, IT Director, Hedrick Gardner
- "We cancelled Loom for Trupeer… absolutely rock solid" — Damien Stalls, CIO Director, Fluid Networks
- "Trupeer is the voice of LambdaTest. Multiple teams now use it — sales, marketing, CRM training" — Jay Singh, Co-founder, LambdaTest

**Funding:** Raised **$3M seed** (July 2025) led by **RTP Global**, with **Salesforce Ventures** (via Salesforce AI Pitchfield) and 20+ Fortune-500 CIO/CTO angels.

**Recent shipping signals:** changelog references Custom Glossary and Custom Pronunciations; they also ship an **MCP server** at `https://api.trupeer.ai/mcp` exposing `search_knowledge_base` and `answer_query_from_knowledge_base` tools over OAuth 2.0 (https://trupeer.ai/mcp) — meaning Claude/ChatGPT can query a customer's Trupeer knowledge base directly. They've also built an explicit **HeyGen x Trupeer** partnership page ("Give your screen recordings a face-lift with Trupeer x Heygen", https://trupeer.ai/heygen) and a **Consensus** partnership (Demofest 2025 London event page).

---

## 2) Product surface

The "Trupeer platform" that the 30–50 screenshots/demo clips would be of is a **web app + Chrome-extension screen recorder** whose pipeline is:

1. **AI Screen Recorder** — Chrome extension that captures "desktop, browser or any tab of your choice" along with "your clicks and actions", with a toolbar for play/pause/annotations and trimming (https://trupeer.ai/aiscreen-record).
2. **AI Scripting** — "AI perfected scripts: no uhms and ahs"; "Enhance grammar and vocabulary"; "Translate scripts across 30+ languages and 100+ styles"; auto-syncs video to edited script (https://trupeer.ai/aiscripting).
3. **Studio-quality AI voiceover** — "100+ accents & styles, 150+ voices", optional **voice cloning**, plus **Custom Pronunciations** and **Custom Glossary** for brand/product terms.
4. **Automated zoom effects** based on clicks.
5. **AI Avatars** — "1000+ avatars representing diverse genders, cultures, ethnicities". Deeper avatar support via HeyGen integration.
6. **Brand Kits** — upload logos, custom wallpapers, intros/outros, custom voices; "Effortless Branding, Every Time" (https://trupeer.ai/brand-kits).
7. **Video translation** — "Translate videos in 65+ languages, in one click"; "Trupeer automatically syncs the video as per the pace and structure of the new language" (https://trupeer.ai/translation).
8. **Step-by-step guides / manuals / SOPs** — same recording produces written output (manual-creator, sop-creator, technical-documentation pages).
9. **Knowledge Base** (paid add-on) with **AI Video Search** that returns answers with exact video timestamps.
10. **Shared pages / analytics** — likes, comments, view metrics.
11. **Integrations (visible):** Monday.com, Make, Medium, Google Analytics, Repurpose.ai, Bigtincan, Cal.com, Pipedrive, SurveyMonkey (https://trupeer.ai/integrations). Also Confluence/Intercom export referenced in blog content.
12. **MCP server** for AI agents to query the customer's Trupeer KB.

**Pricing tiers** (https://trupeer.ai/pricing):

| Tier | Price | Video minutes / month | Notable gating |
|---|---|---|---|
| Free | $0 (10-day trial) | 10 AI video min, 5 guides, 3 exports | 8-min max recording |
| Pro | $40/mo (annual) / $49 monthly | 20 AI video min, unlimited guides/exports | 12-min max recording; watermark removal, intros/outros, captions |
| Scale | $199/mo (annual) / $249 monthly | 100 AI video min | 15-min max recording; 3-editor workspace, custom voices, custom backgrounds, branded pages |
| Enterprise | Custom | Custom | SAML SSO, admin dashboard, forward-deployed engineering, priority support |
| Knowledge Base add-on | $150/mo | — | Custom branding, domain hosting |
| Knowledge Base + AI Search | $200/mo | — | 1,000 AI searches, video timestamp search |

Enterprise page lists **ISO 27001**, **SOC 2**, **GDPR**, **SSO**, **SCIM** (https://trupeer.ai/enterprise).

Critical pricing fact for pitching UGC volume: **translation "consumes credits just like creating a new AI video" based on length**. Every translated language is a credit burn, not free. 20–100 UGC videos/day × N languages will explode credit usage — important for unit-economics framing.

---

## 3) Blog post inventory

The sitemap contains **1,470 URLs per locale across 10 locales** (en, es, de, fr, it, nl, zh, ja, ar, pt). The blog section alone holds ~180+ posts plus 700+ "tutorials/*" pages (Canva, Figma, Notion, GitHub, Jira, Excel, Teams, Slack how-tos — pure programmatic SEO for generic SaaS queries, not directly related to Trupeer's product).

Representative **Trupeer-relevant blog posts** (title → URL → one-line pain-point summary drawn from the post's actual intro):

1. **User Manual Generator: Complete Guide 2026** — /blog/user-manual-generator — "Teams invest 8 to 12 hours crafting a single manual from scratch."
2. **Best Screen Capture Software** — /blog/best-screen-capture-software — Screen-recording tooling comparison / buying guide.
3. **Best Customer Onboarding Video Software for 2026** — /blog/best-customer-onboarding-video-software-for-2026 — CS/onboarding teams drowning in repetitive tickets and outdated content.
4. **Video Localization** — /blog/video-localization — "Manually doing so is time-consuming and expensive… over 51% of online shoppers say information in their own language matters more than price."
5. **Loom Alternatives** — /blog/loom-alternatives — Loom is fine for quick messaging but can't hit "polished, on-brand, doubles as documentation".
6. **Guidde Alternatives** — /blog/guidde-alternatives — "49% of employees are frustrated by the technology their company provides"; Guidde caps videos at 100 steps and has weak editing.
7. **Synthesia Alternatives** — /blog/synthesia-alternatives — Synthesia is inflexible, limited avatars, steep pricing; Trupeer automates the *entire* doc process, not just talking-head avatars.
8. **Tango Alternatives** — /blog/tango-alternatives — "Modern teams aren't just looking for screen-capture tools anymore. They want outcomes" — self-updating docs, multilingual, analytics.
9. **Best Scribehow Alternatives** — /blog/best-scribehow-alternatives — "77% of B2B buyers say self-service product documentation is critical to their decision."
10. **Camtasia Alternatives** — /blog/camtasia-alternatives — Camtasia too heavy for modern AI-first workflows.
11. **Descript / VEED / Screenpal / ScreenStudio / Vidyard alternatives** — /blog/{descript,veed,screenpal,best-screenstudio,best-vidyard}-alternatives — lightweight screen-tools comparison cluster.
12. **Create Personalized Sales Demos** — /blog/create-personalized-sales-demos — "79% of sales professionals say personalized demos are more likely to convert"; video production services cost $2,000–$10,000.
13. **Repurpose Demo Videos** — /blog/repurpose-demo-videos — Turn one demo "into dozens of high-ROI assets without looping in a creative team".
14. **How to Make a Product Demo Video** — /blog/how-to-make-a-product-demo-video — Teams struggle with engagement, narrative structure, and production complexity.
15. **16 Best Product Demo Examples to Copy** — /blog/16-best-product-demo-examples-that-you-need-to-copy — "54% of buyers say product demos are one of the top factors that influence their final decision."
16. **5 Tips for Creating Killer Product Demos** — /blog/5-tips-for-creating-killer-product-demos
17. **19 Best Customer Onboarding Video Examples** — /blog/19-best-examples-of-customer-onboarding-videos
18. **How to Write a Video Script** — /blog/how-to-write-a-video-script — 92.3% of internet users consume online video.
19. **Announce SaaS Product Updates** — /blog/announce-saas-product-updates — "Most likely, three out of four users never engage with features you've built."
20. **Customer Education** — /blog/customer-education — "Customers don't stick around when they feel lost. They don't explore features they don't understand."
21. **Video Outreach Strategies** — /blog/video-outreach-strategies — Email fatigue; "up to 3x more responses" with video.
22. **Video Prospecting** — /blog/video-prospecting
23. **Marketing Videos** — /blog/marketing-videos — "84% of marketers say video directly increased sales."
24. **AI in Marketing** — /blog/ai-in-marketing — "65% of businesses utilize AI in at least one function."
25. **Best AI Avatar Generator** — /blog/best-ai-avatar-generator — Trupeer vs Synthesia/HeyGen: avatars embedded in broader doc workflow.
26. **Best Training Video Software** — /blog/best-training-video-software — LMS/SCORM/xAPI world, comparing to Camtasia, Vyond, iSpring, Articulate.
27. **Best SOP Creation Software** — /blog/best-sop-creation-software
28. **Best Product Walkthrough Software** — /blog/best-product-walkthrough-software
29. **Best Practices for Writing User Guides** — /blog/best-practices-for-writing-user-guides — manual guide creation is fragmented, stale, inconsistent.
30. **SaaS Black Friday Sale 2025** — /blog/saas-black-friday-sale-2025

There are also 8+ **customer-onboarding-video** posts and 15+ **user-guide-generator** variants, which is clearly programmatic SEO farming a keyword cluster (not independent editorial).

---

## 4) ICPs

Trupeer's own positioning names **"Marketing, Sales, L&D and CX teams"** as core, with dedicated use-case landing pages that reveal the specific buying roles:

| Use case page | Named ICP roles | Core problem framed on page |
|---|---|---|
| **Product marketing** (usecases/product-marketing) | Product marketers, sales enablement, PMMs, product-education leads | "Slow turnaround… every product update requires fresh production cycles… localizing content means restarting production from scratch." |
| **Sales enablement** (usecases/sales-enablement) | Sales Enablement leaders, sales marketers, AEs | "Reps waste hours re-recording demos for every prospect… content goes off-brand and inconsistent across regions." Headline: *"Empower Reps to Sell Smarter with AI Video Content"*. |
| **Pre-sales** (usecases/pre-sales) | Solutions engineers, pre-sales, sales engineers | "Free Pre-Sales from Demo Overload." "Hours spent customizing demos for individual accounts… constant re-recording when products are updated." |
| **Customer success** (usecases/customer-success) | CSMs, support/success teams | *"Turn Repetitive Support Tickets into Effortless Video Answers with AI."* "Endless hours spent re-recording when features change." |
| **Training videos** (usecases/training-videos) | L&D, training managers, product-education directors | *"Make Studio-Quality Training Videos with AI that actually get watched."* "Weeks spent scripting, recording, and editing… entire lessons re-recorded when features change." |
| **Change management** (usecases/change-management) | Change leaders, IT Directors, PMMs | *"AI-Powered Product Videos & Documentation in Minutes."* "Critical updates lost in long emails and slide decks… translation delays slow transformation rollouts." |

**Company types:** customer list skews B2B SaaS (Glean, LambdaTest, Zuora, Dextego, Siigo), plus **enterprise IT** (Hedrick Gardner, Fluid Networks, Ace Relocation Systems — law firm, MSP, logistics) and **global enterprise ops** (Zetwerk "Sales and Ops Onboarding across 20+ Countries"). The Siigo case story mentions "1M+ SMB training across Latin America" — i.e. Trupeer is used to *scale training of their customers' customers* in LATAM.

**Use cases, condensed:** product demos, personalized sales demos, onboarding videos, SOPs / runbooks, training modules, IT-migration comms, support answers, feature announcements, knowledge-base articles with video, localized product tours.

---

## 5) Pain-point clusters

Synthesized from repeated language across the homepage, use-case pages, and blog intros. Each cluster is grounded in direct quotes.

**Cluster A — "Every product update = re-record from scratch."**
- "Every product update requires fresh production cycles" (product-marketing).
- "Weeks spent scripting, recording, and editing training modules… entire lessons must be re-recorded when processes or features change" (training-videos).
- "Endless hours spent re-recording when features change" (customer-success).
- "Constant re-recording when products are updated" (pre-sales).

**Cluster B — "Localization means starting over."**
- "Localizing content means restarting production from scratch" (product-marketing).
- "Translation delays slow transformation rollouts" (change-management).
- "Manually doing so is time-consuming and expensive… over 51% of online shoppers say information in their own language matters more than price" (video-localization blog).

**Cluster C — "Personalization at scale is impossible with humans in the loop."**
- "Reps waste hours re-recording demos for every prospect" (sales-enablement).
- "Hours spent customizing demos for individual accounts" (pre-sales).
- "79% of sales professionals say personalized demos are more likely to convert" (create-personalized-sales-demos blog).
- "The buyer journey today is non-linear… no two prospects arrive at your demo with the same context" (same blog).

**Cluster D — "Production is too expensive and too slow."**
- "What usually took 5-6 hours is now down to 3-4 mins" (Zuora testimonial, everywhere).
- "Video production services cost $2,000–$10,000 or more" (personalized-sales-demos blog).
- "No more endless back-and-forth with designers or agencies" (product-marketing).
- "Teams typically invest 8 to 12 hours crafting a single manual from scratch" (user-guide best-practices blog).

**Cluster E — "Content goes off-brand the moment it leaves the central team."**
- "Content goes off-brand and inconsistent across regions" (sales-enablement).
- "Playbooks and product updates get lost in docs and Slack threads" (sales-enablement).
- "Inconsistent change messages across departments and regions" (change-management).
- Brand-Kits pitch: "Stay On-Brand everywhere."

**Cluster F — "Nobody discovers or watches the content once it's made."**
- "Most likely, three out of four users never engage with features you've built" (announce-saas-product-updates blog).
- "Customers don't stick around when they feel lost. They don't explore features they don't understand" (customer-education blog).
- "Training videos quickly become outdated and underused" (sales-enablement).

**Cluster G — "Documentation and video are separate workflows, and both rot."**
- "Trupeer handles both videos + documentation" (guidde-alternatives).
- "Guides lack dynamic, evolving formats" (tango-alternatives).
- "Modern teams… want outcomes — self-updating documentation, scalable training, measurable usage analytics" (tango-alternatives).

---

## 6) Keyword themes

Inferred from 1,470-URL sitemap, blog slugs, use-case pages and meta titles (no paid Ahrefs data required).

1. **"[Competitor] alternatives" (programmatic comparison SEO)** — `loom-alternatives`, `guidde-alternatives`, `synthesia-alternatives`, `tango-alternatives`, `best-scribehow-alternatives`, `camtasia-alternatives`, `descript-alternatives`, `veed-alternatives`, `screenpal-alternatives`, `best-vidyard-alternatives`, `best-screenstudio-alternatives`, `colossyan-features-pricing`, `reelmindai-features-pricing`, `livestorm-onboarding-features-pricing-2026`, `panopto-onboarding-features-pricing`.
2. **"Best X for customer/client onboarding video" (huge cluster)** — `best-customer-onboarding-video-software-for-2026`, `customer-onboarding-video-platforms`, `customer-onboarding-video-solutions`, `best-video-tools-for-customer-onboarding`, `interactive-video-for-customer-onboarding`, `best-video-platforms-for-onboarding-new-users`, `customer-onboarding-videos`, `best-customer-success-video-tools`. (15+ slug variants.)
3. **"Client onboarding automation"** — `best-client-onboarding-automation-software`, `client-onboarding-automation-platforms`, `features-of-client-onboarding-automation`, `best-client-onboarding-platforms-for-2026`, `leading-client-onboarding-solutions-for-saas`. (10+ variants.)
4. **"User guide / user manual / SOP generator"** — `ai-user-guide-generator`, `user-guide-generator-online`, `best-ai-software-to-create-user-guides`, `ai-tool-to-create-user-manuals`, `generate-user-guides-with-ai`, `best-sop-creation-software`, `sop-best-practices`, `standard-operating-procedure-templates`, `how-to-create-effective-video-sops`. (15+ variants.)
5. **"AI documentation / technical documentation"** — `ai-documentation-generator`, `ai-powered-documentation-tools`, `ai-for-technical-documentation`, `ai-tools-for-technical-documentation`, `best-ai-documentation-tools-for-2026`.
6. **"Product demo video / walkthrough"** — `how-to-make-a-product-demo-video`, `5-tips-for-creating-killer-product-demos`, `16-best-product-demo-examples-that-you-need-to-copy`, `create-personalized-sales-demos`, `product-walkthrough-video-examples`, `best-product-walkthrough-software`, `sales-demo-best-practices`, `repurpose-demo-videos`.
7. **"Training video / employee onboarding / L&D"** — `best-training-video-software`, `training-video-production`, `training-videos`, `employee-onboarding-videos`, `video-learning-platforms-for-employee-onboarding`, `top-video-based-employee-onboarding-software`, `microlearning-examples`, `instructional-design-certificates`, `8-instructional-design-models-to-use-in-2025`, `how-to-become-instructional-designer`.
8. **"Screen recording / screen capture"** — `best-screen-recording-software`, `best-screen-capture-software`, `best-screen-recording-softwares`, `aiscreen-record`, `usecases/screen-recorder`.
9. **"How-to tutorials for adjacent SaaS tools" (pure programmatic SEO funnel)** — 700+ `/tutorials/how-to-*` pages across Canva, Figma, Notion, GitHub, Jira, Slack, Teams, Excel, Zoom, Webflow, Ahrefs, Semrush, Moz, ChatGPT, LinkedIn. Bait for anyone Googling "how to do X in [tool]", funnel to Trupeer.
10. **"Video localization / translation / multilingual product video"** — `video-localization`, `usecases/translate-videos`, `translation-lp`, `translate`.

Notable keyword clusters they are **NOT** going after in any visible way: UGC, influencer, TikTok, Reels, short-form social, ad creative, paid social, ad testing, creator economy, YouTube Shorts. Their SEO footprint is 100% in **B2B SaaS enablement / documentation / training**, not in **social-first ad UGC**.

---

## 7) Languages / regional targeting — real vs marketing copy

The founder's "hundreds of languages" framing needs calibration.

**What's real:**
- **Marketing site is genuinely localized into 10 locales**: en-US, es-ES, de-DE, fr-FR, it-IT, nl-NL, zh-CN, ja-JP, ar-SA, pt-PT. Verified by fetching `/es/`, `/ja/`, `/ar/` homepages and a translated blog post — actual translated body copy, not just UI strings. Example: Spanish homepage headline is *"Vídeos y documentos de IA para el ciclo de vida de su producto"*; Japanese is *"トゥルーピア | AI駆動の製品ビデオとドキュメントを数分で作成"*. Each locale has its own sitemap of ~1,470 URLs with `hreflang` annotations — so ~14,700 indexable pages total.
- **The video product itself advertises 65+ languages** for video translation, consistent across homepage, pricing, /translation, /translate, /video, /aiscripting. The Aiscripting page says **"Translate scripts across 30+ languages and 100+ styles"** — mild inconsistency between 30+ (scripts) and 65+ (videos).
- **"100+ accents & styles, 150+ voices"** for voiceover — separate dimension from languages.
- **Auto-resync:** "Once you translate to another language, Trupeer automatically syncs the video as per the pace and structure of the new language" — this is a real, specific capability.

**What's marketing copy, not reality:**
- There is **no evidence of "hundreds of languages"** anywhere on the site. The consistent ceiling is **65+**.
- On-screen text translation (i.e. translating the pixels showing English in the original screen recording) is **not explicitly claimed**. The translation is voice + script + guide text, not in-video UI text.
- Arabic locale translation quality is visibly uneven (mixed English terms, awkward phrasing) — localization is LLM-assisted, not human copywritten, at least in some locales.

**Implication for pitch:** The "100s of languages" number would overstate current capability. The safer framing is **"65+ languages for delivery, 10 locales for their own demand-gen"**. UGC output volume × 65 languages is the honest ceiling.

---

## 8) Competitive positioning — Trupeer's own words

**Vs Loom:** "Video messaging tools like Loom have become a go-to for quick communication. But as teams scale and content expectations rise for demos, training, and product walkthroughs, many start to feel the limitations of simple screen recorders." Positioning: Loom = raw capture; Trupeer = "studio-quality results" with AI noise removal, avatars, multilingual output. Customer quote: *"We cancelled Loom for Trupeer"* (Fluid Networks).

**Vs Guidde:** Guidde limitations cited — 100-step cap, weak integrations behind paywalls, limited editing. Trupeer's line: "Trupeer handles both videos + documentation" from one recording, with "zero editing or writing skills."

**Vs Scribe / ScribeHow:** Scribe = screenshot-based step guides. Trupeer = "the next level — unified video and text documentation from a single recording, built-in collaboration with version control, automatic SEO indexing, 30+ languages, analytics dashboards."

**Vs Tango:** Tango = screen capture only. Trupeer = "outcomes… self-updating documentation, scalable training content, measurable usage analytics," with multi-format export (PDF/Word/Markdown) and integrations (Confluence, Intercom).

**Vs Synthesia / HeyGen (pure AI-avatar tools):** Trupeer says Synthesia is "inflexible, limited avatars, steep pricing" and that its own differentiation is automating "the *entire* documentation process" — not just spinning up talking-head avatars. For HeyGen specifically, Trupeer has instead built a **partnership** page ("Give your screen recordings a face-lift with Trupeer x Heygen") — so Trupeer's screen-recording front-end plugs into HeyGen's avatars/voices as an option, not a competitor.

**Vs Camtasia / Descript / ScreenStudio / Vidyard / VEED / Screenpal:** Consistent framing — legacy screen-recorders and video editors are "too heavy / too manual" for an AI-native workflow that generates video + docs + translations in one pipeline.

**Vs Gong / Chorus:** **Not addressed anywhere on the site.** Trupeer is not positioned in the revenue-intelligence / call-recording space. Gong/Chorus record *sales calls*; Trupeer records *the product's screen*. Different category, no overlap in Trupeer's messaging.

**Vs Arcade / Supademo (interactive product tours):** Not directly addressed either. Closest thing: the `best-product-walkthrough-software` post. Instead of positioning against them, Trupeer has a **Consensus partnership** (the interactive demo platform for buyer-enablement), suggesting Trupeer's wedge is "linear narrated video + doc" while Consensus/Arcade/Supademo own "click-through interactive." Pitch implication: there is a visible whitespace in their own positioning around interactive/UGC-style short-form.

**Core "in their own words" differentiation:** "AI videos **and** docs for your product lifecycle" — dual output from one recording — is the single line Trupeer repeats more than anything else. The second pillar is the 65+ language re-sync. The third is brand-kit consistency at scale.

---

## Pitch implications

1. **Frame UGC-Peer as "Trupeer × 10 output surface, same input," not a new product category.** Their existing wedge is "one recording → polished video + doc + 65 translations." We're extending that to "one corpus of 30–50 shots → 20–100 persona-targeted UGC variants per day." Pritish already believes in the 1-input-to-many-outputs model; we're just adding ICP-personalization and social-first formats as new output axes. Do not position this as "and now you also do TikTok" — position it as "your existing asset library compounds 20× more."

2. **Lead with localization + personalization as the *combined* wedge, not localization alone.** Their site already screams localization pain ("localizing means restarting production from scratch," "translation delays slow transformation rollouts") and they already have the 65-language infrastructure. The gap their own blog concedes is **personalization at scale** ("reps waste hours re-recording demos for every prospect," "79% of sales professionals say personalized demos are more likely to convert"). UGC-Peer's wedge is the product of those two axes: *ICP × language*. That's a 10 ICPs × 65 languages = 650-variant-per-asset story, which is where "20–100 videos/day" naturally lives.

3. **Anchor the pitch to their Ahrefs/SEO blog farm, not to new channels.** They are clearly running a programmatic-SEO content factory (1,470 URLs per locale, 700+ how-to tutorials for unrelated SaaS tools, 15+ near-duplicate "best customer onboarding video" posts). The pitch should show how a UGC generation engine compounds *that existing muscle*: every keyword cluster they rank on becomes a persona-targeted short-form video, and every blog post becomes a social-native distribution surface. Use their actual ranked slugs as example inputs in the demo.

4. **Call out the credit-economics reality upfront.** Their own pricing page says "translation consumes credits just like creating a new AI video." 20–100 videos/day × 65 languages would detonate current credit plans. Either UGC-Peer assumes a different cost model (batch / template-based re-render without full per-video credits), or we explicitly position this as an enterprise-tier offering priced separately. Pritish will do this math in his head in the first 60 seconds, so beat him to it.

5. **Avoid competing with their own narrative on Gong/Chorus and Loom.** Loom they explicitly kill ("We cancelled Loom for Trupeer"). Gong/Chorus they ignore because different category. Don't muddy the pitch by dragging in call-recording or sales-intelligence framings — keep it strictly in the Trupeer lane: product-lifecycle video + docs, now with UGC-style persona variants. The one external name to lean on is **Consensus** — they're already partnered, which proves Pritish is comfortable plugging Trupeer into adjacent demo-experience categories; UGC-Peer can be framed the same way (an adjacent output surface that shares the same recording/keyword corpus).
