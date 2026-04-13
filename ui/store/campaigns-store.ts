'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  Campaign,
  CampaignArchetype,
  GraphEdgeMeta,
  GraphNodeMeta,
} from '@/lib/types';

interface CampaignsStore {
  campaigns: Campaign[];
  currentCampaignId: string | null;
  newCampaignModalOpen: boolean;
  createCampaign: (archetype: CampaignArchetype, brandName: string) => string;
  deleteCampaign: (id: string) => void;
  setCurrentCampaign: (id: string | null) => void;
  openNewCampaignModal: () => void;
  closeNewCampaignModal: () => void;
  updateCampaign: (id: string, patch: Partial<Campaign>) => void;
  updateNodeData: (
    campaignId: string,
    nodeId: string,
    partialData: Record<string, unknown>,
  ) => void;
}

function generateId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `campaign-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// TODO(WU-3): replace with real archetype-specific graph seeding.
function seedGraph(_archetype: CampaignArchetype): {
  nodes: GraphNodeMeta[];
  edges: GraphEdgeMeta[];
} {
  return { nodes: [], edges: [] };
}

export const useCampaignsStore = create<CampaignsStore>()(
  persist(
    (set) => ({
      campaigns: [],
      currentCampaignId: null,
      newCampaignModalOpen: false,
      createCampaign: (archetype, brandName) => {
        const id = generateId();
        const campaign: Campaign = {
          id,
          archetype,
          brandName,
          createdAt: new Date().toISOString(),
          status: 'idle',
          variants: [],
          graph: seedGraph(archetype),
        };
        set((state) => ({
          campaigns: [...state.campaigns, campaign],
          currentCampaignId: id,
        }));
        return id;
      },
      deleteCampaign: (id) =>
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
          currentCampaignId:
            state.currentCampaignId === id ? null : state.currentCampaignId,
        })),
      setCurrentCampaign: (currentCampaignId) => set({ currentCampaignId }),
      openNewCampaignModal: () => set({ newCampaignModalOpen: true }),
      closeNewCampaignModal: () => set({ newCampaignModalOpen: false }),
      updateCampaign: (id, patch) =>
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        })),
      updateNodeData: (campaignId, nodeId, partialData) =>
        set((state) => ({
          campaigns: state.campaigns.map((campaign) => {
            if (campaign.id !== campaignId) return campaign;
            const nodes = campaign.graph.nodes.map((node) =>
              node.id === nodeId
                ? { ...node, data: { ...(node.data ?? {}), ...partialData } }
                : node,
            );
            return { ...campaign, graph: { ...campaign.graph, nodes } };
          }),
        })),
    }),
    {
      name: 'nucleus-campaigns',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        campaigns: state.campaigns,
        currentCampaignId: state.currentCampaignId,
      }),
    },
  ),
);
