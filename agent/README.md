# Nucleus Agent Framework

Ruflo / Claude Flow v3.5.42 configuration for the Nucleus recursive
neuromarketing video pipeline.

## Structure

- `nucleus-swarm.config.ts` — Swarm topology and agent roster
- `agents/*.yaml` — 5 agent definitions (orchestrator, generator, editor, scorer, strategist)
- `tools/registry.ts` — Type-safe tool registry wrapping the backend HTTP endpoints
- `tools/types.ts` — TypeScript types mirroring the backend Pydantic schemas

## Agents

| Agent | Role | Tools |
|-------|------|-------|
| `orchestrator` | Queen | All 7 tools |
| `generator` | Worker | generate_video, generate_audio, generate_music, compose_remotion |
| `editor` | Worker | edit_variant, clip_ffmpeg, generate_video, generate_audio |
| `scorer` | Worker | score_neuropeer |
| `strategist` | Post-loop | (none — pure LLM reasoning) |

## Setup

```bash
npm install
npm run typecheck
```

## Linking to Ruflo

In production, install `claude-flow` from `/Users/yahvingali/gen-strat/ruflo`:

```bash
npm install ../../gen-strat/ruflo
```

The swarm config is consumed by Ruflo's `UnifiedSwarmCoordinator`.
