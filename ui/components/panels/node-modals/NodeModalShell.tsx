'use client';

// TODO(WU-6): Replace this minimal shell with the full NodeModalShell from WU-6.
// Until then, this provides the header/body/footer scaffolding consumed by the
// prompt-driven modals in this directory.

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface NodeModalShellProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function NodeModalShell({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: NodeModalShellProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="node-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="gs-scroll max-h-[85vh] w-full max-w-[560px] overflow-y-auto rounded-xl border border-black/8 bg-white shadow-[0_24px_48px_rgba(0,0,0,0.18)]"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 border-b border-black/6 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--color-ink)]">
                  {title}
                </h2>
                {subtitle ? (
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                    {subtitle}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="rounded-full border border-black/8 p-1.5 text-[var(--color-muted)] transition hover:bg-black/[0.03] hover:text-[var(--color-ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="px-5 py-4">{children}</div>

            {footer ? (
              <footer className="flex items-center justify-between gap-3 border-t border-black/6 bg-[var(--color-muted-bg,#f7f8fa)] px-5 py-3">
                {footer}
              </footer>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
