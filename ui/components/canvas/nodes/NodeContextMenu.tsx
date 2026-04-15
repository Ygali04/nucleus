'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Copy,
  MoreVertical,
  Pencil,
  Play,
  PowerOff,
  Pin,
  Shuffle,
  Trash2,
} from 'lucide-react';
import { useCampaignsStore } from '@/store/campaigns-store';
import type { GraphNodeKind } from '@/lib/types';
import {
  PendingApprovalOverlay,
  pendingApprovalId,
} from '@/components/canvas/nodes/PendingApprovalOverlay';

const SWAP_KINDS: GraphNodeKind[] = [
  'video_gen',
  'audio_gen',
  'composition',
  'scoring',
  'editor',
  'brand_kb',
  'icp',
  'delivery',
  'source_video',
  'storyboard',
  'image_edit',
];

const HOVER_CLOSE_MS = 200;

interface MenuPanelProps {
  nodeId: string;
  currentKind: GraphNodeKind;
  onClose: () => void;
}

/** The menu items panel. Positioning is owned by the parent wrapper. */
function MenuPanel({ nodeId, currentKind, onClose }: MenuPanelProps) {
  const campaignId = useCampaignsStore((s) => s.currentCampaignId);
  const retryNode = useCampaignsStore((s) => s.retryNode);
  const duplicateNode = useCampaignsStore((s) => s.duplicateNode);
  const toggleBypass = useCampaignsStore((s) => s.toggleBypass);
  const deleteNode = useCampaignsStore((s) => s.deleteNode);
  const togglePin = useCampaignsStore((s) => s.togglePinNode);
  const swapNodeKind = useCampaignsStore((s) => s.swapNodeKind);
  const openNodeModal = useCampaignsStore((s) => s.openNodeModal);
  const [swapOpen, setSwapOpen] = useState(false);

  const guard =
    <T extends unknown[]>(fn: (...args: T) => void) =>
    (...args: T) => {
      fn(...args);
      onClose();
    };

  const disabled = !campaignId;

  return (
    <div
      role="menu"
      className="w-[180px] rounded-md border border-black/10 bg-white py-1 shadow-lg"
      onContextMenu={(e) => e.preventDefault()}
    >
      <MenuItem
        icon={<Pencil className="h-3.5 w-3.5" />}
        label="Edit"
        onClick={guard(() => openNodeModal(nodeId))}
      />
      <MenuItem
        icon={<Play className="h-3.5 w-3.5" />}
        label="Queue / Re-run"
        onClick={guard(() => campaignId && retryNode(campaignId, nodeId))}
        disabled={disabled}
      />
      <MenuItem
        icon={<Copy className="h-3.5 w-3.5" />}
        label="Duplicate"
        onClick={guard(() => campaignId && duplicateNode(campaignId, nodeId))}
        disabled={disabled}
      />
      <MenuItem
        icon={<PowerOff className="h-3.5 w-3.5" />}
        label="Bypass"
        onClick={guard(() => campaignId && toggleBypass(campaignId, nodeId))}
        disabled={disabled}
      />
      <MenuItem
        icon={<Pin className="h-3.5 w-3.5" />}
        label="Pin / Unpin"
        onClick={guard(() => campaignId && togglePin(campaignId, nodeId))}
        disabled={disabled}
      />
      <div
        role="menuitem"
        className="relative flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-[12px] text-[var(--color-ink)] hover:bg-black/5"
        onMouseEnter={() => setSwapOpen(true)}
        onMouseLeave={() => setSwapOpen(false)}
      >
        <span className="flex items-center gap-2">
          <Shuffle className="h-3.5 w-3.5" />
          Swap Type...
        </span>
        <span className="text-[var(--color-muted)]">›</span>
        {swapOpen ? (
          <div className="absolute left-full top-0 w-[160px] rounded-md border border-black/10 bg-white py-1 shadow-lg">
            {SWAP_KINDS.filter((k) => k !== currentKind).map((k) => (
              <button
                key={k}
                type="button"
                className="block w-full px-3 py-1.5 text-left text-[12px] hover:bg-black/5"
                onClick={guard(
                  () => campaignId && swapNodeKind(campaignId, nodeId, k),
                )}
              >
                {k.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="my-1 h-px bg-black/5" />
      <MenuItem
        icon={<Trash2 className="h-3.5 w-3.5" />}
        label="Delete"
        tone="rose"
        onClick={guard(() => campaignId && deleteNode(campaignId, nodeId))}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * Wraps a node body and attaches a hover-popover actions menu pinned to a
 * 3-dots button in the node's top-right corner. Menu opens on hover (or
 * click) of the button or right-click on the node body, and closes ~200ms
 * after the cursor leaves both the button and the menu panel.
 */
export function NodeContextMenuWrapper({
  nodeId,
  kind,
  children,
  nodeData,
}: {
  nodeId: string;
  kind: GraphNodeKind;
  children: ReactNode;
  /**
   * Pass the node's `data` bag so the wrapper can detect a Ruflo
   * ghost-suggestion (`pendingApproval`) and render the approval overlay +
   * block the edit modal.
   */
  nodeData?: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  const cancelClose = () => {
    if (closeTimer.current !== undefined) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = undefined;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      closeTimer.current = undefined;
    }, HOVER_CLOSE_MS);
  };

  useEffect(() => {
    return () => cancelClose();
  }, []);

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  const pendingSuggestion = pendingApprovalId(nodeData);
  const pendingReason = nodeData
    ? ((nodeData as { suggestionReason?: string }).suggestionReason ?? undefined)
    : undefined;

  const body = pendingSuggestion ? (
    <PendingApprovalOverlay
      suggestionId={pendingSuggestion}
      reason={pendingReason}
    >
      {children}
    </PendingApprovalOverlay>
  ) : (
    children
  );

  return (
    <div className="group relative" onContextMenu={onContextMenu}>
      {body}

      {/* Anchor for the dots button + popover. Top-right of the node.
         z-[45] keeps the menu above all React Flow nodes but below the
         Edit modal (z-[60]) and any modal-internal dropdowns (z-[70]). */}
      <div
        className="absolute right-1.5 top-1.5 z-[45]"
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        onMouseLeave={scheduleClose}
      >
        <button
          type="button"
          aria-label="Node actions"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-transparent bg-white/85 text-[var(--color-muted)] opacity-0 shadow-sm transition hover:border-black/10 hover:bg-white hover:text-[var(--color-ink)] group-hover:opacity-100 focus-visible:opacity-100"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>

        {open ? (
          <div className="absolute right-0 top-full mt-1">
            <MenuPanel
              nodeId={nodeId}
              currentKind={kind}
              onClose={() => setOpen(false)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  tone,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: 'rose';
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 ${
        tone === 'rose' ? 'text-rose-600' : 'text-[var(--color-ink)]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
