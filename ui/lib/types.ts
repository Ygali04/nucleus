export type AgentPermission = 'reader' | 'analyst' | 'operator' | 'admin';
export type AgentStatus = 'idle' | 'running' | 'error' | 'disabled';
export type TaskStatus = 'pending' | 'active' | 'completed' | 'failed';
export type ActivityType =
  | 'task_started'
  | 'task_completed'
  | 'task_failed'
  | 'thinking'
  | 'tool_call'
  | 'tool_result'
  | 'message_sent'
  | 'message_received'
  | 'iteration'
  | 'reflection'
  | 'error'
  | 'preempted'
  | 'compaction'
  | 'cost';

export type DashboardEventType =
  | 'agent:spawn'
  | 'agent:status'
  | 'agent:iteration'
  | 'tool:call'
  | 'tool:result'
  | 'message:sent'
  | 'message:received'
  | 'task:created'
  | 'task:assigned'
  | 'task:completed'
  | 'task:failed'
  | 'file:write'
  | 'file:read'
  | 'llm:call'
  | 'llm:response'
  | 'llm:error'
  | 'system:info'
  | 'system:error'
  | 'cost:update';

export interface AgentConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  max_iterations: number;
  permissions: AgentPermission;
  tags: string[];
  parent?: string;
}

export interface AgentState {
  status: AgentStatus;
  last_run?: string;
  total_cost_usd: number;
  run_count: number;
  last_error?: string;
  modifications_today: number;
  modifications_date?: string;
}

export interface AgentDefinition {
  id: string;
  prompt: string;
  tools: string[];
  config: AgentConfig;
  state: AgentState;
  memory: string;
  depth: number;
}

export interface Task {
  id: string;
  title: string;
  instruction: string;
  assigned_to?: string;
  created_by: string;
  priority: number;
  required_tools: string[];
  required_tags: string[];
  context: Record<string, unknown>;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  result?: string;
  status: TaskStatus;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  channel?: string;
  content: string;
  timestamp: string;
  type: 'direct' | 'channel' | 'system';
  metadata: Record<string, unknown>;
}

export interface Fact {
  key: string;
  value: unknown;
  claimed_by: string;
  timestamp: string;
  evidence: string;
  verified: boolean;
  ttl_minutes: number;
  supersedes?: string;
}

export interface DashboardEvent {
  type: DashboardEventType;
  timestamp: string;
  agentId?: string;
  data: Record<string, unknown>;
}

export interface ActivityEntry {
  ts: string;
  agent: string;
  type: ActivityType;
  taskId?: string;
  taskTitle?: string;
  data: Record<string, unknown>;
}

export interface CostHistoryPoint {
  timestamp: string;
  cost: number;
  cumulative: number;
  tokens?: number;
  agent?: string;
  provider?: string;
}

export interface StateResponse {
  agents: Array<Record<string, unknown>>;
  pipelineDir: string;
}

export interface TaskQueueColumn {
  file: string;
  status: TaskStatus;
  raw: Task;
}

export interface TaskQueueResponse {
  pending: TaskQueueColumn[];
  active: TaskQueueColumn[];
  completed: TaskQueueColumn[];
  failed?: TaskQueueColumn[];
}

export type GraphNodeKind =
  | 'video_gen'
  | 'audio_gen'
  | 'composition'
  | 'scoring'
  | 'editor'
  | 'brand_kb'
  | 'icp'
  | 'delivery'
  | 'group';

export type NodeExecutionStatus =
  | 'idle'
  | 'queued'
  | 'executing'
  | 'running'
  | 'done'
  | 'failed';

/**
 * Execution-state fields stored on a node's `data` bag to drive visual
 * indicators (progress bar, pulsing ring, timing badge, cached tint).
 * Populated live by the pipeline-events hook.
 */
export interface NodeExecutionState {
  executionStatus?: NodeExecutionStatus;
  progressPercent?: number;
  progressLabel?: string;
  lastExecutionS?: number;
  lastCostUsd?: number;
  cached?: boolean;
}

/** Pipeline-specific metadata attached to the 5 Nucleus node kinds. */
export interface VideoGenNodeData extends NodeExecutionState {
  provider: string;
  prompt: string;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  costUsd: number;
  durationS: number;
  iterationCount?: number;
}

export interface AudioGenNodeData extends NodeExecutionState {
  kind: 'voice' | 'music';
  voiceName?: string;
  language?: string;
  mood?: string;
  text?: string;
  audioUrl: string | null;
  costUsd: number;
  durationS: number;
}

export interface CompositionNodeData extends NodeExecutionState {
  templateId: string;
  sceneCount: number;
  totalDurationS: number;
  renderProgress: number;
  outputUrl: string | null;
}

export interface ScoringNodeData extends NodeExecutionState {
  neuralScore: number | null;
  threshold: number;
  topMetrics: Array<{ name: string; score: number }>;
  iterationCount: number;
  scoreDelta: number | null;
}

export interface EditorNodeData extends NodeExecutionState {
  editType: string;
  targetStartS: number;
  targetEndS: number;
  beforeScore: number;
  afterScore: number | null;
  costUsd: number;
}

export interface BrandKBNodeData extends NodeExecutionState {
  brandName: string;
  voiceTone: string[];
  docCount: number;
}

export interface ICPNodeData extends NodeExecutionState {
  personaName: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | string;
  painPoint: string;
}

export interface DeliveryNodeData extends NodeExecutionState {
  variantCount: number;
  exportFormats: string[];
  cdnUrl: string | null;
  badgeText?: string;
}

export interface GraphNodeMeta {
  id: string;
  label: string;
  kind: GraphNodeKind;
  subtype?: string;
  status: 'active' | 'warning' | 'error' | 'idle' | 'new';
  statusText: string;
  metaTag?: string | null;
  parentId?: string | null;
  x: number;
  y: number;
  width?: number;
  height?: number;
  data?: Record<string, unknown>;
}

export interface GraphEdgeMeta {
  id: string;
  source: string;
  target: string;
  kind: 'dataflow' | 'dependency';
  animated?: boolean;
  label?: string;
  sourceHandle?: string;
  targetHandle?: string;
  data?: Record<string, unknown>;
}

export interface NodeMetrics {
  tasksToday: number;
  avgDuration: string;
  costToday: number;
  tokens: number;
  factCount: number;
  vectorEntries: number;
  lastLearned: string;
}

export interface AgentDetailModel {
  id: string;
  title: string;
  typeLabel: string;
  status: string;
  statusTone: GraphNodeMeta['status'];
  lastActivity: string;
  metrics: NodeMetrics;
  recentTasks: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    timestamp: string;
  }>;
  config: {
    model: string;
    permission: AgentPermission;
    maxIterations: number;
    tags: string[];
  };
}

export interface WebSocketHistoryMessage {
  type: 'history';
  events: DashboardEvent[];
}

export interface WebSocketEventMessage {
  type: 'event';
  event: DashboardEvent;
}

export type DashboardSocketMessage =
  | WebSocketHistoryMessage
  | WebSocketEventMessage;

export type CampaignArchetype =
  | 'demo'
  | 'marketing'
  | 'knowledge'
  | 'education';

export type CampaignStatus = 'idle' | 'running' | 'scored' | 'failed';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface CampaignBrief {
  goal?: string;
  audience?: string;
  tone?: string;
  notes?: string;
  description?: string;
  chat_history?: ChatMessage[];
}

// --- NeuroPeer report types (mirror backend/models/schemas.py) --------------

export interface NeuralScoreBreakdown {
  total: number;
  hook_score: number;
  sustained_attention: number;
  emotional_resonance: number;
  memory_encoding: number;
  aesthetic_quality: number;
  cognitive_accessibility: number;
}

export interface MetricScore {
  name: string;
  score: number;
  raw_value: number;
  description: string;
  brain_region: string;
  gtm_proxy: string;
}

export type KeyMomentType =
  | 'best_hook'
  | 'peak_engagement'
  | 'emotional_peak'
  | 'dropoff_risk'
  | 'recovery';

export interface KeyMoment {
  timestamp: number;
  type: KeyMomentType;
  label: string;
  score: number;
}

export interface ModalityContribution {
  timestamp: number;
  visual: number;
  audio: number;
  text: number;
}

export interface NeuroPeerReport {
  job_id: string;
  neural_score: NeuralScoreBreakdown;
  attention_curve: number[];
  emotional_arousal_curve: number[];
  cognitive_load_curve: number[];
  metrics: MetricScore[];
  key_moments: KeyMoment[];
  modality_breakdown: ModalityContribution[];
  ai_summary: string;
  ai_action_items: string[];
  ai_report_title: string;
  parent_job_id?: string;
  content_group_id?: string;
}

export type NeuralDimensionKey = keyof Omit<NeuralScoreBreakdown, 'total'>;

export const NEURAL_DIMENSIONS: ReadonlyArray<{
  key: NeuralDimensionKey;
  label: string;
}> = [
  { key: 'hook_score', label: 'Hook' },
  { key: 'sustained_attention', label: 'Sustained Attention' },
  { key: 'emotional_resonance', label: 'Emotional Resonance' },
  { key: 'memory_encoding', label: 'Memory Encoding' },
  { key: 'aesthetic_quality', label: 'Aesthetic Quality' },
  { key: 'cognitive_accessibility', label: 'Cognitive Accessibility' },
];

export interface PipelineEvent {
  id: string;
  timestamp: string;
  campaignId?: string;
  eventType: string;
  severity?: 'info' | 'warn' | 'error';
  candidateIndex?: number;
  iterationIndex?: number;
  message?: string;
  payload?: Record<string, unknown>;
}

export type PipelineEventSeverity = 'info' | 'warn' | 'error';

export type { Campaign } from '@/lib/api-client';
