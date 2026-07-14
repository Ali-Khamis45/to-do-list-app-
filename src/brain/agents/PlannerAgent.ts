import { BaseAgent, AgentOutput } from './BaseAgent';
import { plannerPrompt } from '../prompts/planner';

export class PlannerAgent extends BaseAgent {
  name = 'PlannerAgent';
  description = 'Builds study plans, guides, and timetables.';

  async run(prompt: string, context: string): Promise<AgentOutput> {
    const fullInstruction = `${plannerPrompt}\n\nUser Workspace Context:\n${context}`;
    const response = await this.llm.generate(prompt, fullInstruction);
    return {
      agentName: this.name,
      analysis: response.text,
      suggestedTools: response.toolCalls
    };
  }
}
