'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ARCHETYPE_CONFIGS } from '@/lib/campaign-archetypes';
import type { CampaignArchetype } from '@/lib/campaign-archetypes';
import type { GraphEdgeMeta, GraphNodeMeta } from '@/lib/types';

export type { CampaignArchetype };

export interface CampaignGraph {
  nodes: GraphNodeMeta[];
  edges: GraphEdgeMeta[];
}

export interface Campaign {
  id: string;
  brandName: string;
  archetype: CampaignArchetype;
  createdAt: string;
  graph: CampaignGraph;
}

interface CampaignsState {
  campaigns: Campaign[];
  newCampaignModalOpen: boolean;
  openNewCampaignModal: () => void;
  closeNewCampaignModal: () => void;
  createCampaign: (archetype: CampaignArchetype, brandName: string) => Campaign;
}

function generateCampaignId(): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `camp-${Date.now().toString(36)}-${random}`;
}

function seedGraph(campaignId: string, archetype: CampaignArchetype): CampaignGraph {
  const config = ARCHETYPE_CONFIGS[archetype];
  const nodes = structuredClone(config.defaultNodes).map((node) => ({
    ...node,
    id: `${campaignId}-${node.id}`,
    parentId: node.parentId ? `${campaignId}-${node.parentId}` : node.parentId,
  }));
  const edges = structuredClone(config.defaultEdges).map((edge) => ({
    ...edge,
    id: `${campaignId}-${edge.id}`,
    source: `${campaignId}-${edge.source}`,
    target: `${campaignId}-${edge.target}`,
  }));
  return { nodes, edges };
}

export const useCampaignsStore = create<CampaignsState>()(
  persist(
    (set) => ({
      campaigns: [],
      newCampaignModalOpen: false,
      openNewCampaignModal: () => set({ newCampaignModalOpen: true }),
      closeNewCampaignModal: () => set({ newCampaignModalOpen: false }),
      createCampaign: (archetype, brandName) => {
        const id = generateCampaignId();
        const campaign: Campaign = {
          id,
          brandName: brandName.trim(),
          archetype,
          createdAt: new Date().toISOString(),
          graph: seedGraph(id, archetype),
        };
        set((state) => ({ campaigns: [...state.campaigns, campaign] }));
        return campaign;
      },
    }),
    {
      name: 'nucleus-campaigns-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ campaigns: state.campaigns }),
    },
  ),
);
