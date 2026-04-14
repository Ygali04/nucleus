'use client';

import { useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import type {
  NodeExecutionState,
  PipelineEvent,
  PipelineEventSeverity,
} from '@/lib/types';
import { useCampaignsStore } from '@/store/campaigns-store';
import { useEventsStore } from '@/store/events-store';
import { usePipelineStore } from '@/store/pipeline-store';

const RUNNING_STATUSES = new Set([
  'briefed',
  'planning',
  'generating',
  'scoring',
  'editing',
  'delivering',
]);

function severityFor(eventType: string): PipelineEventSeverity {
  if (eventType.includes('error') || eventType.includes('failed')) return 'error';
  if (eventType.includes('warn') || eventType.includes('preempted')) return 'warn';
  return 'info';
}

function toPipelineEvent(campaignId: string, raw: Record<string, unknown>): PipelineEvent {
  const eventType = (raw.event_type as string) ?? 'unknown';
  return {
    id: `${campaignId}-${raw.timestamp ?? Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: (raw.timestamp as string) ?? new Date().toISOString(),
    campaignId,
    eventType,
    severity: severityFor(eventType),
    candidateIndex: raw.candidate_index as number | undefined,
    iterationIndex: raw.iteration_index as number | undefined,
    message: raw.message as string | undefined,
    payload: raw,
  };
}

function comfyuiExecutionPatch(
  eventType: string,
  payload: Record<string, unknown>,
): NodeExecutionState | null {
  switch (eventType) {
    case 'tool.comfyui.progress':
      return {
        executionStatus: 'executing',
        progressPercent: payload.percent as number | undefined,
        progressLabel: payload.label as string | undefined,
      };
    case 'tool.comfyui.node_complete':
      return {
        executionStatus: 'done',
        progressPercent: 100,
        lastExecutionS: payload.duration_s as number | undefined,
        lastCostUsd: payload.cost_usd as number | undefined,
        cached: false,
      };
    case 'tool.comfyui.cached':
      return { cached: true };
    case 'tool.comfyui.failed':
      return { executionStatus: 'failed' };
    default:
      return null;
  }
}

export function usePipelineEvents() {
  const job = usePipelineStore((state) => state.currentJob);
  const appendEvent = useEventsStore((state) => state.appendEvent);

  const jobId = job && RUNNING_STATUSES.has(job.status) ? job.id : null;

  useEffect(() => {
    if (!jobId) return;
    const ws = new WebSocket(apiClient.getWebSocketUrl(jobId));
    ws.onmessage = (ev) => {
      try {
        const raw = JSON.parse(ev.data) as Record<string, unknown>;
        appendEvent(toPipelineEvent(jobId, raw));

        const eventType = (raw.event_type as string) ?? '';
        const payload = (raw.payload as Record<string, unknown> | undefined) ?? raw;
        const nodeId = payload.nucleus_node_id as string | undefined;
        if (!nodeId) return;
        const patch = comfyuiExecutionPatch(eventType, payload);
        if (!patch) return;
        // Read campaign id lazily so campaign switches don't tear down the WS.
        const { currentCampaignId, updateNodeExecutionState } =
          useCampaignsStore.getState();
        if (currentCampaignId) {
          updateNodeExecutionState(currentCampaignId, nodeId, patch);
        }
      } catch {
        // Ignore malformed messages (e.g., keepalive pings).
      }
    };
    return () => ws.close();
  }, [jobId, appendEvent]);
}
