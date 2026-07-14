import { Tool, ToolDefinition } from './Tool';
import { Goal } from '../../goals/types';

export class ListGoalsTool extends Tool {
  definition: ToolDefinition = {
    name: 'ListGoals',
    description: 'Retrieve all goals and progress tracks.',
    parameters: {
      type: 'object',
      properties: {}
    },
    permissionLevel: 'READ'
  };

  private getGoals: () => Goal[];

  constructor(getGoals: () => Goal[]) {
    super();
    this.getGoals = getGoals;
  }

  async execute(): Promise<Goal[]> {
    return this.getGoals();
  }
}

export class CreateGoalTool extends Tool {
  definition: ToolDefinition = {
    name: 'CreateGoal',
    description: 'Create a new smart goal with milestones.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Goal objective title' },
        description: { type: 'string', description: 'Brief description of the goal context' },
        category: { type: 'string', description: 'Category (e.g. Health, Business, Learning, Personal)' },
        difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
        targetValue: { type: 'number', description: 'Target value to achieve (e.g., number of books, hours)' },
        unit: { type: 'string', description: 'Unit name (e.g. pages, books, sessions, miles)' }
      },
      required: ['title', 'targetValue', 'unit']
    },
    permissionLevel: 'WRITE'
  };

  private onAddGoal: (goal: Goal) => void;

  constructor(onAddGoal: (goal: Goal) => void) {
    super();
    this.onAddGoal = onAddGoal;
  }

  async execute(args: { title: string; description?: string; category?: string; difficulty?: 'easy' | 'medium' | 'hard'; targetValue: number; unit: string }): Promise<any> {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 3); // Default 3 months

    const newGoal: Goal = {
      id: `g-ai-${Date.now()}`,
      userId: '', // Populated by application
      title: args.title,
      description: args.description || '',
      goalType: 'numeric',
      targetValue: args.targetValue,
      currentValue: 0,
      unit: args.unit,
      startDate: todayStr,
      targetDate: targetDate.toISOString().split('T')[0],
      priority: 'medium',
      category: args.category || 'General',
      frequency: 'weekly',
      difficulty: args.difficulty || 'medium',
      estimatedMinutesPerUnit: 60,
      status: 'active',
      tags: [],
      color: '#6b7280',
      icon: 'Target',
      milestones: [],
      logs: [],
      subGoals: [],
      dependencies: [],
      history: [{
        id: `h-ai-${Date.now()}`,
        goalId: '',
        eventType: 'created',
        timestamp: new Date().toISOString(),
        description: 'Goal created via AI Productivity Coach'
      }]
    };

    this.onAddGoal(newGoal);
    return { success: true, goal: newGoal };
  }
}
