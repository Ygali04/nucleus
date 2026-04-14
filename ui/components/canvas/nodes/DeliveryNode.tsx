import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Package } from 'lucide-react';
import { STATUS_MAP } from '@/lib/constants';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { StatusDot } from '@/components/shared/StatusDot';
import {
  NodeExecutionBadges,
  NodeExecutionFooter,
  NodeExecutionOverlay,
  readExecutionState,
} from '@/components/canvas/node-status';

export function DeliveryNode({ data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    variantCount?: number;
    exportFormats?: string[];
    cdnUrl?: string | null;
    badgeText?: string;
  };
  const exec = readExecutionState(node.data);
  const tone = STATUS_MAP[node.status];
  const formats = (d.exportFormats ?? []).filter(Boolean);
  const shipText = d.cdnUrl ?? 'Ready to ship';
  const badge = d.badgeText ?? (node.status === 'active' ? 'Shipping' : 'Ready');

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
            <Package className="h-3 w-3 text-[var(--color-primary)]" />
            <span>Delivery</span>
          </div>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: 'var(--color-primary-soft,#eef2ff)',
              color: 'var(--color-primary)',
            }}
          >
            {badge}
          </span>
        </div>

        <div className="mb-1 text-[13px] font-semibold text-[var(--color-ink)]">
          {d.variantCount !== undefined ? `${d.variantCount} variants` : node.label}
        </div>

        {formats.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1">
            {formats.map((f) => (
              <span
                key={f}
                className="rounded bg-[var(--color-muted-bg,#f5f6f8)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-muted)]"
              >
                {f}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mb-2 truncate font-mono text-[10px] text-[var(--color-muted)]" title={shipText}>
          {shipText}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          <StatusDot color={tone.color} pulse={node.status === 'active'} />
          <span>{node.statusText}</span>
        </div>

        <NodeExecutionFooter state={exec} />
      </div>
    </NodeExecutionOverlay>
  );
}
