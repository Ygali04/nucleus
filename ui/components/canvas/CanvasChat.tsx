'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import { useCanvasChat } from '@/hooks/useCanvasChat';
import type { ChatMessage } from '@/lib/types';
import { useCampaignsStore } from '@/store/campaigns-store';
import { useCanvasStore } from '@/store/canvas-store';

const RUFLO_VIOLET = '#8b5cf6';

interface CanvasChatProps {
  campaignId: string | null;
}

function statusLabel(isThinking: boolean, lastEventType: string | null): string {
  if (isThinking) return 'thinking';
  if (lastEventType === 'chat.typing') return 'typing';
  return 'idle';
}

function RoleAvatar({ role }: { role: ChatMessage['role'] }) {
  if (role === 'assistant') {
    return (
      <div
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
        style={{ backgroundColor: RUFLO_VIOLET }}
      >
        ✦
      </div>
    );
  }
  if (role === 'user') {
    return (
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-[11px] font-semibold text-gray-700">
        U
      </div>
    );
  }
  return null;
}

/**
 * Inline Approve / Reject buttons for a Ruflo suggestion, shown directly
 * beneath the `chat.assistant_message` that asked for approval. Uses the same
 * store actions as the ghost-node overlay on the canvas so either UI can
 * resolve the suggestion.
 */
function InlineApprovalControls({
  campaignId,
  suggestionId,
  nodeId,
}: {
  campaignId: string;
  suggestionId: string;
  /** Suggestion's node id — used to scroll the canvas to the ghost. */
  nodeId?: string;
}) {
  const approve = useCampaignsStore((s) => s.approveSuggestion);
  const reject = useCampaignsStore((s) => s.rejectSuggestion);
  const pendingSuggestions = useCampaignsStore((s) => s.pendingSuggestions);
  const highlightNode = useCanvasStore((s) => s.highlightNode);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);

  // Resolve the ghost node id from the stored suggestion (falls back to the
  // suggestion id if the back-end uses the same value for both).
  const ghostNodeId =
    pendingSuggestions[campaignId]?.find((s) => s.id === suggestionId)?.node.id ??
    nodeId;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1.5">
        {ghostNodeId ? (
          <button
            type="button"
            onClick={() => highlightNode(ghostNodeId)}
            className="rounded-md border border-black/10 px-2 py-1 text-[11px] text-[var(--color-muted)] hover:bg-black/5"
          >
            Review on canvas
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await approve(campaignId, suggestionId);
            } finally {
              setBusy(false);
            }
          }}
          className="rounded-md px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: RUFLO_VIOLET }}
        >
          Approve
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setRejectOpen((v) => !v)}
          className="rounded-md border px-2 py-1 text-[11px] font-semibold disabled:opacity-50"
          style={{ borderColor: RUFLO_VIOLET, color: RUFLO_VIOLET }}
        >
          Reject
        </button>
      </div>
      {rejectOpen ? (
        <div className="mt-1.5 rounded-md border border-black/10 p-2">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell Ruflo what to try instead…"
            className="h-14 w-full resize-none rounded border border-black/10 p-1.5 text-[11px] outline-none"
          />
          <div className="mt-1 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                setRejectOpen(false);
                setFeedback('');
              }}
              className="rounded px-2 py-1 text-[11px] text-[var(--color-muted)] hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await reject(
                    campaignId,
                    suggestionId,
                    feedback.trim() || undefined,
                  );
                } finally {
                  setBusy(false);
                  setRejectOpen(false);
                  setFeedback('');
                }
              }}
              className="rounded px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: RUFLO_VIOLET }}
            >
              Submit
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-2 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: RUFLO_VIOLET,
            animation: 'nucleus-executing-pulse 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

export function CanvasChat({ campaignId }: CanvasChatProps) {
  const { messages, isThinking, lastEventType, sendMessage } = useCanvasChat(campaignId);
  const [collapsed, setCollapsed] = useState(false);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length, isThinking, collapsed]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const lineHeight = 20;
    const maxHeight = lineHeight * 5 + 16;
    ta.style.height = `${Math.min(ta.scrollHeight, maxHeight)}px`;
  }, [draft]);

  if (!campaignId) return null;

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    await sendMessage(text);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-6 right-6 z-[50] flex items-center gap-2 rounded-full border border-black/10 bg-white/95 px-4 py-2 text-sm font-medium shadow-lg backdrop-blur transition hover:shadow-xl"
        style={{ color: RUFLO_VIOLET }}
      >
        <span>✦</span>
        <span>Ruflo</span>
      </button>
    );
  }

  const status = statusLabel(isThinking, lastEventType);

  return (
    <div
      className="fixed bottom-6 right-6 z-[50] flex w-[380px] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white/98 shadow-xl backdrop-blur"
      style={{ maxHeight: 560 }}
    >
      <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold" style={{ color: RUFLO_VIOLET }}>
            ✦ Ruflo
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
            style={{
              backgroundColor: `${RUFLO_VIOLET}1a`,
              color: RUFLO_VIOLET,
            }}
          >
            {status}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="rounded-md px-2 py-1 text-xs text-gray-500 transition hover:bg-black/5 hover:text-gray-800"
          aria-label="Collapse chat"
        >
          ▾
        </button>
      </div>

      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
        style={{ minHeight: 200 }}
      >
        {messages.length === 0 && !isThinking && (
          <div className="text-center text-xs text-gray-400">
            Ask Ruflo anything about this campaign.
          </div>
        )}
        {messages.map((msg) => {
          if (msg.role === 'system') {
            return (
              <div key={msg.id} className="text-center text-[11px] text-gray-400">
                {msg.content}
              </div>
            );
          }
          const isUser = msg.role === 'user';
          const showApproval =
            !isUser &&
            msg.requires_approval === true &&
            typeof msg.suggestion_id === 'string' &&
            !msg.approval_outcome;
          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <RoleAvatar role={msg.role} />
              <div
                className={`max-w-[280px] rounded-2xl px-3 py-2 text-sm leading-snug ${
                  isUser
                    ? 'bg-gray-100 text-gray-900'
                    : 'border border-black/5 bg-white text-gray-900'
                }`}
              >
                <div>{msg.content}</div>
                {showApproval && campaignId && msg.suggestion_id ? (
                  <InlineApprovalControls
                    campaignId={campaignId}
                    suggestionId={msg.suggestion_id}
                    nodeId={msg.suggestion_id}
                  />
                ) : null}
                {msg.approval_outcome ? (
                  <div
                    className="mt-1.5 text-[11px] italic"
                    style={{ color: RUFLO_VIOLET }}
                  >
                    {msg.approval_outcome === 'approved'
                      ? 'Approved'
                      : msg.approval_feedback
                      ? `Rejected — ${msg.approval_feedback}`
                      : 'Rejected'}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
        {isThinking && lastEventType === 'chat.thinking' && (
          <div className="flex gap-2">
            <RoleAvatar role="assistant" />
            <div className="rounded-2xl border border-black/5 bg-white">
              <ThinkingDots />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 border-t border-black/5 px-3 py-2.5">
        <textarea
          ref={textareaRef}
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Ruflo..."
          className="flex-1 resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-black/20"
          style={{ maxHeight: 116 }}
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!draft.trim()}
          className="rounded-lg px-3 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: RUFLO_VIOLET }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
