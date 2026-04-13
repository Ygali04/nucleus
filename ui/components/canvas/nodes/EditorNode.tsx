'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { PencilRuler } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { useCanvasStore } from '@/store/canvas-store';
import { NodeActionsMenu } from './NodeActionsMenu';
import { NodeStatusChip } from './NodeStatusChip';

const EDIT_TYPE_LABELS: Record<string, string> = {
  hook_rewrite: 'Hook Rewrite',
  cut_tightening: 'Cut Tightening',
  music_swap: 'Music Swap',
  pacing_change: 'Pacing Change',
  narration_rewrite: 'Narration Rewrite',
  visual_substitution: 'Visual Substitution',
  caption_emphasis: 'Caption Emphasis',
  icp_reanchor: 'ICP Re-anchor',
};

interface EditorData {
  editType?: string;
  targetStartS?: number;
  targetEndS?: number;
  beforeScore?: number;
  afterScore?: number | null;
  costUsd?: number;
}

function formatTimestamp(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function EditorNode({ id, data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as EditorData;
  const openNodeModal = useCanvasStore((s) => s.openNodeModal);

  const label = d.editType ? EDIT_TYPE_LABELS[d.editType] ?? d.editType : 'Not started';
  const hasRange = d.targetStartS !== undefined && d.targetEndS !== undefined;
  const range = hasRange
    ? `${formatTimestamp(d.targetStartS as number)}–${formatTimestamp(d.targetEndS as number)}`
    : null;
  const hasDelta =
    d.beforeScore !== undefined && d.afterScore !== null && d.afterScore !== undefined;
  const delta = hasDelta ? (d.afterScore as number) - (d.beforeScore as number) : null;

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

      <NodeActionsMenu nodeId={id} kind="editor" campaignId={node.campaignId} />

      <div className="mb-2 flex items-center justify-between gap-1.5 pr-6 text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
        <div className="flex items-center gap-1.5">
          <PencilRuler className="h-3 w-3 text-[var(--color-primary)]" />
          <span>Edit</span>
        </div>
        {d.costUsd !== undefined ? (
          <span className="font-mono text-[10px] normal-case tracking-normal">
            ${d.costUsd.toFixed(3)}
          </span>
        ) : null}
      </div>

      <div className="mb-1 text-[13px] font-semibold text-[var(--color-ink)]">{label}</div>

      <div className="mb-2 font-mono text-[11px] text-[var(--color-muted)]">
        {range ?? 'No window selected'}
      </div>

      {delta !== null ? (
        <div className="mb-2 flex items-center gap-1 text-[11px]">
          <span className="text-[var(--color-muted)]">{d.beforeScore?.toFixed(1)}</span>
          <span className="text-[var(--color-muted)]">→</span>
          <span className={delta >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>
            {(d.afterScore as number).toFixed(1)}
          </span>
          <span className={delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
            ({delta >= 0 ? '+' : ''}{delta.toFixed(1)})
          </span>
        </div>
      ) : null}

      <NodeStatusChip status={node.status} text={node.statusText} />
    </div>
  );
}
