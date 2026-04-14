import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PipelineEvent } from '@/lib/types';

const MAX_EVENTS = 10000;
const MAX_PAYLOAD_BYTES = 1024;

export interface EventsState {
  events: PipelineEvent[];
  appendEvent: (event: PipelineEvent) => void;
  clearEvents: (campaignId?: string) => void;
}

function stripLargePayload(event: PipelineEvent): PipelineEvent {
  try {
    const size = JSON.stringify(event.payload).length;
    if (size > MAX_PAYLOAD_BYTES) {
      return { ...event, payload: { _truncated: true, _bytes: size } };
    }
  } catch {
    return { ...event, payload: { _unserializable: true } };
  }
  return event;
}

export const useEventsStore = create<EventsState>()(
  persist(
    (set) => ({
      events: [],
      appendEvent: (event) =>
        set((state) => {
          const next = state.events.length >= MAX_EVENTS
            ? [...state.events.slice(state.events.length - MAX_EVENTS + 1), event]
            : [...state.events, event];
          return { events: next };
        }),
      clearEvents: (campaignId) =>
        set((state) => ({
          events: campaignId
            ? state.events.filter((e) => e.campaignId !== campaignId)
            : [],
        })),
    }),
    {
      name: 'nucleus-events-store',
      partialize: (state) => ({
        events: state.events.map(stripLargePayload),
      }),
    },
  ),
);
