export interface UserPreferences {
  workHoursStart: string; // e.g. "09:00"
  workHoursEnd: string; // e.g. "17:00"
  skills: string[];
  favoriteTech: string[];
  frequentlyUsedCategories: string[];
  learningProgress: Record<string, number>; // topic name -> percentage (0 to 100)
}

export class UserMemory {
  private userId: string;
  private preferences: UserPreferences;

  constructor(userId: string) {
    this.userId = userId;
    this.preferences = this.loadFromStorage();
  }

  private loadFromStorage(): UserPreferences {
    const raw = localStorage.getItem(`nexus_user_memory_${this.userId}`);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // Fall back to defaults
      }
    }
    return {
      workHoursStart: '09:00',
      workHoursEnd: '17:00',
      skills: [],
      favoriteTech: [],
      frequentlyUsedCategories: ['Work', 'Health', 'Learning', 'Personal'],
      learningProgress: {}
    };
  }

  save(): void {
    localStorage.setItem(`nexus_user_memory_${this.userId}`, JSON.stringify(this.preferences));
  }

  getPreferences(): UserPreferences {
    return this.preferences;
  }

  updatePreferences(updates: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.save();
  }

  addSkill(skill: string): void {
    if (!this.preferences.skills.includes(skill)) {
      this.preferences.skills.push(skill);
      this.save();
    }
  }

  addFavoriteTech(tech: string): void {
    if (!this.preferences.favoriteTech.includes(tech)) {
      this.preferences.favoriteTech.push(tech);
      this.save();
    }
  }

  trackCategoryUsage(category: string): void {
    if (!this.preferences.frequentlyUsedCategories.includes(category)) {
      this.preferences.frequentlyUsedCategories.push(category);
      this.save();
    }
  }
}
