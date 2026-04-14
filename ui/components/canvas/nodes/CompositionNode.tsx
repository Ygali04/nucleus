import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Layers } from 'lucide-react';
import { STATUS_MAP } from '@/lib/constants';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { StatusDot } from '@/components/shared/StatusDot';
import { InlineVideoPreview } from '@/components/canvas/node-previews/InlineVideoPreview';
import { InlineImageStripPreview } from '@/components/canvas/node-previews/InlineImageStripPreview';

export function CompositionNode({ data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    templateId?: string;
    sceneCount?: number;
    totalDurationS?: number;
    renderProgress?: number;
    outputUrl?: string | null;
    sceneThumbnails?: string[];
  };
  const tone = STATUS_MAP[node.status];
  const progressPct = Math.round((d.renderProgress ?? 0) * 100);
  const scenes = (d.sceneThumbnails ?? []).filter(Boolean);

  return (
    <div
      className="gs-card relative min-w-[216px] max-w-[216px] overflow-hidden rounded-[10px] border bg-white"
      style={{ borderColor: selected ? 'var(--color-primary)' : 'rgba(26,26,26,0.1)' }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />

      <div className="flex h-6 items-center gap-1.5 bg-[var(--color-dark,#1a1a1a)]/95 px-3 text-[10px] uppercase tracking-[0.12em] text-white">
        <Layers className="h-3 w-3" />
        <span>{d.templateId ?? 'Composition'}</span>
      </div>

      <div className="px-3 py-3">
        {d.outputUrl ? (
          <div className="mb-2">
            <InlineVideoPreview src={d.outputUrl} durationS={d.totalDurationS} />
          </div>
        ) : scenes.length > 0 ? (
          <div className="mb-2">
            <InlineImageStripPreview
              images={scenes.map((src) => ({ src, kind: 'image' as const }))}
              max={5}
            />
          </div>
        ) : null}

        <div className="mb-1 text-[13px] font-semibold text-[var(--color-ink)]">{node.label}</div>

        <div className="mb-2 flex items-center justify-between text-[11px] text-[var(--color-muted)]">
          <span>{d.sceneCount ?? 0} scenes</span>
          <span className="font-mono">{(d.totalDurationS ?? 0).toFixed(1)}s</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          <StatusDot color={tone.color} pulse={node.status === 'active'} />
          <span>{node.statusText}</span>
        </div>
      </div>

      {node.status === 'active' ? (
        <div className="h-[3px] w-full bg-[var(--color-muted-bg,#f5f6f8)]">
          <div
            className="h-full bg-[var(--color-primary)] transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
