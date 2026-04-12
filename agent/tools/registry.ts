/**
 * Tool registry — maps tool names to their backend HTTP endpoints.
 * The Ruflo orchestrator invokes tools by calling POST on these URLs.
 */

import type { ToolName, ToolTypeMap } from "./types.js";

const BACKEND_URL = process.env.NUCLEUS_BACKEND_URL ?? "http://localhost:8000";

interface RegistryEntry {
  name: ToolName;
  endpoint: string;
  description: string;
}

export const TOOL_REGISTRY: Record<ToolName, RegistryEntry> = {
  generate_video: {
    name: "generate_video",
    endpoint: `${BACKEND_URL}/api/v1/tools/generate_video`,
    description:
      "Generate a video clip from a text prompt via Kling, Seedance, or MagiHuman.",
  },
  generate_audio: {
    name: "generate_audio",
    endpoint: `${BACKEND_URL}/api/v1/tools/generate_audio`,
    description: "Generate speech from text using ElevenLabs IVC.",
  },
  generate_music: {
    name: "generate_music",
    endpoint: `${BACKEND_URL}/api/v1/tools/generate_music`,
    description: "Generate background music via Google Lyria.",
  },
  compose_remotion: {
    name: "compose_remotion",
    endpoint: `${BACKEND_URL}/api/v1/tools/compose_remotion`,
    description: "Render a branded composition via the Remotion render-api.",
  },
  clip_ffmpeg: {
    name: "clip_ffmpeg",
    endpoint: `${BACKEND_URL}/api/v1/tools/clip_ffmpeg`,
    description: "Trim, concat, or overlay text on a video via ffmpeg.",
  },
  score_neuropeer: {
    name: "score_neuropeer",
    endpoint: `${BACKEND_URL}/api/v1/tools/score_neuropeer`,
    description:
      "Score a video variant with the TRIBE v2 neural model via NeuroPeer.",
  },
  edit_variant: {
    name: "edit_variant",
    endpoint: `${BACKEND_URL}/api/v1/tools/edit_variant`,
    description:
      "Apply a targeted edit (hook_rewrite, cut_tightening, music_swap, etc.) to a candidate.",
  },
};

/** Type-safe tool invocation helper. */
export async function callTool<T extends ToolName>(
  name: T,
  input: ToolTypeMap[T]["input"],
): Promise<ToolTypeMap[T]["output"]> {
  const entry = TOOL_REGISTRY[name];
  const res = await fetch(entry.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Tool ${name} failed: ${res.status} ${body}`);
  }
  return (await res.json()) as ToolTypeMap[T]["output"];
}

export const TOOL_NAMES: readonly ToolName[] = Object.keys(TOOL_REGISTRY) as ToolName[];
