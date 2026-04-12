import type { EdgeProps } from '@xyflow/react';
import { BaseEdge, getBezierPath } from '@xyflow/react';

export function DataFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: 'rgba(184,160,122,0.85)',
          strokeWidth: 1.5,
          strokeDasharray: '6 5',
        }}
      />
      <circle r="3" fill="var(--color-brass)">
        <animateMotion dur="2.4s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </>
  );
}
