import { Tool, ToolDefinition } from './Tool';
import { Idea } from '../types';
import { searchIdeas } from '../searchEngine';

export class SearchTool extends Tool {
  definition: ToolDefinition = {
    name: 'SearchTool',
    description: 'Perform a semantic/textual keyword search across all saved ideas, project plans, and brain documents.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search keywords or target phrase' }
      },
      required: ['query']
    },
    permissionLevel: 'READ'
  };

  private getIdeas: () => Idea[];

  constructor(getIdeas: () => Idea[]) {
    super();
    this.getIdeas = getIdeas;
  }

  async execute(args: { query: string }): Promise<Idea[]> {
    return searchIdeas(this.getIdeas(), args.query);
  }
}
