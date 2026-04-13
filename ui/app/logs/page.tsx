'use client';

import { useMemo, useState } from 'react';
import { LogFilters } from '@/components/logs/LogFilters';
import { LogViewer } from '@/components/logs/LogViewer';
import { usePipelineEvents } from '@/hooks/usePipelineEvents';
import type { PipelineEventSeverity } from '@/lib/types';
import { useEventsStore } from '@/store/events-store';

export default function LogsPage() {
  usePipelineEvents();
  const events = useEventsStore((state) => state.events);

  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<'all' | PipelineEventSeverity>('all');
  const [campaign, setCampaign] = useState('all');
  const [eventTypePrefixes, setEventTypePrefixes] = useState<string[]>([]);

  const campaigns = useMemo(
    () => Array.from(new Set(events.map((e) => e.campaignId))).sort(),
    [events],
  );

  const filtered = useMemo(
    () =>
      events.filter((event) => {
        if (severity !== 'all' && event.severity !== severity) return false;
        if (campaign !== 'all' && event.campaignId !== campaign) return false;
        if (
          eventTypePrefixes.length > 0 &&
          !eventTypePrefixes.some((p) => event.eventType.startsWith(p))
        ) {
          return false;
        }
        if (search) {
          const needle = search.toLowerCase();
          const hay = `${event.eventType} ${event.message ?? ''} ${JSON.stringify(event.payload)}`.toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        return true;
      }),
    [events, severity, campaign, eventTypePrefixes, search],
  );

  const toggleEventType = (prefix: string) =>
    setEventTypePrefixes((current) =>
      current.includes(prefix)
        ? current.filter((p) => p !== prefix)
        : [...current, prefix],
    );

  return (
    <div className="px-5 py-6">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Logs
        </div>
        <h1 className="mt-2 font-serif text-4xl text-[var(--color-ink)]">
          Pipeline Runtime
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Events emitted during campaign execution.
        </p>
      </div>

      <LogFilters
        search={search}
        severity={severity}
        campaign={campaign}
        campaigns={campaigns}
        eventTypePrefixes={eventTypePrefixes}
        onSearch={setSearch}
        onSeverity={setSeverity}
        onCampaign={setCampaign}
        onToggleEventType={toggleEventType}
      />
      <LogViewer events={filtered} />
    </div>
  );
}
