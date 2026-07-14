import { BaseAgent, AgentOutput } from './BaseAgent';
import { codingPrompt } from '../prompts/coding';

export class CodingAgent extends BaseAgent {
  name = 'CodingAgent';
  description = 'Provides software engineering and React coding advice.';

  async run(prompt: string, context: string): Promise<AgentOutput> {
    const fullInstruction = `${codingPrompt}\n\nUser Workspace Context:\n${context}`;
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
