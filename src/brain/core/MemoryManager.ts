import { UserMemory } from '../memory/UserMemory';
import { ConversationMemory } from '../memory/ConversationMemory';
import { GoalMemory } from '../memory/GoalMemory';
import { IdeaMemory } from '../memory/IdeaMemory';

export class MemoryManager {
  private static instances: Record<string, MemoryManager> = {};

  userMemory: UserMemory;
  conversationMemory: ConversationMemory;
  goalMemory: GoalMemory;
  ideaMemory: IdeaMemory;

  private constructor(userId: string) {
    this.userMemory = new UserMemory(userId);
    this.conversationMemory = new ConversationMemory(userId);
    this.goalMemory = new GoalMemory(userId);
    this.ideaMemory = new IdeaMemory(userId);
  }

  static getInstance(userId: string): MemoryManager {
    if (!MemoryManager.instances[userId]) {
      MemoryManager.instances[userId] = new MemoryManager(userId);
    }
    return MemoryManager.instances[userId];
  }
}
