'use client';

import { useMemo, useState } from 'react';
import { LogFilters } from '@/components/logs/LogFilters';
import { LogViewer } from '@/components/logs/LogViewer';
import { useActivity } from '@/hooks/useActivity';
import { useDashboardStore } from '@/store/dashboard-store';

export default function LogsPage() {
  useActivity(500);
  const activity = useDashboardStore((state) => state.activity);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');
  const [agent, setAgent] = useState('all');

  const agents = useMemo(
    () => Array.from(new Set(activity.map((entry) => entry.agent))).sort(),
    [activity],
  );

  const entries = useMemo(
    () =>
      activity.filter((entry) => {
        const levelMatch =
          level === 'all'
            ? true
            : level === 'error'
              ? entry.type === 'error' || entry.type === 'task_failed'
              : level === 'warn'
                ? entry.type === 'reflection' || entry.type === 'preempted'
                : !(
                    entry.type === 'error' ||
                    entry.type === 'task_failed' ||
                    entry.type === 'reflection' ||
                    entry.type === 'preempted'
                  );

        const agentMatch = agent === 'all' ? true : entry.agent === agent;
        const searchMatch = search
          ? JSON.stringify(entry).toLowerCase().includes(search.toLowerCase())
          : true;

        return levelMatch && agentMatch && searchMatch;
      }),
    [activity, agent, level, search],
  );

  return (
    <div className="px-5 py-6">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Logs
        </div>
        <h1 className="mt-2 font-serif text-4xl text-[var(--color-ink)]">
          Structured Runtime Feed
        </h1>
      </div>

      <LogFilters
        search={search}
        level={level}
        agent={agent}
        agents={agents}
        onSearch={setSearch}
        onLevel={setLevel}
        onAgent={setAgent}
      />
      <LogViewer entries={entries} />
    </div>
  );
}
