'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { MoreHorizontal, Pencil, RotateCw, Trash2, Shuffle } from 'lucide-react';
import type { GraphNodeKind } from '@/lib/types';
import { useCampaignsStore } from '@/store/campaigns-store';

/**
 * Target kinds each node can be swapped into without losing semantic
 * compatibility. Keeping this alongside the menu (rather than pushing it
 * into a shared module) keeps the footprint small — WU-7 can lift it when
 * it needs the same rules server-side.
 */
const SWAP_COMPATIBILITY: Partial<Record<GraphNodeKind, GraphNodeKind[]>> = {
  video_gen: ['audio_gen', 'composition'],
  audio_gen: ['video_gen'],
  composition: ['video_gen', 'editor'],
  editor: ['composition', 'scoring'],
  scoring: ['editor'],
  brand_kb: ['icp'],
  icp: ['brand_kb'],
};

const KIND_LABEL: Record<GraphNodeKind, string> = {
  agent: 'Agent',
  database: 'Database',
  scheduler: 'Scheduler',
  gateway: 'Gateway',
  service: 'Service',
  group: 'Group',
  video_gen: 'Video Gen',
  audio_gen: 'Audio Gen',
  composition: 'Composition',
  scoring: 'Scoring',
  editor: 'Editor',
  brand_kb: 'Brand KB',
  icp: 'ICP',
  delivery: 'Delivery',
};

interface NodeActionsMenuProps {
  nodeId: string;
  kind: GraphNodeKind;
  campaignId?: string | null;
}

export function NodeActionsMenu({ nodeId, kind, campaignId }: NodeActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const openNodeModal = useCampaignsStore((s) => s.openNodeModal);
  const retryNode = useCampaignsStore((s) => s.retryNode);
  const deleteNode = useCampaignsStore((s) => s.deleteNode);
  const swapNodeKind = useCampaignsStore((s) => s.swapNodeKind);

  useEffect(() => {
    if (!open) return;
    const handleDown = (e: Event) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSwapOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [open]);

  const stop = (e: MouseEvent) => e.stopPropagation();

  const swapTargets = SWAP_COMPATIBILITY[kind] ?? [];

  return (
    <div ref={rootRef} className="nodrag absolute right-1.5 top-1.5" onClick={stop}>
      <button
        type="button"
        aria-label="Node actions"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
          setSwapOpen(false);
        }}
        className="rounded p-0.5 text-[var(--color-muted)] hover:bg-[var(--color-muted-bg,#f5f6f8)] hover:text-[var(--color-ink)]"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {open ? (
        <div className="absolute right-0 top-6 z-10 w-40 overflow-visible rounded-md border border-[rgba(26,26,26,0.08)] bg-white py-1 text-[12px] shadow-lg">
          <MenuItem
            icon={<Pencil className="h-3 w-3" />}
            label="Edit"
            onClick={() => {
              openNodeModal(nodeId);
              setOpen(false);
            }}
          />
          <MenuItem
            icon={<RotateCw className="h-3 w-3" />}
            label="Retry"
            onClick={() => {
              retryNode(nodeId);
              setOpen(false);
            }}
          />
          <MenuItem
            icon={<Trash2 className="h-3 w-3" />}
            label="Delete"
            onClick={() => {
              deleteNode(campaignId ?? null, nodeId);
              setOpen(false);
            }}
            danger
          />
          <div
            className="relative"
            onMouseEnter={() => setSwapOpen(true)}
            onMouseLeave={() => setSwapOpen(false)}
          >
            <MenuItem
              icon={<Shuffle className="h-3 w-3" />}
              label="Swap type ▸"
              onClick={() => setSwapOpen((v) => !v)}
              disabled={swapTargets.length === 0}
            />
            {swapOpen && swapTargets.length > 0 ? (
              <div className="absolute left-full top-0 ml-0.5 w-36 rounded-md border border-[rgba(26,26,26,0.08)] bg-white py-1 shadow-lg">
                {swapTargets.map((target) => (
                  <MenuItem
                    key={target}
                    label={KIND_LABEL[target]}
                    onClick={() => {
                      swapNodeKind(campaignId ?? null, nodeId, target);
                      setOpen(false);
                      setSwapOpen(false);
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface MenuItemProps {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

function MenuItem({ icon, label, onClick, danger, disabled }: MenuItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      className={`flex w-full items-center gap-2 px-2 py-1.5 text-left transition ${
        disabled
          ? 'cursor-not-allowed text-[var(--color-faint)]'
          : danger
            ? 'text-rose-600 hover:bg-rose-50'
            : 'text-[var(--color-ink)] hover:bg-[var(--color-muted-bg,#f5f6f8)]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
