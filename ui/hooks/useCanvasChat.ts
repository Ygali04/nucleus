'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { apiClient } from '@/lib/api-client';
import type { ChatMessage } from '@/lib/types';
import { useCampaignsStore } from '@/store/campaigns-store';
import { useEventsStore } from '@/store/events-store';

export interface UseCanvasChatResult {
  messages: ChatMessage[];
  isThinking: boolean;
  lastEventType: string | null;
  sendMessage: (text: string) => Promise<void>;
}

function genId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useCanvasChat(campaignId: string | null): UseCanvasChatResult {
  const appendChatMessage = useCampaignsStore((s) => s.appendChatMessage);
  const messages = useCampaignsStore((s) => {
    if (!campaignId) return undefined;
    const c = s.campaigns.find((camp) => camp.id === campaignId);
    const brief = (c?.brief ?? null) as { chat_history?: ChatMessage[] } | null;
    return brief?.chat_history;
  });

  const events = useEventsStore((s) => s.events);
  const [isThinking, setIsThinking] = useState(false);
  const lastSeenIndex = useRef(0);

  const chatEvents = useMemo(() => {
    if (!campaignId) return [];
    return events.filter(
      (e) => e.campaignId === campaignId && e.eventType.startsWith('chat.'),
    );
  }, [events, campaignId]);

  const lastEventType = chatEvents.length
    ? chatEvents[chatEvents.length - 1].eventType
    : null;

  useEffect(() => {
    if (!campaignId) {
      lastSeenIndex.current = 0;
      return;
    }
    for (let i = lastSeenIndex.current; i < chatEvents.length; i++) {
      const ev = chatEvents[i];
      if (ev.eventType === 'chat.thinking') {
        setIsThinking(true);
      } else if (ev.eventType === 'chat.assistant_message') {
        setIsThinking(false);
        const payload = ev.payload ?? {};
        const rawMsg = (payload.message ?? payload) as Record<string, unknown>;
        const msg = rawMsg as Partial<ChatMessage> & {
          suggestion_id?: string;
          requires_approval?: boolean;
        };
        const content = typeof msg.content === 'string' ? msg.content : '';
        if (!content) continue;
        // The approval metadata may live on either the inner `message` or the
        // outer payload — accept both so the backend has flexibility.
        const suggestionId =
          msg.suggestion_id ?? (payload.suggestion_id as string | undefined);
        const requiresApproval =
          msg.requires_approval ??
          (payload.requires_approval as boolean | undefined);
        appendChatMessage(campaignId, {
          id: msg.id ?? genId(),
          role: 'assistant',
          content,
          timestamp: msg.timestamp ?? ev.timestamp,
          suggestion_id: suggestionId,
          requires_approval: requiresApproval,
        });
      }
    }
    lastSeenIndex.current = chatEvents.length;
  }, [chatEvents, campaignId, appendChatMessage]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !campaignId) return;
      const optimistic: ChatMessage = {
        id: genId(),
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      };
      appendChatMessage(campaignId, optimistic);
      setIsThinking(true);
      try {
        await apiClient.sendChatMessage(campaignId, trimmed);
      } catch {
        setIsThinking(false);
        appendChatMessage(campaignId, {
          id: genId(),
          role: 'system',
          content: 'Failed to send message. Please retry.',
          timestamp: new Date().toISOString(),
        });
      }
    },
    [campaignId, appendChatMessage],
  );

  return {
    messages: messages ?? [],
    isThinking,
    lastEventType,
    sendMessage,
  };
}
