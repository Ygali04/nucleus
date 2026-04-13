'use client';

import { useEffect, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Node,
  type NodeChange,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import {
  buildCanvasEdges,
  buildCanvasNodes,
  type CanvasNodeData,
} from '@/lib/graph-layout';
import { useCanvasStore } from '@/store/canvas-store';
import { useDashboardStore } from '@/store/dashboard-store';
import { Minimap } from '@/components/canvas/Minimap';
import { AgentNode } from '@/components/canvas/nodes/AgentNode';
import { AudioGenNode } from '@/components/canvas/nodes/AudioGenNode';
import { BrandKBNode } from '@/components/canvas/nodes/BrandKBNode';
import { CompositionNode } from '@/components/canvas/nodes/CompositionNode';
import { DatabaseNode } from '@/components/canvas/nodes/DatabaseNode';
import { DeliveryNode } from '@/components/canvas/nodes/DeliveryNode';
import { EditorNode } from '@/components/canvas/nodes/EditorNode';
import { GatewayNode } from '@/components/canvas/nodes/GatewayNode';
import { GroupNode } from '@/components/canvas/nodes/GroupNode';
import { ICPNode } from '@/components/canvas/nodes/ICPNode';
import { SchedulerNode } from '@/components/canvas/nodes/SchedulerNode';
import { ScoringNode } from '@/components/canvas/nodes/ScoringNode';
import { ServiceNode } from '@/components/canvas/nodes/ServiceNode';
import { VideoGenNode } from '@/components/canvas/nodes/VideoGenNode';
import { DataFlowEdge } from '@/components/canvas/edges/DataFlowEdge';
import { DependencyEdge } from '@/components/canvas/edges/DependencyEdge';

const nodeTypes: NodeTypes = {
  agent: AgentNode,
  database: DatabaseNode,
  scheduler: SchedulerNode,
  gateway: GatewayNode,
  service: ServiceNode,
  group: GroupNode,
  video_gen: VideoGenNode,
  audio_gen: AudioGenNode,
  composition: CompositionNode,
  scoring: ScoringNode,
  editor: EditorNode,
  brand_kb: BrandKBNode,
  icp: ICPNode,
  delivery: DeliveryNode,
};

const edgeTypes: EdgeTypes = {
  dataflow: DataFlowEdge,
  dependency: DependencyEdge,
};

function FlowSync({
  nodes,
  setNodes,
}: {
  nodes: Node<CanvasNodeData>[];
  setNodes: Dispatch<SetStateAction<Node<CanvasNodeData>[]>>;
}) {
  const reactFlow = useReactFlow();
  const highlightedNodeId = useCanvasStore((state) => state.highlightedNodeId);
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const viewport = useCanvasStore((state) => state.viewport);

  useEffect(() => {
    if (!highlightedNodeId) return;
    const target = nodes.find((node) => node.id === highlightedNodeId);
    if (!target) return;

    reactFlow.setCenter(target.position.x + 120, target.position.y + 60, {
      zoom: 1.1,
      duration: 500,
    });
  }, [highlightedNodeId, nodes, reactFlow]);

  useEffect(() => {
    setNodes((current) =>
      current.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      })),
    );
  }, [selectedNodeId, setNodes]);

  useEffect(() => {
    reactFlow.setViewport(viewport, { duration: 0 });
  }, [reactFlow, viewport]);

  return null;
}

function FlowCanvas() {
  const agents = useDashboardStore((state) => state.agents);
  const customNodes = useDashboardStore((state) => state.customNodes);
  const selectNode = useCanvasStore((state) => state.selectNode);
  const nodePositions = useCanvasStore((state) => state.nodePositions);
  const viewport = useCanvasStore((state) => state.viewport);
  const setViewport = useCanvasStore((state) => state.setViewport);

  const nodesWithRuntime = useMemo(() => {
    const runtimeMap = new Map(
      agents.map((agent) => [
        agent.id,
        {
          status:
            agent.state.status === 'running'
              ? 'active'
              : agent.state.status === 'error'
                ? 'error'
                : agent.state.status === 'disabled'
                  ? 'idle'
                  : 'idle',
          statusText:
            agent.state.status === 'running'
              ? 'Agent active'
              : agent.state.last_error || 'Standing by',
          metaTag: agent.config.model,
        },
      ]),
    );

    return buildCanvasNodes(nodePositions, agents, customNodes).map((node) => {
      const runtime = runtimeMap.get(node.id);
      if (!runtime) return node;

      return {
        ...node,
        data: {
          ...node.data,
          status: runtime.status,
          statusText: runtime.statusText,
          metaTag: node.data.metaTag || runtime.metaTag,
        },
      };
    }) as Node<CanvasNodeData>[];
  }, [agents, customNodes, nodePositions]);

  const [nodes, setNodes] = useNodesState(nodesWithRuntime);
  const [edges] = useEdgesState(buildCanvasEdges());

  useEffect(() => {
    setNodes(nodesWithRuntime);
  }, [nodesWithRuntime, setNodes]);

  const onNodesChange = (changes: NodeChange[]) => {
    setNodes(
      (current) => applyNodeChanges(changes, current) as Node<CanvasNodeData>[],
    );
  };

  return (
    <div className="relative h-[calc(100vh-92px)] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        proOptions={{ hideAttribution: true }}
        fitView
        minZoom={0.35}
        maxZoom={1.8}
        nodesDraggable={false}
        onNodesChange={onNodesChange}
        onNodeClick={(_, node) => selectNode(node.id)}
        defaultViewport={viewport}
        onMoveEnd={(_, nextViewport) => {
          setViewport({
            x: nextViewport.x,
            y: nextViewport.y,
            zoom: nextViewport.zoom,
          });
        }}
        defaultEdgeOptions={{ selectable: false }}
      >
        <Background gap={20} size={1} color="rgba(26,26,26,0.05)" />
        <Controls
          position="top-left"
          showInteractive={false}
          className="!rounded-xl !border !border-black/10 !bg-white/90 !shadow-sm"
        />
        <div className="pointer-events-none absolute bottom-5 left-5 z-10">
          <div className="pointer-events-auto">
            <Minimap />
          </div>
        </div>
        <FlowSync nodes={nodes} setNodes={setNodes} />
      </ReactFlow>
    </div>
  );
}

export function ArchitectureCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
