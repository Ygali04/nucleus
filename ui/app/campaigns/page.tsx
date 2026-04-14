'use client';

import { Plus, Sparkles } from 'lucide-react';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import { useCampaignsStore } from '@/store/campaigns-store';

export default function CampaignsPage() {
  const campaigns = useCampaignsStore((s) => s.campaigns);
  const openNewCampaignModal = useCampaignsStore(
    (s) => s.openNewCampaignModal,
  );

  const hasCampaigns = campaigns.length > 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[var(--color-ink)]">
            Campaigns
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Your UGC variant generation campaigns.
          </p>
        </div>
        <button
          type="button"
          onClick={openNewCampaignModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)]"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </button>
      </header>

      {hasCampaigns ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="gs-card flex max-w-md flex-col items-center gap-4 p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-serif text-xl font-semibold text-[var(--color-ink)]">
                Create your first campaign
              </h2>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Pick an archetype, seed a brief, and Nucleus will draft variants
                to score and iterate.
              </p>
            </div>
            <button
              type="button"
              onClick={openNewCampaignModal}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)]"
            >
              <Plus className="h-4 w-4" />
              New Campaign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
