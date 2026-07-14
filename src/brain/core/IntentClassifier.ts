import { Logger } from './Logger';

export type IntentType = 
  | 'chat' | 'question' | 'planning' | 'task_creation' | 'task_edit'
  | 'goal_creation' | 'goal_update' | 'calendar' | 'idea_capture'
  | 'brainstorming' | 'learning' | 'coding' | 'research' | 'decision_making'
  | 'journal' | 'emotional_support' | 'productivity_coaching'
  | 'project_creation' | 'note_taking' | 'search' | 'general_conversation'
  | 'unknown';

export interface IntentResult {
  primary: IntentType;
  secondary?: IntentType;
  confidence: number;
  keywords: string[];
}

export class IntentClassifier {
  private logger: Logger;

  constructor() {
    this.logger = Logger.getInstance();
  }

  classify(msg: string): IntentResult {
    const span = this.logger.startSpan('IntentClassifier: classify', { msg });
    const lower = msg.toLowerCase();
    const keywords: string[] = [];

    let primary: IntentType = 'chat';
    let confidence = 0.6;

    // Detect emotional support triggers
    if (/\b(stressed|overwhelmed|anxious|tired|sad|exhausted|burnout|struggling|bad|down|blue|too many tasks)\b/i.test(lower)) {
      primary = 'emotional_support';
      confidence = 0.95;
      keywords.push('stressed', 'overwhelmed', 'feel');
    }
    // Detect task creation triggers
    else if (/(?:^|\n)\s*(?:\d+[.):–\-]|\*|-|•)\s+\S/m.test(msg) || /^\s*(?:add|create|schedule|put|todo|tasks|remind me to)\b/i.test(lower) || /(?:(?:add|create|schedule|put|todo|tasks|remind me to)\s*:\s*)/i.test(lower)) {
      primary = 'task_creation';
      confidence = 0.9;
      keywords.push('tasks', 'create', 'add');
    }
    // Detect brainstorm triggers
    else if (lower.includes('brainstorm') || lower.includes('ideas') || lower.includes('innovate') || lower.includes('pitch')) {
      primary = 'brainstorming';
      confidence = 0.85;
      keywords.push('brainstorm', 'ideas');
    }
    // Detect coding triggers
    else if (/\b(code|react|typescript|javascript|html|css|api|database|repository|github)\b/i.test(lower)) {
      primary = 'coding';
      confidence = 0.85;
      keywords.push('code', 'react');
    }
    // Detect goal creation/tracking triggers
    else if (lower.includes('goal') || lower.includes('milestone') || lower.includes('target')) {
      primary = 'goal_creation';
      confidence = 0.8;
      keywords.push('goals', 'milestones');
    }
    // Detect learning triggers
    else if (lower.includes('learn') || lower.includes('study') || lower.includes('course') || lower.includes('book')) {
      primary = 'learning';
      confidence = 0.8;
      keywords.push('learn', 'study');
    }

    this.logger.endSpan(span.id, { primary, confidence });
    return { primary, confidence, keywords };
  }
}
