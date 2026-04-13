'use client';

import { useMemo } from 'react';
import { findFixtureReport } from '@/fixtures/neuropeer-reports';
import type { NeuroPeerReport } from '@/lib/types';
import { useCampaignsStore } from '@/store/campaigns-store';

interface UseNeuroPeerReportResult {
  report: NeuroPeerReport | null;
  loading: boolean;
  error: string | null;
}

export function useNeuroPeerReport(
  variantId: string | null,
): UseNeuroPeerReportResult {
  const campaigns = useCampaignsStore((state) => state.campaigns);

  return useMemo(() => {
    if (!variantId) {
      return { report: null, loading: false, error: null };
    }
    for (const campaign of campaigns) {
      const variant = campaign.variants.find((v) => v.id === variantId);
      if (variant?.report) {
        return { report: variant.report, loading: false, error: null };
      }
    }
    const fixture = findFixtureReport(variantId);
    return { report: fixture, loading: false, error: null };
  }, [campaigns, variantId]);
}
