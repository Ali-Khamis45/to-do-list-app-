import { IntentType } from './IntentClassifier';

export type DialogueGoal = 
  | 'grounding_user' 
  | 'planning_roadmap' 
  | 'brainstorming_mvp' 
  | 'tracking_progress' 
  | 'exploring_tech';

export interface DialogueState {
  activeGoal: DialogueGoal;
  topic?: string;
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
        return JSON.parse(raw);
      } catch {
        // Fall back to defaults
      }
    }
    return {
      activeGoal: 'grounding_user',
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

  determineGoal(intent: IntentType, prompt: string): DialogueGoal {
    const lower = prompt.toLowerCase();
    
    // Stressed triggers grounding goal
    if (intent === 'emotional_support' || /\b(stressed|overwhelmed|anxious|tired|burnout)\b/i.test(lower)) {
      return 'grounding_user';
    }
    
    if (intent === 'planning' || lower.includes('plan') || lower.includes('schedule') || lower.includes('timeline')) {
      return 'planning_roadmap';
    }

    if (intent === 'brainstorming' || lower.includes('idea') || lower.includes('brainstorm') || lower.includes('mvp')) {
      return 'brainstorming_mvp';
    }

    if (intent === 'coding' || lower.includes('code') || lower.includes('react') || lower.includes('typescript')) {
      return 'exploring_tech';
    }

    if (intent === 'goal_creation' || intent === 'goal_update' || lower.includes('progress') || lower.includes('stats')) {
      return 'tracking_progress';
    }

    return this.state.activeGoal; // Retain current goal if no clear transition
  }
}
