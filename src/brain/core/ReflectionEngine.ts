export class ReflectionEngine {
  reflectAndImprove(draft: string, isStressed: boolean): string {
    let text = draft.trim();

    // 1. If user is stressed, strip out any accidental pushy/productivity terms
    if (isStressed) {
      text = text.replace(/\b(must do|need to add|should plan|deadline is|work on your goals|execute tasks)\b/gi, 'focus on yourself');
      text = text.replace(/\b(productivity|efficiency|metrics)\b/gi, 'wellbeing');
    }

    // 2. Resolve generic repetitive chatbot warnings
    text = text.replace(/I am here to help\b/gi, "I'm right here with you");
    text = text.replace(/I can help you\b/gi, "we can talk through it");
    
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

    return text;
  }
}
