import type { GenerateAudioInput, GenerateAudioOutput } from "../types.js";
import { defineTool, httpToolHandler } from "./define-tool.js";

export const generateAudioSchema = {
  type: "object",
  required: ["text"],
  properties: {
    text: { type: "string" },
    voice_id: { type: "string" },
    language: { type: "string" },
  },
} as const;

export function buildGenerateAudioTool(toolsBaseUrl: string) {
  return defineTool<GenerateAudioInput, GenerateAudioOutput>(
    "generate_audio",
    "Generate speech from text using ElevenLabs IVC.",
    generateAudioSchema,
    httpToolHandler<GenerateAudioInput, GenerateAudioOutput>(
      "generate_audio",
      toolsBaseUrl,
    ),
  );
}
