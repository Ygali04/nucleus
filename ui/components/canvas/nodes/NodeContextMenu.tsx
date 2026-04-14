'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
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

const SWAP_KINDS: GraphNodeKind[] = [
  'video_gen',
  'audio_gen',
  'composition',
  'scoring',
  'editor',
  'brand_kb',
  'icp',
  'delivery',
];

interface NodeContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  currentKind: GraphNodeKind;
  onClose: () => void;
}

export function NodeContextMenu({
  x,
  y,
  nodeId,
  currentKind,
  onClose,
}: NodeContextMenuProps) {
  const campaignId = useCampaignsStore((s) => s.currentCampaignId);
  const retryNode = useCampaignsStore((s) => s.retryNode);
  const duplicateNode = useCampaignsStore((s) => s.duplicateNode);
  const toggleBypass = useCampaignsStore((s) => s.toggleBypass);
  const deleteNode = useCampaignsStore((s) => s.deleteNode);
  const togglePin = useCampaignsStore((s) => s.togglePinNode);
  const swapNodeKind = useCampaignsStore((s) => s.swapNodeKind);
  const openNodeModal = useCampaignsStore((s) => s.openNodeModal);

  const [swapOpen, setSwapOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const guard = <T extends unknown[]>(fn: (...args: T) => void) =>
    (...args: T) => {
      fn(...args);
      onClose();
    };

  const disabled = !campaignId;

  return (
    <div
      ref={rootRef}
      role="menu"
      className="fixed z-50 w-[180px] rounded-md border border-black/10 bg-white py-1 shadow-lg"
      style={{ left: x, top: y }}
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
                onClick={guard(() =>
                  campaignId && swapNodeKind(campaignId, nodeId, k),
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
 * Wraps a node body and attaches the right-click context menu. Renders the
 * menu via a portal-free fixed element at the mouse coordinates.
 */
export function NodeContextMenuWrapper({
  nodeId,
  kind,
  children,
}: {
  nodeId: string;
  kind: GraphNodeKind;
  children: ReactNode;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPos({ x: e.clientX, y: e.clientY });
  }, []);
  const onDotsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // Anchor the menu just below the dots button.
    setPos({ x: rect.right - 4, y: rect.bottom + 4 });
  }, []);
  const close = useCallback(() => setPos(null), []);
  return (
    <div className="group relative" onContextMenu={onContextMenu}>
      {children}
      <button
        type="button"
        aria-label="Node actions"
        onClick={onDotsClick}
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute right-1.5 top-1.5 z-20 inline-flex h-6 w-6 items-center justify-center rounded-md border border-transparent bg-white/80 text-[var(--color-muted)] opacity-0 shadow-sm transition hover:border-black/10 hover:bg-white hover:text-[var(--color-ink)] group-hover:opacity-100 focus-visible:opacity-100"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>
      {pos ? (
        <NodeContextMenu
          x={pos.x}
          y={pos.y}
          nodeId={nodeId}
          currentKind={kind}
          onClose={close}
        />
      ) : null}
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
