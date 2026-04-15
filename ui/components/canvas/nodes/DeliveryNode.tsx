import { useState } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Package, Sparkles, X } from 'lucide-react';
import { STATUS_MAP } from '@/lib/constants';
import type { CanvasNodeData } from '@/lib/graph-layout';
import type { CampaignDeliverables } from '@/lib/api-client';
import { StatusDot } from '@/components/shared/StatusDot';
import { NodeHandles } from '@/components/canvas/TypedHandle';
import { NodeContextMenuWrapper } from '@/components/canvas/nodes/NodeContextMenu';
import {
  RUFLO_ARRIVAL_CLASS,
  RufloBadge,
  isRufloAdded,
  rufloBorderColor,
} from '@/components/canvas/nodes/RufloBadge';
import { DeliveryReport } from '@/components/reports/DeliveryReport';

export function DeliveryNode({ id, data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    variantCount?: number;
    exportFormats?: string[];
    cdnUrl?: string | null;
    badgeText?: string;
    bypassed?: boolean;
    deliverables?: CampaignDeliverables | null;
    gtm_ready?: boolean;
    brandName?: string;
    campaignId?: string;
  };
  const [showReader, setShowReader] = useState(false);
  const deliverables = d.deliverables ?? null;
  const hasDeliverables =
    !!deliverables && !!(deliverables.gtm_guide || deliverables.sop_doc);
  const tone = STATUS_MAP[node.status];
  const formats = (d.exportFormats ?? []).filter(Boolean);
  const shipText = d.cdnUrl ?? 'Ready to ship';
  const badge = d.badgeText ?? (node.status === 'active' ? 'Shipping' : 'Ready');
  const ruflo = isRufloAdded(node.data);

  return (
    <NodeContextMenuWrapper nodeId={id} kind="delivery">
      <div
        className={`gs-card relative min-w-[216px] max-w-[216px] rounded-xl border bg-white px-3 py-3 ${ruflo ? RUFLO_ARRIVAL_CLASS : ''}`}
        style={{
          borderColor: rufloBorderColor(!!selected, ruflo),
          opacity: d.bypassed ? 0.45 : 1,
          filter: d.bypassed ? 'grayscale(0.4)' : undefined,
        }}
      >
        <NodeHandles kind="delivery" extraInputs={(d as { extraInputs?: any }).extraInputs} extraOutputs={(d as { extraOutputs?: any }).extraOutputs} />
        {ruflo ? <RufloBadge /> : null}

        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
          <div className="flex items-center gap-1.5">
            <Package className="h-3 w-3 text-[var(--color-primary)]" />
            <span>Delivery</span>
          </div>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: 'var(--color-primary-soft,#eef2ff)',
              color: 'var(--color-primary)',
            }}
          >
            {badge}
          </span>
        </div>

        <div className="mb-1 text-[13px] font-semibold text-[var(--color-ink)]">
          {d.variantCount !== undefined ? `${d.variantCount} variants` : node.label}
        </div>

        {formats.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1">
            {formats.map((f) => (
              <span
                key={f}
                className="rounded bg-[var(--color-muted-bg,#f5f6f8)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-muted)]"
              >
                {f}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mb-2 truncate font-mono text-[10px] text-[var(--color-muted)]" title={shipText}>
          {shipText}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          <StatusDot color={tone.color} pulse={node.status === 'active'} />
          <span>{node.statusText}</span>
        </div>

        {hasDeliverables ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowReader(true);
            }}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary-soft,#eef2ff)] px-2 py-1.5 text-[11px] font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
          >
            <Sparkles className="h-3 w-3" />
            GTM + SOP ready
          </button>
        ) : (
          <div className="mt-2 rounded-md border border-dashed border-black/15 px-2 py-1.5 text-center text-[10px] text-[var(--color-muted)]">
            Awaiting strategist
          </div>
        )}
      </div>

      {showReader && hasDeliverables && deliverables ? (
        <div
          className="fixed inset-0 z-[120] flex items-stretch justify-center bg-black/60 p-4"
          onClick={() => setShowReader(false)}
        >
          <div
            className="flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[var(--color-bg,white)] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Delivery
                </div>
                <div className="text-sm font-semibold text-[var(--color-ink)]">
                  GTM Strategy + SOP
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReader(false)}
                className="rounded-md border border-black/10 bg-white p-1.5 text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                aria-label="Close reader"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto px-5 py-4">
              <DeliveryReport
                campaignId={d.campaignId ?? id}
                brandName={d.brandName}
                deliverables={deliverables}
              />
            </div>
          </div>
        </div>
      ) : null}
    </NodeContextMenuWrapper>
  );
}
