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
import type { GraphEdgeMeta, GraphNodeMeta } from '@/lib/types';
import { useCanvasStore } from '@/store/canvas-store';
import { Minimap } from '@/components/canvas/Minimap';
import { AudioGenNode } from '@/components/canvas/nodes/AudioGenNode';
import { BrandKBNode } from '@/components/canvas/nodes/BrandKBNode';
import { CompositionNode } from '@/components/canvas/nodes/CompositionNode';
import { DeliveryNode } from '@/components/canvas/nodes/DeliveryNode';
import { EditorNode } from '@/components/canvas/nodes/EditorNode';
import { GroupNode } from '@/components/canvas/nodes/GroupNode';
import { ICPNode } from '@/components/canvas/nodes/ICPNode';
import { ScoringNode } from '@/components/canvas/nodes/ScoringNode';
import { VideoGenNode } from '@/components/canvas/nodes/VideoGenNode';
import { DataFlowEdge } from '@/components/canvas/edges/DataFlowEdge';
import { DependencyEdge } from '@/components/canvas/edges/DependencyEdge';
import { TypedEdge } from '@/components/canvas/edges/TypedEdge';

const nodeTypes: NodeTypes = {
  video_gen: VideoGenNode,
  audio_gen: AudioGenNode,
  composition: CompositionNode,
  scoring: ScoringNode,
  editor: EditorNode,
  brand_kb: BrandKBNode,
  icp: ICPNode,
  delivery: DeliveryNode,
  group: GroupNode,
};

const edgeTypes: EdgeTypes = {
  typed: TypedEdge,
  dataflow: DataFlowEdge,
  dependency: DependencyEdge,
};

interface ArchitectureCanvasProps {
  initialNodes?: GraphNodeMeta[];
  initialEdges?: GraphEdgeMeta[];
}

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

  // Refit the view when node count changes so Ruflo-added nodes stay visible.
  const nodeCount = nodes.length;
  useEffect(() => {
    if (nodeCount === 0) return;
    reactFlow.fitView({ padding: 0.2, duration: 400 });
  }, [nodeCount, reactFlow]);

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

function FlowCanvas({
  initialNodes = [],
  initialEdges = [],
}: ArchitectureCanvasProps) {
  const selectNode = useCanvasStore((state) => state.selectNode);
  const nodePositions = useCanvasStore((state) => state.nodePositions);
  const viewport = useCanvasStore((state) => state.viewport);
  const setViewport = useCanvasStore((state) => state.setViewport);

  const builtNodes = useMemo(
    () => buildCanvasNodes(initialNodes, nodePositions),
    [initialNodes, nodePositions],
  );
  const builtEdges = useMemo(() => buildCanvasEdges(initialEdges), [initialEdges]);

  const [nodes, setNodes] = useNodesState(builtNodes);
  const [edges, setEdges] = useEdgesState(builtEdges);

  useEffect(() => {
    setNodes(builtNodes);
  }, [builtNodes, setNodes]);

  useEffect(() => {
    setEdges(builtEdges);
  }, [builtEdges, setEdges]);

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
        defaultEdgeOptions={{ selectable: false, type: 'typed' }}
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

export function ArchitectureCanvas(props: ArchitectureCanvasProps = {}) {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  );
}
