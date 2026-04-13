'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Layers } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { useCanvasStore } from '@/store/canvas-store';
import { NodeActionsMenu } from './NodeActionsMenu';
import { NodeStatusChip } from './NodeStatusChip';

interface CompositionData {
  compositionId?: string;
  templateId?: string;
  sceneCount?: number;
  totalDurationS?: number;
  renderProgress?: number;
}

export function CompositionNode({ id, data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as CompositionData;
  const openNodeModal = useCanvasStore((s) => s.openNodeModal);

  const compositionId = d.compositionId ?? d.templateId ?? null;
  const sceneCount = d.sceneCount ?? 0;
  const duration = d.totalDurationS ?? 0;
  const progressPct = Math.round(Math.max(0, Math.min(1, d.renderProgress ?? 0)) * 100);
  const isRunning = node.status === 'active';

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

      <NodeActionsMenu nodeId={id} kind="composition" campaignId={node.campaignId} />

      <div className="mb-2 flex items-center gap-1.5 pr-6 text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
        <Layers className="h-3 w-3 text-[var(--color-primary)]" />
        <span>Composition</span>
      </div>

      <div className="mb-1 text-[13px] font-semibold text-[var(--color-ink)]">
        {compositionId ?? 'Not started'}
      </div>

      <div className="mb-2 flex items-center justify-between text-[11px] text-[var(--color-muted)]">
        <span>{sceneCount} {sceneCount === 1 ? 'scene' : 'scenes'}</span>
        <span className="font-mono">{duration.toFixed(1)}s</span>
      </div>

      {isRunning ? (
        <div className="mb-2 h-1 w-full overflow-hidden rounded bg-[var(--color-muted-bg,#f5f6f8)]">
          <div
            className="h-full rounded bg-[var(--color-primary)] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      ) : null}

      <NodeStatusChip status={node.status} text={node.statusText} />
    </div>
  );
}
