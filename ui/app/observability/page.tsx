'use client';

import { useMemo } from 'react';
import { ActiveAgentsGauge } from '@/components/observability/ActiveAgentsGauge';
import { ChartCard } from '@/components/observability/ChartCard';
import { CostChart } from '@/components/observability/CostChart';
import { ErrorRateChart } from '@/components/observability/ErrorRateChart';
import { LLMCallChart } from '@/components/observability/LLMCallChart';
import { TaskChart } from '@/components/observability/TaskChart';
import { TokenChart } from '@/components/observability/TokenChart';
import { useActivity } from '@/hooks/useActivity';
import { useAgents } from '@/hooks/useAgents';
import { useCostHistory } from '@/hooks/useCostHistory';
import { useTasks } from '@/hooks/useTasks';
import { useDashboardStore } from '@/store/dashboard-store';

function hourKey(iso: string) {
  return new Date(iso).toISOString().slice(11, 16);
}

export default function ObservabilityPage() {
  useAgents();
  useTasks();
  useActivity();
  useCostHistory();

  const agents = useDashboardStore((state) => state.agents);
  const tasks = useDashboardStore((state) => state.tasks);
  const activity = useDashboardStore((state) => state.activity);
  const costHistory = useDashboardStore((state) => state.costHistory);

  const taskChartData = useMemo(() => {
    const bucket = new Map<string, number>();
    tasks.forEach((task) => {
      const key = hourKey(task.completed_at || task.created_at);
      bucket.set(
        key,
        (bucket.get(key) || 0) + (task.status === 'completed' ? 1 : 0),
      );
    });
    return Array.from(bucket.entries()).map(([hour, completed]) => ({
      hour,
      completed,
    }));
  }, [tasks]);

  const tokenChartData = useMemo(
    () =>
      costHistory.map((point) => ({
        hour: hourKey(point.timestamp),
        input: Math.round((point.tokens || 0) * 0.62),
        output: Math.round((point.tokens || 0) * 0.38),
      })),
    [costHistory],
  );

  const llmChartData = useMemo(() => {
    const bucket = new Map<
      string,
      { hour: string; minimax: number; anthropic: number; openrouter: number }
    >();
    costHistory.forEach((point) => {
      const hour = hourKey(point.timestamp);
      if (!bucket.has(hour)) {
        bucket.set(hour, { hour, minimax: 0, anthropic: 0, openrouter: 0 });
      }
      const row = bucket.get(hour)!;
      if (point.provider === 'MiniMax') row.minimax += 1;
      else if (point.provider === 'Anthropic') row.anthropic += 1;
      else row.openrouter += 1;
    });
    return Array.from(bucket.values());
  }, [costHistory]);

  const errorRateData = useMemo(() => {
    const bucket = new Map<string, number>();
    activity.forEach((entry) => {
      const hour = hourKey(entry.ts);
      if (!bucket.has(hour)) bucket.set(hour, 0);
      if (entry.type === 'error' || entry.type === 'task_failed') {
        bucket.set(hour, (bucket.get(hour) || 0) + 1);
      }
    });
    return Array.from(bucket.entries()).map(([hour, errors]) => ({
      hour,
      errors,
    }));
  }, [activity]);

  const activeAgents = agents.filter(
    (agent) => agent.state.status === 'running',
  ).length;

  return (
    <div className="space-y-6 px-5 py-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Observability
        </div>
        <h1 className="mt-2 font-serif text-4xl text-[var(--color-ink)]">
          Performance and Runtime Telemetry
        </h1>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title="Cost Per Hour"
          subtitle="Cumulative spend flowing through the pipeline runtime"
        >
          <CostChart data={costHistory} />
        </ChartCard>
        <ChartCard
          title="Tasks Completed"
          subtitle="Completed work items by hourly bucket"
        >
          <TaskChart data={taskChartData} />
        </ChartCard>
        <ChartCard
          title="LLM Calls"
          subtitle="Provider mix across the last 48 hours"
        >
          <LLMCallChart data={llmChartData} />
        </ChartCard>
        <ChartCard title="Token Usage" subtitle="Input vs output token mix">
          <TokenChart data={tokenChartData} />
        </ChartCard>
        <ChartCard
          title="Active Agents"
          subtitle="Current number of agents in a running state"
        >
          <ActiveAgentsGauge active={activeAgents} total={agents.length} />
        </ChartCard>
        <ChartCard
          title="Error Rate"
          subtitle="Runtime errors and failed tasks"
        >
          <ErrorRateChart data={errorRateData} />
        </ChartCard>
      </div>
    </div>
  );
}
