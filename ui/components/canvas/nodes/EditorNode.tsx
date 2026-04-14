import { type NodeProps } from '@xyflow/react';
import { PencilRuler } from 'lucide-react';
import { STATUS_MAP } from '@/lib/constants';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { StatusDot } from '@/components/shared/StatusDot';
import { NodeHandles } from '@/components/canvas/TypedHandle';
import { NodeContextMenuWrapper } from '@/components/canvas/nodes/NodeContextMenu';

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

export function EditorNode({ id, data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    editType?: string;
    targetStartS?: number;
    targetEndS?: number;
    beforeScore?: number;
    afterScore?: number | null;
    costUsd?: number;
    bypassed?: boolean;
  };
  const tone = STATUS_MAP[node.status];
  const label = d.editType ? EDIT_TYPE_LABELS[d.editType] ?? d.editType : 'Edit';
  const delta =
    d.beforeScore !== undefined && d.afterScore !== null && d.afterScore !== undefined
      ? d.afterScore - d.beforeScore
      : null;

  return (
    <NodeContextMenuWrapper nodeId={id} kind="editor">
      <div
        className="gs-card relative min-w-[216px] max-w-[216px] rounded-xl border bg-white px-3 py-3"
        style={{
          borderColor: selected ? 'var(--color-primary)' : 'rgba(26,26,26,0.1)',
          opacity: d.bypassed ? 0.45 : 1,
          filter: d.bypassed ? 'grayscale(0.4)' : undefined,
        }}
      >
        <NodeHandles kind="editor" />

        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          <div className="flex items-center gap-1.5">
            <PencilRuler className="h-3 w-3 text-[var(--color-primary)]" />
            <span>Edit</span>
          </div>
          {d.costUsd !== undefined ? (
            <span className="font-mono text-[10px]">${d.costUsd.toFixed(3)}</span>
          ) : null}
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
    </NodeContextMenuWrapper>
  );
}
