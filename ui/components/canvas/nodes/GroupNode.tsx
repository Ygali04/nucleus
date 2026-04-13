import type { NodeProps } from '@xyflow/react';
import type { CanvasNodeData } from '@/lib/graph-layout';

export function GroupNode({ data }: NodeProps) {
  const node = data as CanvasNodeData;
  return (
    <div className="h-full w-full rounded-2xl border border-dashed border-[var(--color-primary)]/35 bg-[rgba(184,160,122,0.05)] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
        {node.label}
      </div>
    </div>
  );
}
