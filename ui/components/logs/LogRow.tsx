import type { CSSProperties } from 'react';
import type { PipelineEvent } from '@/lib/types';

type Category = 'generation' | 'scoring' | 'editing' | 'delivery' | 'failed' | 'other';

const CATEGORY_STYLES: Record<Category, { bg: string; fg: string; label: string }> = {
  generation: { bg: 'rgba(79, 70, 229, 0.14)', fg: '#4338ca', label: 'generation' },
  scoring: { bg: 'rgba(245, 158, 11, 0.16)', fg: '#b45309', label: 'scoring' },
  editing: { bg: 'rgba(139, 92, 246, 0.16)', fg: '#6d28d9', label: 'editing' },
  delivery: { bg: 'rgba(16, 185, 129, 0.16)', fg: '#047857', label: 'delivery' },
  failed: { bg: 'rgba(244, 63, 94, 0.16)', fg: '#be123c', label: 'failed' },
  other: { bg: 'rgba(26, 26, 26, 0.06)', fg: '#4b5563', label: 'event' },
};

export function categorize(eventType: string): Category {
  if (eventType.includes('fail') || eventType.includes('error')) return 'failed';
  if (eventType === 'candidate.delivered') return 'delivery';
  if (eventType === 'candidate.scored' || eventType.startsWith('tool.score.')) return 'scoring';
  if (eventType === 'candidate.edited' || eventType.startsWith('tool.edit.')) return 'editing';
  if (
    eventType === 'candidate.generating' ||
    eventType.startsWith('tool.video.') ||
    eventType.startsWith('tool.audio.')
  ) {
    return 'generation';
  }
  return 'other';
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

interface LogRowProps {
  event: PipelineEvent;
  expanded: boolean;
  onToggle: () => void;
  style?: CSSProperties;
}

export function LogRow({ event, expanded, onToggle, style }: LogRowProps) {
  const category = categorize(event.eventType);
  const palette = CATEGORY_STYLES[category];

  return (
    <button
      style={style}
      onClick={onToggle}
      className="flex w-full flex-col border-b border-black/6 px-4 py-3 text-left transition hover:bg-black/[0.02]"
    >
      <div className="grid grid-cols-[120px_140px_180px_80px_80px_1fr] items-center gap-3">
        <div className="font-mono text-[11px] text-[var(--color-muted)]">
          {formatTimestamp(event.timestamp)}
        </div>
        <div className="truncate font-mono text-[11px] text-[var(--color-muted)]">
          {event.campaignId.slice(0, 8)}
        </div>
        <div>
          <span
            className="inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ backgroundColor: palette.bg, color: palette.fg }}
          >
            {event.eventType}
          </span>
        </div>
        <div className="font-mono text-[11px] text-[var(--color-muted)]">
          {event.candidateIndex ?? '—'}
        </div>
        <div className="font-mono text-[11px] text-[var(--color-muted)]">
          {event.iterationIndex ?? '—'}
        </div>
        <div className="truncate text-sm text-[var(--color-ink)]">
          {event.message ?? event.eventType}
        </div>
      </div>

      {expanded ? (
        <pre className="mt-3 overflow-x-auto rounded-xl bg-black/[0.03] p-3 font-mono text-xs text-[var(--color-muted)]">
          {JSON.stringify(event.payload, null, 2)}
        </pre>
      ) : null}
    </button>
  );
}
