import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PipelineIteration {
  id: string;
  index: number;
  videoUrl: string | null;
  score: number | null;
  editType: string | null;
  costUsd: number;
  timestamp: string;
}

export interface PipelineCandidate {
  id: string;
  icp: string;
  language: string;
  platform: string;
  archetype: string;
  status: string;
  iterations: PipelineIteration[];
  currentScore: number | null;
  finalScore: number | null;
  terminalReason: string | null;
}

export interface PipelineJob {
  id: string;
  status:
    | 'briefed'
    | 'planning'
    | 'generating'
    | 'scoring'
    | 'editing'
    | 'delivering'
    | 'complete'
    | 'failed';
  brief: Record<string, unknown>;
  candidates: PipelineCandidate[];
  createdAt: string;
}

export interface PendingApproval {
  id: string;
  candidateId: string;
  step: string;
  prompt: string;
  estimatedCost: number;
  timestamp: string;
}

export type PermissionMode = 'auto_gen' | 'ask_permissions';

export interface PipelineState {
  currentJob: PipelineJob | null;
  permissionMode: PermissionMode;
  pendingApprovals: PendingApproval[];
  totalCost: number;

  setJob: (job: PipelineJob) => void;
  updateCandidate: (candidateId: string, updates: Partial<PipelineCandidate>) => void;
  addIteration: (candidateId: string, iteration: PipelineIteration) => void;
  setPermissionMode: (mode: PermissionMode) => void;
  addPendingApproval: (approval: PendingApproval) => void;
  resolvePendingApproval: (approvalId: string) => void;
  addCost: (amount: number) => void;
  reset: () => void;
}

export const usePipelineStore = create<PipelineState>()(
  persist(
    (set) => ({
      currentJob: null,
      permissionMode: 'auto_gen',
      pendingApprovals: [],
      totalCost: 0,

      setJob: (job) => set({ currentJob: job }),

      updateCandidate: (candidateId, updates) =>
        set((state) => {
          if (!state.currentJob) return state;
          return {
            currentJob: {
              ...state.currentJob,
              candidates: state.currentJob.candidates.map((c) =>
                c.id === candidateId ? { ...c, ...updates } : c,
              ),
            },
          };
        }),

      addIteration: (candidateId, iteration) =>
        set((state) => {
          if (!state.currentJob) return state;
          return {
            currentJob: {
              ...state.currentJob,
              candidates: state.currentJob.candidates.map((c) =>
                c.id === candidateId
                  ? { ...c, iterations: [...c.iterations, iteration] }
                  : c,
              ),
            },
          };
        }),

      setPermissionMode: (mode) => set({ permissionMode: mode }),

      addPendingApproval: (approval) =>
        set((state) => ({
          pendingApprovals: [...state.pendingApprovals, approval],
        })),

      resolvePendingApproval: (approvalId) =>
        set((state) => ({
          pendingApprovals: state.pendingApprovals.filter((a) => a.id !== approvalId),
        })),

      addCost: (amount) => set((state) => ({ totalCost: state.totalCost + amount })),

      reset: () =>
        set({
          currentJob: null,
          pendingApprovals: [],
          totalCost: 0,
        }),
    }),
    {
      name: 'nucleus-pipeline-store',
      partialize: (state) => ({
        permissionMode: state.permissionMode,
      }),
    },
  ),
);
