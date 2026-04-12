'use client';

import { useEffect } from 'react';
import { dummyMessages } from '@/fixtures/messages';
import { dashboardApi } from '@/lib/api';
import { useDashboardStore } from '@/store/dashboard-store';

export function useMessages() {
  const setMessages = useDashboardStore((state) => state.setMessages);

  useEffect(() => {
    let mounted = true;

    async function loadMessages() {
      try {
        const response = await dashboardApi.getMessages();
        if (!mounted) return;
        setMessages(response);
      } catch {
        if (!mounted) return;
        setMessages(dummyMessages);
      }
    }

    loadMessages();

    return () => {
      mounted = false;
    };
  }, [setMessages]);
}
