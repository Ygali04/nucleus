import type { Edge, Node } from '@xyflow/react';
import type { GraphEdgeMeta, GraphNodeMeta } from '@/lib/types';

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  kind: GraphNodeMeta['kind'];
  subtype?: string;
  status: GraphNodeMeta['status'];
  statusText: string;
  metaTag?: string | null;
  data?: Record<string, unknown>;
}

const KIND_TO_NODE_TYPE: Record<GraphNodeMeta['kind'], string> = {
  video_gen: 'video_gen',
  audio_gen: 'audio_gen',
  composition: 'composition',
  scoring: 'scoring',
  editor: 'editor',
  brand_kb: 'brand_kb',
  icp: 'icp',
  delivery: 'delivery',
  group: 'group',
};

function nodeTypeForKind(kind: GraphNodeMeta['kind']): string {
  return KIND_TO_NODE_TYPE[kind] ?? 'video_gen';
}

export function buildCanvasNodes(
  graphNodes: GraphNodeMeta[] = [],
  positionOverrides: Record<string, { x: number; y: number }> = {},
): Node<CanvasNodeData>[] {
  return graphNodes.map((node) => ({
    id: node.id,
    type: nodeTypeForKind(node.kind),
    position: positionOverrides[node.id] || { x: node.x, y: node.y },
    data: {
      label: node.label,
      kind: node.kind,
      subtype: node.subtype,
      status: node.status,
      statusText: node.statusText,
      metaTag: node.metaTag,
      data: node.data,
    },
    parentId: node.parentId || undefined,
    draggable: node.kind !== 'group',
    selectable: true,
    connectable: false,
    width: node.width,
    height: node.height,
    style:
      node.kind === 'group'
        ? { width: node.width, height: node.height }
        : undefined,
  }));
}

export function buildCanvasEdges(graphEdges: GraphEdgeMeta[] = []): Edge[] {
  return graphEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: edge.kind === 'dataflow' ? 'typed' : edge.kind,
    animated: edge.animated,
    data: { label: edge.label, ...(edge.data ?? {}) },
  }));
}
