import { Handle, Position } from '@xyflow/react';
import {
  DATA_TYPE_COLOR,
  DATA_TYPE_LABEL,
  NODE_IO_MAP,
  type NodeDataType,
} from '@/lib/node-data-types';
import type { GraphNodeKind } from '@/lib/types';

interface TypedHandleProps {
  id: string;
  type: 'source' | 'target';
  position: Position;
  dataType: NodeDataType;
  offset: number;
  showLabel?: boolean;
}

export function TypedHandle({
  id,
  type,
  position,
  dataType,
  offset,
  showLabel = true,
}: TypedHandleProps) {
  const color = DATA_TYPE_COLOR[dataType];
  const label = DATA_TYPE_LABEL[dataType];
  const isLeft = position === Position.Left;
  const topStyle = { top: `${offset}px` } as const;

  return (
    <>
      <Handle
        id={id}
        type={type}
        position={position}
        style={{
          ...topStyle,
          width: 10,
          height: 10,
          background: 'white',
          border: `2px solid ${color}`,
          boxShadow: `0 0 0 1px rgba(0,0,0,0.04)`,
        }}
      />
      {showLabel ? (
        <span
          className="pointer-events-none absolute font-mono text-[9px] uppercase tracking-[0.14em]"
          style={{
            top: `${offset - 6}px`,
            [isLeft ? 'left' : 'right']: '14px',
            color,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      ) : null}
    </>
  );
}

interface NodeHandlesProps {
  kind: GraphNodeKind;
  showLabels?: boolean;
}

/**
 * Renders the canonical input/output handle set for a node kind, evenly
 * distributed vertically along each side. Handle ids follow `in-<type>-<i>` /
 * `out-<type>-<i>` so edges can reference them explicitly.
 */
export function NodeHandles({ kind, showLabels = true }: NodeHandlesProps) {
  const io = NODE_IO_MAP[kind] ?? { inputs: [], outputs: [] };

  return (
    <>
      {io.inputs.map((dataType, i) => (
        <TypedHandle
          key={`in-${dataType}-${i}`}
          id={`in-${dataType}-${i}`}
          type="target"
          position={Position.Left}
          dataType={dataType}
          offset={spread(i, io.inputs.length)}
          showLabel={showLabels}
        />
      ))}
      {io.outputs.map((dataType, i) => (
        <TypedHandle
          key={`out-${dataType}-${i}`}
          id={`out-${dataType}-${i}`}
          type="source"
          position={Position.Right}
          dataType={dataType}
          offset={spread(i, io.outputs.length)}
          showLabel={showLabels}
        />
      ))}
    </>
  );
}

function spread(index: number, total: number): number {
  if (total <= 1) return 28;
  const start = 18;
  const step = 22;
  return start + index * step;
}
