export interface LogSpan {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  metadata?: Record<string, any>;
  error?: string;
}

export class Logger {
  private static instance: Logger;
  private logs: LogSpan[] = [];

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  startSpan(name: string, metadata?: Record<string, any>): LogSpan {
    const span: LogSpan = {
      id: `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      startTime: Date.now(),
      metadata
    };
    this.logs.push(span);
    return span;
  }

  endSpan(id: string, metadata?: Record<string, any>, error?: string): void {
    const span = this.logs.find(s => s.id === id);
    if (span) {
      span.endTime = Date.now();
      span.durationMs = span.endTime - span.startTime;
      if (metadata) {
        span.metadata = { ...span.metadata, ...metadata };
      }
      if (error) {
        span.error = error;
      }
      console.log(`[Agent Logger] ${span.name} completed in ${span.durationMs}ms`, span);
    }
  }

  getLogs(): LogSpan[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}
