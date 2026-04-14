'use client';

import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/surface';

export function Toolbar() {
  const pathname = usePathname();
  const active = NAV_ITEMS.find((n) =>
    n.href === '/campaigns' ? pathname === '/' || pathname?.startsWith('/campaigns') : pathname?.startsWith(n.href),
  );
  const label = active?.label ?? 'Nucleus';

  return (
    <div className="flex h-10 items-center justify-between border-b border-black/8 bg-[var(--color-canvas)] px-5">
      <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
        {label}
      </div>
    </div>
  );
}
