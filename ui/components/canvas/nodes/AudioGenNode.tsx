'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { AudioLines, Music } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { useCanvasStore } from '@/store/canvas-store';
import { NodeActionsMenu } from './NodeActionsMenu';
import { NodeStatusChip } from './NodeStatusChip';

interface AudioGenData {
  kind?: 'voice' | 'music';
  voiceName?: string;
  language?: string;
  mood?: string;
  costUsd?: number;
  durationS?: number;
}

/**
 * Pre-computed 14-bar waveform — deterministic so we don't re-render
 * new heights on every React Flow tick. Kept from the prior impl.
 */
const WAVEFORM_BARS = Array.from({ length: 14 }, (_, i) =>
  8 + Math.floor(14 * Math.abs(Math.sin((i + 1) * 1.3))),
);

export function AudioGenNode({ id, data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as AudioGenData;
  const openNodeModal = useCanvasStore((s) => s.openNodeModal);

  const isMusic = d.kind === 'music';
  const Icon = isMusic ? Music : AudioLines;
  const modeLabel = isMusic ? 'Music' : 'Voice';
  const detail = isMusic ? d.mood : d.voiceName;
  const subtitle = detail
    ? d.language
      ? `${detail} · ${d.language}`
      : detail
    : isMusic
      ? 'No mood yet'
      : 'No voice yet';

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

      <NodeActionsMenu nodeId={id} kind="audio_gen" campaignId={node.campaignId} />

      <div className="mb-2 flex items-center gap-1.5 pr-6 text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
        <Icon className="h-3 w-3 text-[var(--color-primary)]" />
        <span>{modeLabel}</span>
      </div>

      <div className="mb-2 flex h-8 items-end gap-0.5 rounded bg-[var(--color-muted-bg,#f5f6f8)] px-2 py-1">
        {WAVEFORM_BARS.map((h, i) => (
          <div
            key={i}
            className="w-[3px] rounded-sm bg-[var(--color-primary)] opacity-70"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>

      <div className="mb-2 truncate text-[11px] text-[var(--color-muted)]">{subtitle}</div>

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
