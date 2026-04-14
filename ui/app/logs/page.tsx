'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCampaignsStore } from '@/store/campaigns-store';
import { useEventsStore } from '@/store/events-store';
import type { PipelineEvent } from '@/lib/types';

const EVENT_CATEGORY_COLOR: Record<string, string> = {
  generation: 'bg-indigo-100 text-indigo-700',
  scoring: 'bg-amber-100 text-amber-800',
  editing: 'bg-purple-100 text-purple-700',
  delivery: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700',
  info: 'bg-neutral-200 text-neutral-700',
};

function categorize(eventType: string): string {
  if (eventType.includes('failed') || eventType.includes('error')) return 'failed';
  if (eventType.startsWith('candidate.generating') || eventType.startsWith('tool.video') || eventType.startsWith('tool.audio') || eventType.startsWith('tool.compose')) return 'generation';
  if (eventType.startsWith('candidate.scored') || eventType.startsWith('iteration.evaluated') || eventType.startsWith('tool.score')) return 'scoring';
  if (eventType.startsWith('candidate.edited') || eventType.startsWith('tool.edit') || eventType.startsWith('tool.clip')) return 'editing';
  if (eventType.startsWith('candidate.delivered') || eventType.startsWith('tool.delivery')) return 'delivery';
  return 'info';
}

export default function LogsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const events = useEventsStore((s) => s.events);
  const campaigns = useCampaignsStore((s) => s.campaigns);

  const [campaignId, setCampaignId] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (campaignId !== 'all' && e.campaignId !== campaignId) return false;
      if (category !== 'all' && categorize(e.eventType) !== category) return false;
      if (search) {
        const hay = `${e.eventType} ${e.message ?? ''} ${JSON.stringify(e.payload ?? {})}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [events, campaignId, category, search]);

  return (
    <div className="px-5 py-6">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Pipeline Runtime
        </div>
        <h1 className="mt-2 font-serif text-4xl text-[var(--color-ink)]">
          Events
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Live stream of every event Nucleus publishes during campaign execution —
          generation, scoring, edit decisions, delivery.
        </p>
      </div>

      <div className="gs-card mb-4 flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Campaign
          </span>
          <select
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm text-[var(--color-ink)]"
          >
            <option value="all">All campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.brand_name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Event type
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm text-[var(--color-ink)]"
          >
            <option value="all">All</option>
            <option value="generation">Generation</option>
            <option value="scoring">Scoring</option>
            <option value="editing">Editing</option>
            <option value="delivery">Delivery</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto w-64 rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-faint)]"
        />
      </div>

      <div className="gs-card overflow-hidden rounded-2xl">
        <div className="border-b border-black/8 bg-[var(--color-muted-bg,#f7f8fa)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
          <div className="grid grid-cols-[170px_140px_90px_1fr] gap-3">
            <span>Timestamp</span>
            <span>Event</span>
            <span>Severity</span>
            <span>Message</span>
          </div>
        </div>
        {mounted && filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--color-muted)]">
            No events yet — run a campaign from the canvas to see its live events here.
          </div>
        ) : null}
        {mounted
          ? filtered.map((e) => <LogRow key={e.id} event={e} expanded={expandedId === e.id} onToggle={() => setExpandedId((p) => (p === e.id ? null : e.id))} />)
          : null}
      </div>
    </div>
  );
}

function LogRow({
  event,
  expanded,
  onToggle,
}: {
  event: PipelineEvent;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cat = categorize(event.eventType);
  const severity = event.severity ?? (cat === 'failed' ? 'error' : 'info');
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full flex-col border-b border-black/6 px-4 py-3 text-left transition hover:bg-black/[0.02]"
    >
      <div className="grid grid-cols-[170px_140px_90px_1fr] items-center gap-3">
        <div
          className="font-mono text-[11px] text-[var(--color-muted)]"
          suppressHydrationWarning
        >
          {event.timestamp.replace('T', ' ').slice(0, 19)}
        </div>
        <div>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${EVENT_CATEGORY_COLOR[cat]}`}
          >
            {event.eventType.split('.').pop()}
          </span>
        </div>
        <div>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
              severity === 'error'
                ? 'bg-rose-100 text-rose-700'
                : severity === 'warn'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-neutral-200 text-neutral-700'
            }`}
          >
            {severity}
          </span>
        </div>
        <div className="truncate text-sm text-[var(--color-ink)]">
          {event.message ?? event.eventType}
        </div>
      </div>
      {expanded ? (
        <pre className="mt-3 overflow-x-auto rounded-xl bg-black/[0.03] p-3 font-mono text-xs text-[var(--color-muted)]">
          {JSON.stringify(event.payload ?? {}, null, 2)}
        </pre>
      ) : null}
    </button>
  );
}
