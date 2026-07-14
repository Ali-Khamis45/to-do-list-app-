import { BaseAgent, AgentOutput } from './BaseAgent';
import { codingPrompt } from '../prompts/coding';

export class CodingAgent extends BaseAgent {
  name = 'CodingAgent';
  description = 'Provides software engineering and React coding advice.';

  async run(prompt: string, context: string): Promise<AgentOutput> {
    const rules = [
      `CONTEXT REFERENCE CONSTRAINT: Reference at least one prior fact from the conversation history/state.`,
      `RELEASE CONTROL: If the user indicates they are done debugging or coding (e.g. "thanks, that worked", "got it", "done coding", "go back to planning"), suggest returning control.`
    ].join('\n');

    const fullInstruction = `${codingPrompt}\n\n${rules}\n\nUser Workspace Context:\n${context}`;
    const response = await this.llm.generate(prompt, fullInstruction);
    
    // Programmatic handoff check
    const lowerPrompt = prompt.toLowerCase();
    let handoff: AgentOutput['handoff'] = undefined;
    
    if (
      /\b(thanks that worked|got it|done coding|go back to planning|planning flow|return to plan|solved|fixed)\b/.test(lowerPrompt)
    ) {
      handoff = {
        shouldHandoff: true,
        nextAgent: 'pop',
        reason: 'User resolved their coding question and wants to return to the planning context.'
      };
    }

    return {
      agentName: this.name,
      analysis: response.text,
      suggestedTools: response.toolCalls,
      tokensUsed: response.tokensUsed,
      responseTimeMs: response.responseTimeMs,
      handoff
    };
  }
}
