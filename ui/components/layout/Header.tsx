'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Atom } from 'lucide-react';
import { NAV_ITEMS, isActiveNav } from '@/lib/surface';

export function Header() {
  const pathname = usePathname();

  return (
    <header className="gs-darkbar flex h-12 items-center justify-between border-b border-white/10 px-5">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/8">
          <Atom className="h-4 w-4 text-[var(--color-primary-light)]" />
        </div>
        <span className="text-sm font-medium text-white/90">Nucleus</span>
      </div>

      <nav className="hidden items-center gap-6 md:flex">
        {NAV_ITEMS.map((item) => {
          const active = isActiveNav(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-1.5 border-b px-1 py-3 text-sm transition ${
                active
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-white/65 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full border border-white/20 bg-white/10" />
      </div>
    </header>
  );
}
