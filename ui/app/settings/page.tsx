'use client';

import { useAgents } from '@/hooks/useAgents';
import { useDashboardStore } from '@/store/dashboard-store';

export default function SettingsPage() {
  useAgents();
  const agents = useDashboardStore((state) => state.agents);
  const isLiveMode = useDashboardStore((state) => state.isLiveMode);

  const policyRows = [
    [
      'Dashboard API',
      process.env.NEXT_PUBLIC_DASHBOARD_API_BASE || 'http://localhost:3200',
    ],
    [
      'WebSocket URL',
      process.env.NEXT_PUBLIC_DASHBOARD_WS_URL || 'ws://localhost:3200',
    ],
    ['Mode', isLiveMode ? 'Live runtime' : 'Demo fallback'],
    ['Protected files', 'SYSTEM.md, runtime.config.yaml'],
    ['Daily cost limit', '$500'],
  ];

  return (
    <div className="space-y-6 px-5 py-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Settings
        </div>
        <h1 className="mt-2 font-serif text-4xl text-[var(--color-ink)]">
          Runtime Configuration Snapshot
        </h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="gs-card rounded-2xl p-5">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brass)]">
            Environment
          </div>
          <div className="space-y-3">
            {policyRows.map(([label, value]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4 rounded-xl border border-black/8 bg-black/[0.015] px-4 py-3 text-sm"
              >
                <span className="text-[var(--color-muted)]">{label}</span>
                <span className="text-right text-[var(--color-ink)]">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="gs-card rounded-2xl p-5">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-brass)]">
            Agent Models
          </div>
          <div className="space-y-3">
            {agents.slice(0, 10).map((agent) => (
              <div
                key={agent.id}
                className="rounded-xl border border-black/8 bg-black/[0.015] px-4 py-3"
              >
                <div className="text-sm font-medium text-[var(--color-ink)]">
                  {agent.id}
                </div>
                <div className="mt-1 text-sm text-[var(--color-muted)]">
                  {agent.config.model}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
