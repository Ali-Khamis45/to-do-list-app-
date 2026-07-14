export interface PendingTransaction {
  id: string;
  toolName: string;
  arguments: any;
  description: string;
  execute: () => Promise<any>;
}

export class ConfirmationEngine {
  private static instance: ConfirmationEngine;
  private pending: PendingTransaction[] = [];

  private constructor() {}

  static getInstance(): ConfirmationEngine {
    if (!ConfirmationEngine.instance) {
      ConfirmationEngine.instance = new ConfirmationEngine();
    }
    return ConfirmationEngine.instance;
  }

  suspend(toolName: string, args: any, execute: () => Promise<any>): PendingTransaction {
    let description = `Add item to list: "${args.title || args.name || 'Untitled'}"`;
    if (toolName === 'CreateGoal') {
      description = `Create Goal: "${args.title}" with target of ${args.targetValue} ${args.unit}`;
    } else if (toolName === 'CreateIdea') {
      description = `Capture Idea: "${args.title}"`;
    }

    const transaction: PendingTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      toolName,
      arguments: args,
      description,
      execute
    };

    this.pending.push(transaction);
    return transaction;
  }

  getPending(id: string): PendingTransaction | null {
    return this.pending.find(t => t.id === id) || null;
  }

  resolve(id: string): void {
    this.pending = this.pending.filter(t => t.id !== id);
  }

  clear(): void {
    this.pending = [];
  }
}
