'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { usePipelineStore } from '@/store/pipeline-store';

export interface PipelineEvent {
  event_type: string;
  job_id: string;
  [key: string]: unknown;
}

export function usePipelineWebSocket(jobId: string | null) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<PipelineEvent | null>(null);

  useEffect(() => {
    if (!jobId) return;
    const url = apiClient.getWebSocketUrl(jobId);
    const ws = new WebSocket(url);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (ev) => {
      try {
        const event = JSON.parse(ev.data) as PipelineEvent;
        setLastEvent(event);
        // Dispatch to store based on event_type.
        const store = usePipelineStore.getState();
        const et = event.event_type;
        if (et === 'candidate.generating' || et === 'candidate.scored' || et === 'candidate.editing') {
          const cid = event['candidate_id'] as string | undefined;
          if (cid) {
            store.updateCandidate(cid, { status: et.split('.')[1] });
          }
        } else if (et === 'iteration.evaluated') {
          const cid = event['candidate_id'] as string | undefined;
          const score = event['score'] as number | undefined;
          if (cid && score !== undefined) {
            store.updateCandidate(cid, { currentScore: score });
          }
        } else if (et === 'candidate.delivered') {
          const cid = event['candidate_id'] as string | undefined;
          const score = event['score'] as number | undefined;
          if (cid) {
            store.updateCandidate(cid, {
              status: 'delivered',
              finalScore: score ?? null,
            });
          }
        }
      } catch (e) {
        // Ignore malformed messages (e.g., keepalive pings).
      }
    };

    return () => {
      ws.close();
    };
  }, [jobId]);

  return { connected, lastEvent };
}
