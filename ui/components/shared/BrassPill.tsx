import type { ReactNode } from 'react';
import { BRAND } from '@/lib/constants';

interface BrassPillProps {
  children: ReactNode;
  tone?: 'brass' | 'neutral' | 'dark';
  className?: string;
}

export function BrassPill({
  children,
  tone = 'brass',
  className = '',
}: BrassPillProps) {
  const style =
    tone === 'neutral'
      ? {
          backgroundColor: 'rgba(26, 26, 26, 0.06)',
          color: BRAND.muted,
        }
      : tone === 'dark'
        ? {
            backgroundColor: 'rgba(17, 17, 17, 0.92)',
            color: BRAND.canvas,
          }
        : {
            backgroundColor: 'rgba(79, 70, 229, 0.14)',
            color: BRAND.primary,
          };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
