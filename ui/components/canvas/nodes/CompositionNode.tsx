import { type NodeProps } from '@xyflow/react';
import { Layers } from 'lucide-react';
import { STATUS_MAP } from '@/lib/constants';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { StatusDot } from '@/components/shared/StatusDot';
import { NodeHandles } from '@/components/canvas/TypedHandle';
import { NodeContextMenuWrapper } from '@/components/canvas/nodes/NodeContextMenu';
import {
  RUFLO_ARRIVAL_CLASS,
  RufloBadge,
  isRufloAdded,
  rufloBorderColor,
} from '@/components/canvas/nodes/RufloBadge';

export function CompositionNode({ id, data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    templateId?: string;
    sceneCount?: number;
    totalDurationS?: number;
    renderProgress?: number;
    outputUrl?: string | null;
    bypassed?: boolean;
  };
  const tone = STATUS_MAP[node.status];
  const progressPct = Math.round((d.renderProgress ?? 0) * 100);
  const ruflo = isRufloAdded(node.data);

  return (
    <NodeContextMenuWrapper nodeId={id} kind="composition">
      <div
        className={`gs-card relative min-w-[216px] max-w-[216px] rounded-xl border bg-white px-3 py-3 ${ruflo ? RUFLO_ARRIVAL_CLASS : ''}`}
        style={{
          borderColor: rufloBorderColor(!!selected, ruflo),
          opacity: d.bypassed ? 0.45 : 1,
          filter: d.bypassed ? 'grayscale(0.4)' : undefined,
        }}
      >
        <NodeHandles kind="composition" extraInputs={(d as { extraInputs?: any }).extraInputs} extraOutputs={(d as { extraOutputs?: any }).extraOutputs} />
        {ruflo ? <RufloBadge /> : null}

        <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          <Layers className="h-3 w-3 text-[var(--color-primary)]" />
          <span>{d.templateId ?? 'Composition'}</span>
        </div>

        <div className="mb-1 text-[13px] font-semibold text-[var(--color-ink)]">{node.label}</div>

        <div className="mb-2 flex items-center justify-between text-[11px] text-[var(--color-muted)]">
          <span>{d.sceneCount ?? 0} scenes</span>
          <span className="font-mono">{(d.totalDurationS ?? 0).toFixed(1)}s</span>
        </div>

        {node.status === 'active' ? (
          <div className="mb-2 h-1 w-full overflow-hidden rounded bg-[var(--color-muted-bg,#f5f6f8)]">
            <div
              className="h-full rounded bg-[var(--color-primary)] transition-all"
              style={{ width: `${progressPct}%` }}
            />
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
