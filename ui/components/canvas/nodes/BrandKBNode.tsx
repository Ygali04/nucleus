'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Book } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { useCanvasStore } from '@/store/canvas-store';
import { NodeActionsMenu } from './NodeActionsMenu';
import { NodeStatusChip } from './NodeStatusChip';
import { ConfigStatusPill } from './ConfigStatusPill';

interface BrandKBData {
  brandName?: string;
  voiceTone?: string[];
  docCount?: number;
  attachments?: Array<unknown>;
}

export function BrandKBNode({ id, data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as BrandKBData;
  const openNodeModal = useCanvasStore((s) => s.openNodeModal);

  const tones = (d.voiceTone ?? []).filter(Boolean).slice(0, 3);
  const docCount = d.docCount ?? (d.attachments?.length ?? 0);
  const docsLabel = docCount > 0 ? `${docCount} docs loaded` : 'No docs yet';
  const complete = (d.attachments?.length ?? 0) > 0 && Boolean(d.brandName);
  const titleText = d.brandName ?? node.label ?? 'Brand KB';

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

      <NodeActionsMenu nodeId={id} kind="brand_kb" campaignId={node.campaignId} />

      <div className="mb-2 flex items-center gap-1.5 pr-6 text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
        <Book className="h-3 w-3 text-[var(--color-primary)]" />
        <span>Brand KB</span>
      </div>

      <div className="mb-1 text-[13px] font-semibold text-[var(--color-ink)]">
        {titleText}
      </div>

      {tones.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {tones.map((t) => (
            <span
              key={t}
              className="rounded bg-[var(--color-primary-soft,#eef2ff)] px-1.5 py-0.5 text-[10px] text-[var(--color-primary)]"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mb-2 text-[11px] text-[var(--color-muted)]">{docsLabel}</div>

      <div className="flex items-center justify-between gap-1.5">
        <NodeStatusChip status={node.status} text={node.statusText} />
        <ConfigStatusPill nodeId={id} complete={complete} />
      </div>
    </div>
  );
}
