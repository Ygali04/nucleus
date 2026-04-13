'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Film } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { useCanvasStore } from '@/store/canvas-store';
import { NodeActionsMenu } from './NodeActionsMenu';
import { NodeStatusChip } from './NodeStatusChip';

interface VideoGenData {
  provider?: string;
  prompt?: string;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  costUsd?: number;
  durationS?: number;
}

function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

export function VideoGenNode({ id, data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as VideoGenData;
  const openNodeModal = useCanvasStore((s) => s.openNodeModal);

  const provider = d.provider ?? 'Kling';
  const promptPreview = d.prompt?.trim() ? truncate(d.prompt.trim(), 80) : 'No prompt yet';

  const handleCardClick = (e: MouseEvent) => {
    e.stopPropagation();
    openNodeModal(id);
  };

  return (
    <div
      onClick={handleCardClick}
      className="gs-card relative min-w-[224px] max-w-[224px] cursor-pointer rounded-xl border bg-white px-3 py-3 transition"
      style={{ borderColor: selected ? 'var(--color-primary)' : 'rgba(26,26,26,0.1)' }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />

      <NodeActionsMenu nodeId={id} kind="video_gen" campaignId={node.campaignId} />

      <div className="mb-2 flex items-center justify-between gap-1.5 pr-6 text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
        <div className="flex items-center gap-1.5">
          <Film className="h-3 w-3 text-[var(--color-primary)]" />
          <span>Video</span>
        </div>
        <span className="rounded bg-[var(--color-primary-soft,#eef2ff)] px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-[var(--color-primary)]">
          {provider}
        </span>
      </div>

      {d.thumbnailUrl ? (
        <div className="mb-2 aspect-video w-full overflow-hidden rounded-md bg-[var(--color-muted-bg,#f5f6f8)]">
          <img src={d.thumbnailUrl} alt={node.label} className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div className="mb-2 line-clamp-2 text-[11px] text-[var(--color-muted)]">
        {promptPreview}
      </div>

      <div className="flex items-center justify-between gap-1.5">
        <NodeStatusChip status={node.status} text={node.statusText} />
        <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--color-muted)]">
          {d.durationS !== undefined ? <span>{d.durationS.toFixed(1)}s</span> : null}
          {d.costUsd !== undefined ? <span>${d.costUsd.toFixed(3)}</span> : null}
        </div>
      </div>
    </div>
  );
}
