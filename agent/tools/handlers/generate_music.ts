import type { GenerateMusicInput, GenerateMusicOutput } from "../types.js";
import { defineTool, httpToolHandler } from "./define-tool.js";

export const generateMusicSchema = {
  type: "object",
  required: ["prompt", "duration_s"],
  properties: {
    prompt: { type: "string" },
    duration_s: { type: "number" },
    mood: { type: "string" },
  },
} as const;

export function buildGenerateMusicTool(toolsBaseUrl: string) {
  return defineTool<GenerateMusicInput, GenerateMusicOutput>(
    "generate_music",
    "Generate background music via Google Lyria.",
    generateMusicSchema,
    httpToolHandler<GenerateMusicInput, GenerateMusicOutput>(
      "generate_music",
      toolsBaseUrl,
    ),
  );
}
