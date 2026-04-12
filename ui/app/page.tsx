'use client';

import { ActivityPanel } from '@/components/panels/ActivityPanel';
import { ArchitectureCanvas } from '@/components/canvas/ArchitectureCanvas';
import { NodeDetailDrawer } from '@/components/panels/NodeDetailDrawer';
import { useActivity } from '@/hooks/useActivity';
import { useAgents } from '@/hooks/useAgents';
import { useCostHistory } from '@/hooks/useCostHistory';
import { useMessages } from '@/hooks/useMessages';
import { useTasks } from '@/hooks/useTasks';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function ArchitecturePage() {
  useAgents();
  useTasks();
  useActivity();
  useCostHistory();
  useMessages();
  useWebSocket();

  return (
    <div className="relative">
      <ArchitectureCanvas />
      <ActivityPanel />
      <NodeDetailDrawer />
    </div>
  );
}
