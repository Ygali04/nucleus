import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  apiClient,
  type Campaign,
  type CampaignCreate,
  type CampaignPatch,
  type CampaignReport,
} from '@/lib/api-client';

/**
 * Campaign state with optimistic updates.
 *
 * Every mutation applies to local state immediately, then fires the API call.
 * If the API returns an empty / network-error response, we keep the optimistic
 * local copy (backed by localStorage via ``persist``) so the UI keeps working
 * offline.
 */

interface CampaignsState {
  campaigns: Campaign[];
  reportsByCampaign: Record<string, CampaignReport[]>;
  isOffline: boolean;

  hydrate: () => Promise<void>;
  createCampaign: (body: CampaignCreate) => Promise<Campaign>;
  updateCampaign: (id: string, patch: CampaignPatch) => Promise<Campaign | null>;
  deleteCampaign: (id: string) => Promise<void>;
  executeCampaign: (id: string) => Promise<{ job_id: string; websocket_url: string } | null>;
  loadReports: (id: string) => Promise<CampaignReport[]>;
}

const nowIso = () => new Date().toISOString();
const tempId = () => `local-${Math.random().toString(36).slice(2, 10)}`;

const isTransportFailure = (err: unknown): boolean => {
  if (err instanceof TypeError) return true; // network / fetch failure
  if (err instanceof Error && /failed: 0/.test(err.message)) return true;
  return false;
};

export const useCampaignsStore = create<CampaignsState>()(
  persist(
    (set, get) => ({
      campaigns: [],
      reportsByCampaign: {},
      isOffline: false,

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

      async createCampaign(body) {
        const optimistic: Campaign = {
          id: tempId(),
          archetype: body.archetype,
          brand_name: body.brand_name,
          graph: body.graph,
          brief: body.brief ?? null,
          status: 'idle',
          created_at: nowIso(),
          updated_at: nowIso(),
          last_executed_at: null,
          last_job_id: null,
        };
        set((s) => ({ campaigns: [optimistic, ...s.campaigns] }));

        try {
          const created = await apiClient.createCampaign(body);
          set((s) => ({
            campaigns: s.campaigns.map((c) => (c.id === optimistic.id ? created : c)),
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
        set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) }));
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
    }),
    {
      name: 'nucleus-campaigns',
      partialize: (s) => ({
        campaigns: s.campaigns,
        reportsByCampaign: s.reportsByCampaign,
      }),
    },
  ),
);
