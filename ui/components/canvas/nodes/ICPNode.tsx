import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Target } from 'lucide-react';
import { STATUS_MAP } from '@/lib/constants';
import type { CanvasNodeData } from '@/lib/graph-layout';
import { StatusDot } from '@/components/shared/StatusDot';

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  shorts: 'Shorts',
  reels: 'Reels',
};

export function ICPNode({ data, selected }: NodeProps) {
  const node = data as CanvasNodeData;
  const d = (node.data ?? {}) as {
    personaName?: string;
    platform?: string;
    painPoint?: string;
  };
  const tone = STATUS_MAP[node.status];
  const platformLabel = d.platform
    ? PLATFORM_LABELS[d.platform.toLowerCase()] ?? d.platform
    : null;

  return (
    <div
      className="gs-card relative min-w-[208px] max-w-[208px] rounded-xl border bg-white px-3 py-3"
      style={{ borderColor: selected ? 'var(--color-primary)' : 'rgba(26,26,26,0.1)' }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]" />

      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
        <div className="flex items-center gap-1.5">
          <Target className="h-3 w-3 text-[var(--color-primary)]" />
          <span>ICP</span>
        </div>
        {platformLabel ? (
          <span className="rounded bg-[var(--color-primary-soft,#eef2ff)] px-1.5 py-0.5 text-[10px] text-[var(--color-primary)]">
            {platformLabel}
          </span>
        ) : null}
      </div>

      <div className="mb-1 text-[13px] font-semibold text-[var(--color-ink)]">
        {d.personaName ?? node.label}
      </div>

      {d.painPoint ? (
        <div className="mb-2 line-clamp-2 text-[11px] text-[var(--color-muted)]">
          “{d.painPoint}”
        </div>
      ) : null}

      <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
        <StatusDot color={tone.color} pulse={node.status === 'active'} />
        <span>{node.statusText}</span>
      </div>
    </div>
  );
}
