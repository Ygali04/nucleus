import { type NodeProps } from '@xyflow/react';
import { Upload } from 'lucide-react';
import { STATUS_MAP } from '@/lib/constants';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { StatusDot } from '@/components/shared/StatusDot';
import { NodeHandles } from '@/components/canvas/TypedHandle';
import { NodeContextMenuWrapper } from '@/components/canvas/nodes/NodeContextMenu';
import { InlineVideoPreview } from '@/components/canvas/node-previews/InlineVideoPreview';
import {
  RUFLO_ARRIVAL_CLASS,
  RufloBadge,
  isRufloAdded,
  rufloBorderColor,
} from '@/components/canvas/nodes/RufloBadge';

export function SourceVideoNode({ id, data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    videoUrl?: string | null;
    fileName?: string;
    durationS?: number;
    thumbnailUrl?: string | null;
    bypassed?: boolean;
    extraInputs?: any;
    extraOutputs?: any;
  };
  const tone = STATUS_MAP[node.status];
  const ruflo = isRufloAdded(node.data);

  return (
    <NodeContextMenuWrapper nodeId={id} kind="source_video" nodeData={node.data}>
      <div
        className={`gs-card relative min-w-[224px] max-w-[224px] rounded-xl border bg-white px-3 py-3 transition ${ruflo ? RUFLO_ARRIVAL_CLASS : ''}`}
        style={{
          borderColor: rufloBorderColor(!!selected, ruflo),
          opacity: d.bypassed ? 0.45 : 1,
          filter: d.bypassed ? 'grayscale(0.4)' : undefined,
        }}
      >
        <NodeHandles kind="source_video" extraInputs={d.extraInputs} extraOutputs={d.extraOutputs} />
        {ruflo ? <RufloBadge /> : null}

        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          <div className="flex items-center gap-1.5">
            <Upload className="h-3 w-3 text-[var(--color-primary)]" />
            <span>📼 SOURCE</span>
          </div>
        </div>

        <div className="mb-2">
          {d.videoUrl ? (
            <InlineVideoPreview src={d.videoUrl} durationS={d.durationS} />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-md bg-[var(--color-muted-bg,#f5f6f8)] text-[10px] text-[var(--color-muted)]">
              Drop an mp4 via modal
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
          {d.fileName || d.durationS ? (
            <span className="truncate font-mono text-[10px]">
              {d.fileName ? d.fileName : ''}
              {d.fileName && d.durationS ? ' · ' : ''}
              {d.durationS ? `${d.durationS.toFixed(1)}s` : ''}
            </span>
          ) : null}
        </div>
      </div>
    </NodeContextMenuWrapper>
  );
}
