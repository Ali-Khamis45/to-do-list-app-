import { BaseAgent, AgentOutput } from './BaseAgent';
import { coachPrompt } from '../prompts/coach';

export class CoachAgent extends BaseAgent {
  name = 'CoachAgent';
  description = 'Provides calm, empathetic coaching and emotional support.';

  async run(prompt: string, context: string): Promise<AgentOutput> {
    const fullInstruction = `${coachPrompt}\n\nUser Workspace Context:\n${context}`;
    const response = await this.llm.generate(prompt, fullInstruction);
    return {
      agentName: this.name,
      analysis: response.text,
      suggestedTools: response.toolCalls,
      tokensUsed: response.tokensUsed,
      responseTimeMs: response.responseTimeMs
    };
  }
}
