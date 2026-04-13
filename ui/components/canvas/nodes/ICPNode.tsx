'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Target } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { useCanvasStore } from '@/store/canvas-store';
import { NodeActionsMenu } from './NodeActionsMenu';
import { NodeStatusChip } from './NodeStatusChip';
import { ConfigStatusPill } from './ConfigStatusPill';

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  x: 'X',
  shorts: 'Shorts',
  reels: 'Reels',
};

interface ICPData {
  personaName?: string;
  platform?: string;
  painPoint?: string;
}

export function ICPNode({ id, data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as ICPData;
  const openNodeModal = useCanvasStore((s) => s.openNodeModal);

  const platformLabel = d.platform
    ? PLATFORM_LABELS[d.platform.toLowerCase()] ?? d.platform
    : null;
  const complete = Boolean(d.personaName) && Boolean(d.platform);
  const titleText = d.personaName ?? node.label ?? 'ICP';
  const painPoint = d.painPoint?.trim();

  const handleCardClick = (e: MouseEvent) => {
    e.stopPropagation();
    openNodeModal(id);
  };

  return (
    <div
      onClick={handleCardClick}
      className="gs-card relative min-w-[208px] max-w-[208px] cursor-pointer rounded-xl border bg-white px-3 py-3"
      style={{ borderColor: selected ? 'var(--color-primary)' : 'rgba(26,26,26,0.1)' }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />

      <NodeActionsMenu nodeId={id} kind="icp" campaignId={node.campaignId} />

      <div className="mb-2 flex items-center justify-between gap-1.5 pr-6 text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
        <div className="flex items-center gap-1.5">
          <Target className="h-3 w-3 text-[var(--color-primary)]" />
          <span>ICP</span>
        </div>
        {platformLabel ? (
          <span className="rounded bg-[var(--color-primary-soft,#eef2ff)] px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-[var(--color-primary)]">
            {platformLabel}
          </span>
        ) : null}
      </div>

      <div className="mb-1 text-[13px] font-semibold text-[var(--color-ink)]">
        {titleText}
      </div>

      <div className="mb-2 line-clamp-2 text-[11px] text-[var(--color-muted)]">
        {painPoint ? `“${painPoint}”` : 'No pain point yet'}
      </div>

      <div className="flex items-center justify-between gap-1.5">
        <NodeStatusChip status={node.status} text={node.statusText} />
        <ConfigStatusPill nodeId={id} complete={complete} />
      </div>
    </div>
  );
}
