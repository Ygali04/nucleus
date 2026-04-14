import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Film, Play } from 'lucide-react';
import { STATUS_MAP } from '@/lib/constants';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { StatusDot } from '@/components/shared/StatusDot';
import { InlineVideoPreview } from '@/components/canvas/node-previews/InlineVideoPreview';
import { useCanvasStore } from '@/store/canvas-store';

export function VideoGenNode({ data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    provider?: string;
    thumbnailUrl?: string | null;
    videoUrl?: string | null;
    costUsd?: number;
    durationS?: number;
    iterationCount?: number;
  };
  const tone = STATUS_MAP[node.status];
  const openMediaPreview = useCanvasStore((s) => s.openMediaPreview);

  return (
    <div
      className="gs-card relative min-w-[224px] max-w-[224px] overflow-hidden rounded-[10px] border bg-white transition"
      style={{
        borderColor: selected ? 'var(--color-primary)' : 'rgba(26,26,26,0.1)',
      }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />

      <div className="flex h-6 items-center justify-between bg-[var(--color-dark,#1a1a1a)]/95 px-3 text-[10px] uppercase tracking-[0.12em] text-white">
        <div className="flex items-center gap-1.5">
          <Film className="h-3 w-3" />
          <span>{d.provider ?? 'Video'}</span>
        </div>
        {d.costUsd !== undefined ? (
          <span className="font-mono text-[10px] opacity-80">${d.costUsd.toFixed(3)}</span>
        ) : null}
      </div>

      <div className="px-3 py-3">
        <div className="mb-2">
          {d.videoUrl ? (
            <InlineVideoPreview src={d.videoUrl} durationS={d.durationS} />
          ) : d.thumbnailUrl ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (d.thumbnailUrl) openMediaPreview(d.thumbnailUrl, 'image');
              }}
              className="relative block aspect-video w-full overflow-hidden rounded-md shadow-inner"
              aria-label="Open thumbnail"
            >
              <img src={d.thumbnailUrl} alt={node.label} className="h-full w-full object-cover" />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
                  <Play className="h-4 w-4 translate-x-[1px] text-[var(--color-ink)]" />
                </span>
              </span>
            </button>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-md bg-[var(--color-muted-bg,#f5f6f8)] text-[10px] text-[var(--color-muted)] shadow-inner">
              No preview yet
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
    </div>
  );
}
