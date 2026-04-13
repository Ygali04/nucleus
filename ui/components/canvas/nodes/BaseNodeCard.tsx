import type { ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import { STATUS_MAP } from '@/lib/constants';
import { BrassPill } from '@/components/shared/BrassPill';
import { StatusDot } from '@/components/shared/StatusDot';

interface BaseNodeCardProps {
  header: ReactNode;
  title: string;
  status: keyof typeof STATUS_MAP;
  statusText: string;
  metaTag?: string | null;
  selected?: boolean;
  newBadge?: boolean;
  className?: string;
}

export function BaseNodeCard({
  header,
  title,
  status,
  statusText,
  metaTag,
  selected = false,
  newBadge = false,
  className = '',
}: BaseNodeCardProps) {
  const tone = STATUS_MAP[status];

  return (
    <div
      className={`gs-card relative min-w-[208px] max-w-[208px] rounded-xl border px-4 py-3 transition ${className}`}
      style={{
        borderColor: selected ? 'var(--color-primary)' : 'rgba(26,26,26,0.1)',
        background:
          selected || status === 'new' ? 'rgba(184,160,122,0.05)' : 'white',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-[var(--color-primary)]"
      />

      {newBadge ? (
        <div className="absolute right-3 top-3">
          <BrassPill>New</BrassPill>
        </div>
      ) : null}

      <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
        {header}
      </div>

      <div className="mb-2 text-[13px] font-semibold text-[var(--color-ink)]">
        {title}
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs text-[var(--color-muted)]">
        <StatusDot color={tone.color} pulse={status === 'active'} />
        <span>{statusText}</span>
      </div>

      {metaTag ? (
        <BrassPill className="max-w-full truncate normal-case tracking-[0.08em]">
          {metaTag}
        </BrassPill>
      ) : null}
    </div>
  );
}
