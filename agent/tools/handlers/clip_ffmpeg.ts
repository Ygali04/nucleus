import type { ClipFFmpegInput, ClipFFmpegOutput } from "../types.js";
import { defineTool, httpToolHandler } from "./define-tool.js";

export const clipFFmpegSchema = {
  type: "object",
  required: ["input_url"],
  properties: {
    input_url: { type: "string" },
    start_s: { type: "number" },
    end_s: { type: "number" },
    operations: { type: "array", items: { type: "string" } },
  },
} as const;

export function buildClipFFmpegTool(toolsBaseUrl: string) {
  return defineTool<ClipFFmpegInput, ClipFFmpegOutput>(
    "clip_ffmpeg",
    "Trim, concat, or overlay text on a video via ffmpeg.",
    clipFFmpegSchema,
    httpToolHandler<ClipFFmpegInput, ClipFFmpegOutput>(
      "clip_ffmpeg",
      toolsBaseUrl,
    ),
  );
}
