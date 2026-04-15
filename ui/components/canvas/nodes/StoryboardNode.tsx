import { type NodeProps } from '@xyflow/react';
import { Images } from 'lucide-react';
import { STATUS_MAP } from '@/lib/constants';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { StatusDot } from '@/components/shared/StatusDot';
import { NodeHandles } from '@/components/canvas/TypedHandle';
import { NodeContextMenuWrapper } from '@/components/canvas/nodes/NodeContextMenu';
import { InlineImageStripPreview } from '@/components/canvas/node-previews/InlineImageStripPreview';
import {
  RUFLO_ARRIVAL_CLASS,
  RufloBadge,
  isRufloAdded,
  rufloBorderColor,
} from '@/components/canvas/nodes/RufloBadge';

export function StoryboardNode({ id, data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    prompt?: string;
    frameCount?: number;
    aspectRatio?: string;
    imageUrls?: string[];
    styleHints?: string;
    bypassed?: boolean;
    extraInputs?: any;
    extraOutputs?: any;
  };
  const tone = STATUS_MAP[node.status];
  const ruflo = isRufloAdded(node.data);
  const urls = d.imageUrls ?? [];
  const visible = urls.slice(0, 4);
  const remaining = Math.max(0, urls.length - visible.length);
  const promptPreview = (d.prompt ?? '').slice(0, 60);

  return (
    <NodeContextMenuWrapper nodeId={id} kind="storyboard">
      <div
        className={`gs-card relative min-w-[224px] max-w-[224px] rounded-xl border bg-white px-3 py-3 transition ${ruflo ? RUFLO_ARRIVAL_CLASS : ''}`}
        style={{
          borderColor: rufloBorderColor(!!selected, ruflo),
          opacity: d.bypassed ? 0.45 : 1,
          filter: d.bypassed ? 'grayscale(0.4)' : undefined,
        }}
      >
        <NodeHandles kind="storyboard" extraInputs={d.extraInputs} extraOutputs={d.extraOutputs} />
        {ruflo ? <RufloBadge /> : null}

        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          <div className="flex items-center gap-1.5">
            <Images className="h-3 w-3 text-[var(--color-primary)]" />
            <span>🎬 STORYBOARD</span>
          </div>
          {d.aspectRatio ? (
            <span className="font-mono text-[10px]">{d.aspectRatio}</span>
          ) : null}
        </div>

        <div className="mb-2">
          {visible.length > 0 ? (
            <div className="relative">
              <InlineImageStripPreview
                images={visible.map((src) => ({ src, kind: 'image' as const }))}
                max={4}
                className="!grid-cols-4"
              />
              {remaining > 0 ? (
                <span className="pointer-events-none absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 py-0.5 font-mono text-[9px] text-white">
                  +{remaining} more
                </span>
              ) : null}
            </div>
          ) : (
            <div className="flex h-12 w-full items-center justify-center rounded-md bg-[var(--color-muted-bg,#f5f6f8)] text-[10px] text-[var(--color-muted)]">
              No frames yet
            </div>
          )}
        </div>

        <div className="mb-1 text-[13px] font-semibold text-[var(--color-ink)]">
          {node.label}
        </div>

        {promptPreview ? (
          <div className="mb-2 truncate text-[11px] text-[var(--color-muted)]">
            {promptPreview}
            {(d.prompt?.length ?? 0) > 60 ? '…' : ''}
          </div>
        ) : null}

        <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
          <div className="flex items-center gap-1.5">
            <StatusDot color={tone.color} pulse={node.status === 'active'} />
            <span>{node.statusText}</span>
          </div>
          {d.frameCount !== undefined ? (
            <span className="font-mono text-[10px]">{d.frameCount} frames</span>
          ) : null}
        </div>
      </div>
    </NodeContextMenuWrapper>
  );
}
