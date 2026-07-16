import { DialogueState } from './DialogueStateManager';
import { ResponsePlan } from './ResponsePlanner';

import coachExamples from '../conversation_examples/coach.json';
import plannerExamples from '../conversation_examples/planner.json';
import brainstormExamples from '../conversation_examples/brainstorm.json';
import codingExamples from '../conversation_examples/coding.json';
import researchExamples from '../conversation_examples/research.json';
import motivationExamples from '../conversation_examples/motivation.json';

export interface PromptBuilderParams {
  systemPrompt: string;
  dialogueState: DialogueState;
  responsePlan: ResponsePlan;
  workspaceContext: string;
  memoryContext: string;
  promptVersion?: 'A' | 'B';
}

export class PromptBuilder {
  build(params: PromptBuilderParams): string {
    const version = params.promptVersion || 'B';

    if (version === 'A') {
      // Baseline stateless request-response prompt (Version A)
      return [
        `=== AI SYSTEM ROLE ===`,
        params.systemPrompt,
        ``,
        `=== WORKSPACE AND MEMORY CONTEXT ===`,
        params.workspaceContext,
        params.memoryContext,
        ``,
        `=== INSTRUCTION ===`,
        `Reply to the user's message. Help them structure their tasks.`
      ].join('\n');
    }

    // Refined reasoning-first contraction-rich prompt (Version B)
    const examples = this.selectExamples(params.dialogueState);
    const examplesText = examples.map((ex, idx) => 
      `Example ${idx + 1}:\nUser: "${ex.user}"\nAssistant: "${ex.assistant}"`
    ).join('\n\n');

    return [
      `=== AI SYSTEM ROLE ===`,
      params.systemPrompt,
      ``,
      `=== DIALOGUE GOAL STATE ===`,
      `Active Goal: ${params.dialogueState.activeGoal}`,
      params.dialogueState.sentiment ? `User Sentiment: ${params.dialogueState.sentiment}` : '',
      `Dialogue Turns: ${params.dialogueState.turnsCount}`,
      params.dialogueState.lastMeaningfulSummary ? `Last Meaningful Exchange: ${params.dialogueState.lastMeaningfulSummary}` : '',
      ``,
      `=== COGNITIVE INSTRUCTIONS ===`,
      `- INTENT REASONING: First, ask yourself: "What is the user REALLY trying to accomplish?" before generating a reply. Do not answer literally. Understand the deeper emotional or structural objective.`,
      `- EMOTIONAL ALIGNMENT: If user sentiment is 'stressed', act like a supportive human friend. Do NOT mention productivity, efficiency, tasks, schedules, or metrics. If 'excited', match excitement. If 'confused', guide instead of lecture.`,
      `- CONTINUOUS MEMORY: Scan the [WORKSPACE AND MEMORY CONTEXT] below. If the user has a related goal (e.g. React/TypeScript) or captured ideas/projects, bring them up naturally and conversationally. E.g. "By the way, how is your React goal going?" or "This reminds me of that startup idea you saved last week."`,
      `- HUMAN TONE: Use contractions (it's, don't, you're, we'll). Never sound like customer support.`,
      `- BANNED PHRASES: Never say "I'm your productivity coach", "I'm here to help", "I can help you", "I'm here as your productivity partner" unless this is literally turn 1.`,
      `- CONVERSATION FLOW: Never end conversations early. Ask exactly ONE meaningful follow-up question to keep the chat going naturally.`,
      `- CONTEXT REFERENCE CONSTRAINT: Your reply MUST reference at least one concrete fact from the DIALOGUE GOAL STATE or WORKSPACE AND MEMORY CONTEXT below (a specific goal, idea, prior stress cause, or previous topic) - do not respond generically.`,
      ``,
      `=== RESPONSE PLAN ===`,
      `Follow these planned response steps:`,
      params.responsePlan.steps.map((step, idx) => `${idx + 1}. [${step.toUpperCase()}]`).join('\n'),
      ``,
      `=== CONVERSATION STYLE EXAMPLES ===`,
      `Adopt the exact tone, style, and question formatting shown in these examples:`,
      examplesText,
      ``,
      `=== WORKSPACE AND MEMORY CONTEXT ===`,
      params.workspaceContext,
      params.memoryContext,
      ``,
      `=== INSTRUCTION ===`,
      `Synthesize a warm, human, smart contraction-rich dialogue. Follow the response plan steps. Do not perform actions without user confirmation.`
    ].filter(s => s !== '').join('\n');
  }

  private selectExamples(state: DialogueState): Array<{ user: string; assistant: string }> {
    if (state.sentiment === 'stressed' || state.activeGoal === 'grounding_user') {
      return [...coachExamples, ...motivationExamples].slice(0, 4);
    }
    
    switch (state.activeGoal) {
      case 'planning_roadmap':
        return plannerExamples.slice(0, 4);
      case 'brainstorming_mvp':
        return brainstormExamples.slice(0, 4);
      case 'exploring_tech':
        return codingExamples.slice(0, 4);
      case 'tracking_progress':
        return [...plannerExamples, ...coachExamples].slice(0, 4);
      default:
        return coachExamples.slice(0, 4);
    }
  }
}
