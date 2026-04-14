'use client';

import { useCampaignsStore } from '@/store/campaigns-store';
import type { GraphNodeKind, GraphNodeMeta } from '@/lib/types';
import { AudioGenModal } from './AudioGenModal';
import { BrandKBModal } from './BrandKBModal';
import { CompositionModal } from './CompositionModal';
import { DeliveryModal } from './DeliveryModal';
import { EditorModal } from './EditorModal';
import { ICPModal } from './ICPModal';
import { ScoringModal } from './ScoringModal';
import { VideoGenModal } from './VideoGenModal';

const OWNED_KINDS: ReadonlySet<GraphNodeKind> = new Set<GraphNodeKind>([
  'video_gen',
  'audio_gen',
  'composition',
  'scoring',
  'editor',
  'delivery',
  'brand_kb',
  'icp',
]);

/**
 * Self-driven modal registry. Reads `openNodeModalId` + `currentCampaignId`
 * from the campaigns store and renders the kind-specific modal for the open
 * node. Mounted once globally in the root layout — no props required.
 */
export function NodeModalRegistry() {
  const openNodeId = useCampaignsStore((s) => s.openNodeModalId);
  const campaignId = useCampaignsStore((s) => s.currentCampaignId);
  const closeNodeModal = useCampaignsStore((s) => s.closeNodeModal);

  const node = useCampaignsStore((s) => {
    if (!openNodeId) return null;
    // Search across all campaigns so the modal opens even if the user hasn't
    // explicitly set currentCampaignId yet (e.g. navigating directly to /canvas).
    for (const c of s.campaigns) {
      const graph = c.graph as { nodes?: GraphNodeMeta[] } | undefined;
      const found = graph?.nodes?.find((n) => n.id === openNodeId);
      if (found) return { campaignId: c.id, node: found };
    }
    return null;
  });

  if (!node || !OWNED_KINDS.has(node.node.kind as GraphNodeKind)) return null;

  const resolvedCampaignId = node.campaignId || campaignId || '';

  const common = {
    open: true,
    onClose: closeNodeModal,
    campaignId: resolvedCampaignId,
    nodeId: node.node.id,
    initial: (node.node.data ?? {}) as Record<string, unknown>,
  };

  switch (node.node.kind) {
    case 'video_gen':
      return <VideoGenModal {...common} />;
    case 'audio_gen':
      return <AudioGenModal {...common} />;
    case 'composition':
      return <CompositionModal {...common} />;
    case 'scoring':
      return <ScoringModal {...common} />;
    case 'editor':
      return <EditorModal {...common} />;
    case 'delivery':
      return <DeliveryModal {...common} />;
    case 'brand_kb':
      return (
        <BrandKBModal
          open
          onClose={closeNodeModal}
          campaignId={resolvedCampaignId}
          nodeId={node.node.id}
        />
      );
    case 'icp':
      return (
        <ICPModal
          open
          onClose={closeNodeModal}
          campaignId={resolvedCampaignId}
          nodeId={node.node.id}
        />
      );
    default:
      return null;
  }
}
