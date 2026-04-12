'use client';

import { usePathname } from 'next/navigation';
import { RefreshCw, Rocket, Sparkles } from 'lucide-react';
import { CreateModal } from '@/components/panels/CreateModal';
import { BrassPill } from '@/components/shared/BrassPill';
import { DeployModal } from '@/components/layout/DeployModal';
import { WorkspaceDetailsModal } from '@/components/layout/WorkspaceDetailsModal';
import { syncDashboardData } from '@/lib/dashboard-sync';
import { getDashboardSurface } from '@/lib/surface';
import { useCanvasStore } from '@/store/canvas-store';
import { useDashboardStore } from '@/store/dashboard-store';

export function Toolbar() {
  const pathname = usePathname();
  const surface = getDashboardSurface(pathname);
  const openCreateModal = useCanvasStore((state) => state.openCreateModal);
  const isLiveMode = useDashboardStore((state) => state.isLiveMode);
  const stagedChanges = useDashboardStore((state) => state.stagedChanges);
  const isSyncing = useDashboardStore((state) => state.isSyncing);
  const openDetails = useDashboardStore((state) => state.openDetails);
  const openDeployModal = useDashboardStore((state) => state.openDeployModal);

  const title =
    surface === 'provider'
      ? stagedChanges.length > 0
        ? `${stagedChanges.length} unapplied ${stagedChanges.length === 1 ? 'change' : 'changes'}`
        : 'Runtime topology aligned'
      : surface === 'project'
        ? 'Client-safe project view'
        : 'Executive report history';

  const canViewDetails = surface !== 'executive';
  const canSync = surface !== 'executive';
  const canCreate = surface === 'provider';
  const canDeploy = surface === 'provider';

  const handleSync = async () => {
    if (surface === 'executive') return;
    await syncDashboardData(surface);
  };

  return (
    <>
      <div className="flex h-10 items-center justify-between border-b border-black/8 bg-[var(--color-canvas)] px-5">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brass)]/35 bg-[var(--color-brass)]/10 px-3 py-1 text-xs font-medium text-[var(--color-ink)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-warning)]" />
            {title}
          </div>
          {canViewDetails ? (
            <button
              className="rounded-md border border-black/10 px-3 py-1 text-sm text-[var(--color-ink)] transition hover:border-black/20 hover:bg-white"
              onClick={openDetails}
            >
              Details
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <BrassPill tone={isLiveMode ? 'dark' : 'neutral'}>
            {isLiveMode ? 'Live' : 'Demo'}
          </BrassPill>
          {canSync ? (
            <button
              className="inline-flex items-center gap-2 rounded-md border border-black/10 px-3 py-1 text-sm text-[var(--color-ink)] transition hover:border-black/20 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSyncing}
              onClick={handleSync}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`}
              />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </button>
          ) : null}
          {canDeploy ? (
            <button
              className="inline-flex items-center gap-2 rounded-md border border-black/10 px-3 py-1 text-sm text-[var(--color-ink)] transition hover:border-black/20 hover:bg-white"
              onClick={openDeployModal}
            >
              <Rocket className="h-3.5 w-3.5" />
              Deploy
            </button>
          ) : null}
          {canCreate ? (
            <button
              className="inline-flex items-center gap-2 rounded-md border border-[var(--color-brass)] bg-[var(--color-dark)] px-3 py-1 text-sm text-white transition hover:opacity-95"
              onClick={openCreateModal}
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--color-brass)]" />
              Create
            </button>
          ) : null}
        </div>
      </div>
      {surface !== 'executive' ? <WorkspaceDetailsModal surface={surface} /> : null}
      <DeployModal />
      <CreateModal />
    </>
  );
}
