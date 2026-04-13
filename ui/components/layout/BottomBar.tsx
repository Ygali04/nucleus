'use client';

import type { LucideIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { getDashboardSurface, SURFACE_ACTIONS } from '@/lib/surface';
import { useDashboardStore } from '@/store/dashboard-store';

export function BottomBar() {
  const pathname = usePathname();
  const surface = getDashboardSurface(pathname);
  const actions = SURFACE_ACTIONS[surface];
  const selectedBottomAction = useDashboardStore(
    (state) => state.selectedBottomAction,
  );
  const setSelectedBottomAction = useDashboardStore(
    (state) => state.setSelectedBottomAction,
  );

  return (
    <footer className="gs-darkbar fixed inset-x-0 bottom-0 z-30 flex h-[52px] items-center justify-center border-t border-white/10">
      <div className="flex h-full w-full max-w-3xl items-center justify-between px-6">
        {actions.map((action) => {
          const Icon = action.icon as LucideIcon;
          const active = selectedBottomAction === action.id;

          return (
            <button
              key={action.id}
              className={`flex h-full items-center gap-2 border-t-2 px-2 text-sm transition ${
                active
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
              onClick={() => setSelectedBottomAction(action.id)}
            >
              <Icon className="h-4 w-4" />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </footer>
  );
}
