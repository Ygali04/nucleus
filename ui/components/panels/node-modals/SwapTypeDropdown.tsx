'use client';

import { Shuffle } from 'lucide-react';
import { useCampaignsStore } from '@/store/campaigns-store';
import type { GraphNodeKind } from '@/lib/types';

const SWAP_TARGETS: Partial<Record<GraphNodeKind, GraphNodeKind[]>> = {
  video_gen: ['audio_gen', 'editor'],
  audio_gen: ['video_gen', 'editor'],
  editor: ['video_gen', 'audio_gen'],
  composition: ['delivery'],
  scoring: ['delivery'],
  delivery: ['scoring'],
};

const KIND_LABEL: Record<GraphNodeKind, string> = {
  group: 'Group',
  video_gen: 'VideoGen',
  audio_gen: 'AudioGen',
  composition: 'Composition',
  scoring: 'Scoring',
  editor: 'Editor',
  brand_kb: 'Brand KB',
  icp: 'ICP',
  delivery: 'Delivery',
  source_video: 'Source Video',
  storyboard: 'Storyboard',
  image_edit: 'Image Edit',
};

interface SwapTypeDropdownProps {
  campaignId: string;
  nodeId: string;
  kind: GraphNodeKind;
}

export function SwapTypeDropdown({
  campaignId,
  nodeId,
  kind,
}: SwapTypeDropdownProps) {
  const swapNodeKind = useCampaignsStore((s) => s.swapNodeKind);
  const targets = SWAP_TARGETS[kind] ?? [];

  if (targets.length === 0) return null;

  return (
    <label className="inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white px-2 py-1.5 text-xs text-[var(--color-muted)] transition hover:bg-black/[0.03]">
      <Shuffle className="h-3.5 w-3.5" />
      <span className="sr-only">Swap type</span>
      <select
        aria-label="Swap node type"
        className="bg-transparent text-xs font-medium text-[var(--color-ink)] focus:outline-none"
        value=""
        onChange={(e) => {
          const next = e.target.value as GraphNodeKind;
          if (next) swapNodeKind(campaignId, nodeId, next);
        }}
      >
        <option value="">Swap type…</option>
        {targets.map((target) => (
          <option key={target} value={target}>
            {KIND_LABEL[target]}
          </option>
        ))}
      </select>
    </label>
  );
}
