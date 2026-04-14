'use client';

import { create } from 'zustand';
import { dummyActivity } from '@/fixtures/activity';
import { dummyAgents } from '@/fixtures/agents';
import { dummyCostHistory } from '@/fixtures/cost-history';
import { dummyFacts } from '@/fixtures/facts';
import { dummyMessages } from '@/fixtures/messages';
import { dummyTasks } from '@/fixtures/tasks';
import type {
  ActivityEntry,
  AgentDefinition,
  CostHistoryPoint,
  DashboardEvent,
  Fact,
  GraphNodeMeta,
  Message,
  Task,
} from '@/lib/types';

interface DashboardStore {
  agents: AgentDefinition[];
  demoAgents: AgentDefinition[];
  customNodes: GraphNodeMeta[];
  tasks: Task[];
  activity: ActivityEntry[];
  events: DashboardEvent[];
  costHistory: CostHistoryPoint[];
  messages: Message[];
  facts: Fact[];
  isLiveMode: boolean;
  lastSyncedAt?: string;
  isSyncing: boolean;
  setAgents: (agents: AgentDefinition[]) => void;
  setTasks: (tasks: Task[]) => void;
  setActivity: (activity: ActivityEntry[]) => void;
  prependActivity: (entry: ActivityEntry) => void;
  setEvents: (events: DashboardEvent[]) => void;
  appendEvent: (event: DashboardEvent) => void;
  setCostHistory: (history: CostHistoryPoint[]) => void;
  setMessages: (messages: Message[]) => void;
  setLiveMode: (isLiveMode: boolean) => void;
  setLastSyncedAt: (lastSyncedAt: string) => void;
  setSyncing: (isSyncing: boolean) => void;
}

function mergeAgents(
  runtimeAgents: AgentDefinition[],
  demoAgents: AgentDefinition[],
): AgentDefinition[] {
  const merged = [...runtimeAgents];
  const knownIds = new Set(runtimeAgents.map((agent) => agent.id));
  for (const agent of demoAgents) {
    if (!knownIds.has(agent.id)) {
      merged.push(agent);
    }
  }
  return merged;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  agents: dummyAgents,
  demoAgents: [],
  customNodes: [],
  tasks: dummyTasks,
  activity: dummyActivity,
  events: [],
  costHistory: dummyCostHistory,
  messages: dummyMessages,
  facts: dummyFacts,
  isLiveMode: false,
  lastSyncedAt: new Date().toISOString(),
  isSyncing: false,
  setAgents: (agents) =>
    set((state) => ({
      agents: mergeAgents(agents, state.demoAgents),
    })),
  setTasks: (tasks) => set({ tasks }),
  setActivity: (activity) => set({ activity }),
  prependActivity: (entry) =>
    set((state) => ({
      activity: [entry, ...state.activity].slice(0, 150),
    })),
  setEvents: (events) => set({ events }),
  appendEvent: (event) =>
    set((state) => ({
      events: [...state.events, event].slice(-250),
    })),
  setCostHistory: (costHistory) => set({ costHistory }),
  setMessages: (messages) => set({ messages }),
  setLiveMode: (isLiveMode) => set({ isLiveMode }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  setSyncing: (isSyncing) => set({ isSyncing }),
}));
