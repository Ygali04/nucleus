'use client';

import { FileText, Upload, X } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';

interface AttachmentDropzoneProps {
  accept: string[];
  files: File[];
  onChange: (files: File[]) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function matchesAccept(file: File, accept: string[]): boolean {
  if (accept.length === 0) return true;
  return accept.some((token) => {
    if (token.startsWith('.')) {
      return file.name.toLowerCase().endsWith(token.toLowerCase());
    }
    return file.type === token;
  });
}

export function AttachmentDropzone({
  accept,
  files,
  onChange,
}: AttachmentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const next: File[] = [];
    for (const file of Array.from(incoming)) {
      if (matchesAccept(file, accept)) next.push(file);
    }
    if (next.length > 0) onChange([...files, ...next]);
  };

  const removeAt = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  return (
    <div>
      <div
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragging
            ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft,#eef2ff)]'
            : 'border-black/15 bg-black/[0.015] hover:bg-black/[0.03]'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <Upload className="mb-2 h-5 w-5 text-[var(--color-muted)]" />
        <div className="text-sm text-[var(--color-ink)]">
          Drop files or click to browse
        </div>
        {accept.length > 0 ? (
          <div className="mt-1 text-xs text-[var(--color-muted)]">
            {accept.join(', ')}
          </div>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept.join(',')}
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      {files.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-md border border-black/8 bg-white px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                <span className="truncate text-[var(--color-ink)]">
                  {file.name}
                </span>
                <span className="shrink-0 text-xs text-[var(--color-muted)]">
                  {formatBytes(file.size)}
                </span>
              </div>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                className="rounded p-1 text-[var(--color-muted)] transition hover:bg-black/[0.04] hover:text-[var(--color-ink)]"
                onClick={() => removeAt(index)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
