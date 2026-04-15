import { type NodeProps } from '@xyflow/react';
import { Wand } from 'lucide-react';
import { STATUS_MAP } from '@/lib/constants';
import type { CanvasNodeData } from '@/lib/graph-layout';
import type { ImageEditNodeData } from '@/lib/types';
import { StatusDot } from '@/components/shared/StatusDot';
import { NodeHandles } from '@/components/canvas/TypedHandle';
import { NodeContextMenuWrapper } from '@/components/canvas/nodes/NodeContextMenu';
import {
  RUFLO_ARRIVAL_CLASS,
  RufloBadge,
  isRufloAdded,
  rufloBorderColor,
} from '@/components/canvas/nodes/RufloBadge';

const OPERATION_LABEL: Record<ImageEditNodeData['operation'], string> = {
  upscale: 'upscale',
  theme_transition: 'theme transition',
  style_transfer: 'style transfer',
  text_to_image: 'text to image',
};

export function ImageEditNode({ id, data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    operation?: ImageEditNodeData['operation'];
    prompt?: string;
    referenceImageUrl?: string;
    outputImageUrl?: string | null;
    bypassed?: boolean;
    extraInputs?: any;
    extraOutputs?: any;
  };
  const tone = STATUS_MAP[node.status];
  const ruflo = isRufloAdded(node.data);

  const before = d.referenceImageUrl;
  const after = d.outputImageUrl;
  const hasBoth = !!before && !!after;
  const hasOne = !!before || !!after;

  return (
    <NodeContextMenuWrapper nodeId={id} kind="image_edit">
      <div
        className={`gs-card relative min-w-[224px] max-w-[224px] rounded-xl border bg-white px-3 py-3 transition ${ruflo ? RUFLO_ARRIVAL_CLASS : ''}`}
        style={{
          borderColor: rufloBorderColor(!!selected, ruflo),
          opacity: d.bypassed ? 0.45 : 1,
          filter: d.bypassed ? 'grayscale(0.4)' : undefined,
        }}
      >
        <NodeHandles kind="image_edit" extraInputs={d.extraInputs} extraOutputs={d.extraOutputs} />
        {ruflo ? <RufloBadge /> : null}

        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          <div className="flex items-center gap-1.5">
            <Wand className="h-3 w-3 text-[var(--color-primary)]" />
            <span>🖼️ IMAGE EDIT</span>
          </div>
        </div>

        <div className="mb-2 aspect-video w-full overflow-hidden rounded-md bg-[var(--color-muted-bg,#f5f6f8)]">
          {hasBoth ? (
            <div className="grid h-full w-full grid-cols-2 gap-0.5">
              <img src={before} alt="before" className="h-full w-full object-cover" />
              <img src={after!} alt="after" className="h-full w-full object-cover" />
            </div>
          ) : hasOne ? (
            <img
              src={(after ?? before)!}
              alt={node.label}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--color-muted)]">
              No image yet
            </div>
          )}
        </div>

        <div className="mb-1 text-[13px] font-semibold text-[var(--color-ink)]">
          {node.label}
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
          <div className="flex items-center gap-1.5">
            <StatusDot color={tone.color} pulse={node.status === 'active'} />
            <span>{node.statusText}</span>
          </div>
          {d.operation ? (
            <span className="font-mono text-[10px] lowercase">
              {OPERATION_LABEL[d.operation]}
            </span>
          ) : null}
        </div>
      </div>
    </NodeContextMenuWrapper>
  );
}
