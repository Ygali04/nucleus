'use client';

import { create } from 'zustand';
import { migrateNodeData } from '@/lib/node-swap-migration';
import type { GraphNodeKind, GraphNodeMeta } from '@/lib/types';

export interface CampaignNode extends GraphNodeMeta {
  data: Record<string, unknown>;
}

export interface Campaign {
  id: string;
  name: string;
  nodes: CampaignNode[];
}

interface CampaignsStore {
  campaigns: Record<string, Campaign>;
  upsertCampaign: (campaign: Campaign) => void;
  updateNodeData: (
    campaignId: string,
    nodeId: string,
    patch: Record<string, unknown>,
  ) => void;
  retryNode: (campaignId: string, nodeId: string) => void;
  deleteNode: (campaignId: string, nodeId: string) => void;
  swapNodeKind: (
    campaignId: string,
    nodeId: string,
    newKind: GraphNodeKind,
  ) => void;
}

function mapNode(
  campaign: Campaign | undefined,
  nodeId: string,
  mapper: (node: CampaignNode) => CampaignNode | null,
): Campaign | undefined {
  if (!campaign) return undefined;
  const nodes: CampaignNode[] = [];
  for (const node of campaign.nodes) {
    if (node.id !== nodeId) {
      nodes.push(node);
      continue;
    }
    const next = mapper(node);
    if (next) nodes.push(next);
  }
  return { ...campaign, nodes };
}

export const useCampaignsStore = create<CampaignsStore>((set) => ({
  campaigns: {},
  upsertCampaign: (campaign) =>
    set((state) => ({
      campaigns: { ...state.campaigns, [campaign.id]: campaign },
    })),
  updateNodeData: (campaignId, nodeId, patch) =>
    set((state) => {
      const next = mapNode(state.campaigns[campaignId], nodeId, (node) => ({
        ...node,
        data: { ...node.data, ...patch },
      }));
      if (!next) return state;
      return { campaigns: { ...state.campaigns, [campaignId]: next } };
    }),
  retryNode: (campaignId, nodeId) =>
    set((state) => {
      const next = mapNode(state.campaigns[campaignId], nodeId, (node) => ({
        ...node,
        status: 'active',
        statusText: 'Retry queued',
      }));
      if (!next) return state;
      return { campaigns: { ...state.campaigns, [campaignId]: next } };
    }),
  deleteNode: (campaignId, nodeId) =>
    set((state) => {
      const next = mapNode(state.campaigns[campaignId], nodeId, () => null);
      if (!next) return state;
      return { campaigns: { ...state.campaigns, [campaignId]: next } };
    }),
  swapNodeKind: (campaignId, nodeId, newKind) =>
    set((state) => {
      const next = mapNode(state.campaigns[campaignId], nodeId, (node) => {
        if (node.kind === newKind) return node;
        return {
          ...node,
          kind: newKind,
          data: migrateNodeData(node.kind, newKind, node.data),
        };
      });
      if (!next) return state;
      return { campaigns: { ...state.campaigns, [campaignId]: next } };
    }),
}));
