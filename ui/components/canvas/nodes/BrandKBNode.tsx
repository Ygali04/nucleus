import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Book } from 'lucide-react';
import { STATUS_MAP } from '@/lib/constants';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { StatusDot } from '@/components/shared/StatusDot';

export function BrandKBNode({ data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    brandName?: string;
    voiceTone?: string[];
    docCount?: number;
  };
  const tone = STATUS_MAP[node.status];
  const attributes = (d.voiceTone ?? []).filter(Boolean);

  return (
    <div
      className="gs-card relative min-w-[216px] max-w-[216px] overflow-hidden rounded-[10px] border bg-white"
      style={{ borderColor: selected ? 'var(--color-primary)' : 'rgba(26,26,26,0.1)' }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />

      <div className="flex h-6 items-center justify-between bg-[var(--color-dark,#1a1a1a)]/95 px-3 text-[10px] uppercase tracking-[0.12em] text-white">
        <div className="flex items-center gap-1.5">
          <Book className="h-3 w-3" />
          <span>Brand KB</span>
        </div>
        {d.docCount !== undefined ? (
          <span className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[10px]">
            {d.docCount} docs
          </span>
        ) : null}
      </div>

      <div className="px-3 py-3">
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
      </div>
    </div>
  );
}
