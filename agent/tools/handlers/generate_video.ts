import type { GenerateVideoInput, GenerateVideoOutput } from "../types.js";
import { defineTool, httpToolHandler } from "./define-tool.js";

export const generateVideoSchema = {
  type: "object",
  required: ["prompt", "duration_s"],
  properties: {
    prompt: { type: "string" },
    duration_s: { type: "number" },
    provider: { type: "string" },
    aspect_ratio: { type: "string" },
    reference_image: { type: "string" },
  },
} as const;

export function buildGenerateVideoTool(toolsBaseUrl: string) {
  return defineTool<GenerateVideoInput, GenerateVideoOutput>(
    "generate_video",
    "Generate a video clip from a text prompt via Kling, Seedance, or MagiHuman.",
    generateVideoSchema,
    httpToolHandler<GenerateVideoInput, GenerateVideoOutput>(
      "generate_video",
      toolsBaseUrl,
    ),
  );
}
