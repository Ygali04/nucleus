import { type NodeProps } from '@xyflow/react';
import { Book } from 'lucide-react';
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

export function BrandKBNode({ id, data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    brandName?: string;
    voiceTone?: string[];
    docCount?: number;
    bypassed?: boolean;
  };
  const tone = STATUS_MAP[node.status];
  const attributes = (d.voiceTone ?? []).filter(Boolean);
  const ruflo = isRufloAdded(node.data);

  return (
    <NodeContextMenuWrapper nodeId={id} kind="brand_kb">
      <div
        className={`gs-card relative min-w-[216px] max-w-[216px] rounded-xl border bg-white px-3 py-3 ${ruflo ? RUFLO_ARRIVAL_CLASS : ''}`}
        style={{
          borderColor: rufloBorderColor(!!selected, ruflo),
          opacity: d.bypassed ? 0.45 : 1,
          filter: d.bypassed ? 'grayscale(0.4)' : undefined,
        }}
      >
        <NodeHandles kind="brand_kb" extraInputs={(d as { extraInputs?: any }).extraInputs} extraOutputs={(d as { extraOutputs?: any }).extraOutputs} />
        {ruflo ? <RufloBadge /> : null}

        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          <div className="flex items-center gap-1.5">
            <Book className="h-3 w-3 text-[var(--color-primary)]" />
            <span>Brand KB</span>
          </div>
          {d.docCount !== undefined ? (
            <span className="rounded bg-[var(--color-primary-soft,#eef2ff)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-primary)]">
              {d.docCount} docs
            </span>
          ) : null}
        </div>

        <div className="mb-1 text-[13px] font-semibold text-[var(--color-ink)]">
          {d.brandName ?? node.label}
        </div>

        {attributes.length > 0 ? (
          <div className="mb-2 line-clamp-2 text-[11px] italic text-[var(--color-muted)]">
            {attributes.join(', ')}
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
