import { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useNodes,
  type EdgeProps,
} from '@xyflow/react';
import {
  DATA_TYPE_COLOR,
  DATA_TYPE_LABEL,
  primaryOutputType,
  type NodeDataType,
} from '@/lib/node-data-types';
import type { CanvasNodeData } from '@/lib/graph-layout';

export function TypedEdge({
  id,
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const nodes = useNodes() as unknown as Array<{ id: string; data?: CanvasNodeData }>;
  const [hovered, setHovered] = useState(false);

  const explicit = (data as { dataType?: NodeDataType } | undefined)?.dataType;
  const sourceKind = nodes.find((n) => n.id === source)?.data?.kind;
  const dataType: NodeDataType =
    explicit ?? (sourceKind ? primaryOutputType(sourceKind) : 'any');

  // Pending edges belong to a Ruflo ghost-node suggestion: render violet +
  // dashed + pulsing until the suggestion resolves.
  const edgeDataBag = data as
    | { pending?: boolean; pendingApproval?: string }
    | undefined;
  const pending = Boolean(edgeDataBag?.pending || edgeDataBag?.pendingApproval);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const SUGGESTED_COLOR = '#8b5cf6';
  const color = pending ? SUGGESTED_COLOR : DATA_TYPE_COLOR[dataType];

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: pending ? 2 : 1.5,
          opacity: hovered ? 1 : pending ? 0.9 : 0.7,
          strokeDasharray: pending ? '6 4' : undefined,
          transition: 'opacity 120ms ease',
        }}
        className={pending ? 'nucleus-ghost-pending-edge' : undefined}
        interactionWidth={20}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <EdgeLabelRenderer>
        <div
          className="pointer-events-none absolute rounded px-1 font-mono text-[9px] uppercase tracking-[0.14em]"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            background: 'white',
            color,
            border: `1px solid ${color}`,
            opacity: hovered ? 1 : 0.85,
          }}
        >
          {DATA_TYPE_LABEL[dataType]}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
