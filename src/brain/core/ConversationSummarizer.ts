import { DialogTurn } from '../memory/ConversationMemory';

export class ConversationSummarizer {
  summarize(turns: DialogTurn[]): string {
    if (turns.length === 0) return '';
    
    // Create simple narrative summary
    const userTopics = turns
      .filter(t => t.role === 'user')
      .map(t => t.text.substring(0, 30))
      .join(', ');

    return `Summary of previous turns: User discussed [${userTopics}].`;
  }
}
