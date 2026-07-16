import { BaseAgent, AgentOutput } from './BaseAgent';
import { SUGGEST_TASKS_TOOLS } from '../tools/suggestTasksTool';

export class GoalAgent extends BaseAgent {
  name = 'GoalAgent';
  description = 'Tracks goals and schedules metrics forecasts.';

  async run(prompt: string, context: string): Promise<AgentOutput> {
    const instruction = `You are a goal tracking assistant. Help the user measure progress, complete milestones, and stay ahead.\n\nContext:\n${context}`;
    const response = await this.llm.generate(prompt, instruction, SUGGEST_TASKS_TOOLS);
    return {
      agentName: this.name,
      analysis: response.text,
      suggestedTools: response.toolCalls,
      tokensUsed: response.tokensUsed,
      responseTimeMs: response.responseTimeMs
    };
  }
}

export class TaskAgent extends BaseAgent {
  name = 'TaskAgent';
  description = 'Coordinates daily to-do checklists organization.';

  async run(prompt: string, context: string): Promise<AgentOutput> {
    const instruction = `You are a task organizer. Help the user prioritize their daily task checklist.\n\nContext:\n${context}`;
    const response = await this.llm.generate(prompt, instruction, SUGGEST_TASKS_TOOLS);
    return {
      agentName: this.name,
      analysis: response.text,
      suggestedTools: response.toolCalls,
      tokensUsed: response.tokensUsed,
      responseTimeMs: response.responseTimeMs
    };
  }
}

export class IdeaAgent extends BaseAgent {
  name = 'IdeaAgent';
  description = 'Brainstorms and expands captured startup outlines.';

  async run(prompt: string, context: string): Promise<AgentOutput> {
    const instruction = `You are a creative brainstorming partner. Help the user write, refine, and connect their ideas.\n\nContext:\n${context}`;
    const response = await this.llm.generate(prompt, instruction, SUGGEST_TASKS_TOOLS);
    return {
      agentName: this.name,
      analysis: response.text,
      suggestedTools: response.toolCalls,
      tokensUsed: response.tokensUsed,
      responseTimeMs: response.responseTimeMs
    };
  }
}

export class CalendarAgent extends BaseAgent {
  name = 'CalendarAgent';
  description = 'Arranges schedules and calendar agendas.';

  async run(prompt: string, context: string): Promise<AgentOutput> {
    const instruction = `You are a schedule planner. Coordinate date mappings, agendas, and time management.\n\nContext:\n${context}`;
    const response = await this.llm.generate(prompt, instruction, SUGGEST_TASKS_TOOLS);
    return {
      agentName: this.name,
      analysis: response.text,
      suggestedTools: response.toolCalls,
      tokensUsed: response.tokensUsed,
      responseTimeMs: response.responseTimeMs
    };
  }
}
