import type { GraphEdgeMeta, GraphNodeMeta } from '@/lib/types';

// Campaign graphs now come from campaign-archetypes.ts, seeded per-campaign.
// These empty arrays exist so any legacy import sites continue to compile.
export const emptyGraphNodes: GraphNodeMeta[] = [];
export const emptyGraphEdges: GraphEdgeMeta[] = [];

export const dummyGraphNodes = emptyGraphNodes;
export const dummyGraphEdges = emptyGraphEdges;
