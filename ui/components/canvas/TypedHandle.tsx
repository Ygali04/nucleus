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
}

/**
 * Colored handle dot. Data type is communicated via the border color;
 * full label lives on the edge midpoint (see TypedEdge). We deliberately
 * do NOT render a text label next to the handle — it caused visual
 * collisions with the node header at small node widths.
 */
export function TypedHandle({
  id,
  type,
  position,
  dataType,
  offset,
}: TypedHandleProps) {
  const color = DATA_TYPE_COLOR[dataType];
  const topStyle = { top: `${offset}px` } as const;

  return (
    <Handle
      id={id}
      type={type}
      position={position}
      title={DATA_TYPE_LABEL[dataType]}
      style={{
        ...topStyle,
        width: 10,
        height: 10,
        background: 'white',
        border: `2px solid ${color}`,
        boxShadow: `0 0 0 1px rgba(0,0,0,0.04)`,
      }}
    />
  );
}

interface NodeHandlesProps {
  kind: GraphNodeKind;
  /** Extra input data-types appended at runtime when a new edge type connects. */
  extraInputs?: NodeDataType[];
  /** Extra output data-types appended at runtime (rarely used). */
  extraOutputs?: NodeDataType[];
  showLabels?: boolean; // kept for back-compat; ignored.
}

/**
 * Renders the canonical input/output handle set for a node kind, evenly
 * distributed vertically along each side. Handle ids follow `in-<type>-<i>` /
 * `out-<type>-<i>` so edges can reference them explicitly. Handles are
 * de-duplicated so re-connecting the same data type doesn't add a second dot.
 */
export function NodeHandles({
  kind,
  extraInputs = [],
  extraOutputs = [],
}: NodeHandlesProps) {
  const io = NODE_IO_MAP[kind] ?? { inputs: [], outputs: [] };
  const inputs = uniqueTypes([...io.inputs, ...extraInputs]);
  const outputs = uniqueTypes([...io.outputs, ...extraOutputs]);

  return (
    <>
      {inputs.map((dataType, i) => (
        <TypedHandle
          key={`in-${dataType}-${i}`}
          id={`in-${dataType}-${i}`}
          type="target"
          position={Position.Left}
          dataType={dataType}
          offset={spread(i, inputs.length)}
        />
      ))}
      {outputs.map((dataType, i) => (
        <TypedHandle
          key={`out-${dataType}-${i}`}
          id={`out-${dataType}-${i}`}
          type="source"
          position={Position.Right}
          dataType={dataType}
          offset={spread(i, outputs.length)}
        />
      ))}
    </>
  );
}

function uniqueTypes(list: NodeDataType[]): NodeDataType[] {
  const seen = new Set<NodeDataType>();
  const out: NodeDataType[] = [];
  for (const t of list) {
    if (!seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

function spread(index: number, total: number): number {
  // Push handles below the 28px-tall node header so they can't overlap
  // the icon + label row. Multiple handles stack 22px apart.
  if (total <= 1) return 56;
  const start = 42;
  const step = 22;
  return start + index * step;
}
