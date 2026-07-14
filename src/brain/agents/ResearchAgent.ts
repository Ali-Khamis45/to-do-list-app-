import { BaseAgent, AgentOutput } from './BaseAgent';
import { researchPrompt } from '../prompts/research';

export class ResearchAgent extends BaseAgent {
  name = 'ResearchAgent';
  description = 'Performs critical analysis, SWOT mapping, and competitor research.';

  async run(prompt: string, context: string): Promise<AgentOutput> {
    const fullInstruction = `${researchPrompt}\n\nUser Workspace Context:\n${context}`;
    const response = await this.llm.generate(prompt, fullInstruction);
    return {
      agentName: this.name,
      analysis: response.text,
      suggestedTools: response.toolCalls
    };
  }
}
