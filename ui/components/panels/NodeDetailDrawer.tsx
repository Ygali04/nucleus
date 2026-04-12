'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { dummyGraphNodes } from '@/fixtures/graph-nodes';
import { AgentDetail } from '@/components/panels/AgentDetail';
import { DatabaseDetail } from '@/components/panels/DatabaseDetail';
import { SchedulerDetail } from '@/components/panels/SchedulerDetail';
import { useCanvasStore } from '@/store/canvas-store';
import { useDashboardStore } from '@/store/dashboard-store';

interface NodeDetailDrawerProps {
  showProviderMetrics?: boolean;
  showProviderControls?: boolean;
}

export function NodeDetailDrawer({
  showProviderMetrics = true,
  showProviderControls = true,
}: NodeDetailDrawerProps) {
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const selectNode = useCanvasStore((state) => state.selectNode);
  const agents = useDashboardStore((state) => state.agents);
  const customNodes = useDashboardStore((state) => state.customNodes);
  const tasks = useDashboardStore((state) => state.tasks);
  const facts = useDashboardStore((state) => state.facts);
  const costHistory = useDashboardStore((state) => state.costHistory);

  const selectedNode = [...dummyGraphNodes, ...customNodes].find(
    (node) => node.id === selectedNodeId,
  );
  const selectedAgent = agents.find((agent) => agent.id === selectedNodeId);

  const recentTasks = selectedAgent
    ? tasks
        .filter((task) => task.assigned_to === selectedAgent.id)
        .slice(0, 5)
        .map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          timestamp: task.completed_at || task.started_at || task.created_at,
        }))
    : [];

  const agentCost = selectedAgent
    ? costHistory
        .filter((point) => point.agent === selectedAgent.id)
        .reduce((total, point) => total + point.cost, 0)
    : 0;

  return (
    <AnimatePresence>
      {selectedNode ? (
        <motion.aside
          key={selectedNode.id}
          initial={{ x: 420 }}
          animate={{ x: 0 }}
          exit={{ x: 420 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="gs-scroll fixed bottom-0 right-0 top-[92px] z-40 w-[380px] overflow-y-auto border-l border-black/8 bg-white/96 px-6 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        >
          <div className="mb-6 flex items-center justify-between">
            <button
              className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
              onClick={() => selectNode(null)}
            >
              ← Back to canvas
            </button>
            <button
              className="rounded-full border border-black/8 p-2 text-[var(--color-muted)] transition hover:bg-black/[0.03] hover:text-[var(--color-ink)]"
              onClick={() => selectNode(null)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {selectedAgent ? (
            <AgentDetail
              showProviderMetrics={showProviderMetrics}
              showProviderConfig={showProviderControls}
              detail={{
                id: selectedAgent.id,
                title: selectedNode.label,
                typeLabel: selectedNode.subtype || 'agent',
                status: selectedAgent.state.status,
                statusTone:
                  selectedAgent.state.status === 'running'
                    ? 'active'
                    : selectedAgent.state.status === 'error'
                      ? 'error'
                      : 'idle',
                lastActivity: selectedAgent.state.last_run || 'No recent run',
                metrics: {
                  tasksToday: recentTasks.length,
                  avgDuration: '1m 23s',
                  costToday: agentCost,
                  tokens: costHistory
                    .filter((point) => point.agent === selectedAgent.id)
                    .reduce((total, point) => total + (point.tokens || 0), 0),
                  factCount: facts.filter(
                    (fact) => fact.claimed_by === selectedAgent.id,
                  ).length,
                  vectorEntries: 1200 + selectedAgent.depth * 145,
                  lastLearned:
                    selectedAgent.config.tags[0] || 'shared context update',
                },
                recentTasks,
                config: {
                  model: selectedAgent.config.model,
                  permission: selectedAgent.config.permissions,
                  maxIterations: selectedAgent.config.max_iterations,
                  tags: selectedAgent.config.tags,
                },
              }}
            />
          ) : selectedNode.kind === 'database' ? (
            <DatabaseDetail
              title={selectedNode.label}
              subtitle={selectedNode.subtype || 'database'}
              statusText={selectedNode.statusText}
              metaTag={selectedNode.metaTag}
            />
          ) : selectedNode.kind === 'scheduler' ? (
            <SchedulerDetail
              title={selectedNode.label}
              statusText={selectedNode.statusText}
              metaTag={selectedNode.metaTag}
            />
          ) : (
            <DatabaseDetail
              title={selectedNode.label}
              subtitle={selectedNode.subtype || selectedNode.kind}
              statusText={selectedNode.statusText}
              metaTag={selectedNode.metaTag}
            />
          )}

          {showProviderControls ? (
            <div className="mt-8 flex gap-2">
              <button className="rounded-md border border-black/10 px-3 py-2 text-sm text-[var(--color-ink)] transition hover:bg-black/[0.03]">
                View Logs
              </button>
              <button className="rounded-md border border-black/10 px-3 py-2 text-sm text-[var(--color-ink)] transition hover:bg-black/[0.03]">
                Edit Config
              </button>
              <button className="rounded-md border border-black/10 px-3 py-2 text-sm text-[var(--color-ink)] transition hover:bg-black/[0.03]">
                Restart
              </button>
            </div>
          ) : null}
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
