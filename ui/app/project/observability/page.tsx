'use client';

import { useMemo } from 'react';
import { ActiveAgentsGauge } from '@/components/observability/ActiveAgentsGauge';
import { ChartCard } from '@/components/observability/ChartCard';
import { ErrorRateChart } from '@/components/observability/ErrorRateChart';
import { TaskChart } from '@/components/observability/TaskChart';
import { useActivity } from '@/hooks/useActivity';
import { useAgents } from '@/hooks/useAgents';
import { useMessages } from '@/hooks/useMessages';
import { useTasks } from '@/hooks/useTasks';
import { useDashboardStore } from '@/store/dashboard-store';

function hourKey(iso: string) {
  return new Date(iso).toISOString().slice(11, 16);
}

export default function ProjectObservabilityPage() {
  useAgents();
  useTasks();
  useActivity();
  useMessages();

  const agents = useDashboardStore((state) => state.agents);
  const tasks = useDashboardStore((state) => state.tasks);
  const activity = useDashboardStore((state) => state.activity);
  const messages = useDashboardStore((state) => state.messages);

  const completedTaskData = useMemo(() => {
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

  const failedTaskData = useMemo(() => {
    const bucket = new Map<string, number>();
    tasks.forEach((task) => {
      const key = hourKey(task.completed_at || task.created_at);
      bucket.set(
        key,
        (bucket.get(key) || 0) + (task.status === 'failed' ? 1 : 0),
      );
    });
    return Array.from(bucket.entries()).map(([hour, errors]) => ({
      hour,
      errors,
    }));
  }, [tasks]);

  const conversationSummary = useMemo(() => {
    const bucket = new Map<string, number>();
    messages.forEach((message) => {
      const key = hourKey(message.timestamp);
      bucket.set(key, (bucket.get(key) || 0) + 1);
    });
    return Array.from(bucket.entries()).map(([hour, completed]) => ({
      hour,
      completed,
    }));
  }, [messages]);

  const openTasks = tasks.filter(
    (task) => task.status === 'pending' || task.status === 'active',
  ).length;
  const activeAgents = agents.filter(
    (agent) => agent.state.status === 'running',
  ).length;
  const projectEvents = activity.length;

  return (
    <div className="space-y-6 px-5 py-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Project Observability
        </div>
        <h1 className="mt-2 font-serif text-4xl text-[var(--color-ink)]">
          Aggregate Task and Deliverable Signals
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-[var(--color-muted)]">
          Client-safe observability focused on task flow, communication load,
          and delivery progress. Provider diagnostics, token usage, and cost
          telemetry are intentionally excluded here.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Open Tasks" value={String(openTasks)} />
        <SummaryCard label="Messages in Flow" value={String(messages.length)} />
        <SummaryCard label="Project Events" value={String(projectEvents)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard
          title="Completed Tasks"
          subtitle="Completed work items over time"
        >
          <TaskChart data={completedTaskData} />
        </ChartCard>
        <ChartCard
          title="Failed Tasks"
          subtitle="Exceptions that may affect delivery timing"
        >
          <ErrorRateChart data={failedTaskData} />
        </ChartCard>
        <ChartCard
          title="Communication Load"
          subtitle="A2A and report traffic by hour"
        >
          <TaskChart data={conversationSummary} />
        </ChartCard>
        <ChartCard
          title="Active Agents"
          subtitle="Running agents contributing to current project work"
        >
          <ActiveAgentsGauge active={activeAgents} total={agents.length} />
        </ChartCard>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="gs-card rounded-2xl px-5 py-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
        {value}
      </div>
    </div>
  );
}
