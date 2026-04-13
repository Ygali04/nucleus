import type { EditVariantInput, EditVariantOutput } from "../types.js";
import { defineTool, httpToolHandler } from "./define-tool.js";

export const editVariantSchema = {
  type: "object",
  required: ["candidate_id", "edit_type"],
  properties: {
    candidate_id: { type: "string" },
    edit_type: { type: "string" },
    edit_params: { type: "object" },
  },
} as const;

export function buildEditVariantTool(toolsBaseUrl: string) {
  return defineTool<EditVariantInput, EditVariantOutput>(
    "edit_variant",
    "Apply a targeted edit (hook_rewrite, cut_tightening, music_swap, etc.) to a candidate.",
    editVariantSchema,
    httpToolHandler<EditVariantInput, EditVariantOutput>(
      "edit_variant",
      toolsBaseUrl,
    ),
  );
}
