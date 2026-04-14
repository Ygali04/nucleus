'use client';

// TODO(WU-6): Merge with the BrandKB/ICP modals added by WU-6. This file
// currently registers only the 6 modals owned by WU-7; extend the switch
// below when the BrandKB/ICP modals from WU-6 land.

import { useCampaignsStore } from '@/store/campaigns-store';
import type { GraphNodeKind, GraphNodeMeta } from '@/lib/types';
import { AudioGenModal } from './AudioGenModal';
import { CompositionModal } from './CompositionModal';
import { DeliveryModal } from './DeliveryModal';
import { EditorModal } from './EditorModal';
import { ScoringModal } from './ScoringModal';
import { VideoGenModal } from './VideoGenModal';

export interface NodeModalRegistryProps {
  campaignId: string;
  openNodeId: string | null;
  onClose: () => void;
}

const OWNED_KINDS: ReadonlySet<GraphNodeKind> = new Set<GraphNodeKind>([
  'video_gen',
  'audio_gen',
  'composition',
  'scoring',
  'editor',
  'delivery',
]);

export function NodeModalRegistry({
  campaignId,
  openNodeId,
  onClose,
}: NodeModalRegistryProps) {
  const node = useCampaignsStore((s) => {
    if (!openNodeId) return null;
    const graph = s.campaigns.find((c) => c.id === campaignId)?.graph as
      | { nodes?: GraphNodeMeta[] }
      | undefined;
    return graph?.nodes?.find((n) => n.id === openNodeId) ?? null;
  });

  if (!node || !OWNED_KINDS.has(node.kind as GraphNodeKind)) return null;

  const common = {
    open: true,
    onClose,
    campaignId,
    nodeId: node.id,
    initial: (node.data ?? {}) as Record<string, unknown>,
  };

  switch (node.kind) {
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
    default:
      return null;
  }
}
