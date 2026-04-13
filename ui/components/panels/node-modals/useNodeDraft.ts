'use client';

import { useRef, useState } from 'react';
import { useCampaignsStore } from '@/store/campaigns-store';

/** Keeps a draft copy of a node's data while a modal is open. */
export function useNodeDraft<T extends Record<string, unknown>>(
  campaignId: string,
  nodeId: string,
  initial: T,
) {
  const updateNodeData = useCampaignsStore((s) => s.updateNodeData);
  const retryNode = useCampaignsStore((s) => s.retryNode);
  const deleteNode = useCampaignsStore((s) => s.deleteNode);

  const [draft, setDraft] = useState<T>(initial);
  const key = `${campaignId}:${nodeId}`;
  const lastKey = useRef(key);
  if (lastKey.current !== key) {
    lastKey.current = key;
    setDraft(initial);
  }

  const patch = (p: Partial<T>) => setDraft((d) => ({ ...d, ...p }));
  const save = () => updateNodeData(campaignId, nodeId, draft);
  const retry = () => retryNode(campaignId, nodeId);
  const remove = () => deleteNode(campaignId, nodeId);

  return { draft, patch, save, retry, remove };
}
