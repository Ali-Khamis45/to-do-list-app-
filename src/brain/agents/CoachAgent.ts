import { BaseAgent, AgentOutput } from './BaseAgent';
import { coachPrompt } from '../prompts/coach';

export class CoachAgent extends BaseAgent {
  name = 'CoachAgent';
  description = 'Provides calm, empathetic coaching and emotional support.';

  async run(prompt: string, context: string): Promise<AgentOutput> {
    const rules = [
      `CONTEXT REFERENCE CONSTRAINT: You must reference at least one prior fact from the conversation history/state (e.g., their university studies, exams, specific ideas, or goals) to show you are listening.`,
      `STABILITY RULE: If the user is discussing stress, burnout, anxiety, or exams, do NOT switch to planning/project management. Keep the emotional conversation stable.`,
      `HANDOFF RULE: If the user explicitly says they are ready to schedule, plan, or organize tasks, suggest transferring to the planner agent.`
    ].join('\n');

    const fullInstruction = `${coachPrompt}\n\n${rules}\n\nUser Workspace Context:\n${context}`;
    const response = await this.llm.generate(prompt, fullInstruction);
    
    // Programmatic handoff check for LocalProvider/GeminiProvider fallback
    const lowerPrompt = prompt.toLowerCase();
    let handoff: AgentOutput['handoff'] = undefined;
    
    if (
      /\b(ready to plan|let's plan|schedule tasks|start planning|organize my work|ready to schedule)\b/.test(lowerPrompt)
    ) {
      handoff = {
        shouldHandoff: true,
        nextAgent: 'planner',
        reason: 'User is ready to plan and organize tasks.'
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
