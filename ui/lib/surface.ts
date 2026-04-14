import type { LucideIcon } from 'lucide-react';
import { BarChart3, LayoutGrid, ScrollText, Settings, Workflow } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Campaigns', href: '/campaigns', icon: LayoutGrid },
  { label: 'Canvas', href: '/canvas', icon: Workflow },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Logs', href: '/logs', icon: ScrollText },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function isActiveNav(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/campaigns') return pathname === '/' || pathname.startsWith('/campaigns');
  return pathname.startsWith(href);
}
