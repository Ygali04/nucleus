import type { LucideIcon } from 'lucide-react';
import { NODE_ICON_MAP } from '@/lib/constants';

interface NodeIconProps {
  type?: string;
  className?: string;
}

export function NodeIcon({
  type = 'service',
  className = 'h-4 w-4',
}: NodeIconProps) {
  const Icon = (NODE_ICON_MAP[type as keyof typeof NODE_ICON_MAP] ||
    NODE_ICON_MAP.service) as LucideIcon;
  return <Icon className={className} strokeWidth={1.75} />;
}
