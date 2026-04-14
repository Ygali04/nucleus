import { DASHBOARD_API_BASE } from '@/lib/constants';
import type {
  ActivityEntry,
  CostHistoryPoint,
  DashboardEvent,
  Message,
  StateResponse,
  TaskQueueResponse,
} from '@/lib/types';

function withView(path: string): string {
  return path;
}

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${DASHBOARD_API_BASE}${withView(path)}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const dashboardApi = {
  getState: () => requestJson<StateResponse>('/api/state'),
  getTasks: () => requestJson<TaskQueueResponse>('/api/tasks'),
  getActivity: (limit = 200) =>
    requestJson<ActivityEntry[]>(`/api/activity?limit=${limit}`),
  getAgentActivity: (agentId: string) =>
    requestJson<ActivityEntry[]>(
      `/api/activity/${encodeURIComponent(agentId)}`,
    ),
  getCostHistory: () => requestJson<CostHistoryPoint[]>('/api/cost-history'),
  getMessages: () => requestJson<Message[]>('/api/messages'),
  getHistory: () => requestJson<DashboardEvent[]>('/api/history'),
  getGoals: () => requestJson<Record<string, unknown>[]>('/api/goals'),
  getPrompt: async (agentId: string) => {
    const response = await fetch(
      `${DASHBOARD_API_BASE}${withView(`/api/prompt/${encodeURIComponent(agentId)}`)}`,
      { cache: 'no-store' },
    );
    if (!response.ok) {
      throw new Error(`Prompt request failed: ${response.status}`);
    }
    return response.text();
  },
  getFile: async (relativePath: string) => {
    const response = await fetch(
      `${DASHBOARD_API_BASE}${withView(`/api/file/${encodeURIComponent(relativePath)}`)}`,
      { cache: 'no-store' },
    );
    if (!response.ok) {
      throw new Error(`File request failed: ${response.status}`);
    }
    return response.text();
  },
};
