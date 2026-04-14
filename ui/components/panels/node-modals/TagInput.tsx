'use client';

import { X } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const next = draft.trim();
    if (!next) return;
    if (value.includes(next)) {
      setDraft('');
      return;
    }
    onChange([...value, next]);
    setDraft('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      event.stopPropagation();
      commit();
    } else if (event.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-black/10 bg-black/[0.015] px-3 py-2 focus-within:border-[var(--color-primary)]">
      {value.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-soft,#eef2ff)] px-2.5 py-1 text-xs text-[var(--color-primary)]"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            className="text-[var(--color-primary)] hover:opacity-70"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        className="min-w-[120px] flex-1 bg-transparent py-1 text-sm outline-none"
        placeholder={value.length === 0 ? placeholder : ''}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
      />
    </div>
  );
}
