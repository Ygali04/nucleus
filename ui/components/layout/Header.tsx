'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Atom, ChevronDown, Share2 } from 'lucide-react';
import { getDashboardSurface, SURFACE_META, SURFACE_NAV } from '@/lib/surface';

const SURFACE_SWITCHES = [
  { label: 'Pipeline', href: '/' },
  { label: 'Project', href: '/project' },
  { label: 'Executive', href: '/executive' },
];

export function Header() {
  const pathname = usePathname();
  const surface = getDashboardSurface(pathname);
  const navItems = SURFACE_NAV[surface];
  const meta = SURFACE_META[surface];

  return (
    <header className="gs-darkbar flex h-12 items-center justify-between border-b border-white/10 px-5">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/8">
          <Atom className="h-4 w-4 text-[var(--color-primary-light)]" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-white/90">
            {meta.workspaceLabel}
          </span>
          <span className="text-white/25">/</span>
          <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-white/75 transition hover:bg-white/8 hover:text-white">
            {meta.environmentLabel}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <nav className="hidden items-center gap-6 md:flex">
        {navItems.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`border-b px-1 py-3 text-sm transition ${
                active
                  ? 'border-[var(--color-brass)] text-[var(--color-brass)]'
                  : 'border-transparent text-white/65 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/6 p-1 md:flex">
          {SURFACE_SWITCHES.map((item) => {
            const itemSurface = getDashboardSurface(item.href);
            const active = surface === itemSurface;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  active
                    ? 'bg-[var(--color-brass)] text-[var(--color-dark)]'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <button className="hidden items-center gap-2 rounded-md border border-white/14 px-3 py-1.5 text-sm text-white/75 transition hover:bg-white/8 hover:text-white md:inline-flex">
          <Share2 className="h-4 w-4" />
          {surface === 'executive' ? 'Share Links' : 'Share'}
        </button>
        <div className="h-8 w-8 rounded-full border border-white/20 bg-white/10" />
      </div>
    </header>
  );
}
