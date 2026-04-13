'use client';

import { useMemo } from 'react';
import { dummyGraphNodes } from '@/fixtures/graph-nodes';
import type { GraphNodeKind, GraphNodeMeta } from '@/lib/types';
import { useCampaignsStore } from '@/store/campaigns-store';
import { useDashboardStore } from '@/store/dashboard-store';
import { BrandKBModal } from './BrandKBModal';
import { ICPModal } from './ICPModal';

export default function NodeModalRegistry() {
  const openNodeModalId = useCampaignsStore((state) => state.openNodeModalId);
  const closeNodeModal = useCampaignsStore((state) => state.closeNodeModal);
  const campaignId = useCampaignsStore((state) => state.currentCampaignId);
  const customNodes = useDashboardStore((state) => state.customNodes);

  const kind = useMemo<GraphNodeKind | null>(() => {
    if (!openNodeModalId) return null;
    const all: GraphNodeMeta[] = [...dummyGraphNodes, ...customNodes];
    return all.find((node) => node.id === openNodeModalId)?.kind ?? null;
  }, [openNodeModalId, customNodes]);

  if (!openNodeModalId || !kind) return null;

  if (kind === 'brand_kb') {
    return (
      <BrandKBModal
        campaignId={campaignId}
        nodeId={openNodeModalId}
        open
        onClose={closeNodeModal}
      />
    );
  }

  if (kind === 'icp') {
    return (
      <ICPModal
        campaignId={campaignId}
        nodeId={openNodeModalId}
        open
        onClose={closeNodeModal}
      />
    );
  }

  return null;
}
