/**
 * Builds the full handler set for the Nucleus swarm against a given
 * `toolsBaseUrl` (the Python backend that actually executes each tool).
 *
 * The Ruflo bridge calls `buildToolHandlers()` at swarm start so every
 * tool invocation fans out to `{toolsBaseUrl}/api/v1/tools/{name}`.
 */

import type { ToolName, ToolTypeMap } from "../types.js";
import { buildClipFFmpegTool } from "./clip_ffmpeg.js";
import { buildComposeRemotionTool } from "./compose_remotion.js";
import type { ToolDefinition } from "./define-tool.js";
import { buildEditVariantTool } from "./edit_variant.js";
import { buildGenerateAudioTool } from "./generate_audio.js";
import { buildGenerateMusicTool } from "./generate_music.js";
import { buildGenerateVideoTool } from "./generate_video.js";
import { buildScoreNeuroPeerTool } from "./score_neuropeer.js";

export type NucleusToolSet = {
  [K in ToolName]: ToolDefinition<ToolTypeMap[K]["input"], ToolTypeMap[K]["output"]>;
};

export function buildToolHandlers(toolsBaseUrl: string): NucleusToolSet {
  return {
    generate_video: buildGenerateVideoTool(toolsBaseUrl),
    generate_audio: buildGenerateAudioTool(toolsBaseUrl),
    generate_music: buildGenerateMusicTool(toolsBaseUrl),
    compose_remotion: buildComposeRemotionTool(toolsBaseUrl),
    clip_ffmpeg: buildClipFFmpegTool(toolsBaseUrl),
    score_neuropeer: buildScoreNeuroPeerTool(toolsBaseUrl),
    edit_variant: buildEditVariantTool(toolsBaseUrl),
  };
}

export type { ToolDefinition } from "./define-tool.js";
