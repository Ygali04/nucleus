'use client';

import { BookOpen, GraduationCap, Megaphone, Sparkles } from 'lucide-react';
import type { ComponentType } from 'react';
import type {
  ArchetypeConfig,
  ArchetypeIconName,
} from '@/lib/campaign-archetypes';

const ICON_MAP: Record<ArchetypeIconName, ComponentType<{ className?: string }>> = {
  Sparkles,
  Megaphone,
  BookOpen,
  GraduationCap,
};

interface ArchetypeCardProps {
  archetype: ArchetypeConfig;
  selected: boolean;
  onSelect: () => void;
}

export function ArchetypeCard({ archetype, selected, onSelect }: ArchetypeCardProps) {
  const Icon = ICON_MAP[archetype.iconName];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition ${
        selected
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/8 ring-2 ring-[var(--color-primary)]/40'
          : 'border-black/10 bg-white hover:border-black/20 hover:bg-black/[0.02]'
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
          selected
            ? 'bg-[var(--color-dark)] text-[var(--color-primary)]'
            : 'bg-black/[0.04] text-[var(--color-ink)]'
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <div className="font-serif text-lg text-[var(--color-ink)]">
          {archetype.label}
        </div>
        <div className="text-sm text-[var(--color-muted)]">{archetype.tagline}</div>
      </div>
      <p className="text-xs leading-relaxed text-[var(--color-muted)]">
        {archetype.useCase}
      </p>
    </button>
  );
}
