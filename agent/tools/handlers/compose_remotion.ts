import type { ComposeRemotionInput, ComposeRemotionOutput } from "../types.js";
import { defineTool, httpToolHandler } from "./define-tool.js";

export const composeRemotionSchema = {
  type: "object",
  required: ["scene_manifest", "template_id"],
  properties: {
    scene_manifest: { type: "object" },
    template_id: { type: "string" },
  },
} as const;

export function buildComposeRemotionTool(toolsBaseUrl: string) {
  return defineTool<ComposeRemotionInput, ComposeRemotionOutput>(
    "compose_remotion",
    "Render a branded composition via the Remotion render-api.",
    composeRemotionSchema,
    httpToolHandler<ComposeRemotionInput, ComposeRemotionOutput>(
      "compose_remotion",
      toolsBaseUrl,
    ),
  );
}
