import { Tool, ToolDefinition } from './Tool';
import { Task, Habit } from '../../types';
import { Goal } from '../../goals/types';

export class GetAnalyticsTool extends Tool {
  definition: ToolDefinition = {
    name: 'GetAnalytics',
    description: 'Calculate productivity reports, completion rates, and active streaks analysis.',
    parameters: {
      type: 'object',
      properties: {}
    },
    permissionLevel: 'READ'
  };

  private getTasks: () => Task[];
  private getGoals: () => Goal[];
  private getHabits: () => Habit[];

  constructor(getTasks: () => Task[], getGoals: () => Goal[], getHabits: () => Habit[]) {
    super();
    this.getTasks = getTasks;
    this.getGoals = getGoals;
    this.getHabits = getHabits;
  }

  async execute(): Promise<any> {
    const tasks = this.getTasks();
    const goals = this.getGoals();
    const habits = this.getHabits();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.date === todayStr);
    const completedToday = todayTasks.filter(t => t.completed).length;

    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');

    // Calculate habits average completions
    let totalLogsCount = 0;
    let completedLogsCount = 0;
    habits.forEach(h => {
      const statuses = Object.values(h.logs);
      totalLogsCount += statuses.length;
      completedLogsCount += statuses.filter(s => s === 'completed').length;
    });

    const habitSuccessRate = totalLogsCount > 0 
      ? Math.round((completedLogsCount / totalLogsCount) * 100) 
      : 0;

    return {
      todayPendingTasks: todayTasks.length - completedToday,
      todayCompletedTasks: completedToday,
      activeGoalsCount: activeGoals.length,
      completedGoalsCount: completedGoals.length,
      habitSuccessRatePercent: habitSuccessRate,
      totalHabitsTracked: habits.length
    };
  }
}
