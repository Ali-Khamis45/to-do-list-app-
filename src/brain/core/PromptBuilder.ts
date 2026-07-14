import { DialogueState } from './DialogueStateManager';
import { ResponsePlan } from './ResponsePlanner';

export interface PromptBuilderParams {
  systemPrompt: string;
  dialogueState: DialogueState;
  responsePlan: ResponsePlan;
  workspaceContext: string;
  memoryContext: string;
}

export class PromptBuilder {
  build(params: PromptBuilderParams): string {
    return [
      `=== AI SYSTEM ROLE ===`,
      params.systemPrompt,
      ``,
      `=== DIALOGUE GOAL STATE ===`,
      `Active Goal: ${params.dialogueState.activeGoal}`,
      params.dialogueState.sentiment ? `User Sentiment: ${params.dialogueState.sentiment}` : '',
      `Dialogue Turns: ${params.dialogueState.turnsCount}`,
      ``,
      `=== RESPONSE PLAN ===`,
      `You must format your reasoning/response through these planning steps:`,
      params.responsePlan.steps.map((step, idx) => `${idx + 1}. [${step.toUpperCase()}]`).join('\n'),
      ``,
      `=== WORKSPACE AND MEMORY CONTEXT ===`,
      params.workspaceContext,
      params.memoryContext,
      ``,
      `=== INSTRUCTION ===`,
      `Synthesize a warm, human, smart contraction-rich dialogue. Follow the plan. Do not perform actions without user confirmation.`
    ].filter(s => s !== '').join('\n');
  }
}
