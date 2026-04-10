# Next-Session Prompt

> Paste the contents of this file (everything between the horizontal rules below) into a new Claude Code session started in `/Users/yahvingali/ugc-peer`. It is a self-contained prompt that hands over full context from the pitch-slice session to the post-meeting deep-pass session.

---

## Context

You are continuing work on **Nucleus**, a new product being built inside TruPeer (trupeer.ai, the AI screen-recording + documentation SaaS co-founded by Shivali Goyal and Pritish Gupta, $3M seed led by RTP Global July 2025).

Nucleus is a recursive neuromarketing video-generation engine. It takes a TruPeer customer's existing screen recordings, brand knowledge base, and ICP definitions, and produces persona × language × format variants at the cross-product — each one scored by a neuro-predictive model (Meta FAIR TRIBE v2 via the author's NeuroPeer service) and recursively edited until it passes a quality threshold. Outputs per job: the delivered variants, a neural report, and a GTM strategy guide.

The previous Claude Code session (April 9, 2026) was a **pitch-slice session** — it produced a tight mkdocs site focused on Section 1 (Vision & Positioning) to be shown to Pritish at a Friday 10am IST meeting. That meeting has now happened (or will happen imminently — check the date). Your job in this session is to execute the post-meeting buildout: expanding the mkdocs site across Sections 2–8 of the original decomposition, and optionally scaffolding the actual codebase.

## Critical constraints

1. **Minimal-code philosophy.** Every component of Nucleus that can be borrowed from an existing repo or OSS project must be. The engineering budget is reserved for the orchestrator, the editor agent's prompt surface, and the TruPeer product-shell integration. Do not propose building anything that already exists.

2. **TruPeer-first framing.** Nucleus lives inside TruPeer's product surface. It is not a standalone TikTok UGC factory. The product page, the problem framing, and every design decision should stay anchored in TruPeer's actual positioning — B2B SaaS enablement/documentation/training — not in the generic creator economy.

3. **TRIBE v2 license awareness.** TRIBE v2 is CC BY-NC 4.0 (non-commercial). The canonical path assumes a Meta FAIR commercial licensing deal is feasible. If the deal stalls, the `AttentionProxyAnalyzer` fallback (V-JEPA2 features + lightweight attention head) becomes the critical path. The pluggable analyzer interface is already designed — do not remove it.

4. **Name is locked: Nucleus.** Do not re-brainstorm. If branding refinements come up in Section 6, work within the Nucleus name.

5. **Compliance inheritance.** TruPeer holds ISO 27001, SOC 2, GDPR, SSO, SCIM. Any Nucleus subsystem that touches customer data inherits those obligations. Design accordingly.

## What already exists (read these first)

The author has a rich ecosystem of existing repos that Nucleus reuses:

- **`/Users/yahvingali/video-brainscore/`** — NeuroPeer. FastAPI + Celery + Redis + Postgres + MinIO on Railway. `POST /api/v1/analyze`, `/compare`, `/results/{id}/timeseries`, `/brain-map`, WebSocket progress. TRIBE v2 inference via DataCrunch A100 spot GPUs. Read `NEUROPEER_SPEC.md` and `README.md`.
- **`/Users/yahvingali/glassroom-edu/neuroflix-gemini-hack/`** — Neuroflix. Next.js agent with a Director pattern, 25+ tool declarations, Veo 3.1, Nano Banana Pro, ElevenLabs IVC, Google Lyria, FFmpeg. Read `/Users/yahvingali/glassroom-edu/archs/neuroflix-architecture.md` for the full summary.
- **`/Users/yahvingali/glassroom-edu/DeepTutor/`** — Multi-agent RAG with LightRAG/LlamaIndex/RAGAnything, knowledge base manager, deep research pipeline. Read `/Users/yahvingali/glassroom-edu/archs/deeptutor-architecture.md`.
- **`/Users/yahvingali/glassroom-edu/Roto/`** — Video ingestion + Marengo embeddings + SSE streaming + GLM 4.6V-flash. Read `/Users/yahvingali/glassroom-edu/archs/roto-architecture.md`.
- **`/Users/yahvingali/glassroom-edu/ManimStudio-simple-middleware/`** — Remotion engine, design system ("Tempered Glass over Warm Light"), prior brand work. Read `/Users/yahvingali/glassroom-edu/archs/ui-design-template.md`.
- **`/Users/yahvingali/glassroom-edu/GlassRoom v1 agent/`** — LangGraph-based orchestration backbone. Read `docs/PRODUCTION_ROADMAP.md`.

## What the previous session shipped (read these second)

The pitch slice lives in this directory (`/Users/yahvingali/ugc-peer/`). The deliverables:

### mkdocs site (docs/) — Nucleus-first concept doc

- `index.md` — Hero: "Brand knowledge in. Neuro-scored video out." Feature cards, loop diagram, why-now.
- `concept.md` — What Nucleus is, what it's not, the core insight, what's novel.
- `features.md` — Full feature surface: Ingest / Generate / Deliver, card-based.
- `how-it-works.md` — Mechanical view: loop, state machine, services, continuous scoring, throughput, cost, pluggable analyzer.
- `archetypes.md` — Four output archetypes (demo, marketing, knowledge, education) with stacks and scoring weights.
- `foundation.md` — UGC + neuromarketing research with full academic spine (DOIs).
- `landscape.md` — Competitive landscape, Descript deep-dive, positioning map, at-risk incumbents.
- `integration.md` — Embed pattern, tenant UX, service reuse map, TruPeer as first design partner, extraction path.
- `roadmap.md` — MVP / v1 / v2 with dates and risks.
- `appendix/ugc-primer.md` — UGC research condensed.
- `appendix/neuromarketing-primer.md` — Academic citations + TRIBE v2.
- `appendix/trupeer-keywords.md` — TruPeer company reference (not pitch front matter).
- `POST_MEETING_PLAN.md` — The full buildout plan (your work queue).
- `NEXT_SESSION_PROMPT.md` — This file.
- `stylesheets/extra.css` — Nucleus visual system aligned to TruPeer aesthetic.

**Important framing note.** The pitch site was deliberately rewritten
as a **concept doc for Nucleus front and center**, not as a response
to a specific founder ask. Do not reintroduce "Pritish said X" or
"TruPeer's pain is Y" framing into the top-level pages. TruPeer
belongs on the `integration.md` page as the first design-partner
tenant and in the appendix as a reference doc. Everywhere else,
Nucleus is the subject.

### Raw research files (research/)

- `competitive-landscape.md` — Full unabridged competitor scan
- `ugc-neuromarketing-intersection.md` — Full UGC + neuro research with academic citations
- `trupeer-context.md` — Full TruPeer company research with direct quotes and URLs

### Config

- `mkdocs.yml` — Material theme with Nucleus branding

## Your mission this session

Read `docs/POST_MEETING_PLAN.md`. That file is your work queue. It has:

1. A checklist of what's already done (✅)
2. Eight sections of deferred work, each decomposed into specific deliverables
3. A list of deferred research agents to dispatch
4. Open questions to resolve with the user post-meeting

Your session should:

1. **Check in with the user first.** Ask:
   - How did the Friday meeting go?
   - What did Pritish actually commit to / react most to / push back on?
   - Which open question(s) from `POST_MEETING_PLAN.md` got answered by Pritish?
   - Which section of the buildout should you tackle first?
   - Are any sections now out of scope because of what Pritish said?

2. **Re-verify the ecosystem hasn't changed.** The memory you're reading this from is from April 9, 2026. Before quoting file paths or API signatures in new docs, re-read the relevant source files and confirm they still exist and still look as described.

3. **Dispatch background research agents in parallel** for the deferred research topics in `POST_MEETING_PLAN.md` Section "Deferred research agents to dispatch." The three topics are: OSS video composition tools, diffusion video provider APIs, and compliance/legal deep-dive. Use the `general-purpose` Agent subtype.

4. **Execute the buildout sections the user selects.** For each section you execute, follow the same pattern as the pitch slice: thinking first, then drafting mkdocs pages into `docs/<section>/`, then updating `mkdocs.yml` nav, then running a self-review pass. Keep page quality high — these documents are for a real product launch.

5. **Update `POST_MEETING_PLAN.md`** as you complete items. Check boxes, add follow-ups, adjust the plan based on Pritish's feedback from the meeting.

6. **Optionally scaffold the codebase** if the user wants implementation to start. Create `backend/`, `worker/`, `frontend/` directories. Do NOT start coding without explicit user approval — the user may want to stay in docs-mode for several more sessions.

## Tooling notes for the new Claude session

- You have the Superpowers skill system. Use `superpowers:brainstorming` if you're about to invoke creative work beyond what `POST_MEETING_PLAN.md` already specifies. Use `superpowers:writing-plans` for any new implementation plans. Use `superpowers:test-driven-development` if scaffolding code.
- You have background Agent dispatch via `run_in_background: true`. The previous session dispatched 3 research agents in parallel and they finished in ~2 minutes each. Do the same for the deferred research topics.
- You have a memory system at `/Users/yahvingali/.claude/projects/-Users-yahvingali/memory/`. Check `MEMORY.md` for the index. The previous session did not write new memory entries — this post-meeting session should consider writing one about Nucleus's positioning and Friday meeting outcomes.
- Use `Bash` for directory ops, `Glob`/`Grep` for search, `Read`/`Edit`/`Write` for files. Do not use `cat`/`head`/`find`/`grep` CLI commands.

## Tone and style for the mkdocs pages

The pitch slice is written in a specific voice:

- **Direct and concrete.** Every claim is backed by either a source URL, a quoted customer testimonial, or a specific file path in the existing ecosystem.
- **No filler.** No "in today's fast-paced world" openings. No "it's important to note that" hedges. No marketing cliches.
- **Tables for dense information.** Use markdown tables liberally. Use mermaid for anything that benefits from a diagram.
- **Callouts (blockquotes) for killer stats.** When a number or a quote is the point, blockquote it.
- **Internal links over repetition.** If a concept is covered on another page, link there instead of re-explaining.
- **Assume the reader is technical and busy.** Pritish is ex-BCG, IIT Bombay. Do not over-explain.

Continue that voice. If you find yourself writing a paragraph that could be a three-row table, make it a table.

## Most important thing

The previous session was disciplined about the minimal-code thesis. Every architectural decision was justified by "this component already exists in an existing repo or as a reputable OSS project — we're gluing, not building from scratch." Maintain that discipline. Nucleus is a gluing project, not a greenfield rebuild. If you find yourself proposing to build something from scratch, ask first whether it already exists in one of the listed repos or as a known OSS project — and if it does, use it.

---

## How to start

After reading this prompt, your first action should be:

```
1. Read /Users/yahvingali/ugc-peer/docs/POST_MEETING_PLAN.md
2. Read /Users/yahvingali/ugc-peer/docs/index.md (refresh on framing)
3. Read /Users/yahvingali/ugc-peer/docs/concept.md (what Nucleus is and isn't)
4. Read /Users/yahvingali/ugc-peer/docs/integration.md (how Nucleus embeds in TruPeer)
5. Ask the user the 5 questions from section "Your mission this session → Check in with the user first"
6. Wait for answers before executing any deferred section.
```

Good luck, future-me.
