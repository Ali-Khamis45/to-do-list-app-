export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>; // JSON Schema format for tool inputs
  permissionLevel: 'READ' | 'WRITE';
}

export abstract class Tool {
  abstract definition: ToolDefinition;

  // Execute the tool logic. Validation should happen in ToolRouter.
  abstract execute(args: any): Promise<any>;
}
