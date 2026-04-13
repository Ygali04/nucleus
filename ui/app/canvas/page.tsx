'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ArchitectureCanvas } from '@/components/canvas/ArchitectureCanvas';
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar';
import { useCampaignsStore } from '@/store/campaigns-store';

function CanvasView() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaign');
  const campaign = useCampaignsStore((state) =>
    campaignId ? state.campaigns.find((c) => c.id === campaignId) : undefined,
  );

  if (!campaign) {
    return (
      <div className="flex min-h-[calc(100vh-92px)] items-center justify-center p-6">
        <div className="gs-card max-w-md rounded-2xl border border-black/10 bg-white/95 p-8 text-center shadow-sm">
          <h2 className="mb-2 font-serif text-xl text-[var(--color-ink)]">
            No campaign selected
          </h2>
          <p className="mb-5 text-sm text-[var(--color-muted)]">
            Create one from Campaigns to load a canvas.
          </p>
          <Link
            href="/campaigns"
            className="inline-flex items-center rounded-md bg-[var(--color-dark)] px-4 py-2 text-sm text-white transition hover:opacity-95"
          >
            Go to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <ArchitectureCanvas
        initialNodes={campaign.graph.nodes}
        initialEdges={campaign.graph.edges}
      />
      <CanvasToolbar campaign={campaign} />
    </div>
  );
}

export default function CanvasPage() {
  return (
    <Suspense fallback={null}>
      <CanvasView />
    </Suspense>
  );
}
