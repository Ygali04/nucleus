'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Package } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { useCanvasStore } from '@/store/canvas-store';
import { NodeActionsMenu } from './NodeActionsMenu';
import { NodeStatusChip } from './NodeStatusChip';

interface DeliveryData {
  variantCount?: number;
  exportFormats?: string[];
  cdnUrl?: string | null;
  finalScore?: number | null;
}

export function DeliveryNode({ id, data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as DeliveryData;
  const openNodeModal = useCanvasStore((s) => s.openNodeModal);

  const formats = (d.exportFormats ?? []).filter(Boolean);
  const variantCount = d.variantCount ?? 0;
  const shipText = d.cdnUrl ?? 'Ready to ship';
  const hasFinal = d.finalScore !== null && d.finalScore !== undefined;

  const handleCardClick = (e: MouseEvent) => {
    e.stopPropagation();
    openNodeModal(id);
  };

  return (
    <div
      onClick={handleCardClick}
      className="gs-card relative min-w-[216px] max-w-[216px] cursor-pointer rounded-xl border bg-white px-3 py-3"
      style={{ borderColor: selected ? 'var(--color-primary)' : 'rgba(26,26,26,0.1)' }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />

      <NodeActionsMenu nodeId={id} kind="delivery" campaignId={node.campaignId} />

      <div className="mb-2 flex items-center gap-1.5 pr-6 text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
        <Package className="h-3 w-3 text-[var(--color-primary)]" />
        <span>Delivery</span>
      </div>

      <div className="mb-1 text-[13px] font-semibold text-[var(--color-ink)]">
        {variantCount > 0 ? `${variantCount} ${variantCount === 1 ? 'variant' : 'variants'}` : 'No variants yet'}
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

      <div className="flex items-center justify-between gap-1.5">
        <NodeStatusChip status={node.status} text={node.statusText} />
        {hasFinal ? (
          <span className="font-mono text-[11px] font-semibold text-[var(--color-ink)]">
            {(d.finalScore as number).toFixed(1)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
