'use client';

import { create } from 'zustand';
import type { GraphNodeKind } from '@/lib/types';

export interface CampaignsStoreState {
  openNodeModalId: string | null;
  activeReportNodeId: string | null;
  openNodeModal: (nodeId: string) => void;
  closeNodeModal: () => void;
  openReportForIteration: (nodeId: string) => void;
  closeReport: () => void;
  retryNode: (nodeId: string) => void;
  deleteNode: (campaignId: string | null | undefined, nodeId: string) => void;
  swapNodeKind: (
    campaignId: string | null | undefined,
    nodeId: string,
    newKind: GraphNodeKind,
  ) => void;
}

/**
 * WU-7 owns the real campaign graph reducer and `migrateNodeData`. Until that
 * lands, these actions are in-memory stubs — enough for the canvas to render
 * and for WU-10 to wire real side effects.
 */
export const useCampaignsStore = create<CampaignsStoreState>((set) => ({
  openNodeModalId: null,
  activeReportNodeId: null,
  openNodeModal: (nodeId) => set({ openNodeModalId: nodeId }),
  closeNodeModal: () => set({ openNodeModalId: null }),
  openReportForIteration: (nodeId) => set({ activeReportNodeId: nodeId }),
  closeReport: () => set({ activeReportNodeId: null }),
  retryNode: () => {},
  deleteNode: () => {},
  swapNodeKind: () => {},
}));
