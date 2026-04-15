'use client';

/**
 * Ghost-node / pending-approval overlay. Wraps any node body with the faded
 * pulsing ring that signals "Ruflo suggested this node; the user has not
 * approved it yet." Injects a top-left "✦ Suggested by Ruflo" ribbon and
 * inline Approve / Reject buttons in the footer. Clicking into the overlay
 * does NOT bubble up to ReactFlow's node double-click handler, so the edit
 * modal stays locked until approval.
 */
import { useState, type ReactNode } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { useCampaignsStore } from '@/store/campaigns-store';

export const RUFLO_VIOLET = '#8b5cf6';

/**
 * Tailwind+CSS-variable marker class. Actual animation + glow live in
 * `ui/app/globals.css` under `.nucleus-ghost-pending`.
 */
export const GHOST_PENDING_CLASS = 'nucleus-ghost-pending';

interface PendingApprovalOverlayProps {
  suggestionId: string;
  reason?: string;
  children: ReactNode;
}

export function PendingApprovalOverlay({
  suggestionId,
  reason,
  children,
}: PendingApprovalOverlayProps) {
  const campaignId = useCampaignsStore((s) => s.currentCampaignId);
  const approveSuggestion = useCampaignsStore((s) => s.approveSuggestion);
  const rejectSuggestion = useCampaignsStore((s) => s.rejectSuggestion);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);

  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const handleApprove = async (e: React.MouseEvent) => {
    stop(e);
    if (!campaignId || busy) return;
    setBusy(true);
    try {
      await approveSuggestion(campaignId, suggestionId);
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (e: React.MouseEvent) => {
    stop(e);
    if (!campaignId || busy) return;
    setBusy(true);
    try {
      await rejectSuggestion(campaignId, suggestionId, feedback.trim() || undefined);
    } finally {
      setBusy(false);
      setRejectOpen(false);
      setFeedback('');
    }
  };

  return (
    <div
      className={`relative ${GHOST_PENDING_CLASS}`}
      // Lock edit-modal / selection interactions for the pending node. Double
      // clicks must not open the modal until the user approves.
      onDoubleClick={stop}
    >
      {children}

      {/* Top-left "Suggested by Ruflo" ribbon. Separate from the normal
          RufloBadge (top-right) so both can coexist without overlap. */}
      <span
        className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white shadow-sm"
        style={{ backgroundColor: RUFLO_VIOLET }}
        title={reason ?? 'Suggested by Ruflo'}
      >
        <Sparkles className="h-2.5 w-2.5" />
        Suggested
      </span>

      {/* Inline footer with Approve / Reject. Positioned over the bottom of
          the card so the card itself can stay untouched. */}
      <div
        className="absolute inset-x-2 bottom-2 z-10 flex items-center gap-1.5"
        onClick={stop}
        onMouseDown={stop}
      >
        <button
          type="button"
          onClick={handleApprove}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-white shadow-sm transition disabled:opacity-50"
          style={{ backgroundColor: RUFLO_VIOLET }}
          aria-label="Approve suggestion"
        >
          <Check className="h-3 w-3" />
          Approve
        </button>
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            setRejectOpen((v) => !v);
          }}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition disabled:opacity-50"
          style={{
            borderColor: RUFLO_VIOLET,
            color: RUFLO_VIOLET,
            background: 'rgba(255,255,255,0.95)',
          }}
          aria-label="Reject suggestion"
        >
          <X className="h-3 w-3" />
          Reject
        </button>
      </div>

      {rejectOpen ? (
        <div
          className="absolute left-2 right-2 top-[calc(100%+6px)] z-20 rounded-md border bg-white p-2 shadow-lg"
          style={{ borderColor: RUFLO_VIOLET }}
          onClick={stop}
          onMouseDown={stop}
        >
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Why reject? (optional)
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell Ruflo what to try instead…"
            className="mb-2 h-16 w-full resize-none rounded border border-black/10 p-1.5 text-[11px] outline-none focus:border-black/30"
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                setRejectOpen(false);
                setFeedback('');
              }}
              className="rounded px-2 py-1 text-[11px] text-[var(--color-muted)] hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={busy}
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

/**
 * Read the `pendingApproval` id off a node's data bag. Returns the suggestion
 * id when the node is a Ruflo ghost awaiting approval, otherwise null.
 */
export function pendingApprovalId(
  data: Record<string, unknown> | undefined,
): string | null {
  if (!data) return null;
  const v = (data as { pendingApproval?: string }).pendingApproval;
  return typeof v === 'string' && v.length > 0 ? v : null;
}
