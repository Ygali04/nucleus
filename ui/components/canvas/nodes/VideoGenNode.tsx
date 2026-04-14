import { type NodeProps } from '@xyflow/react';
import { Film } from 'lucide-react';
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

export function VideoGenNode({ id, data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    provider?: string;
    thumbnailUrl?: string | null;
    videoUrl?: string | null;
    costUsd?: number;
    durationS?: number;
    iterationCount?: number;
    bypassed?: boolean;
  };
  const tone = STATUS_MAP[node.status];
  const ruflo = isRufloAdded(node.data);

  return (
    <NodeContextMenuWrapper nodeId={id} kind="video_gen">
      <div
        className={`gs-card relative min-w-[224px] max-w-[224px] rounded-xl border bg-white px-3 py-3 transition ${ruflo ? RUFLO_ARRIVAL_CLASS : ''}`}
        style={{
          borderColor: rufloBorderColor(!!selected, ruflo),
          opacity: d.bypassed ? 0.45 : 1,
          filter: d.bypassed ? 'grayscale(0.4)' : undefined,
        }}
      >
        <NodeHandles kind="video_gen" extraInputs={(d as { extraInputs?: any }).extraInputs} extraOutputs={(d as { extraOutputs?: any }).extraOutputs} />
        {ruflo ? <RufloBadge /> : null}

        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          <div className="flex items-center gap-1.5">
            <Film className="h-3 w-3 text-[var(--color-primary)]" />
            <span>{d.provider ?? 'Video'}</span>
          </div>
          {d.costUsd !== undefined ? (
            <span className="font-mono text-[10px] text-[var(--color-muted)]">
              ${d.costUsd.toFixed(3)}
            </span>
          ) : null}
        </div>

        <div className="mb-2 aspect-video w-full overflow-hidden rounded-md bg-[var(--color-muted-bg,#f5f6f8)]">
          {d.thumbnailUrl ? (
            <img src={d.thumbnailUrl} alt={node.label} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--color-muted)]">
              {d.videoUrl ? 'Ready' : 'No preview'}
            </div>
          )}
        </div>

        <div className="mb-2 text-[13px] font-semibold text-[var(--color-ink)]">
          {node.label}
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
          <div className="flex items-center gap-1.5">
            <StatusDot color={tone.color} pulse={node.status === 'active'} />
            <span>{node.statusText}</span>
          </div>
          {d.durationS ? <span className="font-mono text-[10px]">{d.durationS.toFixed(1)}s</span> : null}
        </div>
      </div>
    </NodeContextMenuWrapper>
  );
}
