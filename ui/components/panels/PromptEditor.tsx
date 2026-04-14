'use client';

import { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';

export interface PromptEditorProps {
  open: boolean;
  prompt: string;
  toolName: string;
  estimatedCost: number;
  onClose: () => void;
  onRetry: (newPrompt: string) => void;
}

export function PromptEditor({
  open,
  prompt: initialPrompt,
  toolName,
  estimatedCost,
  onClose,
  onRetry,
}: PromptEditorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[rgba(26,26,26,0.08)] px-6 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
              {toolName}
            </div>
            <div className="mt-0.5 text-lg font-semibold text-[var(--color-ink)]">
              Edit orchestrator prompt
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--color-muted)] hover:bg-[var(--color-muted-bg,#f5f6f8)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="h-full min-h-[400px] w-full resize-none rounded-lg border border-[rgba(26,26,26,0.1)] bg-[var(--color-muted-bg,#f5f6f8)] p-4 font-mono text-[13px] leading-relaxed text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between border-t border-[rgba(26,26,26,0.08)] px-6 py-4">
          <div className="text-sm text-[var(--color-muted)]">
            Estimated cost:{' '}
            <span className="font-mono font-semibold text-[var(--color-ink)]">
              ${estimatedCost.toFixed(3)}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-muted-bg,#f5f6f8)]"
            >
              Cancel
            </button>
            <button
              onClick={() => onRetry(prompt)}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark,#3730a3)]"
            >
              <RotateCcw className="h-4 w-4" />
              Retry with this prompt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
