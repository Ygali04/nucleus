'use client';

import { useMemo, useState } from 'react';
import { List, type RowComponentProps } from 'react-window';
import { LogRow } from '@/components/logs/LogRow';
import type { ActivityEntry } from '@/lib/types';

interface LogViewerProps {
  entries: ActivityEntry[];
}

interface RowProps {
  entries: ActivityEntry[];
  expandedId: string | null;
  onToggle: (id: string) => void;
}

function Row({
  index,
  style,
  entries,
  expandedId,
  onToggle,
}: RowComponentProps<RowProps>) {
  const entry = entries[index];
  const key = `${entry.ts}-${entry.agent}-${index}`;
  return (
    <LogRow
      entry={entry}
      expanded={expandedId === key}
      onToggle={() => onToggle(key)}
      style={style}
    />
  );
}

export function LogViewer({ entries }: LogViewerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const rowHeight = useMemo(
    () => (index: number) => {
      const entry = entries[index];
      const key = `${entry.ts}-${entry.agent}-${index}`;
      return expandedId === key ? 168 : 72;
    },
    [entries, expandedId],
  );

  return (
    <div className="gs-card overflow-hidden rounded-2xl">
      <div className="border-b border-black/8 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
        Structured activity log
      </div>
      <List
        className="gs-scroll"
        style={{ height: 620 }}
        defaultHeight={620}
        rowCount={entries.length}
        rowHeight={rowHeight}
        rowComponent={Row}
        rowProps={{
          entries,
          expandedId,
          onToggle: (id: string) =>
            setExpandedId((current) => (current === id ? null : id)),
        }}
      />
    </div>
  );
}
