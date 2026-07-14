import { BaseAgent, AgentOutput } from './BaseAgent';
import { projectPrompt } from '../prompts/project';

export class ProjectAgent extends BaseAgent {
  name = 'ProjectAgent';
  description = 'Coordinates Scrum breakdown pipelines (Epics -> Features -> Tasks).';

  async run(prompt: string, context: string): Promise<AgentOutput> {
    const fullInstruction = `${projectPrompt}\n\nUser Workspace Context:\n${context}`;
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
