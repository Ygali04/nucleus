# Brand Knowledge Ingestion

The Brand KB is the constraint layer that makes Nucleus's variants
feel on-brand at volume. Every script, every voiceover, every edit is
grounded against the tenant's Brand KB. This section describes how
the KB is built, what it contains, how it's queried during
generation, and how the engine integrates with the host product's
existing knowledge sources.

## What's in this section

| Page | Subject |
|---|---|
| [Brand KB schema](brand-kb-schema.md) | What's in a KB, document structure, embedding strategy |
| [Connectors](connectors.md) | How sources flow in (PDF, Notion, Confluence, Drive, MCP) |
| [RAG query pattern](rag-query-pattern.md) | How the generator agent queries the KB during scripting |
| [MCP integration](mcp-integration.md) | TruPeer's existing MCP server as a Brand KB source |
| [Research pipeline](research-pipeline.md) | DeepTutor multi-agent research over the KB for the education archetype |

## Why a Brand KB exists

Three reasons.

### 1. Generic AI video output is generic

The defining failure mode of every other AI video tool is that the
output feels generic — the avatar is on-brand, the voice is the right
language, but the script could be about any product in the category.
That's because the generator has no semantic representation of the
brand beyond the prompt.

Nucleus's Brand KB is the answer. Every script the generator writes
is retrieval-augmented from the brand's actual documents — product
copy, positioning, ICPs, sales call transcripts, support tickets,
case studies. The output sounds like the brand because it's
literally drawing from the brand's words.

### 2. Brand voice consistency at volume

A tenant producing 100 variants per day cannot manually review every
script for brand voice. The Brand KB enforces voice consistency at
the generation step: the generator agent retrieves on-brand examples
and grounds its output in them.

### 3. Updates propagate without re-shoots

When the brand's positioning changes — a new product launch, a
repositioning, a change in messaging — the tenant updates the Brand
KB. The next variant the engine produces reflects the change. No
re-shoot, no manual rewrite, no ad-hoc retraining.

## How the Brand KB differs from existing tools

| Tool | Brand representation |
|---|---|
| HeyGen | Brand Hub: logos, colors, glossary (visual + glossary only) |
| Synthesia | Brand Kit: logos, colors, fonts (visual only) |
| Arcads | Script generator with hook templates (template-based, no semantic store) |
| Creatify | URL scrape of the product page (one-shot snapshot, no persistent store) |
| Descript | None (relies on the user's manual editing) |
| Tavus | Persona RAG (closest to Nucleus, but only for conversational personas) |
| **Nucleus** | **Full semantic Brand KB: documents + chunks + embeddings + tags + freshness, queryable at generation time** |

The Brand KB is the structural piece that makes Nucleus a different
class of product, not a feature improvement on existing tools.

## What goes in a Brand KB

A typical brand's first KB ingestion includes:

| Source | Why |
|---|---|
| Marketing site (homepage, product pages, pricing) | Canonical positioning |
| Blog posts | Pain points, ICP framings, customer voice |
| Case studies | Specific outcomes and customer quotes |
| Help center / docs | Product feature explanations in the brand's voice |
| Product changelog | What's new, what's deprecated, how features evolved |
| ICP documents | Persona definitions, target roles, target verticals |
| Sales call transcripts (sanitized) | What customers actually ask about |
| Support ticket excerpts (sanitized) | Common pain points |
| Brand guidelines PDF | Tone of voice, restricted phrases, approved language |

Sources that should NOT go into the Brand KB:

- Personally-identifying customer data (use anonymized excerpts)
- Confidential internal strategy docs (the KB is queryable by an LLM
  agent; treat it as semi-public)
- Drafts of unreleased products (could leak into a generated variant)
- Legal documents (out of scope for variant generation)

## Sizing

Typical Brand KB sizes by tenant tier:

| Tenant tier | Documents | Total chunks | Storage |
|---|---|---|---|
| Starter | 10–100 | 200–2,000 | < 100MB |
| Growth | 100–1,000 | 2,000–20,000 | < 1GB |
| Enterprise | 1,000+ | 20,000+ | 1–10GB |

The bottleneck is rarely storage. The bottleneck is the quality and
freshness of the source material.

## Refresh cadence

Sources change. The KB stays fresh through three mechanisms:

1. **Webhook-driven** for sources that emit change events (Notion,
   Confluence)
2. **Polled** for sources that don't (URL crawls, sitemap walks)
3. **Manual re-upload** for PDF and Markdown files

The default polling cadence is 24 hours. Tenants can configure per-
source overrides.

## Reading order

If you're new to the ingestion layer:

1. [Brand KB schema](brand-kb-schema.md) — the data model
2. [Connectors](connectors.md) — how sources arrive
3. [RAG query pattern](rag-query-pattern.md) — how the generator uses
   the KB
4. [MCP integration](mcp-integration.md) — TruPeer-specific path
5. [Research pipeline](research-pipeline.md) — only relevant for the
   education archetype
