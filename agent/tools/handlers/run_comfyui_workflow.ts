import type {
  RunComfyUIWorkflowInput,
  RunComfyUIWorkflowOutput,
} from "../types.js";
import { defineTool, httpToolHandler } from "./define-tool.js";

export const runComfyUIWorkflowSchema = {
  type: "object",
  required: ["workflow", "job_id", "candidate_id", "node_id", "expected_output_kind"],
  properties: {
    workflow: { type: "object" },
    job_id: { type: "string" },
    candidate_id: { type: "string" },
    node_id: { type: "string" },
    expected_output_kind: {
      type: "string",
      enum: ["video", "audio", "image"],
    },
  },
} as const;

export function buildRunComfyUIWorkflowTool(toolsBaseUrl: string) {
  return defineTool<RunComfyUIWorkflowInput, RunComfyUIWorkflowOutput>(
    "run_comfyui_workflow",
    "Run an open-weights diffusion or audio workflow (SVD, AnimateDiff, LTX-Video, MusicGen, Whisper) via ComfyUI.",
    runComfyUIWorkflowSchema,
    httpToolHandler<RunComfyUIWorkflowInput, RunComfyUIWorkflowOutput>(
      "run_comfyui_workflow",
      toolsBaseUrl,
    ),
  );
}
