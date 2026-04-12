'use client';

import { useEffect } from 'react';
import { DASHBOARD_WS_URL } from '@/lib/constants';
import { getDashboardSurface } from '@/lib/surface';
import { MockEventGenerator } from '@/lib/mock-event-generator';
import type { ActivityEntry, DashboardSocketMessage } from '@/lib/types';
import { useDashboardStore } from '@/store/dashboard-store';

export function useWebSocket() {
  const appendEvent = useDashboardStore((state) => state.appendEvent);
  const prependActivity = useDashboardStore((state) => state.prependActivity);
  const setEvents = useDashboardStore((state) => state.setEvents);
  const setLiveMode = useDashboardStore((state) => state.setLiveMode);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let mockGenerator: MockEventGenerator | null = null;
    let isMounted = true;

    const hydrateActivity = (
      type: string,
      event: {
        agentId?: string;
        timestamp: string;
        data: Record<string, unknown>;
      },
    ) =>
      ({
        ts: event.timestamp,
        agent: event.agentId || 'system',
        type:
          type === 'cost:update'
            ? 'cost'
            : type === 'task:completed'
              ? 'task_completed'
              : type === 'task:failed'
                ? 'task_failed'
                : type === 'tool:call'
                  ? 'tool_call'
                  : type === 'tool:result'
                    ? 'tool_result'
                    : type === 'message:sent'
                      ? 'message_sent'
                      : type === 'message:received'
                        ? 'message_received'
                        : type === 'agent:iteration'
                          ? 'iteration'
                          : type === 'system:error'
                            ? 'error'
                            : 'thinking',
        data: {
          summary:
            typeof event.data.message === 'string'
              ? event.data.message
              : typeof event.data.title === 'string'
                ? event.data.title
                : `Event: ${type}`,
          ...event.data,
        },
      }) satisfies ActivityEntry;

    const startMockMode = () => {
      if (mockGenerator) return;
      setLiveMode(false);
      mockGenerator = new MockEventGenerator((event, activity) => {
        if (!isMounted) return;
        appendEvent(event);
        prependActivity(activity);
      });
      mockGenerator.start();
    };

    const connect = () => {
      const view = getDashboardSurface(window.location.pathname);
      const wsUrl = new URL(DASHBOARD_WS_URL);
      wsUrl.searchParams.set('view', view);
      socket = new WebSocket(wsUrl.toString());

      socket.onopen = () => {
        if (!isMounted) return;
        setLiveMode(true);
        if (mockGenerator) {
          mockGenerator.stop();
          mockGenerator = null;
        }
      };

      socket.onmessage = (message) => {
        if (!isMounted) return;

        const parsed = JSON.parse(message.data) as DashboardSocketMessage;
        if (parsed.type === 'history') {
          setEvents(parsed.events);
          return;
        }

        appendEvent(parsed.event);
        prependActivity(hydrateActivity(parsed.event.type, parsed.event));
      };

      socket.onerror = () => {
        startMockMode();
      };

      socket.onclose = () => {
        if (!isMounted) return;
        startMockMode();
        reconnectTimer = setTimeout(connect, 5_000);
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (mockGenerator) mockGenerator.stop();
      if (socket && socket.readyState < 2) socket.close();
    };
  }, [appendEvent, prependActivity, setEvents, setLiveMode]);
}
