'use client';

import { useEffect } from 'react';
import { dummyActivity } from '@/fixtures/activity';
import { dashboardApi } from '@/lib/api';
import { useDashboardStore } from '@/store/dashboard-store';

export function useActivity(limit = 200) {
  const setActivity = useDashboardStore((state) => state.setActivity);

  useEffect(() => {
    let mounted = true;

    async function loadActivity() {
      try {
        const response = await dashboardApi.getActivity(limit);
        if (!mounted) return;
        setActivity(response.slice().reverse());
      } catch {
        if (!mounted) return;
        setActivity(dummyActivity);
      }
    }

    loadActivity();

    return () => {
      mounted = false;
    };
  }, [limit, setActivity]);
}
