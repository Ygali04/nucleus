import type { Edge, Node } from '@xyflow/react';
import { dummyGraphEdges, dummyGraphNodes } from '@/fixtures/graph-nodes';
import type {
  AgentDefinition,
  GraphEdgeMeta,
  GraphNodeMeta,
} from '@/lib/types';

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  kind: GraphNodeMeta['kind'];
  subtype?: string;
  status: GraphNodeMeta['status'];
  statusText: string;
  metaTag?: string | null;
  campaignId?: string | null;
  data?: Record<string, unknown>;
}

const KIND_TO_NODE_TYPE: Record<GraphNodeMeta['kind'], string> = {
  agent: 'agent',
  database: 'database',
  scheduler: 'scheduler',
  gateway: 'gateway',
  service: 'service',
  group: 'group',
  video_gen: 'video_gen',
  audio_gen: 'audio_gen',
  composition: 'composition',
  scoring: 'scoring',
  editor: 'editor',
  brand_kb: 'brand_kb',
  icp: 'icp',
  delivery: 'delivery',
};

function nodeTypeForKind(kind: GraphNodeMeta['kind']): string {
  return KIND_TO_NODE_TYPE[kind] ?? 'agent';
}

function toneFromAgentStatus(
  status: AgentDefinition['state']['status'],
): GraphNodeMeta['status'] {
  if (status === 'running') return 'active';
  if (status === 'error') return 'error';
  if (status === 'disabled') return 'idle';
  return 'idle';
}

function statusTextFromAgent(agent: AgentDefinition) {
  if (agent.state.status === 'running') return 'Agent active';
  if (agent.state.last_error) return agent.state.last_error;
  return 'Standing by';
}

function computeSpawnLayout(
  agents: AgentDefinition[],
  positionOverrides: Record<string, { x: number; y: number }>,
) {
  const positions = new Map<string, { x: number; y: number }>();
  const rootBase = positionOverrides.root || { x: 510, y: 250 };
  positions.set('root', rootBase);

  const childrenByParent = new Map<string | null, AgentDefinition[]>();

  for (const agent of agents) {
    const parent = agent.config.parent ?? null;
    const list = childrenByParent.get(parent) || [];
    list.push(agent);
    childrenByParent.set(parent, list);
  }

  for (const list of childrenByParent.values()) {
    list.sort((a, b) => a.id.localeCompare(b.id));
  }

  const topLevel = (childrenByParent.get(null) || []).filter(
    (agent) => agent.id !== 'root',
  );
  topLevel.forEach((agent, index) => {
    if (!positions.has(agent.id)) {
      positions.set(
        agent.id,
        positionOverrides[agent.id] || { x: 1080, y: 220 + index * 110 },
      );
    }
  });

  const queue = ['root'];
  while (queue.length > 0) {
    const parentId = queue.shift()!;
    const siblings = childrenByParent.get(parentId) || [];
    const parentPos = positions.get(parentId) || rootBase;

    siblings.forEach((agent, index) => {
      if (positions.has(agent.id)) {
        queue.push(agent.id);
        return;
      }

      const columnX = Math.max(40, parentPos.x - 260);
      const rowY =
        parentId === 'root'
          ? 180 + index * 110
          : parentPos.y + (index + 1) * 95;
      positions.set(
        agent.id,
        positionOverrides[agent.id] || { x: columnX, y: rowY },
      );
      queue.push(agent.id);
    });
  }

  return positions;
}

export function buildCanvasNodes(
  positionOverrides: Record<string, { x: number; y: number }> = {},
  runtimeAgents: AgentDefinition[] = [],
  customNodes: GraphNodeMeta[] = [],
): Node<CanvasNodeData>[] {
  const baseNodes = dummyGraphNodes.map((node) => ({
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
        ? {
            width: node.width,
            height: node.height,
          }
        : undefined,
  }));

  const knownIds = new Set(baseNodes.map((node) => node.id));
  const spawnLayout = computeSpawnLayout(runtimeAgents, positionOverrides);

  const runtimeNodes = runtimeAgents
    .filter((agent) => !knownIds.has(agent.id))
    .map((agent) => {
      const pos = spawnLayout.get(agent.id) ||
        positionOverrides[agent.id] || { x: 260, y: 220 };
      return {
        id: agent.id,
        type: 'agent',
        position: pos,
        data: {
          label: agent.id.replace(/-/g, ' '),
          kind: 'agent' as const,
          subtype:
            agent.id === 'root'
              ? 'orchestrator'
              : agent.config.tags[0] || 'analyst',
          status: toneFromAgentStatus(agent.state.status),
          statusText: statusTextFromAgent(agent),
          metaTag: agent.config.model,
          data: {
            depth: agent.depth,
            parent: agent.config.parent,
          },
        },
        draggable: true,
        selectable: true,
        connectable: false,
      } satisfies Node<CanvasNodeData>;
    });

  const overlayNodes = customNodes
    .filter((node) => !knownIds.has(node.id))
    .map((node) => ({
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
      draggable: false,
      selectable: true,
      connectable: false,
      width: node.width,
      height: node.height,
      style:
        node.kind === 'group'
          ? {
              width: node.width,
              height: node.height,
            }
          : undefined,
    }) satisfies Node<CanvasNodeData>);

  return [...baseNodes, ...runtimeNodes, ...overlayNodes];
}

export function buildCanvasEdges(): Edge[] {
  return dummyGraphEdges.map((edge: GraphEdgeMeta) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.kind,
    animated: edge.animated,
    data: { label: edge.label },
  }));
}
