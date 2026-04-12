import { dummyActivity } from '@/fixtures/activity';
import type {
  ActivityEntry,
  DashboardEvent,
  DashboardEventType,
} from '@/lib/types';

const eventTypes: DashboardEventType[] = [
  'agent:status',
  'agent:iteration',
  'task:assigned',
  'task:completed',
  'llm:response',
  'cost:update',
  'system:info',
];

export class MockEventGenerator {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private index = 0;

  constructor(
    private onEvent: (event: DashboardEvent, activity: ActivityEntry) => void,
  ) {}

  start() {
    this.schedule();
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private schedule() {
    const delay = 3_000 + Math.round(Math.random() * 5_000);
    this.timer = setTimeout(() => {
      const template = dummyActivity[this.index % dummyActivity.length];
      const event: DashboardEvent = {
        type: eventTypes[this.index % eventTypes.length],
        timestamp: new Date().toISOString(),
        agentId: template.agent,
        data: {
          message: template.data.summary || 'Synthetic dashboard event',
          cost: template.data.cost || Number((Math.random() * 0.06).toFixed(3)),
          tokens: template.data.tokens || 1_200,
          title: template.taskTitle,
          status: this.index % 5 === 0 ? 'running' : 'idle',
        },
      };

      const activity: ActivityEntry = {
        ...template,
        ts: event.timestamp,
      };

      this.onEvent(event, activity);
      this.index += 1;
      this.schedule();
    }, delay);
  }
}
