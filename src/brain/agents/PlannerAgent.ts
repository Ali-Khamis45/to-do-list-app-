import { BaseAgent, AgentOutput } from './BaseAgent';
import { plannerPrompt } from '../prompts/planner';

export class PlannerAgent extends BaseAgent {
  name = 'PlannerAgent';
  description = 'Builds study plans, guides, and timetables.';

  async run(prompt: string, context: string): Promise<AgentOutput> {
    const rules = [
      `CONTEXT REFERENCE CONSTRAINT: Reference at least one prior fact from the conversation history/state (e.g., the goals, projects, or stress they mentioned previously).`,
      `HANDOFF RULE: If the user asks a specific programming or coding question (e.g. React hooks, TypeScript compilation), suggest transferring to the coding agent.`,
      `RELEASE CONTROL: If the user indicates they want to stop planning or return to general chat, suggest returning control.`
    ].join('\n');

    const fullInstruction = `${plannerPrompt}\n\n${rules}\n\nUser Workspace Context:\n${context}`;
    const response = await this.llm.generate(prompt, fullInstruction);
    
    // Programmatic handoff checks
    const lowerPrompt = prompt.toLowerCase();
    let handoff: AgentOutput['handoff'] = undefined;
    
    if (
      /\b(how do i code|write a react|react useEffect|typescript error|how to use useEffect|syntax for|code this)\b/.test(lowerPrompt)
    ) {
      handoff = {
        shouldHandoff: true,
        nextAgent: 'coding',
        reason: 'User asked a specific coding question during a planning session.'
      };
    } else if (
      /\b(done planning|stop planning|go back|chat about|talk about other things|return)\b/.test(lowerPrompt)
    ) {
      handoff = {
        shouldHandoff: true,
        nextAgent: 'pop',
        reason: 'User completed the planning flow.'
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
