'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { XYPosition } from '@xyflow/react';

interface CanvasStore {
  selectedNodeId: string | null;
  highlightedNodeId: string | null;
  viewport: { x: number; y: number; zoom: number };
  nodePositions: Record<string, XYPosition>;
  isCreateModalOpen: boolean;
  isActivityPanelCollapsed: boolean;
  openNodeModalId: string | null;
  selectNode: (nodeId: string | null) => void;
  highlightNode: (nodeId: string | null) => void;
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  setNodePosition: (nodeId: string, position: XYPosition) => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  toggleActivityPanel: () => void;
  openNodeModal: (nodeId: string) => void;
  closeNodeModal: () => void;
}

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set) => ({
      selectedNodeId: null,
      highlightedNodeId: null,
      viewport: { x: 0, y: 0, zoom: 1 },
      nodePositions: {},
      isCreateModalOpen: false,
      isActivityPanelCollapsed: false,
      openNodeModalId: null,
      selectNode: (selectedNodeId) => set({ selectedNodeId }),
      highlightNode: (highlightedNodeId) => set({ highlightedNodeId }),
      setViewport: (viewport) => set({ viewport }),
      setNodePosition: (nodeId, position) =>
        set((state) => ({
          nodePositions: { ...state.nodePositions, [nodeId]: position },
        })),
      openCreateModal: () => set({ isCreateModalOpen: true }),
      closeCreateModal: () => set({ isCreateModalOpen: false }),
      toggleActivityPanel: () =>
        set((state) => ({
          isActivityPanelCollapsed: !state.isActivityPanelCollapsed,
        })),
      openNodeModal: (nodeId) => set({ openNodeModalId: nodeId }),
      closeNodeModal: () => set({ openNodeModalId: null }),
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
