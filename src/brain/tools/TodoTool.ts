import { Tool, ToolDefinition } from './Tool';
import { Task } from '../../types';

export class ListTasksTool extends Tool {
  definition: ToolDefinition = {
    name: 'ListTasks',
    description: 'Retrieve all todo tasks from the checklist database.',
    parameters: {
      type: 'object',
      properties: {}
    },
    permissionLevel: 'READ'
  };

  private getTasks: () => Task[];

  constructor(getTasks: () => Task[]) {
    super();
    this.getTasks = getTasks;
  }

  async execute(): Promise<Task[]> {
    return this.getTasks();
  }
}

export class CreateTaskTool extends Tool {
  definition: ToolDefinition = {
    name: 'CreateTask',
    description: 'Add a new task item to the to-do list checklist.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'The title description of the task' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Urgency tier of the task' },
        category: { type: 'string', description: 'Functional category (e.g. Work, Health, Personal, Learning)' }
      },
      required: ['title']
    },
    permissionLevel: 'READ'
  };

  private onAddTask: (task: Task) => void;

  constructor(onAddTask: (task: Task) => void) {
    super();
    this.onAddTask = onAddTask;
  }

  async execute(args: { title: string; priority?: 'low' | 'medium' | 'high'; category?: string }): Promise<any> {
    const todayStr = new Date().toISOString().split('T')[0];
    const newTask: Task = {
      id: `ai-task-${Date.now()}-${Math.random()}`,
      title: args.title,
      time: '09:00',
      subtext: 'Added by AI Productivity Coach',
      completed: false,
      date: todayStr,
      category: args.category || 'General',
      priority: args.priority || 'medium',
      createdAt: todayStr,
      logs: {}
    };
    
    this.onAddTask(newTask);
    return { success: true, task: newTask };
  }
}
