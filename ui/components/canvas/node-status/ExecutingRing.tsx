import type { ReactNode } from 'react';

interface ExecutingRingProps {
  active: boolean;
  children: ReactNode;
}

export function ExecutingRing({ active, children }: ExecutingRingProps) {
  return (
    <div className="relative">
      {active ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-[2px] rounded-[0.85rem] ring-2 ring-[var(--color-primary)] nucleus-executing-pulse"
        />
      ) : null}
      {children}
    </div>
  );
}
