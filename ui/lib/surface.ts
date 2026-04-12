import type { LucideIcon } from 'lucide-react';
import {
  Link2,
  MessageSquare,
  ScrollText,
  Share2,
} from 'lucide-react';

export type DashboardSurface = 'provider' | 'project' | 'executive';

export interface NavItem {
  label: string;
  href: string;
}

export interface SurfaceAction {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const SURFACE_NAV: Record<DashboardSurface, NavItem[]> = {
  provider: [
    { label: 'Pipeline', href: '/' },
    { label: 'Canvas', href: '/observability' },
    { label: 'Scoring', href: '/deliverables' },
    { label: 'Logs', href: '/logs' },
    { label: 'Settings', href: '/settings' },
  ],
  project: [
    { label: 'Pipeline', href: '/project' },
    { label: 'Canvas', href: '/project/observability' },
    { label: 'Scoring', href: '/project/deliverables' },
  ],
  executive: [{ label: 'Scoring', href: '/executive' }],
};

export const SURFACE_ACTIONS: Record<DashboardSurface, SurfaceAction[]> = {
  provider: [],
  project: [],
  executive: [
    { id: 'reports', label: 'Reports', icon: ScrollText },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'share', label: 'Share', icon: Share2 },
    { id: 'links', label: 'Links', icon: Link2 },
  ],
};

export const SURFACE_META: Record<
  DashboardSurface,
  { environmentLabel: string; workspaceLabel: string }
> = {
  provider: {
    environmentLabel: 'provider',
    workspaceLabel: 'Nucleus Pipeline',
  },
  project: {
    environmentLabel: 'project',
    workspaceLabel: 'Pipeline workspace',
  },
  executive: {
    environmentLabel: 'executive',
    workspaceLabel: 'Pipeline workspace',
  },
};

export function getDashboardSurface(pathname: string | null): DashboardSurface {
  if (pathname?.startsWith('/executive')) {
    return 'executive';
  }
  if (pathname?.startsWith('/project')) {
    return 'project';
  }
  return 'provider';
}
