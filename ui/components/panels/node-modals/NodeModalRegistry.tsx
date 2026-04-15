'use client';

import { useCampaignsStore } from '@/store/campaigns-store';
import type { GraphNodeKind, GraphNodeMeta } from '@/lib/types';
import { AudioGenModal } from './AudioGenModal';
import { BrandKBModal } from './BrandKBModal';
import { CompositionModal } from './CompositionModal';
import { DeliveryModal } from './DeliveryModal';
import { EditorModal } from './EditorModal';
import { ICPModal } from './ICPModal';
import { ImageEditModal } from './ImageEditModal';
import { ScoringModal } from './ScoringModal';
import { SourceVideoModal } from './SourceVideoModal';
import { StoryboardModal } from './StoryboardModal';
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
  'source_video',
  'storyboard',
  'image_edit',
]);

/**
 * Self-driven modal registry. Reads `openNodeModalId` + `currentCampaignId`
 * from the campaigns store and renders the kind-specific modal for the open
 * node. Mounted once globally in the root layout — no props required.
 */
export function NodeModalRegistry() {
  // Keep each selector primitive-valued so Zustand's referential equality
  // check prevents infinite re-renders. Composition happens outside the
  // store (derived state is cheap).
  const openNodeId = useCampaignsStore((s) => s.openNodeModalId);
  const currentCampaignId = useCampaignsStore((s) => s.currentCampaignId);
  const campaigns = useCampaignsStore((s) => s.campaigns);
  const closeNodeModal = useCampaignsStore((s) => s.closeNodeModal);

  if (!openNodeId) return null;

  let foundNode: GraphNodeMeta | null = null;
  let foundCampaignId = '';
  for (const c of campaigns) {
    const graph = c.graph as { nodes?: GraphNodeMeta[] } | undefined;
    const match = graph?.nodes?.find((n) => n.id === openNodeId);
    if (match) {
      foundNode = match;
      foundCampaignId = c.id;
      break;
    }
  }

  if (!foundNode || !OWNED_KINDS.has(foundNode.kind as GraphNodeKind)) return null;

  const resolvedCampaignId = foundCampaignId || currentCampaignId || '';

  const common = {
    open: true,
    onClose: closeNodeModal,
    campaignId: resolvedCampaignId,
    nodeId: foundNode.id,
    initial: (foundNode.data ?? {}) as Record<string, unknown>,
  };

  switch (foundNode.kind) {
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
          nodeId={foundNode.id}
        />
      );
    case 'icp':
      return (
        <ICPModal
          open
          onClose={closeNodeModal}
          campaignId={resolvedCampaignId}
          nodeId={foundNode.id}
        />
      );
    case 'source_video':
      return <SourceVideoModal {...common} />;
    case 'storyboard':
      return <StoryboardModal {...common} />;
    case 'image_edit':
      return <ImageEditModal {...common} />;
    default:
      return null;
  }
}
