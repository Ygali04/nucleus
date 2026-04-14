'use client';

import { useState } from 'react';
import { Check, ChevronDown, Pencil, Play, Plus, X } from 'lucide-react';
import type { Campaign, GraphNodeKind, GraphNodeMeta } from '@/lib/types';
import { useCampaignsStore } from '@/store/campaigns-store';

const STATUS_PILL: Record<
  Campaign['status'],
  { label: string; className: string; dotClassName: string }
> = {
  idle: {
    label: 'Idle',
    className: 'bg-neutral-200/70 text-neutral-600',
    dotClassName: 'bg-neutral-400',
  },
  running: {
    label: 'Running',
    className: 'bg-indigo-100 text-indigo-700',
    dotClassName: 'bg-indigo-500 animate-pulse',
  },
  scored: {
    label: 'Scored',
    className: 'bg-emerald-100 text-emerald-700',
    dotClassName: 'bg-emerald-500',
  },
  failed: {
    label: 'Failed',
    className: 'bg-rose-100 text-rose-700',
    dotClassName: 'bg-rose-500',
  },
};

const ADDABLE_KINDS: Array<{ kind: GraphNodeKind; label: string }> = [
  { kind: 'video_gen', label: 'Video Gen' },
  { kind: 'audio_gen', label: 'Audio Gen' },
  { kind: 'composition', label: 'Composition' },
  { kind: 'scoring', label: 'Scoring' },
  { kind: 'editor', label: 'Editor' },
  { kind: 'brand_kb', label: 'Brand KB' },
  { kind: 'icp', label: 'ICP' },
  { kind: 'delivery', label: 'Delivery' },
];

function isRunDisabled(campaign: Campaign): boolean {
  for (const node of campaign.graph.nodes) {
    if (node.kind === 'brand_kb') {
      const docCount = Number((node.data as { docCount?: number } | undefined)?.docCount ?? 0);
      if (!docCount) return true;
    }
    if (node.kind === 'icp') {
      const personaName = (node.data as { personaName?: string } | undefined)?.personaName;
      if (!personaName || !personaName.trim()) return true;
    }
  }
  return false;
}

interface CanvasToolbarProps {
  campaign: Campaign;
  canvasCenter?: { x: number; y: number };
}

export function CanvasToolbar({
  campaign,
  canvasCenter = { x: 400, y: 240 },
}: CanvasToolbarProps) {
  const executeCampaign = useCampaignsStore((state) => state.executeCampaign);
  const addNode = useCampaignsStore((state) => state.addNode);
  const updateCampaign = useCampaignsStore((state) => state.updateCampaign);
  const [addOpen, setAddOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(campaign.brand_name);

  const runDisabled = isRunDisabled(campaign) || campaign.status === 'running';
  const pill = STATUS_PILL[campaign.status];

  const commitName = () => {
    const next = nameDraft.trim();
    if (next && next !== campaign.brand_name) {
      updateCampaign(campaign.id, { brand_name: next });
    } else {
      setNameDraft(campaign.brand_name);
    }
    setIsEditingName(false);
  };

  const cancelNameEdit = () => {
    setNameDraft(campaign.brand_name);
    setIsEditingName(false);
  };

  const handleAdd = (kind: GraphNodeKind) => {
    const id = `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const node: GraphNodeMeta = {
      id,
      label: kind.replace(/_/g, ' '),
      kind,
      status: 'idle',
      statusText: 'Unconfigured',
      x: canvasCenter.x,
      y: canvasCenter.y,
    };
    addNode(campaign.id, node);
    setAddOpen(false);
  };

  return (
    <div className="pointer-events-auto absolute right-5 top-5 z-10 flex items-center gap-2 rounded-xl border border-black/10 bg-white/95 p-2 shadow-sm">
      <div className="flex flex-col px-2 leading-tight">
        <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
          Campaign
        </span>
        {isEditingName ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName();
                if (e.key === 'Escape') cancelNameEdit();
              }}
              className="w-40 rounded-sm border border-[var(--color-primary)]/40 bg-white px-1 py-0.5 text-sm font-semibold text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={commitName}
              className="rounded p-0.5 text-emerald-600 hover:bg-emerald-50"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={cancelNameEdit}
              className="rounded p-0.5 text-rose-600 hover:bg-rose-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setNameDraft(campaign.brand_name);
              setIsEditingName(true);
            }}
            className="group inline-flex items-center gap-1 text-left text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-primary)]"
          >
            {campaign.brand_name}
            <Pencil className="h-3 w-3 opacity-0 transition group-hover:opacity-70" />
          </button>
        )}
      </div>

      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${pill.className}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${pill.dotClassName}`} />
        {pill.label}
      </span>

      <div className="relative">
        <button
          type="button"
          onClick={() => setAddOpen((open) => !open)}
          className="inline-flex items-center gap-1 rounded-md border border-black/10 px-2.5 py-1.5 text-sm text-[var(--color-ink)] transition hover:bg-black/[0.03]"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Node
          <ChevronDown className="h-3 w-3" />
        </button>
        {addOpen ? (
          <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-md border border-black/10 bg-white shadow-lg">
            {ADDABLE_KINDS.map((item) => (
              <button
                key={item.kind}
                type="button"
                onClick={() => handleAdd(item.kind)}
                className="block w-full px-3 py-1.5 text-left text-sm text-[var(--color-ink)] transition hover:bg-black/[0.03]"
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => executeCampaign(campaign.id)}
        disabled={runDisabled}
        title={
          runDisabled
            ? 'Configure Brand KB docs and ICP persona before running.'
            : 'Run campaign'
        }
        className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-dark)] px-3 py-1.5 text-sm text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Play className="h-3.5 w-3.5" />
        Run
      </button>
    </div>
  );
}
