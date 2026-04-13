'use client';

import { RotateCw, Save, Trash2 } from 'lucide-react';
import { SwapTypeDropdown } from './SwapTypeDropdown';
import type { GraphNodeKind } from '@/lib/types';

interface ModalFooterProps {
  campaignId: string;
  nodeId: string;
  kind: GraphNodeKind;
  onSave: () => void;
  onRetry?: () => void;
  onDelete?: () => void;
  saveDisabled?: boolean;
}

export function ModalFooter({
  campaignId,
  nodeId,
  kind,
  onSave,
  onRetry,
  onDelete,
  saveDisabled,
}: ModalFooterProps) {
  return (
    <>
      <div className="flex items-center gap-2">
        <SwapTypeDropdown
          campaignId={campaignId}
          nodeId={nodeId}
          kind={kind}
        />
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:bg-black/[0.03]"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Retry
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={saveDisabled}
        className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Save className="h-3.5 w-3.5" />
        Save
      </button>
    </>
  );
}
