import { Tool, ToolDefinition } from './Tool';
import { Habit } from '../../types';

export class ListHabitsTool extends Tool {
  definition: ToolDefinition = {
    name: 'ListHabits',
    description: 'Retrieve all tracked habits and completion logs.',
    parameters: {
      type: 'object',
      properties: {}
    },
    permissionLevel: 'READ'
  };

  private getHabits: () => Habit[];

  constructor(getHabits: () => Habit[]) {
    super();
    this.getHabits = getHabits;
  }

  async execute(): Promise<Habit[]> {
    return this.getHabits();
  }
}
