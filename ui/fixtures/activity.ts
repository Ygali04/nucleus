import type { ActivityEntry } from '@/lib/types';

const agents = [
  'root',
  'ops-analysis',
  'financial-metrics',
  'market-research',
  'working-capital',
  'reporting',
  'risk-analysis',
  'vendor-benchmarking',
];

const activityTypes: ActivityEntry['type'][] = [
  'task_started',
  'thinking',
  'tool_call',
  'tool_result',
  'reflection',
  'task_completed',
  'error',
  'cost',
  'iteration',
  'message_sent',
];

export const dummyActivity: ActivityEntry[] = Array.from(
  { length: 100 },
  (_, index) => {
    const type = activityTypes[index % activityTypes.length];
    const agent = agents[index % agents.length];
    const ts = new Date(Date.now() - index * 90_000).toISOString();

    return {
      ts,
      agent,
      type,
      taskId: `task-${String((index % 30) + 1).padStart(3, '0')}`,
      taskTitle: `Pipeline update ${index + 1}`,
      data: {
        summary:
          type === 'error'
            ? 'Encountered timeout while fetching source data'
            : type === 'tool_call'
              ? 'Invoked ERP query adapter'
              : type === 'tool_result'
                ? 'Received refreshed KPI payload'
                : type === 'reflection'
                  ? 'Confirmed recommendation is aligned with latest facts'
                  : type === 'message_sent'
                    ? 'Sent synthesis to reporting agent'
                    : 'Progress update emitted by agent runtime',
        cost:
          type === 'cost'
            ? Number((Math.random() * 0.08 + 0.01).toFixed(3))
            : undefined,
        tokens: 150 + index * 5,
        iteration: (index % 6) + 1,
      },
    };
  },
);
