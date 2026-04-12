'use client';

import { useEffect } from 'react';
import { dummyAgents } from '@/fixtures/agents';
import { dashboardApi } from '@/lib/api';
import { normalizeAgents } from '@/lib/dashboard-sync';
import { useDashboardStore } from '@/store/dashboard-store';

export function useAgents() {
  const setAgents = useDashboardStore((state) => state.setAgents);
  const setLiveMode = useDashboardStore((state) => state.setLiveMode);

  useEffect(() => {
    let mounted = true;

    async function loadAgents() {
      try {
        const response = await dashboardApi.getState();
        if (!mounted) return;
        setAgents(normalizeAgents(response));
        setLiveMode(true);
      } catch {
        if (!mounted) return;
        setAgents(dummyAgents);
        setLiveMode(false);
      }
    }

    loadAgents();

    return () => {
      mounted = false;
    };
  }, [setAgents, setLiveMode]);
}
