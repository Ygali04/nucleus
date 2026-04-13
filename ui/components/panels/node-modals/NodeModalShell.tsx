'use client';

import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface NodeModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  nodeIcon: ReactNode;
  onSave: () => void;
  saveDisabled?: boolean;
  children: ReactNode;
}

export function NodeModalShell({
  open,
  onClose,
  title,
  nodeIcon,
  onSave,
  saveDisabled = false,
  children,
}: NodeModalShellProps) {
  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTextArea = target?.tagName === 'TEXTAREA';

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Enter' && !event.shiftKey && !isTextArea) {
        event.preventDefault();
        if (!saveDisabled) onSave();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose, onSave, saveDisabled]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="gs-card flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/8 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-soft,#eef2ff)] text-[var(--color-primary)]">
              {nodeIcon}
            </div>
            <h2 className="font-serif text-xl text-[var(--color-ink)]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="rounded-md p-1.5 text-[var(--color-muted)] transition hover:bg-black/[0.04] hover:text-[var(--color-ink)]"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        <div className="flex justify-end gap-2 border-t border-black/8 px-6 py-4">
          <button
            type="button"
            className="rounded-md border border-black/10 px-4 py-2 text-sm text-[var(--color-muted)] transition hover:bg-black/[0.03] hover:text-[var(--color-ink)]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-[var(--color-dark)] px-4 py-2 text-sm text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saveDisabled}
            onClick={onSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
