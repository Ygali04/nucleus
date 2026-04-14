/**
 * Ruflo bridge — drives a Nucleus swarm and emits SSE events.
 *
 * This bridge runs an in-process Queen-Worker loop that:
 *   - Loads the 5 agent YAMLs from `agent/agents/*.yaml`
 *   - Materializes a campaign graph live by emitting `canvas.*` events
 *     for each pipeline step Ruflo decides to run
 *   - Uses `run_comfyui_workflow` for every generation + edit step so
 *     the UI sees a single progress-event channel (`tool.comfyui.*`) no
 *     matter which underlying provider Ruflo picked
 *   - Keeps the existing `candidate.*` / `iteration.*` events as
 *     a complementary "narrative" track
 *
 * Provider selection is env-driven:
 *   NUCLEUS_VIDEO_SUBTYPE  — default "kling"
 *   NUCLEUS_AUDIO_SUBTYPE  — default "elevenlabs"
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
  RunComfyUIWorkflowOutput,
  ScoreNeuroPeerInput,
  ScoreNeuroPeerOutput,
} from "../tools/types.js";
import {
  buildEditorWorkflow,
  buildVideoWorkflow,
  type ComfyWorkflow,
  type VideoSubtype,
} from "./workflow-builder.js";

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
  /** Optional override for the video model Ruflo should call for this candidate. */
  video_subtype?: VideoSubtype;
  /** Optional pre-built prompt. Falls back to a deterministic string from spec. */
  prompt?: string;
}

export interface SwarmRequest {
  job_id: string;
  candidate_spec: CandidateSpec;
  tools_base_url: string;
  /** Campaign id for routing canvas events to the right UI canvas. */
  campaign_id?: string;
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

export interface CanvasNode {
  id: string;
  kind: "video_gen" | "scoring" | "editor" | "delivery";
  subtype: string;
  label: string;
  x: number;
  y: number;
  data: Record<string, unknown>;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  kind: "dataflow";
}

// ---------------------------------------------------------------------------
// Agent YAML loader
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENT_NAMES = ["orchestrator", "generator", "editor", "scorer", "strategist"];

function resolveAgentsDir(): string {
  if (process.env.NUCLEUS_AGENTS_DIR) return process.env.NUCLEUS_AGENTS_DIR;
  const candidates = [
    resolve(__dirname, "../agents"),
    resolve(__dirname, "../../agents"),
    resolve(__dirname, "../../../agents"),
  ];
  for (const candidate of candidates) {
    if (existsSync(resolve(candidate, "orchestrator.yaml"))) return candidate;
  }
  return candidates[0]!;
}

let _cachedAgents: AgentConfig[] | null = null;

export async function loadAgents(): Promise<AgentConfig[]> {
  if (_cachedAgents) return _cachedAgents;
  const agentsDir = resolveAgentsDir();
  const loaded = await Promise.all(
    AGENT_NAMES.map(async (name) => {
      const raw = await readFile(resolve(agentsDir, `${name}.yaml`), "utf-8");
      return yaml.load(raw) as AgentConfig;
    }),
  );
  _cachedAgents = loaded;
  return loaded;
}

// ---------------------------------------------------------------------------
// Evaluator + edit-pick heuristics
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
// Canvas layout + id helpers
// ---------------------------------------------------------------------------

const NODE_DX = 280;
const ROW_DY = 220;

const DEFAULT_VIDEO_SUBTYPE = (process.env.NUCLEUS_VIDEO_SUBTYPE ?? "kling") as VideoSubtype;
const DEFAULT_AUDIO_SUBTYPE = process.env.NUCLEUS_AUDIO_SUBTYPE ?? "elevenlabs";

function rand4(): string {
  return Math.random().toString(16).slice(2, 6).padStart(4, "0");
}

function nodeId(
  campaignId: string,
  kind: CanvasNode["kind"],
  iter: number,
): string {
  // Strip characters that would break DOM ids; keep the shape deterministic.
  const safe = campaignId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const kindSlug = kind.replace(/_/g, "");
  return `${safe}-${kindSlug}-${iter}-${rand4()}`;
}

function edgeId(source: string, target: string): string {
  return `e-${source}--${target}`;
}

// ---------------------------------------------------------------------------
// Swarm runner
// ---------------------------------------------------------------------------

export interface RunSwarmOptions {
  tools?: NucleusToolSet;
  agents?: AgentConfig[];
  /** Override the workflow builder (tests). */
  buildVideo?: typeof buildVideoWorkflow;
  /** Override the editor workflow builder (tests). */
  buildEditor?: typeof buildEditorWorkflow;
}

export async function* runSwarm(
  req: SwarmRequest,
  opts: RunSwarmOptions = {},
): AsyncIterable<SwarmEvent> {
  const { job_id, candidate_spec, tools_base_url } = req;
  const campaign_id = req.campaign_id ?? job_id;
  const tools = opts.tools ?? bindToolHandlers(tools_base_url);
  const agents = opts.agents ?? (await loadAgents());
  const buildVideo = opts.buildVideo ?? buildVideoWorkflow;
  const buildEditor = opts.buildEditor ?? buildEditorWorkflow;

  const videoSubtype: VideoSubtype = candidate_spec.video_subtype ?? DEFAULT_VIDEO_SUBTYPE;
  const baseY = candidate_spec.variant_index * ROW_DY;
  let col = 0;
  const nextX = (): number => {
    const x = col * NODE_DX;
    col += 1;
    return x;
  };

  const base = (event_type: string, data: Record<string, unknown>): SwarmEvent => ({
    event_type,
    job_id,
    candidate_id: candidate_spec.id,
    ...data,
  });

  const canvasNode = (node: CanvasNode): SwarmEvent => ({
    event_type: "canvas.node_added",
    job_id,
    campaign_id,
    candidate_id: candidate_spec.id,
    node,
  });
  const canvasEdge = (edge: CanvasEdge): SwarmEvent => ({
    event_type: "canvas.edge_added",
    job_id,
    campaign_id,
    candidate_id: candidate_spec.id,
    edge,
  });
  const canvasPatch = (id: string, patch: Record<string, unknown>): SwarmEvent => ({
    event_type: "canvas.node_updated",
    job_id,
    campaign_id,
    candidate_id: candidate_spec.id,
    node_id: id,
    patch: { data: patch },
  });

  yield base("swarm.started", {
    agents: agents.map((a) => a.name),
    topology: "hierarchical-mesh",
    video_subtype: videoSubtype,
    audio_subtype: DEFAULT_AUDIO_SUBTYPE,
  });

  try {
    const prompt = candidate_spec.prompt ?? defaultPrompt(candidate_spec);

    // -----------------------------------------------------------------
    // Step 1: initial video generation
    // -----------------------------------------------------------------
    yield base("candidate.generating", { iteration: 0 });

    const videoNode: CanvasNode = {
      id: nodeId(campaign_id, "video_gen", 0),
      kind: "video_gen",
      subtype: videoSubtype,
      label: `${videoSubtype} gen`,
      x: nextX(),
      y: baseY,
      data: { prompt, duration_s: 15, status: "running" },
    };
    yield canvasNode(videoNode);

    const videoWorkflow = await buildVideo(tools_base_url, videoSubtype, prompt, 15);
    const genOut = await runComfyStep(tools, videoWorkflow, {
      job_id,
      candidate_id: candidate_spec.id,
      node_id: videoNode.id,
      expected_output_kind: "video",
    });
    let currentVideoUrl = genOut.output_url;
    let cost = genOut.cost_usd ?? 0;

    yield canvasPatch(videoNode.id, {
      status: "complete",
      output_url: currentVideoUrl,
      cost_usd: genOut.cost_usd,
    });

    // -----------------------------------------------------------------
    // Step 2+: recursive scoring + editing loop
    // -----------------------------------------------------------------
    const history: number[] = [];
    let decision: StopDecision = "continue";
    let lastScore: ScoreNeuroPeerOutput | null = null;
    let prevNodeId = videoNode.id;

    for (let i = 0; i < candidate_spec.max_iterations; i++) {
      // Scorer node
      const scoreNode: CanvasNode = {
        id: nodeId(campaign_id, "scoring", i),
        kind: "scoring",
        subtype: "neuropeer",
        label: `NeuroPeer #${i + 1}`,
        x: nextX(),
        y: baseY,
        data: { video_url: currentVideoUrl, status: "running" },
      };
      yield canvasNode(scoreNode);
      yield canvasEdge({
        id: edgeId(prevNodeId, scoreNode.id),
        source: prevNodeId,
        target: scoreNode.id,
        kind: "dataflow",
      });

      const scoreInput: ScoreNeuroPeerInput = {
        video_url: currentVideoUrl,
        parent_job_id: i === 0 ? undefined : candidate_spec.id,
      };
      const scoreOut = await tools.score_neuropeer.handler(scoreInput);
      lastScore = scoreOut;
      history.push(scoreOut.neural_score);
      cost += 0.08;

      yield canvasPatch(scoreNode.id, {
        status: "complete",
        neural_score: scoreOut.neural_score,
        breakdown: scoreOut.breakdown,
      });

      yield base("candidate.scored", {
        score: scoreOut.neural_score,
        iteration: i,
        video_url: currentVideoUrl,
        breakdown: scoreOut.breakdown,
        attention_curve: scoreOut.attention_curve,
      });

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

      if (decision !== "continue") {
        prevNodeId = scoreNode.id;
        break;
      }

      // Editor node
      const editType = pickEdit(scoreOut);
      const editorNode: CanvasNode = {
        id: nodeId(campaign_id, "editor", i),
        kind: "editor",
        subtype: editType,
        label: `edit: ${editType}`,
        x: nextX(),
        y: baseY,
        data: { edit_type: editType, source_video_url: currentVideoUrl, status: "running" },
      };
      yield canvasNode(editorNode);
      yield canvasEdge({
        id: edgeId(scoreNode.id, editorNode.id),
        source: scoreNode.id,
        target: editorNode.id,
        kind: "dataflow",
      });

      const editWorkflow = await buildEditor(
        tools_base_url,
        editType,
        currentVideoUrl,
      );
      const editOut = await runComfyStep(tools, editWorkflow, {
        job_id,
        candidate_id: candidate_spec.id,
        node_id: editorNode.id,
        expected_output_kind: "video",
      });
      currentVideoUrl = editOut.output_url;
      cost += editOut.cost_usd ?? 0.05;

      yield canvasPatch(editorNode.id, {
        status: "complete",
        output_url: currentVideoUrl,
        cost_usd: editOut.cost_usd,
      });

      yield base("candidate.edited", {
        edit_type: editType,
        iteration: i + 1,
        video_url: currentVideoUrl,
      });

      prevNodeId = editorNode.id;
      yield base("candidate.generating", { iteration: i + 1 });
    }

    // -----------------------------------------------------------------
    // Delivery node
    // -----------------------------------------------------------------
    const deliveryNode: CanvasNode = {
      id: nodeId(campaign_id, "delivery", history.length),
      kind: "delivery",
      subtype: "final",
      label: "Deliver",
      x: nextX(),
      y: baseY,
      data: {
        final_video_url: currentVideoUrl,
        score: lastScore?.neural_score ?? 0,
        decision,
        iterations: history.length,
        cost_usd: cost,
      },
    };
    yield canvasNode(deliveryNode);
    yield canvasEdge({
      id: edgeId(prevNodeId, deliveryNode.id),
      source: prevNodeId,
      target: deliveryNode.id,
      kind: "dataflow",
    });

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

async function runComfyStep(
  tools: NucleusToolSet,
  workflow: ComfyWorkflow,
  ctx: {
    job_id: string;
    candidate_id: string;
    node_id: string;
    expected_output_kind: "video" | "audio" | "image";
  },
): Promise<RunComfyUIWorkflowOutput> {
  return tools.run_comfyui_workflow.handler({ workflow, ...ctx });
}

function defaultPrompt(spec: CandidateSpec): string {
  return (
    `Generate a ${spec.platform} ${spec.archetype} ad for ICP=${spec.icp} ` +
    `in ${spec.language}. Variant ${spec.variant_index}.`
  );
}
