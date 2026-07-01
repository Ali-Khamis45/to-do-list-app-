import { 
  User, 
  RelationalTask, 
  RelationalDailyTaskProgress,
  RelationalHabit, 
  RelationalDailyProgress, 
  RelationalAchievement, 
  RelationalFocusSession,
  RelationalNote
} from './UserModel';

export interface IUserRepository {
  // Users Table
  getUserByEmail(email: string): User | null;
  getUserById(id: string): User | null;
  saveUser(user: User): void;
  updateUserLastLogin(id: string, timestamp: string): void;
  isEmailExists(email: string): boolean;

  // Tasks Table
  getTasksByUserId(userId: string): RelationalTask[];
  saveTask(userId: string, task: RelationalTask): void;
  deleteTask(userId: string, taskId: string): void;
  
  // Daily Task Progress Table (Task Logs)
  getDailyTaskProgressByUserId(userId: string): RelationalDailyTaskProgress[];
  saveDailyTaskProgress(userId: string, progress: RelationalDailyTaskProgress): void;
  clearDailyTaskProgress(userId: string, taskId: string): void;

  // Habits Table
  getHabitsByUserId(userId: string): RelationalHabit[];
  saveHabit(userId: string, habit: RelationalHabit): void;
  deleteHabit(userId: string, habitId: string): void;

  // Daily Progress Table (Habit Logs)
  getDailyProgressByUserId(userId: string): RelationalDailyProgress[];
  saveDailyProgress(userId: string, progress: RelationalDailyProgress): void;
  clearDailyProgress(userId: string, habitId: string): void;

  // Focus Sessions Table
  getFocusSessionsByUserId(userId: string): RelationalFocusSession[];
  saveFocusSession(userId: string, session: RelationalFocusSession): void;
  clearFocusSessions(userId: string): void;

  // Achievements Table
  getAchievementsByUserId(userId: string): RelationalAchievement[];
  saveAchievement(userId: string, achievement: RelationalAchievement): void;

  // Notes Table
  getNotesByUserId(userId: string): RelationalNote[];
  saveNote(userId: string, note: RelationalNote): void;
  deleteNote(userId: string, noteId: string): void;

  // Core Utilities
  seedDefaultUserData(userId: string): void;
  resetAllUserData(userId: string): void;
}

export class UserRepository implements IUserRepository {
  private getTable<T>(tableName: string): T[] {
    const rawData = localStorage.getItem(`db_${tableName}`);
    return rawData ? JSON.parse(rawData) : [];
  }

  private saveTable<T>(tableName: string, data: T[]): void {
    localStorage.setItem(`db_${tableName}`, JSON.stringify(data));
  }

  // --- Users Table ---
  public getUserByEmail(email: string): User | null {
    const users = this.getTable<User>('users');
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return found || null;
  }

  public getUserById(id: string): User | null {
    const users = this.getTable<User>('users');
    const found = users.find(u => u.id === id);
    return found || null;
  }

  public saveUser(user: User): void {
    const users = this.getTable<User>('users');
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.saveTable('users', users);
  }

  public updateUserLastLogin(id: string, timestamp: string): void {
    const user = this.getUserById(id);
    if (user) {
      user.lastLogin = timestamp;
      this.saveUser(user);
    }
  }

  public isEmailExists(email: string): boolean {
    return this.getUserByEmail(email) !== null;
  }

  // --- Tasks Table ---
  public getTasksByUserId(userId: string): RelationalTask[] {
    const tasks = this.getTable<RelationalTask>('tasks');
    return tasks.filter(t => t.userId === userId);
  }

  public saveTask(userId: string, task: RelationalTask): void {
    const tasks = this.getTable<RelationalTask>('tasks');
    const index = tasks.findIndex(t => t.id === task.id);
    
    // Ensure data isolation
    const cleanTask = { ...task, userId };
    
    if (index >= 0) {
      if (tasks[index].userId !== userId) throw new Error("Unauthorized data access");
      tasks[index] = cleanTask;
    } else {
      tasks.push(cleanTask);
    }
    this.saveTable('tasks', tasks);
  }

  public deleteTask(userId: string, taskId: string): void {
    let tasks = this.getTable<RelationalTask>('tasks');
    const target = tasks.find(t => t.id === taskId);
    if (target && target.userId !== userId) throw new Error("Unauthorized data deletion");
    
    tasks = tasks.filter(t => t.id !== taskId);
    this.saveTable('tasks', tasks);
    
    // Clean up daily task progress logs
    this.clearDailyTaskProgress(userId, taskId);
  }

  // --- Daily Task Progress Table ---
  public getDailyTaskProgressByUserId(userId: string): RelationalDailyTaskProgress[] {
    const progressList = this.getTable<RelationalDailyTaskProgress>('daily_task_progress');
    return progressList.filter(p => p.userId === userId);
  }

  public saveDailyTaskProgress(userId: string, progress: RelationalDailyTaskProgress): void {
    const progressList = this.getTable<RelationalDailyTaskProgress>('daily_task_progress');
    // Unique match by taskId, date, and userId
    const index = progressList.findIndex(
      p => p.taskId === progress.taskId && p.date === progress.date && p.userId === userId
    );

    const cleanProgress = { ...progress, userId };

    if (index >= 0) {
      progressList[index] = cleanProgress;
    } else {
      progressList.push(cleanProgress);
    }
    this.saveTable('daily_task_progress', progressList);
  }

  public clearDailyTaskProgress(userId: string, taskId: string): void {
    let progressList = this.getTable<RelationalDailyTaskProgress>('daily_task_progress');
    progressList = progressList.filter(p => !(p.userId === userId && p.taskId === taskId));
    this.saveTable('daily_task_progress', progressList);
  }

  // --- Habits Table ---
  public getHabitsByUserId(userId: string): RelationalHabit[] {
    const habits = this.getTable<RelationalHabit>('habits');
    return habits.filter(h => h.userId === userId);
  }

  public saveHabit(userId: string, habit: RelationalHabit): void {
    const habits = this.getTable<RelationalHabit>('habits');
    const index = habits.findIndex(h => h.id === habit.id);
    
    const cleanHabit = { ...habit, userId };
    
    if (index >= 0) {
      if (habits[index].userId !== userId) throw new Error("Unauthorized data access");
      habits[index] = cleanHabit;
    } else {
      habits.push(cleanHabit);
    }
    this.saveTable('habits', habits);
  }

  public deleteHabit(userId: string, habitId: string): void {
    let habits = this.getTable<RelationalHabit>('habits');
    const target = habits.find(h => h.id === habitId);
    if (target && target.userId !== userId) throw new Error("Unauthorized data deletion");
    
    habits = habits.filter(h => h.id !== habitId);
    this.saveTable('habits', habits);

    // Relational CASCADE: Clean up progress logs
    this.clearDailyProgress(userId, habitId);
  }

  // --- Daily Progress Table ---
  public getDailyProgressByUserId(userId: string): RelationalDailyProgress[] {
    const progressList = this.getTable<RelationalDailyProgress>('daily_progress');
    return progressList.filter(p => p.userId === userId);
  }

  public saveDailyProgress(userId: string, progress: RelationalDailyProgress): void {
    const progressList = this.getTable<RelationalDailyProgress>('daily_progress');
    // Unique match by habitId, date, and userId
    const index = progressList.findIndex(
      p => p.habitId === progress.habitId && p.date === progress.date && p.userId === userId
    );

    const cleanProgress = { ...progress, userId };

    if (index >= 0) {
      progressList[index] = cleanProgress;
    } else {
      progressList.push(cleanProgress);
    }
    this.saveTable('daily_progress', progressList);
  }

  public clearDailyProgress(userId: string, habitId: string): void {
    let progressList = this.getTable<RelationalDailyProgress>('daily_progress');
    progressList = progressList.filter(p => !(p.userId === userId && p.habitId === habitId));
    this.saveTable('daily_progress', progressList);
  }

  // --- Focus Sessions Table ---
  public getFocusSessionsByUserId(userId: string): RelationalFocusSession[] {
    const sessions = this.getTable<RelationalFocusSession>('focus_sessions');
    return sessions.filter(s => s.userId === userId);
  }

  public saveFocusSession(userId: string, session: RelationalFocusSession): void {
    const sessions = this.getTable<RelationalFocusSession>('focus_sessions');
    const index = sessions.findIndex(s => s.id === session.id);
    
    const cleanSession = { ...session, userId };
    
    if (index >= 0) {
      if (sessions[index].userId !== userId) throw new Error("Unauthorized data access");
      sessions[index] = cleanSession;
    } else {
      sessions.push(cleanSession);
    }
    this.saveTable('focus_sessions', sessions);
  }

  public clearFocusSessions(userId: string): void {
    let sessions = this.getTable<RelationalFocusSession>('focus_sessions');
    sessions = sessions.filter(s => s.userId !== userId);
    this.saveTable('focus_sessions', sessions);
  }

  // --- Achievements Table ---
  public getAchievementsByUserId(userId: string): RelationalAchievement[] {
    const achievements = this.getTable<RelationalAchievement>('achievements');
    return achievements.filter(a => a.userId === userId);
  }

  public saveAchievement(userId: string, achievement: RelationalAchievement): void {
    const achievements = this.getTable<RelationalAchievement>('achievements');
    const index = achievements.findIndex(a => a.id === achievement.id);
    
    const cleanAchievement = { ...achievement, userId };
    
    if (index >= 0) {
      if (achievements[index].userId !== userId) throw new Error("Unauthorized data access");
      achievements[index] = cleanAchievement;
    } else {
      achievements.push(cleanAchievement);
    }
    this.saveTable('achievements', achievements);
  }

  // --- Notes Table ---
  public getNotesByUserId(userId: string): RelationalNote[] {
    const notes = this.getTable<RelationalNote>('notes');
    return notes.filter(n => n.userId === userId);
  }

  public saveNote(userId: string, note: RelationalNote): void {
    const notes = this.getTable<RelationalNote>('notes');
    const index = notes.findIndex(n => n.id === note.id);
    
    const cleanNote = { ...note, userId };
    
    if (index >= 0) {
      if (notes[index].userId !== userId) throw new Error("Unauthorized data access");
      notes[index] = cleanNote;
    } else {
      notes.push(cleanNote);
    }
    this.saveTable('notes', notes);
  }

  public deleteNote(userId: string, noteId: string): void {
    let notes = this.getTable<RelationalNote>('notes');
    const target = notes.find(n => n.id === noteId);
    if (target && target.userId !== userId) throw new Error("Unauthorized data deletion");
    
    notes = notes.filter(n => n.id !== noteId);
    this.saveTable('notes', notes);
  }

  // --- Seeding Default Data (Isolated by UserId) ---
  public seedDefaultUserData(userId: string): void {
    const getRelativeDateString = (daysAgo: number): string => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    // 1. Seed Habits
    const defaultHabits: RelationalHabit[] = [
      {
        id: `h1-${userId}`,
        userId,
        name: 'Deep Study',
        icon: 'Brain',
        color: 'text-stone-900',
        colorHex: '#1c1917',
        createdAt: getRelativeDateString(30),
        streakGoal: 45
      },
      {
        id: `h2-${userId}`,
        userId,
        name: 'Gym & Fitness',
        icon: 'Dumbbell',
        color: 'text-stone-700',
        colorHex: '#44403c',
        createdAt: getRelativeDateString(20),
        streakGoal: 18
      },
      {
        id: `h3-${userId}`,
        userId,
        name: 'Book Reading',
        icon: 'BookOpen',
        color: 'text-stone-600',
        colorHex: '#57534e',
        createdAt: getRelativeDateString(25),
        streakGoal: 21
      }
    ];

    defaultHabits.forEach(h => this.saveHabit(userId, h));

    // 2. Seed Habit logs (Daily Progress)
    const seedLogsH1 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 18, 20];
    seedLogsH1.forEach(day => {
      this.saveDailyProgress(userId, {
        id: `p-h1-${day}-${userId}`,
        userId,
        habitId: `h1-${userId}`,
        date: getRelativeDateString(day),
        status: (day === 13 || day === 15) ? 'missed' : 'completed'
      });
    });

    const seedLogsH2 = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 13, 14, 15, 16, 18, 21, 22];
    seedLogsH2.forEach(day => {
      let status: 'completed' | 'missed' | 'half' = 'completed';
      if (day === 4 || day === 5 || day === 6 || day === 14 || day === 22) status = 'missed';
      else if (day === 9 || day === 13) status = 'half';

      this.saveDailyProgress(userId, {
        id: `p-h2-${day}-${userId}`,
        userId,
        habitId: `h2-${userId}`,
        date: getRelativeDateString(day),
        status
      });
    });

    // 3. Seed Tasks
    const defaultTasks: RelationalTask[] = [
      {
        id: `t1-${userId}`,
        userId,
        title: 'Advanced Study Session',
        time: '08:00',
        subtext: 'Data structures and advanced algorithms review',
        completed: true,
        date: getRelativeDateString(0),
        createdAt: getRelativeDateString(0)
      },
      {
        id: `t2-${userId}`,
        userId,
        title: 'Strategic Planning Meeting',
        time: '10:30',
        subtext: 'Team alignment and roadmap sync',
        completed: false,
        date: getRelativeDateString(0),
        createdAt: getRelativeDateString(0)
      },
      {
        id: `t3-${userId}`,
        userId,
        title: 'Evening Gym Workout',
        time: '18:00',
        subtext: 'Leg day and core session',
        completed: false,
        date: getRelativeDateString(0),
        createdAt: getRelativeDateString(0)
      }
    ];

    defaultTasks.forEach(t => this.saveTask(userId, t));

    // 4. Seed Focus Sessions (Heatmap representation)
    for (let i = 0; i < 30; i++) {
      const dateStr = getRelativeDateString(i);
      const rand = Math.random();
      if (rand > 0.4) {
        const numSessions = Math.floor(rand * 2) + 1;
        for (let s = 0; s < numSessions; s++) {
          this.saveFocusSession(userId, {
            id: `f-${i}-${s}-${userId}`,
            userId,
            date: dateStr,
            intensity: parseFloat((Math.random() * 0.4 + 0.2).toFixed(2)),
            durationMinutes: 30
          });
        }
      }
    }

    // 5. Seed Achievements
    const defaultAchievements: RelationalAchievement[] = [
      {
        id: `ach1-${userId}`,
        userId,
        achievementType: 'initial_login',
        title: 'The Journey Begins',
        desc: 'Logged in to To Do List for the very first time.',
        unlockedAt: new Date().toISOString()
      }
    ];
    defaultAchievements.forEach(a => this.saveAchievement(userId, a));
  }

  public resetAllUserData(userId: string): void {
    // Keep user credentials but delete all child data
    let tasks = this.getTable<RelationalTask>('tasks').filter(t => t.userId !== userId);
    this.saveTable('tasks', tasks);

    let habits = this.getTable<RelationalHabit>('habits').filter(h => h.userId !== userId);
    this.saveTable('habits', habits);

    let progress = this.getTable<RelationalDailyProgress>('daily_progress').filter(p => p.userId !== userId);
    this.saveTable('daily_progress', progress);

    let sessions = this.getTable<RelationalFocusSession>('focus_sessions').filter(s => s.userId !== userId);
    this.saveTable('focus_sessions', sessions);

    let achievements = this.getTable<RelationalAchievement>('achievements').filter(a => a.userId !== userId);
    this.saveTable('achievements', achievements);

    let notes = this.getTable<RelationalNote>('notes').filter(n => n.userId !== userId);
    this.saveTable('notes', notes);
    
    // Re-seed default pristine empty structure or clean default state for user
    this.seedDefaultUserData(userId);
  }
}
