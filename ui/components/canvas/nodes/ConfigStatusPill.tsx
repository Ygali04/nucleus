'use client';

import type { MouseEvent } from 'react';
import { useCanvasStore } from '@/store/canvas-store';

interface ConfigStatusPillProps {
  nodeId: string;
  complete: boolean;
  completeLabel?: string;
  incompleteLabel?: string;
}

export function ConfigStatusPill({
  nodeId,
  complete,
  completeLabel = 'Complete',
  incompleteLabel = 'Needs input',
}: ConfigStatusPillProps) {
  const openNodeModal = useCanvasStore((s) => s.openNodeModal);

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    openNodeModal(nodeId);
  };

  const classes = complete
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
    : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium transition ${classes}`}
    >
      {complete ? completeLabel : incompleteLabel}
    </button>
  );
}
