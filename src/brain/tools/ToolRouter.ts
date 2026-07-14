import { ToolRegistry } from './ToolRegistry';
import { Logger } from '../core/Logger';

export interface ToolRouteResult {
  success: boolean;
  suspended?: boolean;
  result?: any;
  error?: string;
  toolName?: string;
  arguments?: any;
}

export class ToolRouter {
  private registry: ToolRegistry;
  private logger: Logger;

  constructor() {
    this.registry = ToolRegistry.getInstance();
    this.logger = Logger.getInstance();
  }

  async route(name: string, args: any, onConfirmRequested: (toolName: string, args: any, proceed: () => Promise<any>) => void): Promise<ToolRouteResult> {
    const span = this.logger.startSpan(`ToolRouter: route ${name}`, { args });
    const tool = this.registry.getTool(name);

    if (!tool) {
      this.logger.endSpan(span.id, {}, `Tool ${name} not found in registry`);
      return { success: false, error: `Tool ${name} not found.` };
    }

    try {
      // Validate schema (basic type assertions for security)
      this.validateArguments(tool.definition, args);

      // Check permission level
      if (tool.definition.permissionLevel === 'WRITE') {
        this.logger.endSpan(span.id, { status: 'suspended_for_permission' });
        
        // Return a suspended result, so pipeline can request confirmation from UI
        return {
          success: true,
          suspended: true,
          toolName: name,
          arguments: args
        };
      }

      // Execute read-only tools automatically
      const result = await tool.execute(args);
      this.logger.endSpan(span.id, { status: 'success' });
      return { success: true, result };
    } catch (err: any) {
      this.logger.endSpan(span.id, {}, err.message);
      return { success: false, error: err.message };
    }
  }

  private validateArguments(def: any, args: any): void {
    if (!def.parameters || !def.parameters.required) return;
    for (const req of def.parameters.required) {
      if (args[req] === undefined || args[req] === null || args[req] === '') {
        throw new Error(`Missing required parameter: '${req}' for tool '${def.name}'`);
      }
    }
  }
}
