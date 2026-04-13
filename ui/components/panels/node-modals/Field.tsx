'use client';

import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({ label, required, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-[var(--color-muted)]">
        {label}
        {required ? (
          <span className="ml-1 text-[var(--color-primary)]">*</span>
        ) : null}
      </span>
      {children}
    </label>
  );
}
