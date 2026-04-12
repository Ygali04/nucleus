'use client';

import { RotateCcw } from 'lucide-react';

export interface RetryControlProps {
  onRetry: () => void;
  estimatedCost: number;
  retryCount?: number;
  disabled?: boolean;
}

export function RetryControl({
  onRetry,
  estimatedCost,
  retryCount = 0,
  disabled = false,
}: RetryControlProps) {
  return (
    <button
      onClick={onRetry}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg border border-[rgba(26,26,26,0.1)] bg-white px-3 py-1.5 text-sm text-[var(--color-ink)] hover:bg-[var(--color-muted-bg,#f5f6f8)] disabled:opacity-50"
    >
      <RotateCcw className="h-4 w-4 text-[var(--color-primary)]" />
      {retryCount > 0 ? `Retry #${retryCount + 1}` : 'Retry'}
      <span className="ml-1 font-mono text-[11px] text-[var(--color-muted)]">
        ~${estimatedCost.toFixed(3)}
      </span>
    </button>
  );
}
