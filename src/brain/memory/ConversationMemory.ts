export interface DialogTurn {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface ConversationHistory {
  id: string;
  title: string;
  summary: string;
  turns: DialogTurn[];
}

export class ConversationMemory {
  private userId: string;
  private conversations: Record<string, ConversationHistory> = {};

  constructor(userId: string) {
    this.userId = userId;
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const raw = localStorage.getItem(`nexus_conv_memory_${this.userId}`);
    if (raw) {
      try {
        this.conversations = JSON.parse(raw);
      } catch {
        this.conversations = {};
      }
    }
  }

  private save(): void {
    localStorage.setItem(`nexus_conv_memory_${this.userId}`, JSON.stringify(this.conversations));
  }

  getConversation(convId: string): ConversationHistory | null {
    return this.conversations[convId] || null;
  }

  saveTurn(convId: string, turn: DialogTurn, titleFallback?: string): void {
    if (!this.conversations[convId]) {
      this.conversations[convId] = {
        id: convId,
        title: titleFallback || 'New Plan Session',
        summary: '',
        turns: []
      };
    }

    const conv = this.conversations[convId];
    conv.turns.push(turn);
    
    // Automatic simple summary generation if turns count is large
    if (conv.turns.length > 10) {
      conv.summary = `Conversation with ${conv.turns.length} messages. Discussed topics: ${conv.turns.slice(-4).map(t => t.text.substring(0, 15)).join(', ')}`;
    }

    this.save();
  }

  getRecentContext(convId: string, limit: number = 6): DialogTurn[] {
    const conv = this.getConversation(convId);
    if (!conv) return [];
    return conv.turns.slice(-limit);
  }

  getHistoryList(): Array<{ id: string; title: string; summary: string }> {
    return Object.values(this.conversations).map(c => ({
      id: c.id,
      title: c.title,
      summary: c.summary
    }));
  }
}
