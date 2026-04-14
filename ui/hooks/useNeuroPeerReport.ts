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
  const reportsByCampaign = useCampaignsStore((s) => s.reportsByCampaign);

  return useMemo(() => {
    if (!variantId) {
      return { report: null, loading: false, error: null };
    }
    for (const reports of Object.values(reportsByCampaign)) {
      const match = reports.find((r) => r.iteration_id === variantId);
      if (match) {
        return {
          report: match.analysis_result as unknown as NeuroPeerReport,
          loading: false,
          error: null,
        };
      }
    }
    const fixture = findFixtureReport(variantId);
    return { report: fixture, loading: false, error: null };
  }, [reportsByCampaign, variantId]);
}
