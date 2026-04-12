import type { Message } from '@/lib/types';

export const dummyMessages: Message[] = Array.from(
  { length: 15 },
  (_, index) => ({
    id: `msg-${index + 1}`,
    from: index % 2 === 0 ? 'root' : 'ops-analysis',
    to: index % 3 === 0 ? 'reporting' : 'financial-metrics',
    content:
      index % 2 === 0
        ? 'Please fold the latest working-capital findings into the weekly brief.'
        : 'Validated the cost-center anomaly. Ready for report synthesis.',
    timestamp: new Date(Date.now() - index * 13 * 60_000).toISOString(),
    type: 'direct',
    metadata: {
      priority: index % 4 === 0 ? 'high' : 'normal',
      source: 'demo',
    },
  }),
);
