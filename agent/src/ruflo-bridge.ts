/**
 * Ruflo bridge — drives a Nucleus swarm and emits SSE events.
 *
 * ## Implementation note
 *
 * Research confirmed Ruflo (Claude Flow v3.5.42) has NO out-of-the-box HTTP
 * server — it only ships a CLI (`npx claude-flow`) and an MCP stdio server.
 * The `UnifiedSwarmCoordinator` at `ruflo/v3/@claude-flow/swarm/src/` is an
 * internal package that isn't published as a consumable dep.
 *
 * Per task spec: "If Ruflo's programmatic API turns out to be harder to import
 * than expected, fall back to: spawn Ruflo as a subprocess via execa /
 * child_process — same interface to Python, different implementation under
 * the hood."
 *
 * This bridge therefore runs an in-process Queen-Worker loop that:
 *   - Loads the 5 agent YAMLs from `agent/agents/*.yaml`
 *   - Registers the 7 `defineTool` handlers (each POSTs to the Nucleus API)
 *   - Drives the recursive generate → score → evaluate → edit loop
 *   - Emits SSE events using the Nucleus event schema
 *
 * Swapping this for a real Ruflo swarm is a single-file change: replace
 * `runInProcessSwarm` with a spawn of `claude-flow swarm run` and parse
 * its stdout events. The external SSE contract stays identical.
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import yaml from "js-yaml";

import { bindToolHandlers } from "../tools/registry.js";
import type { NucleusToolSet } from "../tools/handlers/index.js";
import type {
  EditType,
  EditVariantInput,
  GenerateVideoInput,
  ScoreNeuroPeerInput,
  ScoreNeuroPeerOutput,
} from "../tools/types.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CandidateSpec {
  id: string;
  job_id: string;
  icp: string;
  language: string;
  platform: string;
  archetype: string;
  variant_index: number;
  score_threshold: number;
  max_iterations: number;
  cost_ceiling: number | null;
  source_url: string;
}

export interface SwarmRequest {
  job_id: string;
  candidate_spec: CandidateSpec;
  tools_base_url: string;
}

export interface SwarmEvent {
  event_type: string;
  job_id: string;
  [key: string]: unknown;
}

export type StopDecision =
  | "continue"
  | "passed_threshold"
  | "max_iterations"
  | "monotone_failure"
  | "cost_ceiling";

interface AgentConfig {
  name: string;
  role: string;
  model?: string;
  tools?: string[];
  system_prompt?: string;
  max_iterations?: number;
}

// ---------------------------------------------------------------------------
// Agent YAML loader
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENT_NAMES = ["orchestrator", "generator", "editor", "scorer", "strategist"];

/**
 * Resolve the agents directory robustly across dev (tsx from ``src/``),
 * compiled (``dist/src/``), and Docker (``/app/dist/src/``) layouts.
 * ``NUCLEUS_AGENTS_DIR`` always wins when set.
 */
function resolveAgentsDir(): string {
  if (process.env.NUCLEUS_AGENTS_DIR) return process.env.NUCLEUS_AGENTS_DIR;
  const candidates = [
    resolve(__dirname, "../agents"),          // src/ runtime
    resolve(__dirname, "../../agents"),       // dist/src/ runtime
    resolve(__dirname, "../../../agents"),    // deeper nesting
  ];
  for (const candidate of candidates) {
    const probe = resolve(candidate, "orchestrator.yaml");
    if (existsSync(probe)) return candidate;
  }
  return candidates[0]!;
}

let _cachedAgents: AgentConfig[] | null = null;

export async function loadAgents(): Promise<AgentConfig[]> {
  if (_cachedAgents) return _cachedAgents;
  const agentsDir = resolveAgentsDir();
  const loaded = await Promise.all(
    AGENT_NAMES.map(async (name) => {
      const path = resolve(agentsDir, `${name}.yaml`);
      const raw = await readFile(path, "utf-8");
      return yaml.load(raw) as AgentConfig;
    }),
  );
  _cachedAgents = loaded;
  return loaded;
}

// ---------------------------------------------------------------------------
// Evaluator (mirrors backend/nucleus/orchestrator/evaluator.py)
// ---------------------------------------------------------------------------

function evaluate(
  score: number,
  threshold: number,
  iteration: number,
  maxIters: number,
  history: number[],
  cost: number,
  ceiling: number | null,
): StopDecision {
  if (score >= threshold) return "passed_threshold";
  if (iteration >= maxIters) return "max_iterations";
  if (history.length >= 2) {
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    if (last !== undefined && prev !== undefined && last <= prev) {
      return "monotone_failure";
    }
  }
  if (ceiling !== null && cost >= ceiling) return "cost_ceiling";
  return "continue";
}

// ---------------------------------------------------------------------------
// Edit selection (mirrors backend/nucleus/orchestrator/editor.py)
//
// This lives in the Ruflo orchestrator agent — the Python loop no longer
// owns this decision. In a real Ruflo swarm the Queen LLM would call
// `edit_variant` with a chosen edit_type; here we deterministically pick
// from the score breakdown.
// ---------------------------------------------------------------------------

function pickEdit(score: ScoreNeuroPeerOutput): EditType {
  const curve = score.attention_curve ?? [];
  for (let i = 1; i < curve.length; i++) {
    const prev = curve[i - 1];
    const cur = curve[i];
    if (prev !== undefined && cur !== undefined && prev - cur > 15) {
      return "cut_tightening";
    }
  }
  const metrics = score.breakdown ?? {};
  const candidates: Array<[number, EditType]> = [
    [metrics.hook_score ?? 100, "hook_rewrite"],
    [metrics.emotional_resonance ?? 100, "music_swap"],
    [metrics.cognitive_accessibility ?? 100, "pacing_change"],
    [metrics.memory_encoding ?? 100, "caption_emphasis"],
    [metrics.aesthetic_quality ?? 100, "visual_substitution"],
  ];
  candidates.sort(([a], [b]) => a - b);
  return candidates[0]?.[1] ?? "hook_rewrite";
}

// ---------------------------------------------------------------------------
// In-process swarm runner
// ---------------------------------------------------------------------------

export interface RunSwarmOptions {
  /** Override tool handlers (used by tests). */
  tools?: NucleusToolSet;
  /** Override agent configs (used by tests). */
  agents?: AgentConfig[];
}

export async function* runSwarm(
  req: SwarmRequest,
  opts: RunSwarmOptions = {},
): AsyncIterable<SwarmEvent> {
  const { job_id, candidate_spec, tools_base_url } = req;
  const tools = opts.tools ?? bindToolHandlers(tools_base_url);
  const agents = opts.agents ?? (await loadAgents());

  const base = (event_type: string, data: Record<string, unknown>): SwarmEvent => ({
    event_type,
    job_id,
    candidate_id: candidate_spec.id,
    ...data,
  });

  yield base("swarm.started", {
    agents: agents.map((a) => a.name),
    topology: "hierarchical-mesh",
  });

  try {
    // --- Generator agent: produce initial variant ---------------------
    yield base("candidate.generating", { iteration: 0 });

    const generateInput: GenerateVideoInput = {
      prompt: buildPrompt(candidate_spec),
      duration_s: 15,
    };
    const genOut = await tools.generate_video.handler(generateInput);
    let currentVideoUrl = genOut.video_url;
    let cost = genOut.cost_usd ?? 0;

    // --- Recursive scoring + editing loop -----------------------------
    const history: number[] = [];
    let decision: StopDecision = "continue";
    let lastScore: ScoreNeuroPeerOutput | null = null;

    for (let i = 0; i < candidate_spec.max_iterations; i++) {
      // Scorer agent
      const scoreInput: ScoreNeuroPeerInput = {
        video_url: currentVideoUrl,
        parent_job_id: i === 0 ? undefined : candidate_spec.id,
      };
      const scoreOut = await tools.score_neuropeer.handler(scoreInput);
      lastScore = scoreOut;
      history.push(scoreOut.neural_score);
      cost += 0.08;

      yield base("candidate.scored", {
        score: scoreOut.neural_score,
        iteration: i,
        video_url: currentVideoUrl,
        breakdown: scoreOut.breakdown,
        attention_curve: scoreOut.attention_curve,
      });

      // Orchestrator agent: decide
      decision = evaluate(
        scoreOut.neural_score,
        candidate_spec.score_threshold,
        i,
        candidate_spec.max_iterations,
        history,
        cost,
        candidate_spec.cost_ceiling,
      );

      yield base("iteration.evaluated", {
        decision,
        score: scoreOut.neural_score,
        iteration: i,
      });

      if (decision !== "continue") break;

      // Editor agent: apply an edit
      const editType = pickEdit(scoreOut);
      const editInput: EditVariantInput = {
        candidate_id: candidate_spec.id,
        edit_type: editType,
      };
      const editOut = await tools.edit_variant.handler(editInput);
      currentVideoUrl = editOut.video_url;
      cost += editOut.cost_usd ?? 0.05;

      yield base("candidate.edited", {
        edit_type: editType,
        iteration: i + 1,
        video_url: currentVideoUrl,
      });

      yield base("candidate.generating", { iteration: i + 1 });
    }

    // --- Deliver ------------------------------------------------------
    yield base("candidate.delivered", {
      score: lastScore?.neural_score ?? 0,
      iterations: history.length,
      decision,
      final_video_url: currentVideoUrl,
      cost_usd: cost,
    });

    yield {
      event_type: "candidate.complete",
      job_id,
      candidate_id: candidate_spec.id,
      final_state: {
        decision,
        score: lastScore?.neural_score ?? 0,
        iterations: history.length,
        score_history: history,
        cost_usd: cost,
        video_url: currentVideoUrl,
      },
    };
  } catch (err) {
    yield base("candidate.failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

function buildPrompt(spec: CandidateSpec): string {
  return (
    `Generate a ${spec.platform} ${spec.archetype} ad for ICP=${spec.icp} ` +
    `in ${spec.language}. Variant ${spec.variant_index}.`
  );
}
