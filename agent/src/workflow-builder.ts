/**
 * Workflow builder — thin client around the backend's
 * POST /api/v1/tools/build_workflow translator endpoint.
 *
 * Ruflo uses these helpers to turn "I want a kling clip of X" into a
 * concrete ComfyUI workflow dict it can hand to `tools.run_comfyui_workflow`.
 */

export type VideoSubtype =
  | "kling"
  | "seedance"
  | "veo"
  | "runway"
  | "luma"
  | "hailuo"
  | "svd"
  | "animatediff"
  | "ltxv";

export type AudioSubtype = "elevenlabs" | "stable_audio";

export type EditOp =
  | "hook_rewrite"
  | "cut_tightening"
  | "music_swap"
  | "pacing_change"
  | "narration_rewrite"
  | "visual_substitution"
  | "caption_emphasis"
  | "icp_reanchor";

export type ComfyWorkflow = Record<string, { class_type: string; inputs: Record<string, unknown> }>;

interface BuildWorkflowResponse {
  kind: string;
  subtype: string;
  workflow: ComfyWorkflow;
}

interface VideoOpts {
  aspectRatio?: string;
  referenceImageUrl?: string;
}

async function callBuildWorkflow(
  toolsBaseUrl: string,
  body: Record<string, unknown>,
): Promise<ComfyWorkflow> {
  const url = `${toolsBaseUrl.replace(/\/$/, "")}/api/v1/tools/build_workflow`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`build_workflow ${res.status}: ${text}`);
  }
  const data = (await res.json()) as BuildWorkflowResponse;
  return data.workflow;
}

export async function buildVideoWorkflow(
  toolsBaseUrl: string,
  subtype: VideoSubtype,
  prompt: string,
  durationS: number,
  opts: VideoOpts = {},
): Promise<ComfyWorkflow> {
  return callBuildWorkflow(toolsBaseUrl, {
    kind: "video",
    subtype,
    prompt,
    duration_s: durationS,
    aspect_ratio: opts.aspectRatio ?? "16:9",
    reference_image_url: opts.referenceImageUrl ?? null,
  });
}

export async function buildAudioWorkflow(
  toolsBaseUrl: string,
  subtype: AudioSubtype,
  prompt: string,
  durationS: number,
): Promise<ComfyWorkflow> {
  return callBuildWorkflow(toolsBaseUrl, {
    kind: "audio",
    subtype,
    prompt,
    duration_s: durationS,
  });
}

export async function buildEditorWorkflow(
  toolsBaseUrl: string,
  editType: EditOp,
  sourceVideoUrl: string,
  targetStartS?: number,
  targetEndS?: number,
  sourceAudioUrl?: string,
): Promise<ComfyWorkflow> {
  return callBuildWorkflow(toolsBaseUrl, {
    kind: "edit",
    subtype: editType,
    edit_type: editType,
    source_video_url: sourceVideoUrl,
    source_audio_url: sourceAudioUrl ?? null,
    target_start_s: targetStartS ?? null,
    target_end_s: targetEndS ?? null,
  });
}
