import type { PipelineEventSeverity } from '@/lib/types';

export const EVENT_TYPE_GROUPS: Array<{ label: string; prefix: string }> = [
  { label: 'job.*', prefix: 'job.' },
  { label: 'candidate.*', prefix: 'candidate.' },
  { label: 'iteration.*', prefix: 'iteration.' },
  { label: 'tool.*', prefix: 'tool.' },
];

interface LogFiltersProps {
  search: string;
  severity: 'all' | PipelineEventSeverity;
  campaign: string;
  campaigns: string[];
  eventTypePrefixes: string[];
  onSearch: (value: string) => void;
  onSeverity: (value: 'all' | PipelineEventSeverity) => void;
  onCampaign: (value: string) => void;
  onToggleEventType: (prefix: string) => void;
}

export function LogFilters({
  search,
  severity,
  campaign,
  campaigns,
  eventTypePrefixes,
  onSearch,
  onSeverity,
  onCampaign,
  onToggleEventType,
}: LogFiltersProps) {
  return (
    <div className="gs-card mb-5 grid gap-3 rounded-2xl p-4 md:grid-cols-[1fr_auto_auto]">
      <input
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder="Search events"
        className="rounded-xl border border-black/10 bg-black/[0.015] px-4 py-3 outline-none transition focus:border-[var(--color-primary)]"
      />
      <select
        value={severity}
        onChange={(event) =>
          onSeverity(event.target.value as 'all' | PipelineEventSeverity)
        }
        className="rounded-xl border border-black/10 bg-black/[0.015] px-4 py-3 outline-none transition focus:border-[var(--color-primary)]"
      >
        <option value="all">All severities</option>
        <option value="info">Info</option>
        <option value="warn">Warn</option>
        <option value="error">Error</option>
      </select>
      <select
        value={campaign}
        onChange={(event) => onCampaign(event.target.value)}
        className="rounded-xl border border-black/10 bg-black/[0.015] px-4 py-3 outline-none transition focus:border-[var(--color-primary)]"
      >
        <option value="all">All campaigns</option>
        {campaigns.map((id) => (
          <option key={id} value={id}>
            {id.slice(0, 8)}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-2 md:col-span-3">
        {EVENT_TYPE_GROUPS.map((group) => {
          const active = eventTypePrefixes.includes(group.prefix);
          return (
            <button
              key={group.prefix}
              type="button"
              onClick={() => onToggleEventType(group.prefix)}
              className="rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition"
              style={{
                backgroundColor: active
                  ? 'rgba(79, 70, 229, 0.14)'
                  : 'rgba(26, 26, 26, 0.04)',
                color: active ? 'var(--color-primary)' : 'var(--color-muted)',
              }}
            >
              {group.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
