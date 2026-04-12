import type { CSSProperties } from 'react';
import { BrassPill } from '@/components/shared/BrassPill';
import type { ActivityEntry } from '@/lib/types';

interface LogRowProps {
  entry: ActivityEntry;
  expanded: boolean;
  onToggle: () => void;
  style?: CSSProperties;
}

export function LogRow({ entry, expanded, onToggle, style }: LogRowProps) {
  const level =
    entry.type === 'error' || entry.type === 'task_failed'
      ? 'error'
      : entry.type === 'reflection' || entry.type === 'preempted'
        ? 'warn'
        : 'info';

  return (
    <button
      style={style}
      onClick={onToggle}
      className="flex w-full flex-col border-b border-black/6 px-4 py-3 text-left transition hover:bg-black/[0.02]"
    >
      <div className="grid grid-cols-[140px_160px_90px_1fr] items-center gap-3">
        <div className="font-mono text-[11px] text-[var(--color-muted)]">
          {entry.ts.replace('T', ' ').slice(0, 19)}
        </div>
        <div>
          <BrassPill tone="neutral" className="normal-case tracking-[0.08em]">
            {entry.agent}
          </BrassPill>
        </div>
        <div>
          <BrassPill tone={level === 'error' ? 'dark' : 'brass'}>
            {level}
          </BrassPill>
        </div>
        <div className="truncate text-sm text-[var(--color-ink)]">
          {(entry.data.summary as string) || entry.taskTitle || entry.type}
        </div>
      </div>

      {expanded ? (
        <pre className="mt-3 overflow-x-auto rounded-xl bg-black/[0.03] p-3 font-mono text-xs text-[var(--color-muted)]">
          {JSON.stringify(entry.data, null, 2)}
        </pre>
      ) : null}
    </button>
  );
}
