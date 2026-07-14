export interface GoalHistoryRecord {
  id: string;
  goalId: string;
  eventType: 'created' | 'log_added' | 'log_removed' | 'milestone_completed' | 'milestone_uncompleted';
  timestamp: string;
  description: string;
}

export class GoalMemory {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Goal event logging handles
  logEvent(goalId: string, eventType: GoalHistoryRecord['eventType'], description: string): GoalHistoryRecord {
    const record: GoalHistoryRecord = {
      id: `evt-${Date.now()}-${Math.random()}`,
      goalId,
      eventType,
      timestamp: new Date().toISOString(),
      description
    };
    
    // Save to user storage
    const raw = localStorage.getItem(`nexus_goal_memory_${this.userId}_${goalId}`);
    const list: GoalHistoryRecord[] = raw ? JSON.parse(raw) : [];
    list.push(record);
    localStorage.setItem(`nexus_goal_memory_${this.userId}_${goalId}`, JSON.stringify(list));

    return record;
  }

  getGoalEvents(goalId: string): GoalHistoryRecord[] {
    const raw = localStorage.getItem(`nexus_goal_memory_${this.userId}_${goalId}`);
    return raw ? JSON.parse(raw) : [];
  }
}
