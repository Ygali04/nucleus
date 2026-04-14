import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Book } from 'lucide-react';
import { STATUS_MAP } from '@/lib/constants';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { StatusDot } from '@/components/shared/StatusDot';
import {
  NodeExecutionBadges,
  NodeExecutionFooter,
  NodeExecutionOverlay,
  readExecutionState,
} from '@/components/canvas/node-status';

export function BrandKBNode({ data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    brandName?: string;
    voiceTone?: string[];
    docCount?: number;
  };
  const exec = readExecutionState(node.data);
  const tone = STATUS_MAP[node.status];
  const attributes = (d.voiceTone ?? []).filter(Boolean);

  return (
    <NodeExecutionOverlay state={exec}>
      <div
        className="gs-card relative min-w-[216px] max-w-[216px] rounded-xl border bg-white px-3 py-3"
        style={{ borderColor: selected ? 'var(--color-primary)' : 'rgba(26,26,26,0.1)' }}
      >
        <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />
        <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />
        <NodeExecutionBadges state={exec} />

        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          <div className="flex items-center gap-1.5">
            <Book className="h-3 w-3 text-[var(--color-primary)]" />
            <span>Brand KB</span>
          </div>
          {d.docCount !== undefined ? (
            <span className="rounded bg-[var(--color-primary-soft,#eef2ff)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-primary)]">
              {d.docCount} docs
            </span>
          ) : null}
        </div>

        <div className="mb-1 text-[13px] font-semibold text-[var(--color-ink)]">
          {d.brandName ?? node.label}
        </div>

        {attributes.length > 0 ? (
          <div className="mb-2 line-clamp-2 text-[11px] italic text-[var(--color-muted)]">
            {attributes.join(', ')}
          </div>
        ) : null}

        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          <StatusDot color={tone.color} pulse={node.status === 'active'} />
          <span>{node.statusText}</span>
        </div>

        <NodeExecutionFooter state={exec} />
      </div>
    </NodeExecutionOverlay>
  );
}
