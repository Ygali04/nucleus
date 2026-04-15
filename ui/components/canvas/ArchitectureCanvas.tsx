'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  reconnectEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import { useCampaignsStore } from '@/store/campaigns-store';
import { useSearchParams } from 'next/navigation';
import {
  buildCanvasEdges,
  buildCanvasNodes,
  type CanvasNodeData,
} from '@/lib/graph-layout';
import type { GraphEdgeMeta, GraphNodeMeta } from '@/lib/types';
import { NODE_IO_MAP, type NodeDataType } from '@/lib/node-data-types';
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
import { SourceVideoNode } from '@/components/canvas/nodes/SourceVideoNode';
import { StoryboardNode } from '@/components/canvas/nodes/StoryboardNode';
import { ImageEditNode } from '@/components/canvas/nodes/ImageEditNode';
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
  source_video: SourceVideoNode,
  storyboard: StoryboardNode,
  image_edit: ImageEditNode,
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
  const setNodePosition = useCanvasStore((state) => state.setNodePosition);
  const viewport = useCanvasStore((state) => state.viewport);
  const setViewport = useCanvasStore((state) => state.setViewport);

  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaign');
  const storeAddEdge = useCampaignsStore((s) => s.addEdge);
  const storeUpdateCampaign = useCampaignsStore((s) => s.updateCampaign);
  const updateNodeData = useCampaignsStore((s) => s.updateNodeData);
  const openNodeModal = useCampaignsStore((s) => s.openNodeModal);
  const campaign = useCampaignsStore((s) =>
    campaignId ? s.campaigns.find((c) => c.id === campaignId) : null,
  );

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
    // Persist drag-completed positions to (a) canvas-store for instant
    // rehydration on remount and (b) the campaign graph itself so the
    // backend persists across browsers/devices.
    for (const change of changes) {
      if (
        change.type === 'position' &&
        change.position &&
        change.dragging === false
      ) {
        setNodePosition(change.id, change.position);
        if (campaignId && campaign?.graph) {
          const graph = campaign.graph as unknown as {
            nodes?: GraphNodeMeta[];
            edges?: GraphEdgeMeta[];
          };
          const nextNodes = (graph.nodes ?? []).map((n) =>
            n.id === change.id
              ? { ...n, x: change.position!.x, y: change.position!.y }
              : n,
          );
          storeUpdateCampaign(
            campaignId,
            { graph: { ...graph, nodes: nextNodes } } as Record<string, unknown>,
          );
        }
      }
    }
  };

  const onEdgesChange = (changes: EdgeChange[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
    // Mirror edge removals back to the persistent graph.
    if (!campaignId || !campaign?.graph) return;
    const removalIds = changes
      .filter((c) => c.type === 'remove')
      .map((c) => (c as { id: string }).id);
    if (removalIds.length === 0) return;
    const graph = campaign.graph as unknown as {
      nodes?: unknown[];
      edges?: Array<Record<string, unknown>>;
    };
    const nextEdges = (graph.edges ?? []).filter((e) => !removalIds.includes(e.id as string));
    storeUpdateCampaign(
      campaignId,
      { graph: { ...graph, edges: nextEdges } } as Record<string, unknown>,
    );
  };

  // Parse handle id ("in-video-0" / "out-audio-1") → data type.
  const handleType = (handleId: string | null | undefined): NodeDataType | null => {
    if (!handleId) return null;
    const m = handleId.match(/^(?:in|out)-([a-z-]+)-\d+$/);
    return (m?.[1] as NodeDataType) ?? null;
  };

  const onConnect = (connection: Connection) => {
    if (!campaignId || !connection.source || !connection.target) return;
    const sourceType = handleType(connection.sourceHandle);
    const targetNode = nodes.find((n) => n.id === connection.target);
    let finalTargetHandle = connection.targetHandle ?? undefined;

    // Route the edge to the input socket whose color matches the source type.
    // If the target node doesn't have such a socket yet, append a dynamic one.
    if (sourceType && targetNode) {
      const kind = (targetNode.data as CanvasNodeData).kind;
      const staticInputs = NODE_IO_MAP[kind]?.inputs ?? [];
      const extraInputs = ((targetNode.data as CanvasNodeData).data as
        | { extraInputs?: NodeDataType[] }
        | undefined)?.extraInputs ?? [];
      const all: NodeDataType[] = [...staticInputs, ...extraInputs];
      const matchIdx = all.findIndex((t) => t === sourceType);
      if (matchIdx >= 0) {
        finalTargetHandle = `in-${sourceType}-${matchIdx}`;
      } else {
        // Add a new dynamic input handle for this type.
        const nextExtras = [...extraInputs, sourceType];
        updateNodeData(campaignId, targetNode.id, { extraInputs: nextExtras });
        finalTargetHandle = `in-${sourceType}-${all.length}`;
      }
    }

    const newEdge = {
      id: `e-${connection.source}-${connection.target}-${Math.random().toString(36).slice(2, 6)}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: finalTargetHandle,
      kind: 'dataflow' as const,
    };
    storeAddEdge(campaignId, newEdge);
    setEdges((current) =>
      addEdge(
        {
          ...newEdge,
          type: 'typed',
        },
        current,
      ),
    );
  };

  // Track whether a reconnect drag actually landed on a target.
  const reconnectSucceeded = useRef(true);

  const onReconnectStart = useCallback(() => {
    reconnectSucceeded.current = false;
  }, []);

  const onReconnect = (oldEdge: Edge, newConnection: Connection) => {
    if (!campaignId) return;
    reconnectSucceeded.current = true;
    setEdges((current) => reconnectEdge(oldEdge, newConnection, current));
    if (campaign && campaign.graph && typeof campaign.graph === 'object') {
      const graph = campaign.graph as unknown as {
        nodes?: unknown[];
        edges?: Array<Record<string, unknown>>;
      };
      const graphEdges = graph.edges ?? [];
      const nextEdges = graphEdges.map((e) =>
        e.id === oldEdge.id
          ? {
              ...e,
              source: newConnection.source ?? e.source,
              target: newConnection.target ?? e.target,
              sourceHandle: newConnection.sourceHandle ?? e.sourceHandle,
              targetHandle: newConnection.targetHandle ?? e.targetHandle,
            }
          : e,
      );
      storeUpdateCampaign(
        campaignId,
        { graph: { ...graph, edges: nextEdges } } as Record<string, unknown>,
      );
    }
  };

  const onReconnectEnd = useCallback(
    (_event: unknown, edge: Edge) => {
      if (reconnectSucceeded.current) {
        reconnectSucceeded.current = true;
        return;
      }
      // User dragged the edge handle into empty space → disconnect.
      setEdges((current) => current.filter((e) => e.id !== edge.id));
      if (campaignId && campaign?.graph) {
        const graph = campaign.graph as unknown as {
          nodes?: unknown[];
          edges?: Array<Record<string, unknown>>;
        };
        const nextEdges = (graph.edges ?? []).filter((e) => e.id !== edge.id);
        storeUpdateCampaign(
          campaignId,
          { graph: { ...graph, edges: nextEdges } } as Record<string, unknown>,
        );
      }
      reconnectSucceeded.current = true;
    },
    [campaignId, campaign, setEdges, storeUpdateCampaign],
  );

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
        nodesDraggable
        nodesConnectable
        edgesFocusable
        elementsSelectable
        reconnectRadius={24}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        onNodeClick={(_, node) => selectNode(node.id)}
        onNodeDoubleClick={(_, node) => {
          // Block the edit modal for Ruflo ghost-suggestion nodes until the
          // user explicitly approves. Reading `pendingApproval` off the node
          // data bag mirrors what `PendingApprovalOverlay` uses on the card.
          const nodeData = (node.data as { data?: { pendingApproval?: string } })
            ?.data;
          if (nodeData?.pendingApproval) return;
          openNodeModal(node.id);
        }}
        defaultViewport={viewport}
        onMoveEnd={(_, nextViewport) => {
          setViewport({
            x: nextViewport.x,
            y: nextViewport.y,
            zoom: nextViewport.zoom,
          });
        }}
        defaultEdgeOptions={{ selectable: true, reconnectable: true, type: 'typed' }}
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
