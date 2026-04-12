/**
 * Nucleus swarm configuration for Ruflo / Claude Flow v3.5.42.
 *
 * The orchestrator is the Queen agent controlling the recursive
 * generate → score → edit loop. Workers handle generation, editing,
 * scoring. The strategist runs post-loop to produce the GTM guide.
 */

import { TOOL_NAMES } from "./tools/registry.js";

export interface NucleusSwarmConfig {
  topology: "hierarchical-mesh";
  queen: string;
  workers: string[];
  postLoop: string[];
  communication: {
    channel: string;
    transport: "redis-pubsub" | "in-process";
  };
  memory: {
    kind: "hnsw";
    dimension: number;
  };
  learning: {
    enabled: boolean;
    reasoningBank: boolean;
  };
  tools: readonly string[];
}

export const NUCLEUS_SWARM: NucleusSwarmConfig = {
  topology: "hierarchical-mesh",
  queen: "orchestrator",
  workers: ["generator", "editor", "scorer"],
  postLoop: ["strategist"],
  communication: {
    channel: "nucleus:job:{job_id}",
    transport: "redis-pubsub",
  },
  memory: {
    kind: "hnsw",
    dimension: 1024,
  },
  learning: {
    enabled: true,
    reasoningBank: true,
  },
  tools: TOOL_NAMES,
};

export default NUCLEUS_SWARM;
