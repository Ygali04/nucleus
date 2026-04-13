import type { CampaignStatus } from '@/lib/types';

const STATUS_STYLES: Record<
  CampaignStatus,
  { label: string; className: string; dotClassName: string }
> = {
  idle: {
    label: 'Idle',
    className: 'bg-neutral-200/70 text-neutral-600',
    dotClassName: 'bg-neutral-400',
  },
  running: {
    label: 'Running',
    className: 'bg-indigo-100 text-indigo-700',
    dotClassName: 'bg-indigo-500 animate-pulse',
  },
  scored: {
    label: 'Scored',
    className: 'bg-emerald-100 text-emerald-700',
    dotClassName: 'bg-emerald-500',
  },
  failed: {
    label: 'Failed',
    className: 'bg-rose-100 text-rose-700',
    dotClassName: 'bg-rose-500',
  },
};

interface CampaignStatusPillProps {
  status: CampaignStatus;
  className?: string;
}

export function CampaignStatusPill({
  status,
  className = '',
}: CampaignStatusPillProps) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${style.className} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dotClassName}`} />
      {style.label}
    </span>
  );
}
