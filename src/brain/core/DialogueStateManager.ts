import { IntentType } from './IntentClassifier';

export type DialogueGoal = 
  | 'grounding_user' 
  | 'planning_roadmap' 
  | 'brainstorming_mvp' 
  | 'tracking_progress' 
  | 'exploring_tech';

export interface DialogueState {
  activeGoal: DialogueGoal;
  activeTopic?: string;
  conversationObjective?: string;
  assistantExpectation?: string;
  userExpectation?: string;
  lastMeaningfulSummary?: string;
  pendingQuestion?: string;
  expectedInformation?: string;
  agentStack: string[];
  sentiment?: 'calm' | 'stressed' | 'excited' | 'confused';
  turnsCount: number;
}

export class DialogueStateManager {
  private userId: string;
  private state: DialogueState;

  constructor(userId: string) {
    this.userId = userId;
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): DialogueState {
    const raw = localStorage.getItem(`nexus_dlg_state_${this.userId}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.agentStack) && parsed.agentStack.length > 0) {
          return parsed;
        }
      } catch {
        // Fall back to defaults
      }
    }
    return {
      activeGoal: 'grounding_user',
      agentStack: ['coach'],
      turnsCount: 0
    };
  }

  private save(): void {
    localStorage.setItem(`nexus_dlg_state_${this.userId}`, JSON.stringify(this.state));
  }

  getState(): DialogueState {
    return this.state;
  }

  updateState(updates: Partial<DialogueState>): void {
    this.state = { ...this.state, ...updates };
    this.save();
  }

  /**
   * Decouples intent from active agent by managing a stack and verifying if the
   * user is answering a pending question.
   */
  determineGoalAndAgent(
    intent: IntentType,
    prompt: string,
    confidence: number,
    dialogueHistory: Array<{ role: 'user' | 'model'; text: string }>
  ): { goal: DialogueGoal; primaryAgent: string } {
    const lower = prompt.toLowerCase();
    const currentAgent = this.state.agentStack[this.state.agentStack.length - 1] || 'coach';

    // --- 1. Check if user is answering a pending question ---
    let isAnswering = false;
    if (this.state.pendingQuestion && this.state.expectedInformation) {
      const expected = this.state.expectedInformation.toLowerCase();
      // If prompt has relevant keywords or the current agent expects an answer,
      // and the intent confidence is low (or general conversational), assume it's an answer.
      if (
        confidence < 0.8 ||
        intent === 'chat' ||
        intent === 'general_conversation' ||
        intent === 'unknown' ||
        lower.split(/\s+/).length <= 4 ||
        lower.includes(expected) ||
        (expected === 'stress_reason' && /\b(exams|study|work|tired|boss|deadline|school|uni)\b/.test(lower)) ||
        (expected === 'project_details' && /\b(app|startup|react|typescript|coding|website)\b/.test(lower))
      ) {
        isAnswering = true;
      }
    }

    // If they are answering, DO NOT switch the agent. Lock to the current one.
    if (isAnswering) {
      return {
        goal: this.state.activeGoal,
        primaryAgent: currentAgent
      };
    }

    // --- 2. Low confidence check: maintain current agent to avoid random jumps ---
    if (confidence < 0.8 && intent !== 'emotional_support') {
      return {
        goal: this.state.activeGoal,
        primaryAgent: currentAgent
      };
    }

    // --- 3. Prevent agent switching caused by isolated keywords during emotional states ---
    const isStressedContext = this.state.activeGoal === 'grounding_user' || intent === 'emotional_support';
    if (isStressedContext) {
      // Do not jump to coding/idea/project agent just because they mention an app/startup/coding while stressed.
      const hasStressWord = /\b(stressed|overwhelmed|anxious|tired|burnout|sad|exams|fail|hard)\b/.test(lower);
      if (hasStressWord) {
        return {
          goal: 'grounding_user',
          primaryAgent: 'coach'
        };
      }
    }

    // --- 4. Map intent to potential target goal & agent ---
    let targetGoal: DialogueGoal = this.state.activeGoal;
    let targetAgent = currentAgent;

    if (intent === 'emotional_support' || /\b(stressed|overwhelmed|anxious|tired|burnout)\b/i.test(lower)) {
      targetGoal = 'grounding_user';
      targetAgent = 'coach';
    } else if (intent === 'planning' || lower.includes('plan') || lower.includes('schedule') || lower.includes('timeline')) {
      targetGoal = 'planning_roadmap';
      targetAgent = 'planner';
    } else if (intent === 'brainstorming' || lower.includes('idea') || lower.includes('brainstorm') || lower.includes('mvp')) {
      targetGoal = 'brainstorming_mvp';
      targetAgent = 'project';
    } else if (intent === 'coding' || lower.includes('code') || lower.includes('react') || lower.includes('typescript')) {
      targetGoal = 'exploring_tech';
      targetAgent = 'coding';
    } else if (intent === 'goal_creation' || intent === 'goal_update' || lower.includes('progress') || lower.includes('stats')) {
      targetGoal = 'tracking_progress';
      targetAgent = 'goal';
    }

    // If agent remains the same, return it.
    if (targetAgent === currentAgent) {
      return { goal: targetGoal, primaryAgent: currentAgent };
    }

    // Otherwise, check transition rules:
    // Allow stack push if switching to a new helper context (e.g. planner -> coding helper, then back).
    const newStack = [...this.state.agentStack];
    if (!newStack.includes(targetAgent)) {
      newStack.push(targetAgent);
    }

    this.state.agentStack = newStack;
    this.save();

    return {
      goal: targetGoal,
      primaryAgent: targetAgent
    };
  }

  determineGoal(intent: IntentType, prompt: string): DialogueGoal {
    // Legacy compatibility fallback
    return this.determineGoalAndAgent(intent, prompt, 1.0, []).goal;
  }
}
