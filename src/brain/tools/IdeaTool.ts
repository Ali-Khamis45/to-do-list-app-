import { Tool, ToolDefinition } from './Tool';
import { Idea } from '../types';

export class ListIdeasTool extends Tool {
  definition: ToolDefinition = {
    name: 'ListIdeas',
    description: 'Retrieve all captured project/notes ideas inside the AI Brain.',
    parameters: {
      type: 'object',
      properties: {}
    },
    permissionLevel: 'READ'
  };

  private getIdeas: () => Idea[];

  constructor(getIdeas: () => Idea[]) {
    super();
    this.getIdeas = getIdeas;
  }

  async execute(): Promise<Idea[]> {
    return this.getIdeas();
  }
}

export class CreateIdeaTool extends Tool {
  definition: ToolDefinition = {
    name: 'CreateIdea',
    description: 'Capture a new raw idea, concept, or startup thought into the AI Brain index.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Brief title descriptor of the idea' },
        content: { type: 'string', description: 'Complete text descriptions or details' },
        category: { type: 'string', description: 'Category (e.g. Technology, Business, Learning, Health, Personal)' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] }
      },
      required: ['title', 'content']
    },
    permissionLevel: 'WRITE'
  };

  private onSaveIdea: (idea: Idea) => void;

  constructor(onSaveIdea: (idea: Idea) => void) {
    super();
    this.onSaveIdea = onSaveIdea;
  }

  async execute(args: { title: string; content: string; category?: string; priority?: 'low' | 'medium' | 'high' }): Promise<any> {
    const todayStr = new Date().toISOString().split('T')[0];
    const newIdea: Idea = {
      id: `idea-ai-${Date.now()}`,
      userId: '', // Populated by repository
      title: args.title,
      content: args.content,
      tags: [],
      createdAt: todayStr,
      updatedAt: todayStr,
      priority: args.priority || 'medium',
      category: args.category || 'General',
      favorite: false,
      archived: false
    };

    this.onSaveIdea(newIdea);
    return { success: true, idea: newIdea };
  }
}
