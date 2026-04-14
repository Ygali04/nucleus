'use client';

import {
  BookOpen,
  GraduationCap,
  Megaphone,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TimeAgo } from '@/components/shared/TimeAgo';
import type { Campaign } from '@/lib/api-client';
import type { CampaignArchetype } from '@/lib/types';
import { CampaignStatusPill } from './CampaignStatusPill';

const ARCHETYPE_ICON: Record<CampaignArchetype, LucideIcon> = {
  demo: Sparkles,
  marketing: Megaphone,
  knowledge: BookOpen,
  education: GraduationCap,
};

const ARCHETYPE_LABEL: Record<CampaignArchetype, string> = {
  demo: 'Demo',
  marketing: 'Marketing',
  knowledge: 'Knowledge',
  education: 'Education',
};

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const router = useRouter();
  const Icon = ARCHETYPE_ICON[campaign.archetype as CampaignArchetype];

  return (
    <button
      type="button"
      onClick={() => router.push(`/canvas?campaign=${campaign.id}`)}
      className="gs-card group flex flex-col gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">
              {campaign.brand_name}
            </div>
            <div className="text-xs text-[var(--color-muted)]">
              {ARCHETYPE_LABEL[campaign.archetype as CampaignArchetype]}
            </div>
          </div>
        </div>
        <CampaignStatusPill status={campaign.status} />
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-faint)]">
            Archetype
          </div>
          <div className="text-2xl font-semibold text-[var(--color-ink)]">
            {ARCHETYPE_LABEL[campaign.archetype as CampaignArchetype]}
          </div>
        </div>
        <div className="text-right text-xs text-[var(--color-muted)]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-faint)]">
            Last run
          </div>
          {campaign.last_executed_at ? (
            <TimeAgo value={campaign.last_executed_at} />
          ) : (
            <span>Never</span>
          )}
        </div>
      </div>
    </button>
  );
}
