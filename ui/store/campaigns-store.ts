'use client';

import { create } from 'zustand';
import type { Campaign, NeuroPeerReport } from '@/lib/types';

interface CampaignsState {
  campaigns: Campaign[];
  setCampaigns: (campaigns: Campaign[]) => void;
  upsertCampaign: (campaign: Campaign) => void;
  setVariantReport: (
    campaignId: string,
    variantId: string,
    report: NeuroPeerReport,
  ) => void;
  reset: () => void;
}

export const useCampaignsStore = create<CampaignsState>((set) => ({
  campaigns: [],

  setCampaigns: (campaigns) => set({ campaigns }),

  upsertCampaign: (campaign) =>
    set((state) => {
      const idx = state.campaigns.findIndex((c) => c.id === campaign.id);
      if (idx === -1) {
        return { campaigns: [...state.campaigns, campaign] };
      }
      const next = state.campaigns.slice();
      next[idx] = campaign;
      return { campaigns: next };
    }),

  setVariantReport: (campaignId, variantId, report) =>
    set((state) => ({
      campaigns: state.campaigns.map((campaign) =>
        campaign.id !== campaignId
          ? campaign
          : {
              ...campaign,
              variants: campaign.variants.map((variant) =>
                variant.id === variantId ? { ...variant, report } : variant,
              ),
            },
      ),
    })),

  reset: () => set({ campaigns: [] }),
}));
