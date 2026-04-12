'use client';

import { useEffect } from 'react';
import { dummyTasks } from '@/fixtures/tasks';
import { dashboardApi } from '@/lib/api';
import { normalizeTasks } from '@/lib/dashboard-sync';
import { useDashboardStore } from '@/store/dashboard-store';

export function useTasks() {
  const setTasks = useDashboardStore((state) => state.setTasks);

  useEffect(() => {
    let mounted = true;

    async function loadTasks() {
      try {
        const response = await dashboardApi.getTasks();
        if (!mounted) return;
        setTasks(normalizeTasks(response));
      } catch {
        if (!mounted) return;
        setTasks(dummyTasks);
      }
    }

    loadTasks();

    return () => {
      mounted = false;
    };
  }, [setTasks]);
}
