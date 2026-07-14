import { Tool, ToolDefinition } from './Tool';
import { Task } from '../../types';

export class GetCalendarEventsTool extends Tool {
  definition: ToolDefinition = {
    name: 'GetCalendarEvents',
    description: 'Retrieve tasks and schedules scheduled for a specific date.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Target date string in YYYY-MM-DD format (defaults to today)' }
      }
    },
    permissionLevel: 'READ'
  };

  private getTasks: () => Task[];

  constructor(getTasks: () => Task[]) {
    super();
    this.getTasks = getTasks;
  }

  async execute(args?: { date?: string }): Promise<Task[]> {
    const targetDate = args?.date || new Date().toISOString().split('T')[0];
    return this.getTasks().filter(t => t.date === targetDate);
  }
}
