'use client';

import { Bot, Shield } from 'lucide-react';
import { usePipelineStore } from '@/store/pipeline-store';

export function PermissionsToggle() {
  const mode = usePipelineStore((s) => s.permissionMode);
  const setMode = usePipelineStore((s) => s.setPermissionMode);

  return (
    <div className="inline-flex items-center rounded-lg border border-[rgba(26,26,26,0.1)] bg-white p-1">
      <button
        onClick={() => setMode('auto_gen')}
        className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition ${
          mode === 'auto_gen'
            ? 'bg-[var(--color-primary)] text-white'
            : 'text-[var(--color-muted)] hover:bg-[var(--color-muted-bg,#f5f6f8)]'
        }`}
      >
        <Bot className="h-4 w-4" />
        Auto-gen
      </button>
      <button
        onClick={() => setMode('ask_permissions')}
        className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition ${
          mode === 'ask_permissions'
            ? 'bg-[var(--color-primary)] text-white'
            : 'text-[var(--color-muted)] hover:bg-[var(--color-muted-bg,#f5f6f8)]'
        }`}
      >
        <Shield className="h-4 w-4" />
        Ask permission
      </button>
    </div>
  );
}
