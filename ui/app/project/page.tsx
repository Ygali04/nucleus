'use client';

import { ArchitectureCanvas } from '@/components/canvas/ArchitectureCanvas';
import { NodeDetailDrawer } from '@/components/panels/NodeDetailDrawer';
import { useAgents } from '@/hooks/useAgents';
import { useMessages } from '@/hooks/useMessages';
import { useTasks } from '@/hooks/useTasks';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function ProjectDashboardPage() {
  useAgents();
  useTasks();
  useMessages();
  useWebSocket();

  return (
    <div className="relative">
      <ArchitectureCanvas />
      <NodeDetailDrawer
        showProviderControls={false}
        showProviderMetrics={false}
      />
    </div>
  );
}
