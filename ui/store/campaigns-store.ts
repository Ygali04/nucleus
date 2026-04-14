'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  apiClient,
  type Campaign as ApiCampaign,
  type CampaignCreate,
  type CampaignPatch,
  type CampaignReport,
} from '@/lib/api-client';
import type {
  CampaignArchetype,
  GraphEdgeMeta,
  GraphNodeKind,
  GraphNodeMeta,
} from '@/lib/types';

/**
 * Campaigns store — backed by /api/v1/campaigns with localStorage fallback.
 *
 * Fields use snake_case (brand_name, created_at) to match the backend shape.
 * UI code should reach into `campaign.brand_name` etc.
 *
 * Beyond API state, this store also owns UI state that lives above campaign
 * level (new-campaign modal visibility, currently-open node modal, current
 * selected campaign id) so it's a single place to wire every UX gesture.
 */

export type Campaign = ApiCampaign;

interface NewCampaignInput {
  archetype: CampaignArchetype;
  brand_name: string;
  graph?: { nodes: GraphNodeMeta[]; edges: GraphEdgeMeta[] };
  brief?: Record<string, unknown> | null;
}

interface CampaignsState {
  // --- API-backed core state ------------------------------------------------
  campaigns: Campaign[];
  reportsByCampaign: Record<string, CampaignReport[]>;
  isOffline: boolean;

  // --- UI state ------------------------------------------------------------
  currentCampaignId: string | null;
  newCampaignModalOpen: boolean;
  openNodeModalId: string | null;

  // --- API actions ---------------------------------------------------------
  hydrate: () => Promise<void>;
  createCampaign: (input: NewCampaignInput) => Promise<Campaign>;
  updateCampaign: (id: string, patch: CampaignPatch) => Promise<Campaign | null>;
  deleteCampaign: (id: string) => Promise<void>;
  executeCampaign: (id: string) => Promise<{ job_id: string; websocket_url: string } | null>;
  loadReports: (id: string) => Promise<CampaignReport[]>;

  // --- UI actions ----------------------------------------------------------
  setCurrentCampaign: (id: string | null) => void;
  openNewCampaignModal: () => void;
  closeNewCampaignModal: () => void;
  openNodeModal: (nodeId: string | null) => void;
  closeNodeModal: () => void;

  // --- Node-level mutations (operate on currentCampaign's graph) -----------
  updateNodeData: (
    campaignId: string,
    nodeId: string,
    partial: Record<string, unknown>,
  ) => void;
  addNode: (campaignId: string, node: GraphNodeMeta) => void;
  deleteNode: (campaignId: string, nodeId: string) => void;
  swapNodeKind: (campaignId: string, nodeId: string, newKind: GraphNodeKind) => void;
  retryNode: (campaignId: string, nodeId: string) => void;
  openReportForIteration: (nodeId: string) => void;
}

const nowIso = () => new Date().toISOString();
const tempId = () => `local-${Math.random().toString(36).slice(2, 10)}`;

const isTransportFailure = (err: unknown): boolean => {
  if (err instanceof TypeError) return true;
  if (err instanceof Error && /failed: 0/.test(err.message)) return true;
  return false;
};

function applyNodePatch(
  campaigns: Campaign[],
  campaignId: string,
  mutate: (nodes: GraphNodeMeta[], edges: GraphEdgeMeta[]) => {
    nodes: GraphNodeMeta[];
    edges: GraphEdgeMeta[];
  },
): Campaign[] {
  return campaigns.map((c) => {
    if (c.id !== campaignId) return c;
    const graph = (c.graph ?? { nodes: [], edges: [] }) as {
      nodes: GraphNodeMeta[];
      edges: GraphEdgeMeta[];
    };
    const next = mutate(graph.nodes ?? [], graph.edges ?? []);
    return { ...c, graph: next };
  });
}

export const useCampaignsStore = create<CampaignsState>()(
  persist(
    (set, get) => ({
      campaigns: [],
      reportsByCampaign: {},
      isOffline: false,

      currentCampaignId: null,
      newCampaignModalOpen: false,
      openNodeModalId: null,

      async hydrate() {
        try {
          const remote = await apiClient.listCampaigns();
          set({ campaigns: remote, isOffline: false });
        } catch (err) {
          if (isTransportFailure(err)) {
            set({ isOffline: true });
            return;
          }
          throw err;
        }
      },

      async createCampaign(input) {
        const optimistic: Campaign = {
          id: tempId(),
          archetype: input.archetype,
          brand_name: input.brand_name,
          graph: input.graph ?? { nodes: [], edges: [] },
          brief: input.brief ?? null,
          status: 'idle',
          created_at: nowIso(),
          updated_at: nowIso(),
          last_executed_at: null,
          last_job_id: null,
        };
        set((s) => ({
          campaigns: [optimistic, ...s.campaigns],
          currentCampaignId: optimistic.id,
        }));

        try {
          const created = await apiClient.createCampaign({
            archetype: input.archetype,
            brand_name: input.brand_name,
            graph: optimistic.graph,
            brief: optimistic.brief,
          });
          set((s) => ({
            campaigns: s.campaigns.map((c) => (c.id === optimistic.id ? created : c)),
            currentCampaignId:
              s.currentCampaignId === optimistic.id ? created.id : s.currentCampaignId,
            isOffline: false,
          }));
          return created;
        } catch (err) {
          if (isTransportFailure(err)) {
            set({ isOffline: true });
            return optimistic;
          }
          set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== optimistic.id) }));
          throw err;
        }
      },

      async updateCampaign(id, patch) {
        const prev = get().campaigns.find((c) => c.id === id);
        if (!prev) return null;
        const optimistic: Campaign = {
          ...prev,
          ...patch,
          graph: patch.graph ?? prev.graph,
          brief: patch.brief ?? prev.brief,
          updated_at: nowIso(),
        };
        set((s) => ({
          campaigns: s.campaigns.map((c) => (c.id === id ? optimistic : c)),
        }));

        try {
          const updated = await apiClient.updateCampaign(id, patch);
          set((s) => ({
            campaigns: s.campaigns.map((c) => (c.id === id ? updated : c)),
            isOffline: false,
          }));
          return updated;
        } catch (err) {
          if (isTransportFailure(err)) {
            set({ isOffline: true });
            return optimistic;
          }
          set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? prev : c)) }));
          throw err;
        }
      },

      async deleteCampaign(id) {
        const prev = get().campaigns;
        set((s) => ({
          campaigns: s.campaigns.filter((c) => c.id !== id),
          currentCampaignId: s.currentCampaignId === id ? null : s.currentCampaignId,
        }));
        try {
          await apiClient.deleteCampaign(id);
          set({ isOffline: false });
        } catch (err) {
          if (isTransportFailure(err)) {
            set({ isOffline: true });
            return;
          }
          set({ campaigns: prev });
          throw err;
        }
      },

      async executeCampaign(id) {
        set((s) => ({
          campaigns: s.campaigns.map((c) =>
            c.id === id ? { ...c, status: 'executing', last_executed_at: nowIso() } : c,
          ),
        }));
        try {
          const res = await apiClient.executeCampaign(id);
          set((s) => ({
            campaigns: s.campaigns.map((c) =>
              c.id === id ? { ...c, last_job_id: res.job_id } : c,
            ),
            isOffline: false,
          }));
          return res;
        } catch (err) {
          if (isTransportFailure(err)) {
            set({ isOffline: true });
            return null;
          }
          throw err;
        }
      },

      async loadReports(id) {
        try {
          const reports = await apiClient.listCampaignReports(id);
          set((s) => ({
            reportsByCampaign: { ...s.reportsByCampaign, [id]: reports },
            isOffline: false,
          }));
          return reports;
        } catch (err) {
          if (isTransportFailure(err)) {
            set({ isOffline: true });
            return get().reportsByCampaign[id] ?? [];
          }
          throw err;
        }
      },

      setCurrentCampaign: (id) => set({ currentCampaignId: id }),
      openNewCampaignModal: () => set({ newCampaignModalOpen: true }),
      closeNewCampaignModal: () => set({ newCampaignModalOpen: false }),
      openNodeModal: (openNodeModalId) => set({ openNodeModalId }),
      closeNodeModal: () => set({ openNodeModalId: null }),

      updateNodeData: (campaignId, nodeId, partial) =>
        set((s) => ({
          campaigns: applyNodePatch(s.campaigns, campaignId, (nodes, edges) => ({
            nodes: nodes.map((n) =>
              n.id === nodeId
                ? { ...n, data: { ...(n.data ?? {}), ...partial } }
                : n,
            ),
            edges,
          })),
        })),

      addNode: (campaignId, node) =>
        set((s) => ({
          campaigns: applyNodePatch(s.campaigns, campaignId, (nodes, edges) => ({
            nodes: [...nodes, node],
            edges,
          })),
        })),

      deleteNode: (campaignId, nodeId) =>
        set((s) => ({
          campaigns: applyNodePatch(s.campaigns, campaignId, (nodes, edges) => ({
            nodes: nodes.filter((n) => n.id !== nodeId),
            edges: edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
          })),
          openNodeModalId:
            s.openNodeModalId === nodeId ? null : s.openNodeModalId,
        })),

      swapNodeKind: (campaignId, nodeId, newKind) =>
        set((s) => ({
          campaigns: applyNodePatch(s.campaigns, campaignId, (nodes, edges) => ({
            nodes: nodes.map((n) =>
              n.id === nodeId ? { ...n, kind: newKind } : n,
            ),
            edges,
          })),
        })),

      retryNode: (_campaignId, _nodeId) => {
        // Stub: WU-10 will wire to per-node re-execution once the orchestrator
        // supports targeted retries. Logged to events-store in the meantime.
      },

      openReportForIteration: (_nodeId) => {
        // Stub: navigates to /reports?variant={id} once that hook is wired.
      },
    }),
    {
      name: 'nucleus-campaigns',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        campaigns: s.campaigns,
        reportsByCampaign: s.reportsByCampaign,
        currentCampaignId: s.currentCampaignId,
      }),
    },
  ),
);
