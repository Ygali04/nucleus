import { useCallback, useEffect, useState } from 'react';

import { apiClient, type CampaignReport } from '@/lib/api-client';
import { useCampaignsStore } from '@/store/campaigns-store';

interface UseNeuroPeerReport {
  reports: CampaignReport[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Fetch NeuroPeer analysis reports for a campaign.
 *
 * Prefers the backend at ``/api/v1/campaigns/{id}/reports`` and falls back to
 * whatever the campaigns store has cached locally (populated via
 * ``useCampaignsStore.loadReports``) when the request fails.
 */
export function useNeuroPeerReport(campaignId: string | null): UseNeuroPeerReport {
  const cached = useCampaignsStore((s) =>
    campaignId ? s.reportsByCampaign[campaignId] ?? [] : [],
  );
  const updateCache = useCampaignsStore((s) => s.loadReports);

  const [reports, setReports] = useState<CampaignReport[]>(cached);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchReports = useCallback(async () => {
    if (!campaignId) return;
    setIsLoading(true);
    setError(null);
    try {
      const remote = await apiClient.listCampaignReports(campaignId);
      setReports(remote);
      // Sync the store so siblings see the same list without refetching.
      await updateCache(campaignId).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setReports(cached);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, cached, updateCache]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  return { reports, isLoading, error, refresh: fetchReports };
}
