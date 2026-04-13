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

interface StagedChange {
  id: string;
  type: 'create';
  label: string;
  kind: GraphNodeMeta['kind'];
  createdAt: string;
}

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
  selectedBottomAction: string;
  isLiveMode: boolean;
  lastSyncedAt?: string;
  stagedChanges: StagedChange[];
  isDetailsOpen: boolean;
  isDeployModalOpen: boolean;
  isSyncing: boolean;
  isDeploying: boolean;
  setAgents: (agents: AgentDefinition[]) => void;
  setTasks: (tasks: Task[]) => void;
  setActivity: (activity: ActivityEntry[]) => void;
  prependActivity: (entry: ActivityEntry) => void;
  setEvents: (events: DashboardEvent[]) => void;
  appendEvent: (event: DashboardEvent) => void;
  setCostHistory: (history: CostHistoryPoint[]) => void;
  setMessages: (messages: Message[]) => void;
  setLiveMode: (isLiveMode: boolean) => void;
  setSelectedBottomAction: (selectedBottomAction: string) => void;
  setLastSyncedAt: (lastSyncedAt: string) => void;
  setSyncing: (isSyncing: boolean) => void;
  setDeploying: (isDeploying: boolean) => void;
  openDetails: () => void;
  closeDetails: () => void;
  openDeployModal: () => void;
  closeDeployModal: () => void;
  createEntity: (input: {
    kind: GraphNodeMeta['kind'];
    label: string;
    subtype: string;
    status: GraphNodeMeta['status'];
    metaTag?: string;
    notes?: string;
  }) => void;
  deployStagedChanges: () => void;
  clearStagedChanges: () => void;
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
  selectedBottomAction: 'network',
  isLiveMode: false,
  lastSyncedAt: new Date().toISOString(),
  stagedChanges: [],
  isDetailsOpen: false,
  isDeployModalOpen: false,
  isSyncing: false,
  isDeploying: false,
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
  setSelectedBottomAction: (selectedBottomAction) =>
    set({ selectedBottomAction }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setDeploying: (isDeploying) => set({ isDeploying }),
  openDetails: () => set({ isDetailsOpen: true }),
  closeDetails: () => set({ isDetailsOpen: false }),
  openDeployModal: () => set({ isDeployModalOpen: true }),
  closeDeployModal: () => set({ isDeployModalOpen: false }),
  createEntity: (input) =>
    set((state) => {
      const id = `${input.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;
      const createdAt = new Date().toISOString();

      const nextActivity: ActivityEntry = {
        ts: createdAt,
        agent: 'root',
        type: 'thinking',
        data: {
          summary: `Staged ${input.kind} "${input.label}" for deployment`,
          notes: input.notes || '',
        },
      };

      const stagedChange: StagedChange = {
        id,
        type: 'create',
        label: input.label,
        kind: input.kind,
        createdAt,
      };

      const customNode: GraphNodeMeta = {
        id,
        label: input.label,
        kind: input.kind,
        subtype: input.subtype,
        status: input.status,
        statusText:
          input.status === 'active' ? 'Ready after deploy' : 'Staged for deployment',
        metaTag: input.metaTag || null,
        x: 1120,
        y: 220 + state.customNodes.length * 110,
      };

      return {
        customNodes: [...state.customNodes, customNode],
        stagedChanges: [...state.stagedChanges, stagedChange],
        activity: [nextActivity, ...state.activity].slice(0, 150),
      };
    }),
  deployStagedChanges: () =>
    set((state) => {
      const deployedAt = new Date().toISOString();
      const summaries = state.stagedChanges.map((change) => change.label);
      const deployActivity: ActivityEntry = {
        ts: deployedAt,
        agent: 'root',
        type: 'task_completed',
        data: {
          summary:
            summaries.length > 0
              ? `Deployed staged changes: ${summaries.join(', ')}`
              : 'Deployment completed with no pending changes',
        },
      };

      return {
        stagedChanges: [],
        demoAgents: state.demoAgents.map((agent) => ({
          ...agent,
          state: {
            ...agent.state,
            status: 'idle',
            last_run: deployedAt,
          },
        })),
        agents: state.agents.map((agent) => {
          const staged = state.stagedChanges.find((change) => change.id === agent.id);
          if (!staged) return agent;
          return {
            ...agent,
            state: {
              ...agent.state,
              status: 'idle',
              last_run: deployedAt,
            },
          };
        }),
        customNodes: state.customNodes.map((node) => {
          const staged = state.stagedChanges.find((change) => change.id === node.id);
          if (!staged) return node;
          return {
            ...node,
            status: 'active',
            statusText: 'Deployed from toolbar',
          };
        }),
        activity: [deployActivity, ...state.activity].slice(0, 150),
      };
    }),
  clearStagedChanges: () => set({ stagedChanges: [] }),
}));
