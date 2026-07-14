import { ConversationMemory, DialogTurn } from '../memory/ConversationMemory';

export class ConversationManager {
  private memory: ConversationMemory;
  private maxContextTurns = 12;

  constructor(userId: string) {
    this.memory = new ConversationMemory(userId);
  }

  getHistory(convId: string): DialogTurn[] {
    return this.memory.getRecentContext(convId, this.maxContextTurns);
  }

  saveMessage(convId: string, role: 'user' | 'model', text: string): void {
    const titleFallback = text.length > 25 ? text.substring(0, 25) + '...' : text;
    this.memory.saveTurn(convId, {
      role,
      text,
      timestamp: new Date().toISOString()
    }, titleFallback);
  }

  optimizeContext(convId: string): void {
    const conv = this.memory.getConversation(convId);
    if (!conv) return;

    if (conv.turns.length > this.maxContextTurns) {
      // Retain only last few, summarize first ones
      const oldTurns = conv.turns.slice(0, conv.turns.length - this.maxContextTurns);
      const summaryText = `Previously, user asked about: ${oldTurns.filter(t => t.role === 'user').map(t => t.text.substring(0, 15)).join(', ')}`;
      conv.summary = summaryText;
      // In a real system, we'd trim conv.turns, but let's keep them and let the memory manager retrieve slices.
    }
  }

  getConversationsList() {
    return this.memory.getHistoryList();
  }
}
