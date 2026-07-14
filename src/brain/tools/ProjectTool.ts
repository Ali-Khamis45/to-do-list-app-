import { Tool, ToolDefinition } from './Tool';
import { Idea } from '../types';

export class ProjectTool extends Tool {
  definition: ToolDefinition = {
    name: 'ProjectTool',
    description: 'Promote or group ideas into active development projects.',
    parameters: {
      type: 'object',
      properties: {
        ideaId: { type: 'string', description: 'The ID of the idea to promote' },
        action: { type: 'string', enum: ['promote', 'getProgress'] }
      },
      required: ['ideaId', 'action']
    },
    permissionLevel: 'WRITE'
  };

  private getIdeas: () => Idea[];
  private onSaveIdea: (idea: Idea) => void;

  constructor(getIdeas: () => Idea[], onSaveIdea: (idea: Idea) => void) {
    super();
    this.getIdeas = getIdeas;
    this.onSaveIdea = onSaveIdea;
  }

  async execute(args: { ideaId: string; action: 'promote' | 'getProgress' }): Promise<any> {
    const ideas = this.getIdeas();
    const idea = ideas.find(i => i.id === args.ideaId);
    if (!idea) {
      throw new Error(`Idea with ID ${args.ideaId} not found.`);
    }

    if (args.action === 'promote') {
      const updatedIdea: Idea = {
        ...idea,
        isProject: true,
        projectProgress: 0,
        updatedAt: new Date().toISOString().split('T')[0]
      };
      this.onSaveIdea(updatedIdea);
      return { success: true, project: updatedIdea };
    }

    if (args.action === 'getProgress') {
      return { ideaId: idea.id, isProject: !!idea.isProject, progress: idea.projectProgress || 0 };
    }

    return { success: false, error: 'Unknown action' };
  }
}
