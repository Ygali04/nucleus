'use client';

import type { KeyMoment, KeyMomentType } from '@/lib/types';

interface KeyMomentsListProps {
  moments: KeyMoment[];
}

const MOMENT_STYLE: Record<
  KeyMomentType,
  { label: string; badgeClass: string }
> = {
  dropoff_risk: {
    label: 'Dropoff Risk',
    badgeClass: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  best_hook: {
    label: 'Best Hook',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  peak_engagement: {
    label: 'Peak Engagement',
    badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  },
  emotional_peak: {
    label: 'Emotional Peak',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  recovery: {
    label: 'Recovery',
    badgeClass: 'bg-sky-100 text-sky-700 border-sky-200',
  },
};

const TYPE_PRIORITY: Record<KeyMomentType, number> = {
  dropoff_risk: 0,
  best_hook: 1,
  peak_engagement: 2,
  emotional_peak: 3,
  recovery: 4,
};

function formatTimestamp(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function KeyMomentsList({ moments }: KeyMomentsListProps) {
  const sorted = moments.slice().sort((a, b) => {
    const aRank = TYPE_PRIORITY[a.type] ?? 99;
    const bRank = TYPE_PRIORITY[b.type] ?? 99;
    if (aRank !== bRank) return aRank - bRank;
    return a.timestamp - b.timestamp;
  });

  if (sorted.length === 0) {
    return (
      <div className="text-sm text-[var(--color-muted)]">
        No key moments detected.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {sorted.map((moment, index) => {
        const style = MOMENT_STYLE[moment.type] ?? {
          label: moment.type,
          badgeClass: 'bg-black/5 text-[var(--color-ink)] border-black/10',
        };
        return (
          <li
            key={`${moment.type}-${moment.timestamp}-${index}`}
            className="flex items-start justify-between gap-3 rounded-xl border border-black/8 bg-black/[0.015] px-4 py-3"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[var(--color-muted)]">
                  {formatTimestamp(moment.timestamp)}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${style.badgeClass}`}
                >
                  {style.label}
                </span>
              </div>
              <div className="mt-1 text-sm text-[var(--color-ink)]">
                {moment.label}
              </div>
            </div>
            <div className="text-right font-mono text-sm text-[var(--color-ink)]">
              {moment.score.toFixed(1)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
