/**
 * TypeScript types for the 7 Nucleus agent tools.
 * These match the Pydantic schemas in backend/nucleus/tools/schemas.py.
 */

// --- generate_video ---
export interface GenerateVideoInput {
  prompt: string;
  duration_s: number;
  provider?: string;
  aspect_ratio?: string;
  reference_image?: string;
}
export interface GenerateVideoOutput {
  video_url: string;
  cost_usd: number;
  provider_job_id: string;
  duration_s: number;
  provider: string;
}

// --- generate_audio ---
export interface GenerateAudioInput {
  text: string;
  voice_id?: string;
  language?: string;
}
export interface GenerateAudioOutput {
  audio_url: string;
  cost_usd: number;
  duration_s: number;
}

// --- generate_music ---
export interface GenerateMusicInput {
  prompt: string;
  duration_s: number;
  mood?: string;
}
export interface GenerateMusicOutput {
  audio_url: string;
  cost_usd: number;
}

// --- compose_remotion ---
export interface ComposeRemotionInput {
  scene_manifest: Record<string, unknown>;
  template_id: string;
}
export interface ComposeRemotionOutput {
  video_url: string;
  cost_usd: number;
  duration_s: number;
}

// --- clip_ffmpeg ---
export interface ClipFFmpegInput {
  input_url: string;
  start_s?: number;
  end_s?: number;
  operations?: string[];
}
export interface ClipFFmpegOutput {
  video_url: string;
}

// --- score_neuropeer ---
export interface ScoreNeuroPeerInput {
  video_url: string;
  content_type?: string;
  parent_job_id?: string;
  slice_start?: number;
  slice_end?: number;
}
export interface ScoreNeuroPeerOutput {
  job_id: string;
  neural_score: number;
  breakdown: Record<string, number>;
  metrics: Array<Record<string, unknown>>;
  key_moments: Array<Record<string, unknown>>;
  attention_curve: number[];
  ai_summary?: string;
  ai_action_items?: string[];
}

// --- edit_variant ---
export type EditType =
  | "hook_rewrite"
  | "cut_tightening"
  | "music_swap"
  | "pacing_change"
  | "narration_rewrite"
  | "visual_substitution"
  | "caption_emphasis"
  | "icp_reanchor";

export interface EditVariantInput {
  candidate_id: string;
  edit_type: EditType;
  edit_params?: Record<string, unknown>;
}
export interface EditVariantOutput {
  new_iteration_id: string;
  video_url: string;
  cost_usd: number;
  edit_applied: string;
}

// --- run_comfyui_workflow ---
export interface RunComfyUIWorkflowInput {
  workflow: Record<string, unknown>;
  job_id: string;
  candidate_id: string;
  node_id: string;
  expected_output_kind: "video" | "audio" | "image";
}
export interface RunComfyUIWorkflowOutput {
  output_url: string;
  cost_usd: number;
  duration_s: number;
}

// --- tool type map ---
export interface ToolTypeMap {
  generate_video: { input: GenerateVideoInput; output: GenerateVideoOutput };
  generate_audio: { input: GenerateAudioInput; output: GenerateAudioOutput };
  generate_music: { input: GenerateMusicInput; output: GenerateMusicOutput };
  compose_remotion: { input: ComposeRemotionInput; output: ComposeRemotionOutput };
  clip_ffmpeg: { input: ClipFFmpegInput; output: ClipFFmpegOutput };
  score_neuropeer: { input: ScoreNeuroPeerInput; output: ScoreNeuroPeerOutput };
  edit_variant: { input: EditVariantInput; output: EditVariantOutput };
  run_comfyui_workflow: {
    input: RunComfyUIWorkflowInput;
    output: RunComfyUIWorkflowOutput;
  };
}

export type ToolName = keyof ToolTypeMap;
