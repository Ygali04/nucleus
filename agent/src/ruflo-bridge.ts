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

import {
  createGlmClient,
  parseGlmJson,
  type GlmClient,
  type GlmMessage,
} from "./glm-client.js";
import { bindToolHandlers, TOOL_REGISTRY } from "../tools/registry.js";
import { httpToolHandler } from "../tools/handlers/define-tool.js";
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
const STARTER_ROW_DY = 220;

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
  const baseY = candidate_spec.variant_index * STARTER_ROW_DY;
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

    // -----------------------------------------------------------------
    // Strategist: fan out to GTM + SOP tools when the candidate actually
    // succeeded. Failures are non-fatal — the UI falls back to the empty
    // state on the Delivery node.
    // -----------------------------------------------------------------
    if (
      decision === "passed_threshold" ||
      decision === "max_iterations" ||
      decision === "cost_ceiling"
    ) {
      const strategyVariant = {
        video_url: currentVideoUrl,
        score: lastScore?.neural_score ?? 0,
        report: {
          breakdown: lastScore?.breakdown ?? {},
          metrics: lastScore?.metrics ?? [],
          key_moments: lastScore?.key_moments ?? [],
          attention_curve: lastScore?.attention_curve ?? [],
          ai_summary: lastScore?.ai_summary,
        },
        cost_usd: cost,
        iteration_count: history.length,
        icp: candidate_spec.icp,
        platform: candidate_spec.platform,
        archetype: candidate_spec.archetype,
        language: candidate_spec.language,
      };

      try {
        const [gtm, sop] = await Promise.all([
          postTool<{ gtm_guide: string; strategy_summary: string }>(
            tools_base_url,
            "generate_gtm_strategy",
            {
              campaign_id,
              variants: [strategyVariant],
            },
          ),
          postTool<{ sop_doc: string }>(tools_base_url, "generate_sop", {
            campaign_id,
            variants: [strategyVariant],
            iterations_log: history.map((s, idx) => ({
              iteration: idx,
              score: s,
            })),
          }),
        ]);

        const deliverables = {
          gtm_guide: gtm.gtm_guide,
          sop_doc: sop.sop_doc,
          strategy_summary: gtm.strategy_summary,
          generated_at: new Date().toISOString(),
        };

        yield canvasPatch(deliveryNode.id, {
          deliverables,
          gtm_ready: true,
        });

        yield {
          event_type: "campaign.deliverables_ready",
          job_id,
          campaign_id,
          candidate_id: candidate_spec.id,
          deliverables,
        };

        const summary =
          `Campaign delivered. ${history.length} iteration(s) (highest: ` +
          `${(lastScore?.neural_score ?? 0).toFixed(1)}). GTM + SOP docs ` +
          "available on the Delivery node.";
        yield {
          event_type: "chat.assistant_message",
          job_id,
          campaign_id,
          candidate_id: candidate_spec.id,
          message: summary,
        };
      } catch (err) {
        yield base("strategist.failed", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

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

function postTool<T>(
  toolsBaseUrl: string,
  toolName: string,
  body: Record<string, unknown>,
): Promise<T> {
  return httpToolHandler<Record<string, unknown>, T>(toolName, toolsBaseUrl)(body);
}

function defaultPrompt(spec: CandidateSpec): string {
  return (
    `Generate a ${spec.platform} ${spec.archetype} ad for ICP=${spec.icp} ` +
    `in ${spec.language}. Variant ${spec.variant_index}.`
  );
}

// ---------------------------------------------------------------------------
// Ruflo "brain" — GLM-backed helpers for initial pass, chat, and ceiling
// ---------------------------------------------------------------------------

/** Canvas node kinds Ruflo can seed on the canvas from a description. */
export const STARTER_NODE_KINDS = [
  "brand_kb",
  "icp",
  "source_video",
  "storyboard",
  "video_gen",
  "audio_gen",
  "composition",
  "scoring",
  "editor",
  "delivery",
  "image_edit",
] as const;

export type StarterNodeKind = (typeof STARTER_NODE_KINDS)[number];

export interface StarterNodeProposal {
  id?: string;
  kind: StarterNodeKind;
  label: string;
  x?: number;
  y?: number;
  data?: Record<string, unknown>;
}

export interface StarterEdgeProposal {
  from: string;
  to: string;
}

export interface StarterGraph {
  nodes: StarterNodeProposal[];
  edges: StarterEdgeProposal[];
  summary?: string;
}

export interface InitialPassInput {
  campaign_id: string;
  description: string;
  archetype?: string;
  brand_name?: string;
}

export interface InitialPassOptions {
  glm?: GlmClient | null;
  /** If true (default: env-driven), skip GLM entirely and use the fallback graph. */
  mock?: boolean;
}

const COL_DX = 280;
// (STARTER_ROW_DY is declared above in the canvas-layout block.)

function isMockMode(opts: { mock?: boolean } = {}): boolean {
  if (opts.mock !== undefined) return opts.mock;
  return (process.env.NUCLEUS_MOCK_PROVIDERS ?? "").toLowerCase() === "true";
}

function starterEvent(
  event_type: string,
  campaign_id: string,
  payload: Record<string, unknown>,
): SwarmEvent {
  return { event_type, job_id: campaign_id, campaign_id, ...payload };
}

/** Default seeded graph used when GLM is unavailable or in mock mode. */
export function fallbackStarterGraph(input: InitialPassInput): StarterGraph {
  const arch = (input.archetype ?? "marketing").toLowerCase();
  const nodes: StarterNodeProposal[] = [
    { id: "brand_kb",   kind: "brand_kb",   label: "Brand KB",     x: 0 * COL_DX, y: 0 * STARTER_ROW_DY, data: { name: input.brand_name ?? "" } },
    { id: "icp",        kind: "icp",        label: "ICP",          x: 0 * COL_DX, y: 1 * STARTER_ROW_DY, data: {} },
    { id: "source",     kind: "source_video", label: "Source",     x: 0 * COL_DX, y: 2 * STARTER_ROW_DY, data: {} },
    { id: "storyboard", kind: "storyboard", label: "Storyboard",   x: 1 * COL_DX, y: 1 * STARTER_ROW_DY, data: { archetype: arch } },
    { id: "video_a",    kind: "video_gen",  label: "Video Variant A", x: 2 * COL_DX, y: 0 * STARTER_ROW_DY, data: { prompt: input.description } },
    { id: "video_b",    kind: "video_gen",  label: "Video Variant B", x: 2 * COL_DX, y: 2 * STARTER_ROW_DY, data: { prompt: input.description } },
    { id: "score_a",    kind: "scoring",    label: "NeuroPeer A",  x: 3 * COL_DX, y: 0 * STARTER_ROW_DY, data: {} },
    { id: "score_b",    kind: "scoring",    label: "NeuroPeer B",  x: 3 * COL_DX, y: 2 * STARTER_ROW_DY, data: {} },
    { id: "delivery",   kind: "delivery",   label: "Delivery",     x: 4 * COL_DX, y: 1 * STARTER_ROW_DY, data: {} },
  ];
  const edges: StarterEdgeProposal[] = [
    { from: "brand_kb",   to: "storyboard" },
    { from: "icp",        to: "storyboard" },
    { from: "source",     to: "storyboard" },
    { from: "storyboard", to: "video_a" },
    { from: "storyboard", to: "video_b" },
    { from: "video_a",    to: "score_a" },
    { from: "video_b",    to: "score_b" },
  ];
  return {
    nodes,
    edges,
    summary:
      `Seeded a ${arch} pipeline with 2 video variants, NeuroPeer scoring, and delivery. ` +
      `Hit Run to start.`,
  };
}

function buildInitialPassPrompt(input: InitialPassInput): string {
  const toolNames = Object.keys(TOOL_REGISTRY).join(", ");
  return [
    `You are Ruflo, the planning brain of the Nucleus ad-generation canvas.`,
    `Given a user's campaign description, propose a starter graph of 6-10 nodes wired into a video pipeline.`,
    ``,
    `Available tools: ${toolNames}.`,
    `Available node kinds: ${STARTER_NODE_KINDS.join(", ")}.`,
    `Archetype hint (optional): ${input.archetype ?? "unspecified"}.`,
    `Brand name (optional): ${input.brand_name ?? "unspecified"}.`,
    ``,
    `Return STRICT JSON only, no commentary, matching this schema:`,
    `{`,
    `  "nodes": [{"id": "string", "kind": "<node kind>", "label": "string", "x": number, "y": number, "data": {}}],`,
    `  "edges": [{"from": "node id", "to": "node id"}],`,
    `  "summary": "1-2 sentence plain-English summary of the graph"`,
    `}`,
    `Positions use a ${COL_DX}px x ${STARTER_ROW_DY}px grid (column * ${COL_DX}, row * ${STARTER_ROW_DY}).`,
    `Wire the graph left-to-right: inputs -> storyboard -> generators -> scorers -> delivery.`,
  ].join("\n");
}

function normalizeStarterGraph(raw: unknown): StarterGraph {
  if (!raw || typeof raw !== "object") throw new Error("non-object starter graph");
  const r = raw as { nodes?: unknown; edges?: unknown; summary?: unknown };
  const nodes = Array.isArray(r.nodes) ? r.nodes : [];
  const edges = Array.isArray(r.edges) ? r.edges : [];
  const allowed = new Set<string>(STARTER_NODE_KINDS);
  const cleanNodes: StarterNodeProposal[] = nodes
    .map((n: unknown, idx: number): StarterNodeProposal | null => {
      if (!n || typeof n !== "object") return null;
      const o = n as Record<string, unknown>;
      const kind = String(o.kind ?? "");
      if (!allowed.has(kind)) return null;
      return {
        id: typeof o.id === "string" ? o.id : `n_${idx}`,
        kind: kind as StarterNodeKind,
        label: typeof o.label === "string" ? o.label : kind,
        x: typeof o.x === "number" ? o.x : (idx % 5) * COL_DX,
        y: typeof o.y === "number" ? o.y : Math.floor(idx / 5) * STARTER_ROW_DY,
        data: (o.data && typeof o.data === "object") ? (o.data as Record<string, unknown>) : {},
      };
    })
    .filter((n): n is StarterNodeProposal => n !== null);
  const cleanEdges: StarterEdgeProposal[] = edges
    .map((e: unknown): StarterEdgeProposal | null => {
      if (!e || typeof e !== "object") return null;
      const o = e as Record<string, unknown>;
      if (typeof o.from !== "string" || typeof o.to !== "string") return null;
      return { from: o.from, to: o.to };
    })
    .filter((e): e is StarterEdgeProposal => e !== null);
  return {
    nodes: cleanNodes,
    edges: cleanEdges,
    summary: typeof r.summary === "string" ? r.summary : undefined,
  };
}

/**
 * Initial pass: translate a campaign description into a starter graph
 * via GLM, streaming canvas events + a chat summary. Falls back to the
 * deterministic seed graph on any failure.
 */
export async function* initialPass(
  input: InitialPassInput,
  opts: InitialPassOptions = {},
): AsyncIterable<SwarmEvent> {
  const { campaign_id } = input;
  const glm = opts.glm === undefined ? createGlmClient() : opts.glm;

  // fallbackReason: null = GLM-sourced graph; string = why we fell back.
  // "mock_mode" and "no_glm_key" are intentional (no user-facing hint needed).
  let graph: StarterGraph;
  let fallbackReason: string | null = null;

  if (isMockMode(opts)) {
    graph = fallbackStarterGraph(input);
    fallbackReason = "mock_mode";
  } else if (glm === null) {
    graph = fallbackStarterGraph(input);
    fallbackReason = "no_glm_key";
  } else {
    yield starterEvent("chat.thinking", campaign_id, { message: "Planning starter graph..." });
    try {
      const raw = await glm.callGLM(
        buildInitialPassPrompt(input),
        [{ role: "user", content: input.description }],
        { responseFormat: "json", temperature: 0.3 },
      );
      graph = normalizeStarterGraph(parseGlmJson(raw));
      if (graph.nodes.length === 0) {
        throw new Error("GLM returned zero nodes");
      }
    } catch (err) {
      fallbackReason = err instanceof Error ? err.message : String(err);
      graph = fallbackStarterGraph(input);
    }
  }

  // Emit canvas events for each starter node and edge.
  const idBySourceId = new Map<string, string>();
  for (const node of graph.nodes) {
    const nid = `${campaign_id}-${node.kind}-${rand4()}`;
    if (node.id) idBySourceId.set(node.id, nid);
    yield starterEvent("canvas.node_added", campaign_id, {
      node: {
        id: nid,
        kind: node.kind,
        subtype: node.kind,
        label: node.label,
        x: node.x ?? 0,
        y: node.y ?? 0,
        data: node.data ?? {},
      },
    });
  }
  for (const edge of graph.edges) {
    const source = idBySourceId.get(edge.from);
    const target = idBySourceId.get(edge.to);
    if (!source || !target) continue;
    yield starterEvent("canvas.edge_added", campaign_id, {
      edge: {
        id: edgeId(source, target),
        source,
        target,
        kind: "dataflow",
      },
    });
  }

  const summary = graph.summary
    ?? `I set up a pipeline with ${graph.nodes.length} nodes. Hit Run to start.`;
  // Only surface "fell back" to the user if the cause was a real error, not a
  // deliberate mock-mode / missing-key config.
  const isRealFallback = fallbackReason !== null
    && fallbackReason !== "mock_mode"
    && fallbackReason !== "no_glm_key";
  const message = isRealFallback
    ? `${summary} (fell back to seed graph: ${fallbackReason})`
    : summary;
  yield starterEvent("chat.assistant_message", campaign_id, {
    message,
    used_fallback: fallbackReason !== null,
  });
}

// ---------------------------------------------------------------------------
// Chat routing
// ---------------------------------------------------------------------------

export interface ChatRouteInput {
  campaign_id: string;
  user_message: string;
  /** Current graph snapshot (nodes/edges) as known by the UI. */
  graph?: { nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>> };
  /** Recent execution events for context. */
  recent_events?: Array<Record<string, unknown>>;
  /** Prior chat turns for multi-turn context. */
  history?: GlmMessage[];
}

export interface ChatRouteOptions {
  glm?: GlmClient | null;
  mock?: boolean;
}

interface ChatAction {
  type: "reply" | "update_node" | "add_node" | "add_edge" | "run_campaign";
  message?: string;
  node_id?: string;
  patch?: Record<string, unknown>;
  node?: StarterNodeProposal;
  source?: string;
  target?: string;
}

function buildChatPrompt(input: ChatRouteInput): string {
  const graphDigest = input.graph
    ? `Current graph: ${input.graph.nodes.length} nodes, ${input.graph.edges.length} edges.`
    : "Current graph: unknown.";
  const evDigest = input.recent_events?.length
    ? `Last ${input.recent_events.length} events: ${input.recent_events
        .slice(-5)
        .map((e) => e.event_type ?? "?")
        .join(", ")}.`
    : "No recent events.";
  return [
    `You are Ruflo, the chat brain of the Nucleus canvas.`,
    `The user is chatting with you about their active campaign graph.`,
    graphDigest,
    evDigest,
    ``,
    `Reply with STRICT JSON, no prose: {"actions": [...]}.`,
    `Each action is one of:`,
    `  {"type": "reply", "message": "..."}`,
    `  {"type": "update_node", "node_id": "...", "patch": {...}}`,
    `  {"type": "add_node", "node": {"kind": "...", "label": "...", "x": n, "y": n, "data": {}}}`,
    `  {"type": "add_edge", "source": "...", "target": "..."}`,
    `  {"type": "run_campaign"}`,
    `Prefer a short natural-language reply action even when you also change the graph.`,
  ].join("\n");
}

function fallbackChatActions(input: ChatRouteInput): ChatAction[] {
  const msg = input.user_message.toLowerCase();
  if (/\b(run|start|go|launch)\b/.test(msg)) {
    return [
      { type: "reply", message: "Starting the campaign now." },
      { type: "run_campaign" },
    ];
  }
  return [
    {
      type: "reply",
      message:
        "Got it — I'll keep that in mind. (GLM isn't reachable so I can't edit the graph autonomously right now.)",
    },
  ];
}

/**
 * Handle one user chat message, emitting canvas + chat events.
 * Falls back to a stub reply when GLM is unavailable.
 */
export async function* runChat(
  input: ChatRouteInput,
  opts: ChatRouteOptions = {},
): AsyncIterable<SwarmEvent> {
  const { campaign_id } = input;
  const glm = opts.glm === undefined ? createGlmClient() : opts.glm;

  let actions: ChatAction[];
  if (isMockMode(opts) || glm === null) {
    actions = fallbackChatActions(input);
  } else {
    yield starterEvent("chat.thinking", campaign_id, { message: "Ruflo is thinking..." });
    try {
      const history = input.history ?? [];
      const raw = await glm.callGLM(
        buildChatPrompt(input),
        [...history, { role: "user", content: input.user_message }],
        { responseFormat: "json", temperature: 0.5 },
      );
      const parsed = parseGlmJson<{ actions?: ChatAction[] }>(raw);
      actions = Array.isArray(parsed.actions) ? parsed.actions : [];
      if (actions.length === 0) {
        actions = [{ type: "reply", message: String(raw).slice(0, 500) }];
      }
    } catch (err) {
      actions = [
        {
          type: "reply",
          message:
            `I couldn't reach my planner (${err instanceof Error ? err.message : String(err)}). ` +
            `Try again in a moment.`,
        },
      ];
    }
  }

  for (const action of actions) {
    switch (action.type) {
      case "reply":
        yield starterEvent("chat.assistant_message", campaign_id, {
          message: action.message ?? "",
        });
        break;
      case "update_node":
        if (action.node_id) {
          yield starterEvent("canvas.node_updated", campaign_id, {
            node_id: action.node_id,
            patch: action.patch ?? {},
          });
        }
        break;
      case "add_node":
        if (action.node && action.node.kind) {
          const nid = `${campaign_id}-${action.node.kind}-${rand4()}`;
          yield starterEvent("canvas.node_added", campaign_id, {
            node: {
              id: nid,
              kind: action.node.kind,
              subtype: action.node.kind,
              label: action.node.label ?? action.node.kind,
              x: action.node.x ?? 0,
              y: action.node.y ?? 0,
              data: action.node.data ?? {},
            },
          });
        }
        break;
      case "add_edge":
        if (action.source && action.target) {
          yield starterEvent("canvas.edge_added", campaign_id, {
            edge: {
              id: edgeId(action.source, action.target),
              source: action.source,
              target: action.target,
              kind: "dataflow",
            },
          });
        }
        break;
      case "run_campaign":
        yield starterEvent("campaign.run_requested", campaign_id, {});
        break;
    }
  }
}

// ---------------------------------------------------------------------------
// Ceiling handling
// ---------------------------------------------------------------------------

export interface CeilingInput {
  campaign_id: string;
  variant_index: number;
  final_score: number;
  threshold: number;
  max_iterations: number;
  last_scoring_node_id: string;
  delivery_node_id: string;
}

/**
 * Emit a chat message + a delivery edge when a variant hits the iteration
 * ceiling without reaching the threshold. Paused: the run-loop should
 * await user input before continuing.
 */
export function* ceilingHit(input: CeilingInput): Iterable<SwarmEvent> {
  const {
    campaign_id,
    variant_index,
    final_score,
    threshold,
    max_iterations,
    last_scoring_node_id,
    delivery_node_id,
  } = input;

  const score = Number.isFinite(final_score) ? final_score.toFixed(1) : "n/a";
  const msg =
    `Variant ${variant_index} hit the ${max_iterations}-iteration ceiling at score ${score} ` +
    `(threshold: ${threshold.toFixed(1)}). I'm sending it to delivery anyway — the GTM guide ` +
    `will note this. Want me to continue iterating, lower the threshold, or accept the current variants?`;

  yield starterEvent("chat.assistant_message", campaign_id, {
    message: msg,
    ceiling_hit: true,
    variant_index,
    final_score,
    threshold,
  });
  yield starterEvent("canvas.edge_added", campaign_id, {
    edge: {
      id: edgeId(last_scoring_node_id, delivery_node_id),
      source: last_scoring_node_id,
      target: delivery_node_id,
      kind: "dataflow",
    },
  });
  yield starterEvent("campaign.paused", campaign_id, {
    reason: "ceiling",
    variant_index,
    final_score,
    threshold,
  });
}
