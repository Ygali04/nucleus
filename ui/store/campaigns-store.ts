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
  ChatMessage,
  GraphEdgeMeta,
  GraphNodeKind,
  GraphNodeMeta,
  NodeSuggestion,
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

  // --- Ruflo ghost-node suggestions (live pending-approval queue) ----------
  pendingSuggestions: Record<string, NodeSuggestion[]>;

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
  updateNodeExecutionState: (
    campaignId: string,
    nodeId: string,
    patch: {
      status?: string;
      progressPercent?: number;
      progressLabel?: string;
      lastExecutionS?: number;
      lastCostUsd?: number;
      cached?: boolean;
    },
  ) => void;
  addNode: (campaignId: string, node: GraphNodeMeta) => void;
  addEdge: (campaignId: string, edge: GraphEdgeMeta) => void;
  deleteNode: (campaignId: string, nodeId: string) => void;
  duplicateNode: (campaignId: string, nodeId: string) => void;
  toggleBypass: (campaignId: string, nodeId: string) => void;
  togglePinNode: (campaignId: string, nodeId: string) => void;
  swapNodeKind: (campaignId: string, nodeId: string, newKind: GraphNodeKind) => void;
  retryNode: (campaignId: string, nodeId: string) => void;
  openReportForIteration: (nodeId: string) => void;
  appendChatMessage: (campaignId: string, message: ChatMessage) => void;
  updateChatMessage: (
    campaignId: string,
    messageId: string,
    patch: Partial<ChatMessage>,
  ) => void;

  // --- Ruflo suggestions --------------------------------------------------
  addSuggestion: (campaignId: string, suggestion: NodeSuggestion) => void;
  resolveSuggestion: (
    campaignId: string,
    suggestionId: string,
    outcome: 'approved' | 'rejected',
    feedback?: string,
  ) => void;
  approveSuggestion: (campaignId: string, suggestionId: string) => Promise<void>;
  rejectSuggestion: (
    campaignId: string,
    suggestionId: string,
    feedback?: string,
  ) => Promise<void>;
}

const nowIso = () => new Date().toISOString();
const tempId = () => `local-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Debounced fire-and-forget backend sync for graph mutations. The store's
 * persist middleware already saves to localStorage on every mutation, so the
 * user's data is never lost locally. This adds a best-effort backend write
 * so a fresh browser/device sees the same state.
 */
const PERSIST_DEBOUNCE_MS = 600;
const persistTimers = new Map<string, ReturnType<typeof setTimeout>>();

function schedulePersist(getCampaign: () => Campaign | undefined, campaignId: string) {
  const existing = persistTimers.get(campaignId);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    persistTimers.delete(campaignId);
    const c = getCampaign();
    if (!c) return;
    apiClient
      .updateCampaign(campaignId, {
        graph: c.graph as never,
        brief: c.brief ?? null,
      })
      .catch(() => {
        // Swallow — localStorage already has the latest. The next successful
        // sync will reconcile.
      });
  }, PERSIST_DEBOUNCE_MS);
  persistTimers.set(campaignId, timer);
}

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
      pendingSuggestions: {},

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

      updateNodeData: (campaignId, nodeId, partial) => {
        set((s) => ({
          campaigns: applyNodePatch(s.campaigns, campaignId, (nodes, edges) => ({
            nodes: nodes.map((n) =>
              n.id === nodeId
                ? { ...n, data: { ...(n.data ?? {}), ...partial } }
                : n,
            ),
            edges,
          })),
        }));
        schedulePersist(
          () => get().campaigns.find((c) => c.id === campaignId),
          campaignId,
        );
      },

      updateNodeExecutionState: (campaignId, nodeId, patch) => {
        // Strip undefined so we never overwrite prior state with undefined.
        const clean = Object.fromEntries(
          Object.entries(patch).filter(([, v]) => v !== undefined),
        );
        if (Object.keys(clean).length === 0) return;
        set((s) => ({
          campaigns: applyNodePatch(s.campaigns, campaignId, (nodes, edges) => ({
            nodes: nodes.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    ...(clean.status !== undefined ? { status: clean.status as GraphNodeMeta['status'] } : {}),
                    data: { ...(n.data ?? {}), ...clean },
                  }
                : n,
            ),
            edges,
          })),
        }));
      },

      addNode: (campaignId, node) => {
        set((s) => ({
          campaigns: applyNodePatch(s.campaigns, campaignId, (nodes, edges) =>
            nodes.some((n) => n.id === node.id)
              ? { nodes, edges }
              : { nodes: [...nodes, node], edges },
          ),
        }));
        schedulePersist(
          () => get().campaigns.find((c) => c.id === campaignId),
          campaignId,
        );
      },

      addEdge: (campaignId, edge) => {
        set((s) => ({
          campaigns: applyNodePatch(s.campaigns, campaignId, (nodes, edges) =>
            edges.some((e) => e.id === edge.id)
              ? { nodes, edges }
              : { nodes, edges: [...edges, edge] },
          ),
        }));
        schedulePersist(
          () => get().campaigns.find((c) => c.id === campaignId),
          campaignId,
        );
      },

      deleteNode: (campaignId, nodeId) => {
        set((s) => ({
          campaigns: applyNodePatch(s.campaigns, campaignId, (nodes, edges) => ({
            nodes: nodes.filter((n) => n.id !== nodeId),
            edges: edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
          })),
          openNodeModalId:
            s.openNodeModalId === nodeId ? null : s.openNodeModalId,
        }));
        schedulePersist(
          () => get().campaigns.find((c) => c.id === campaignId),
          campaignId,
        );
      },

      duplicateNode: (campaignId, nodeId) => {
        set((s) => ({
          campaigns: applyNodePatch(s.campaigns, campaignId, (nodes, edges) => {
            const src = nodes.find((n) => n.id === nodeId);
            if (!src) return { nodes, edges };
            const clone: GraphNodeMeta = {
              ...src,
              id: `${src.id}-copy-${Math.random().toString(36).slice(2, 6)}`,
              x: (src.x ?? 0) + 40,
              y: (src.y ?? 0) + 40,
              data: src.data ? { ...src.data } : undefined,
            };
            return { nodes: [...nodes, clone], edges };
          }),
        }));
        schedulePersist(
          () => get().campaigns.find((c) => c.id === campaignId),
          campaignId,
        );
      },

      toggleBypass: (campaignId, nodeId) => {
        set((s) => ({
          campaigns: applyNodePatch(s.campaigns, campaignId, (nodes, edges) => ({
            nodes: nodes.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...(n.data ?? {}),
                      bypassed: !((n.data ?? {}) as { bypassed?: boolean })
                        .bypassed,
                    },
                  }
                : n,
            ),
            edges,
          })),
        }));
        schedulePersist(
          () => get().campaigns.find((c) => c.id === campaignId),
          campaignId,
        );
      },

      togglePinNode: (campaignId, nodeId) => {
        set((s) => ({
          campaigns: applyNodePatch(s.campaigns, campaignId, (nodes, edges) => ({
            nodes: nodes.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...(n.data ?? {}),
                      pinned: !((n.data ?? {}) as { pinned?: boolean }).pinned,
                    },
                  }
                : n,
            ),
            edges,
          })),
        }));
        schedulePersist(
          () => get().campaigns.find((c) => c.id === campaignId),
          campaignId,
        );
      },

      swapNodeKind: (campaignId, nodeId, newKind) => {
        set((s) => ({
          campaigns: applyNodePatch(s.campaigns, campaignId, (nodes, edges) => ({
            nodes: nodes.map((n) =>
              n.id === nodeId ? { ...n, kind: newKind } : n,
            ),
            edges,
          })),
        }));
        schedulePersist(
          () => get().campaigns.find((c) => c.id === campaignId),
          campaignId,
        );
      },

      retryNode: (_campaignId, _nodeId) => {
        // Stub: WU-10 will wire to per-node re-execution once the orchestrator
        // supports targeted retries. Logged to events-store in the meantime.
      },

      openReportForIteration: (_nodeId) => {
        // Stub: navigates to /reports?variant={id} once that hook is wired.
      },

      appendChatMessage: (campaignId, message) => {
        set((s) => ({
          campaigns: s.campaigns.map((c) => {
            if (c.id !== campaignId) return c;
            const brief = (c.brief ?? {}) as Record<string, unknown> & {
              chat_history?: ChatMessage[];
            };
            const history = brief.chat_history ?? [];
            if (history.some((m) => m.id === message.id)) return c;
            return {
              ...c,
              brief: { ...brief, chat_history: [...history, message] },
            };
          }),
        }));
        schedulePersist(
          () => get().campaigns.find((c) => c.id === campaignId),
          campaignId,
        );
      },

      updateChatMessage: (campaignId, messageId, patch) => {
        set((s) => ({
          campaigns: s.campaigns.map((c) => {
            if (c.id !== campaignId) return c;
            const brief = (c.brief ?? {}) as Record<string, unknown> & {
              chat_history?: ChatMessage[];
            };
            const history = brief.chat_history ?? [];
            const nextHistory = history.map((m) =>
              m.id === messageId ? { ...m, ...patch } : m,
            );
            return {
              ...c,
              brief: { ...brief, chat_history: nextHistory },
            };
          }),
        }));
        schedulePersist(
          () => get().campaigns.find((c) => c.id === campaignId),
          campaignId,
        );
      },

      addSuggestion: (campaignId, suggestion) => {
        // Dedup by suggestion id.
        const existing = get().pendingSuggestions[campaignId] ?? [];
        if (existing.some((s) => s.id === suggestion.id)) return;

        // Inject the ghost node + pending edges into the campaign graph so the
        // canvas renders it immediately in the faded/pulsing state.
        const ghostNode: GraphNodeMeta = {
          ...suggestion.node,
          data: {
            ...(suggestion.node.data ?? {}),
            pendingApproval: suggestion.id,
            addedByRuflo: true,
            suggestionReason: suggestion.reason,
          },
        };
        const pendingEdges: GraphEdgeMeta[] = (suggestion.insertion_edges ?? []).map(
          (e) => ({
            ...e,
            data: { ...(e.data ?? {}), pendingApproval: suggestion.id },
          }),
        );

        set((s) => ({
          pendingSuggestions: {
            ...s.pendingSuggestions,
            [campaignId]: [...existing, suggestion],
          },
          campaigns: applyNodePatch(s.campaigns, campaignId, (nodes, edges) => ({
            nodes: nodes.some((n) => n.id === ghostNode.id)
              ? nodes
              : [...nodes, ghostNode],
            edges: [
              ...edges,
              ...pendingEdges.filter((ne) => !edges.some((e) => e.id === ne.id)),
            ],
          })),
        }));
      },

      resolveSuggestion: (campaignId, suggestionId, outcome, feedback) => {
        const current = get().pendingSuggestions[campaignId] ?? [];
        const suggestion = current.find((s) => s.id === suggestionId);
        if (!suggestion) return;

        set((s) => {
          const nextList = (s.pendingSuggestions[campaignId] ?? []).map((x) =>
            x.id === suggestionId
              ? { ...x, resolved: outcome, feedback }
              : x,
          );

          const campaignsNext = applyNodePatch(
            s.campaigns,
            campaignId,
            (nodes, edges) => {
              if (outcome === 'rejected') {
                // Remove the ghost node + any edges tagged with this suggestion.
                return {
                  nodes: nodes.filter((n) => n.id !== suggestion.node.id),
                  edges: edges.filter(
                    (e) =>
                      e.source !== suggestion.node.id &&
                      e.target !== suggestion.node.id &&
                      (e.data as { pendingApproval?: string } | undefined)
                        ?.pendingApproval !== suggestionId,
                  ),
                };
              }
              // Approved: strip the `pendingApproval` flag from node + edges.
              return {
                nodes: nodes.map((n) => {
                  if (n.id !== suggestion.node.id) return n;
                  const data = { ...((n.data ?? {}) as Record<string, unknown>) };
                  delete (data as { pendingApproval?: string }).pendingApproval;
                  return { ...n, data };
                }),
                edges: edges.map((e) => {
                  const edata = (e.data ?? {}) as { pendingApproval?: string };
                  if (edata.pendingApproval !== suggestionId) return e;
                  const nextData = { ...edata };
                  delete nextData.pendingApproval;
                  return { ...e, data: nextData };
                }),
              };
            },
          );

          return {
            pendingSuggestions: {
              ...s.pendingSuggestions,
              [campaignId]: nextList,
            },
            campaigns: campaignsNext,
          };
        });

        // Mirror resolution into the originating chat message, if any.
        const campaign = get().campaigns.find((c) => c.id === campaignId);
        const brief = (campaign?.brief ?? null) as
          | { chat_history?: ChatMessage[] }
          | null;
        const chatMsg = brief?.chat_history?.find(
          (m) => m.suggestion_id === suggestionId,
        );
        if (chatMsg) {
          get().updateChatMessage(campaignId, chatMsg.id, {
            approval_outcome: outcome,
            approval_feedback: feedback,
          });
        }

        schedulePersist(
          () => get().campaigns.find((c) => c.id === campaignId),
          campaignId,
        );
      },

      approveSuggestion: async (campaignId, suggestionId) => {
        // Optimistic local resolution first so the UI responds instantly.
        get().resolveSuggestion(campaignId, suggestionId, 'approved');
        try {
          await apiClient.approveSuggestion(campaignId, suggestionId);
          set({ isOffline: false });
        } catch (err) {
          if (isTransportFailure(err)) {
            set({ isOffline: true });
            return;
          }
          throw err;
        }
      },

      rejectSuggestion: async (campaignId, suggestionId, feedback) => {
        get().resolveSuggestion(campaignId, suggestionId, 'rejected', feedback);
        try {
          await apiClient.rejectSuggestion(campaignId, suggestionId, feedback);
          set({ isOffline: false });
        } catch (err) {
          if (isTransportFailure(err)) {
            set({ isOffline: true });
            return;
          }
          throw err;
        }
      },
    }),
    {
      name: 'nucleus-campaigns',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        campaigns: s.campaigns,
        reportsByCampaign: s.reportsByCampaign,
        currentCampaignId: s.currentCampaignId,
        pendingSuggestions: s.pendingSuggestions,
      }),
    },
  ),
);
