import type { ScoreNeuroPeerInput, ScoreNeuroPeerOutput } from "../types.js";
import { defineTool, httpToolHandler } from "./define-tool.js";

export const scoreNeuroPeerSchema = {
  type: "object",
  required: ["video_url"],
  properties: {
    video_url: { type: "string" },
    content_type: { type: "string" },
    parent_job_id: { type: "string" },
    slice_start: { type: "number" },
    slice_end: { type: "number" },
  },
} as const;

export function buildScoreNeuroPeerTool(toolsBaseUrl: string) {
  return defineTool<ScoreNeuroPeerInput, ScoreNeuroPeerOutput>(
    "score_neuropeer",
    "Score a video variant with the TRIBE v2 neural model via NeuroPeer.",
    scoreNeuroPeerSchema,
    httpToolHandler<ScoreNeuroPeerInput, ScoreNeuroPeerOutput>(
      "score_neuropeer",
      toolsBaseUrl,
    ),
  );
}
