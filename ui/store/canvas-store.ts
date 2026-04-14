'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { XYPosition } from '@xyflow/react';

export type MediaKind = 'video' | 'audio' | 'image';

export interface OpenMedia {
  src: string;
  kind: MediaKind;
}

interface CanvasStore {
  selectedNodeId: string | null;
  highlightedNodeId: string | null;
  viewport: { x: number; y: number; zoom: number };
  nodePositions: Record<string, XYPosition>;
  isActivityPanelCollapsed: boolean;
  openMedia: OpenMedia | null;
  selectNode: (nodeId: string | null) => void;
  highlightNode: (nodeId: string | null) => void;
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  setNodePosition: (nodeId: string, position: XYPosition) => void;
  toggleActivityPanel: () => void;
  openMediaPreview: (src: string, kind: MediaKind) => void;
  closeMediaPreview: () => void;
}

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set) => ({
      selectedNodeId: null,
      highlightedNodeId: null,
      viewport: { x: 0, y: 0, zoom: 1 },
      nodePositions: {},
      isActivityPanelCollapsed: false,
      openMedia: null,
      selectNode: (selectedNodeId) => set({ selectedNodeId }),
      highlightNode: (highlightedNodeId) => set({ highlightedNodeId }),
      setViewport: (viewport) => set({ viewport }),
      setNodePosition: (nodeId, position) =>
        set((state) => ({
          nodePositions: { ...state.nodePositions, [nodeId]: position },
        })),
      toggleActivityPanel: () =>
        set((state) => ({
          isActivityPanelCollapsed: !state.isActivityPanelCollapsed,
        })),
      openMediaPreview: (src, kind) => set({ openMedia: { src, kind } }),
      closeMediaPreview: () => set({ openMedia: null }),
    }),
    {
      name: 'gs-dashboard-canvas',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        viewport: state.viewport,
        nodePositions: state.nodePositions,
        isActivityPanelCollapsed: state.isActivityPanelCollapsed,
      }),
    },
  ),
);
