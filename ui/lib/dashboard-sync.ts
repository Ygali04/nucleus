'use client';

import { dummyActivity } from '@/fixtures/activity';
import { dummyAgents } from '@/fixtures/agents';
import { dummyCostHistory } from '@/fixtures/cost-history';
import { dummyMessages } from '@/fixtures/messages';
import { dummyTasks } from '@/fixtures/tasks';
import { dashboardApi } from '@/lib/api';
import type {
  ActivityEntry,
  AgentDefinition,
  AgentStatus,
  CostHistoryPoint,
  StateResponse,
  Task,
  TaskQueueResponse,
} from '@/lib/types';
import { useDashboardStore } from '@/store/dashboard-store';

function parseState(raw: string): {
  status: AgentStatus;
  total_cost_usd: number;
  run_count: number;
  last_error?: string;
} {
  const status = (raw.match(/status:\s*(\w+)/)?.[1] || 'idle') as AgentStatus;
  const totalCostUsd = Number(raw.match(/total_cost_usd:\s*([0-9.]+)/)?.[1] || 0);
  const runCount = Number(raw.match(/run_count:\s*([0-9.]+)/)?.[1] || 0);
  const lastError = raw.match(/last_error:\s*(.+)/)?.[1];

  return {
    status,
    total_cost_usd: totalCostUsd,
    run_count: runCount,
    last_error: lastError,
  };
}

export function normalizeAgents(response: StateResponse): AgentDefinition[] {
  return response.agents.map((agent) => {
    const rawState = typeof agent.state === 'string' ? agent.state : '';
    const parsedState = parseState(rawState);

    return {
      id: String(agent.id),
      prompt: '',
      tools: [],
      config: {
        model: 'runtime',
        temperature: 0,
        max_tokens: 4096,
        max_iterations: 8,
        permissions: 'analyst',
        tags: [],
        parent: typeof agent.parentId === 'string' ? agent.parentId : undefined,
      },
      state: {
        status: parsedState.status,
        total_cost_usd: parsedState.total_cost_usd,
        run_count: parsedState.run_count,
        modifications_today: 0,
        last_error: parsedState.last_error,
      },
      memory: '',
      depth: Number(agent.depth || 0),
    };
  });
}

function parseTask(
  raw: string,
  fallbackStatus: Task['status'],
  fallbackId: string,
): Task {
  const get = (key: string) =>
    raw.match(new RegExp(`${key}:\\s*(.+)`))?.[1]?.trim();

  return {
    id: get('id') || fallbackId.replace('.yaml', ''),
    title: get('title') || fallbackId.replace('.yaml', ''),
    instruction: get('instruction') || 'Task loaded from runtime queue.',
    assigned_to: get('assigned_to') || undefined,
    created_by: get('created_by') || 'system',
    priority: Number(get('priority') || 5),
    required_tools: [],
    required_tags: [],
    context: {},
    created_at: get('created_at') || new Date().toISOString(),
    started_at: get('started_at') || undefined,
    completed_at: get('completed_at') || undefined,
    result: get('result') || undefined,
    status: fallbackStatus,
  };
}

export function normalizeTasks(
  response: TaskQueueResponse | Array<Record<string, unknown>>,
): Task[] {
  if (Array.isArray(response)) {
    return response.map((item) =>
      parseTask(
        String(item.raw || ''),
        String(item.status || 'pending') as Task['status'],
        String(item.file || 'task.yaml'),
      ),
    );
  }

  return [
    ...response.pending,
    ...response.active,
    ...response.completed,
    ...(response.failed || []),
  ].map((item) => parseTask(String(item.raw || ''), item.status, item.file));
}

export async function syncDashboardData() {
  const store = useDashboardStore.getState();
  const startedAt = new Date().toISOString();

  store.setSyncing(true);

  try {
    const [state, tasks, activity, messages, costHistory] = await Promise.all([
      dashboardApi.getState(),
      dashboardApi.getTasks(),
      dashboardApi.getActivity(),
      dashboardApi.getMessages(),
      dashboardApi.getCostHistory(),
    ]);

    store.setAgents(normalizeAgents(state));
    store.setTasks(normalizeTasks(tasks));
    store.setActivity(activity);
    store.setMessages(messages);
    store.setCostHistory(costHistory);
    store.setLiveMode(true);
    store.setLastSyncedAt(startedAt);
    return { liveMode: true, syncedAt: startedAt };
  } catch {
    store.setAgents(dummyAgents);
    store.setTasks(dummyTasks);
    store.setActivity(dummyActivity as ActivityEntry[]);
    store.setMessages(dummyMessages);
    store.setCostHistory(dummyCostHistory as CostHistoryPoint[]);
    store.setLiveMode(false);
    store.setLastSyncedAt(startedAt);
    return { liveMode: false, syncedAt: startedAt };
  } finally {
    useDashboardStore.getState().setSyncing(false);
  }
}
