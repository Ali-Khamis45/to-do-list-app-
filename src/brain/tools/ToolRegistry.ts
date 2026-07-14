import { Tool } from './Tool';

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Record<string, Tool> = {};

  private constructor() {}

  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  registerTool(tool: Tool): void {
    if (this.tools[tool.definition.name]) {
      console.warn(`Overwriting tool: ${tool.definition.name}`);
    }
    this.tools[tool.definition.name] = tool;
  }

  getTool(name: string): Tool | null {
    return this.tools[name] || null;
  }

  getRegisteredTools(): Tool[] {
    return Object.values(this.tools);
  }

  getToolDefinitions(): any[] {
    return Object.values(this.tools).map(t => ({
      functionDeclaration: {
        name: t.definition.name,
        description: t.definition.description,
        parameters: t.definition.parameters
      }
    }));
  }

  clear(): void {
    this.tools = {};
  }
}
