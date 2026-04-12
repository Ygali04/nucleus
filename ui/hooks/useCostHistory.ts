'use client';

import { useEffect } from 'react';
import { dummyCostHistory } from '@/fixtures/cost-history';
import { dashboardApi } from '@/lib/api';
import { useDashboardStore } from '@/store/dashboard-store';

export function useCostHistory() {
  const setCostHistory = useDashboardStore((state) => state.setCostHistory);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      try {
        const response = await dashboardApi.getCostHistory();
        if (!mounted) return;
        setCostHistory(response);
      } catch {
        if (!mounted) return;
        setCostHistory(dummyCostHistory);
      }
    }

    loadHistory();

    return () => {
      mounted = false;
    };
  }, [setCostHistory]);
}
