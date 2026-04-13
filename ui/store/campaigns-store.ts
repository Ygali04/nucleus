'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const DEFAULT_CAMPAIGN_ID = 'default';

export type NodeDataMap = Record<string, Record<string, unknown>>;

interface CampaignsState {
  currentCampaignId: string;
  openNodeModalId: string | null;
  nodeData: Record<string, NodeDataMap>;

  setCurrentCampaign: (campaignId: string) => void;
  openNodeModal: (nodeId: string) => void;
  closeNodeModal: () => void;
  updateNodeData: (
    campaignId: string,
    nodeId: string,
    partialData: Record<string, unknown>,
  ) => void;
  getNodeData: (
    campaignId: string,
    nodeId: string,
  ) => Record<string, unknown> | undefined;
}

export const useCampaignsStore = create<CampaignsState>()(
  persist(
    (set, get) => ({
      currentCampaignId: DEFAULT_CAMPAIGN_ID,
      openNodeModalId: null,
      nodeData: {},

      setCurrentCampaign: (currentCampaignId) => set({ currentCampaignId }),
      openNodeModal: (nodeId) => set({ openNodeModalId: nodeId }),
      closeNodeModal: () => set({ openNodeModalId: null }),

      updateNodeData: (campaignId, nodeId, partialData) =>
        set((state) => {
          const campaignMap = state.nodeData[campaignId] ?? {};
          const existing = campaignMap[nodeId] ?? {};
          return {
            nodeData: {
              ...state.nodeData,
              [campaignId]: {
                ...campaignMap,
                [nodeId]: { ...existing, ...partialData },
              },
            },
          };
        }),

      getNodeData: (campaignId, nodeId) =>
        get().nodeData[campaignId]?.[nodeId],
    }),
    {
      name: 'nucleus-campaigns',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentCampaignId: state.currentCampaignId,
        nodeData: state.nodeData,
      }),
    },
  ),
);

export { DEFAULT_CAMPAIGN_ID };
