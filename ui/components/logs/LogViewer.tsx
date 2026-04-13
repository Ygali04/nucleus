'use client';

import { useState } from 'react';
import { LogRow } from '@/components/logs/LogRow';
import type { PipelineEvent } from '@/lib/types';

interface LogViewerProps {
  events: PipelineEvent[];
}

export function LogViewer({ events }: LogViewerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (events.length === 0) {
    return (
      <div className="gs-card overflow-hidden rounded-2xl">
        <div className="border-b border-black/8 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Pipeline events
        </div>
        <div className="px-4 py-16 text-center text-sm text-[var(--color-muted)]">
          No events yet. Run a campaign to see runtime events here.
        </div>
      </div>
    );
  }

  return (
    <div className="gs-card overflow-hidden rounded-2xl">
      <div className="border-b border-black/8 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
        Pipeline events
      </div>
      <div className="grid grid-cols-[120px_140px_180px_80px_80px_1fr] gap-3 border-b border-black/6 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
        <div>Timestamp</div>
        <div>Campaign</div>
        <div>Event type</div>
        <div>Candidate</div>
        <div>Iteration</div>
        <div>Message</div>
      </div>
      <div className="gs-scroll max-h-[620px] overflow-y-auto">
        {events.map((event) => (
          <LogRow
            key={event.id}
            event={event}
            expanded={expandedId === event.id}
            onToggle={() =>
              setExpandedId((current) => (current === event.id ? null : event.id))
            }
          />
        ))}
      </div>
    </div>
  );
}
