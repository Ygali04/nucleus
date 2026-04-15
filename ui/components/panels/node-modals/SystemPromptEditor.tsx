'use client';

import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface SystemPromptEditorProps {
  defaultPrompt: string;
  value?: string;
  onChange: (value: string | undefined) => void;
}

export function SystemPromptEditor({
  defaultPrompt,
  value,
  onChange,
}: SystemPromptEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const isOverridden = value !== undefined && value !== defaultPrompt;
  const displayValue = value ?? defaultPrompt;

  return (
    <div className="rounded-md border border-black/8 bg-black/[0.015]">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
      >
        <span className="inline-flex items-center gap-1.5">
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
          System prompt
          {isOverridden ? (
            <span className="rounded-full bg-[var(--color-primary)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
              custom
            </span>
          ) : null}
        </span>
      </button>
      {expanded ? (
        <div className="border-t border-black/8 px-3 pb-3 pt-2">
          <textarea
            rows={8}
            value={displayValue}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full resize-y rounded-md border border-black/10 bg-white px-2.5 py-2 font-mono text-[11px] leading-relaxed text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-none"
          />
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--color-muted)]">
            <span>Ruflo fills {'{campaignDescription}'} at runtime.</span>
            {isOverridden ? (
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className="text-[var(--color-primary)] hover:underline"
              >
                Reset to default
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
