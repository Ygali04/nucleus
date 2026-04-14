import { Handle, Position, type NodeProps } from '@xyflow/react';
import { PencilRuler } from 'lucide-react';
import { STATUS_MAP } from '@/lib/constants';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { StatusDot } from '@/components/shared/StatusDot';
import { InlineVideoPreview } from '@/components/canvas/node-previews/InlineVideoPreview';

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

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-md bg-[var(--color-muted-bg,#f5f6f8)] text-[9px] text-[var(--color-muted)] shadow-inner">
      {label}
    </div>
  );
}

export function EditorNode({ data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    editType?: string;
    targetStartS?: number;
    targetEndS?: number;
    beforeScore?: number;
    afterScore?: number | null;
    costUsd?: number;
    beforeVideoUrl?: string | null;
    afterVideoUrl?: string | null;
  };
  const tone = STATUS_MAP[node.status];
  const label = d.editType ? EDIT_TYPE_LABELS[d.editType] ?? d.editType : 'Edit';
  const delta =
    d.beforeScore !== undefined && d.afterScore !== null && d.afterScore !== undefined
      ? d.afterScore - d.beforeScore
      : null;

  return (
    <div
      className="gs-card relative min-w-[240px] max-w-[240px] overflow-hidden rounded-[10px] border bg-white"
      style={{ borderColor: selected ? 'var(--color-primary)' : 'rgba(26,26,26,0.1)' }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />

      <div className="flex h-6 items-center justify-between bg-[var(--color-dark,#1a1a1a)]/95 px-3 text-[10px] uppercase tracking-[0.12em] text-white">
        <div className="flex items-center gap-1.5">
          <PencilRuler className="h-3 w-3" />
          <span>Edit</span>
        </div>
        {d.costUsd !== undefined ? (
          <span className="font-mono text-[10px] opacity-80">${d.costUsd.toFixed(3)}</span>
        ) : null}
      </div>

      <div className="px-3 py-3">
        <div className="mb-2 grid grid-cols-2 gap-1.5">
          <div className="space-y-1">
            <div className="text-[9px] uppercase tracking-wider text-[var(--color-muted)]">Before</div>
            {d.beforeVideoUrl ? (
              <InlineVideoPreview src={d.beforeVideoUrl} />
            ) : (
              <EmptySlot label="No clip" />
            )}
          </div>
          <div className="space-y-1">
            <div className="text-[9px] uppercase tracking-wider text-[var(--color-muted)]">After</div>
            {d.afterVideoUrl ? (
              <InlineVideoPreview src={d.afterVideoUrl} />
            ) : (
              <EmptySlot label="Pending" />
            )}
          </div>
        </div>

        <div className="mb-1 text-[13px] font-semibold text-[var(--color-ink)]">{label}</div>

        {d.targetStartS !== undefined && d.targetEndS !== undefined ? (
          <div className="mb-2 font-mono text-[11px] text-[var(--color-muted)]">
            {d.targetStartS.toFixed(1)}s → {d.targetEndS.toFixed(1)}s
          </div>
        ) : null}

        {delta !== null ? (
          <div className="mb-2 flex items-center gap-1 text-[11px]">
            <span className="text-[var(--color-muted)]">{d.beforeScore?.toFixed(1)}</span>
            <span className="text-[var(--color-muted)]">→</span>
            <span className={delta >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>
              {d.afterScore?.toFixed(1)}
            </span>
            <span className={delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              ({delta >= 0 ? '+' : ''}{delta.toFixed(1)})
            </span>
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
