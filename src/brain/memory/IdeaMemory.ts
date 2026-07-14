export interface IdeaMemoryRecord {
  ideaId: string;
  isArchived: boolean;
  isFavorite: boolean;
  clusters: string[];
}

export class IdeaMemory {
  private userId: string;
  private memoryRecords: Record<string, IdeaMemoryRecord> = {};

  constructor(userId: string) {
    this.userId = userId;
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const raw = localStorage.getItem(`nexus_idea_memory_${this.userId}`);
    if (raw) {
      try {
        this.memoryRecords = JSON.parse(raw);
      } catch {
        this.memoryRecords = {};
      }
    }
  }

  private save(): void {
    localStorage.setItem(`nexus_idea_memory_${this.userId}`, JSON.stringify(this.memoryRecords));
  }

  getRecord(ideaId: string): IdeaMemoryRecord | null {
    return this.memoryRecords[ideaId] || null;
  }

  updateRecord(ideaId: string, updates: Partial<IdeaMemoryRecord>): void {
    if (!this.memoryRecords[ideaId]) {
      this.memoryRecords[ideaId] = {
        ideaId,
        isArchived: false,
        isFavorite: false,
        clusters: []
      };
    }

    this.memoryRecords[ideaId] = {
      ...this.memoryRecords[ideaId],
      ...updates
    };
    this.save();
  }

  associateCluster(ideaId: string, clusterId: string): void {
    const record = this.memoryRecords[ideaId] || {
      ideaId,
      isArchived: false,
      isFavorite: false,
      clusters: []
    };
    
    if (!record.clusters.includes(clusterId)) {
      record.clusters.push(clusterId);
      this.memoryRecords[ideaId] = record;
      this.save();
    }
  }

  getArchivedIdeasCount(): number {
    return Object.values(this.memoryRecords).filter(r => r.isArchived).length;
  }
}
