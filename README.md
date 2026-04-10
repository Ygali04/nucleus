# Nucleus

> Brand knowledge in. Neuro-scored video out. The recursive
> neuromarketing video engine.

Nucleus is a closed-loop video engine that takes a brand's documents,
product recordings, and ICP library and produces persona-targeted video
variants at the ICP × language × platform × archetype cross-product.
Every variant is scored by a TRIBE v2-class neuro-predictive model,
recursively edited until it passes a quality threshold, and delivered
with a neural report and a GTM strategy guide.

This repository holds the **concept design site** for Nucleus plus the
research inputs. The engineering implementation is scheduled after
the concept is approved (see `docs/POST_MEETING_PLAN.md`).

## What's here

| Directory | Contents |
|---|---|
| `docs/` | Nucleus concept mkdocs site. Start at `docs/index.md`. |
| `docs/stylesheets/` | Custom CSS matching the TruPeer visual aesthetic. |
| `docs/appendix/` | UGC primer, neuromarketing primer, TruPeer reference. |
| `docs/superpowers/specs/` | Canonical design spec (`2026-04-09-nucleus-vision-design.md`). |
| `research/` | Unabridged research outputs that fed the concept. |
| `mkdocs.yml` | Material for MkDocs config with Nucleus branding. |

Two meta-documents:

- **`docs/POST_MEETING_PLAN.md`** — full continuation plan beyond the
  concept site.
- **`docs/NEXT_SESSION_PROMPT.md`** — self-contained prompt to hand to
  a fresh Claude Code session to continue work.

## Running the concept site locally

```bash
pip install mkdocs-material
cd /Users/yahvingali/ugc-peer
mkdocs serve
```

Open http://localhost:8000.

## Site structure

- **Home** — Hero: what Nucleus is in 30 seconds
- **Concept** — What Nucleus is, what it's not, what's novel
- **Features** — Full capability surface: Ingest / Generate / Deliver
- **How it works** — Loop, state machine, services, cost model
- **Output archetypes** — Demo / Marketing / Knowledge / Education
- **Research foundation** — UGC + neuromarketing literature with DOIs
- **Competitive landscape** — Incumbents and the whitespace Nucleus fills
- **Integration** — Embed pattern and the first design-partner tenant
- **Roadmap** — MVP → v1 → v2

## Status

- **2026-04-09** — Concept site shipped.
- **Friday Apr 10** — First review with the first design-partner tenant.
- **After review** — Resume via `docs/NEXT_SESSION_PROMPT.md` to expand
  into engineering design docs, OSS evaluation, brand system, and GTM
  packaging.

## License

TBD.
