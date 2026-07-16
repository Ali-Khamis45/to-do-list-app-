import { DialogueState } from './DialogueStateManager';

export interface ReflectionCheckParams {
  state: DialogueState;
  userMessage: string;
  contextKeywords: string[];
}

export interface ReflectionResult {
  passed: boolean;
  failedChecks: string[];
  cleanedText: string;
}

const STOPWORDS = new Set(['this', 'that', 'with', 'from', 'have', 'about', 'your', 'what', 'when', 'were', 'they', 'them', 'been', 'will', 'would', 'could', 'should']);

function contentWords(text: string): string[] {
  return text.toLowerCase().match(/\b[a-z']+\b/g)?.filter(w => w.length > 3 && !STOPWORDS.has(w)) || [];
}

export class ReflectionEngine {
  reflectAndImprove(draft: string, isStressed: boolean, params: ReflectionCheckParams): ReflectionResult {
    let text = draft.trim();

    // 1. If user is stressed, strip out any accidental pushy/productivity terms
    if (isStressed) {
      text = text.replace(/\b(must do|need to add|should plan|deadline is|work on your goals|execute tasks)\b/gi, 'focus on yourself');
      text = text.replace(/\b(productivity|efficiency|metrics)\b/gi, 'wellbeing');
    }

    // 2. Resolve and strip generic repetitive corporate/coach templates
    text = text.replace(/I'm here as your productivity partner/gi, "I'm here to listen and help you structure your thoughts");
    text = text.replace(/I'm your productivity coach/gi, "I'm a friend who's glad to chat");
    text = text.replace(/I am here as your productivity partner/gi, "I'm glad to help you think through things");
    text = text.replace(/I am your productivity coach/gi, "I'm here to support you");
    text = text.replace(/I am here to help/gi, "I'm right here with you");
    text = text.replace(/I can help you/gi, "we can talk through it");

    // Ensure contractions are used for human warmth
    const contractions: Record<string, string> = {
      'I am ': "I'm ",
      'do not ': "don't ",
      'cannot ': "can't ",
      'you are ': "you're ",
      'what is ': "what's ",
      'we will ': "we'll ",
      'would not ': "wouldn't "
    };

    Object.entries(contractions).forEach(([full, contr]) => {
      text = text.replace(new RegExp(full, 'gi'), contr);
    });

    const cleanedText = text;
    const failedChecks: string[] = [];
    const { state, userMessage, contextKeywords } = params;
    const lowerCleaned = cleanedText.toLowerCase();

    // 1. continued_conversation
    if (state.turnsCount > 1 && /\b(hi there|hello!|as an ai|i'm your ai assistant)\b/i.test(cleanedText)) {
      failedChecks.push('restarted_conversation');
    }

    // 2. no_context_reference
    if (contextKeywords.length > 0) {
      const relevantKeywords = contextKeywords.filter(k => k.length > 3);
      const referenced = relevantKeywords.some(k => lowerCleaned.includes(k.toLowerCase()));
      if (relevantKeywords.length > 0 && !referenced) {
        failedChecks.push('no_context_reference');
      }
    }

    // 3. did_not_answer
    const userContentWords = contentWords(userMessage);
    const isGenericFallback = cleanedText === 'I am processing your thoughts.';
    const repliedWords = contentWords(cleanedText);
    const overlap = userContentWords.some(w => repliedWords.includes(w));
    if (isGenericFallback || (userContentWords.length > 0 && !overlap)) {
      failedChecks.push('did_not_answer');
    }

    // 4. question_overload
    const questionMarks = (cleanedText.match(/\?/g) || []).length;
    if (questionMarks > 1) {
      failedChecks.push('question_overload');
    }

    // 5. restarted_pending_question
    if (state.pendingQuestion) {
      const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
      const normalizedPending = normalize(state.pendingQuestion);
      if (normalizedPending.length > 0 && normalize(cleanedText).includes(normalizedPending)) {
        failedChecks.push('restarted_pending_question');
      }
    }

    return {
      passed: failedChecks.length === 0,
      failedChecks,
      cleanedText
    };
  }
}
