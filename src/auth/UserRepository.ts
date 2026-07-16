import { 
  User, 
  RelationalTask, 
  RelationalDailyTaskProgress,
  RelationalHabit, 
  RelationalDailyProgress, 
  RelationalAchievement, 
  RelationalFocusSession,
  RelationalNote,
  RelationalGoal,
  RelationalIdea,
  RelationalIdeaLink
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

  // Goals Table
  getGoalsByUserId(userId: string): RelationalGoal[];
  saveGoal(userId: string, goal: RelationalGoal): void;
  deleteGoal(userId: string, goalId: string): void;

  // Ideas Table
  getIdeasByUserId(userId: string): RelationalIdea[];
  saveIdea(userId: string, idea: RelationalIdea): void;
  deleteIdea(userId: string, ideaId: string): void;

  // Idea Links Table
  getIdeaLinksByUserId(userId: string): RelationalIdeaLink[];
  saveIdeaLink(userId: string, link: RelationalIdeaLink): void;
  deleteIdeaLink(userId: string, linkId: string): void;

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

  // --- Goals Table ---
  public getGoalsByUserId(userId: string): RelationalGoal[] {
    const goals = this.getTable<RelationalGoal>('goals');
    return goals.filter(g => g.userId === userId);
  }

  public saveGoal(userId: string, goal: RelationalGoal): void {
    const goals = this.getTable<RelationalGoal>('goals');
    const index = goals.findIndex(g => g.id === goal.id);
    
    const cleanGoal = { ...goal, userId };
    
    if (index >= 0) {
      if (goals[index].userId !== userId) throw new Error("Unauthorized data access");
      goals[index] = cleanGoal;
    } else {
      goals.push(cleanGoal);
    }
    this.saveTable('goals', goals);
  }

  public deleteGoal(userId: string, goalId: string): void {
    let goals = this.getTable<RelationalGoal>('goals');
    const target = goals.find(g => g.id === goalId);
    if (target && target.userId !== userId) throw new Error("Unauthorized data deletion");
    
    goals = goals.filter(g => g.id !== goalId);
    this.saveTable('goals', goals);
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

    // Seed Goals
    const defaultGoals: RelationalGoal[] = [
      {
        id: `g1-${userId}`,
        userId,
        title: 'Read 50 Books this Year',
        description: 'Read a diverse set of novels, biographies, and technology books.',
        goalType: 'numeric',
        targetValue: 50,
        currentValue: 10,
        unit: 'books',
        startDate: getRelativeDateString(100), // Day 100 today
        targetDate: getRelativeDateString(-265), // 365 days total
        priority: 'high',
        category: 'Learning',
        frequency: 'daily',
        difficulty: 'medium',
        estimatedMinutesPerUnit: 240,
        status: 'active',
        tags: ['books', 'education', 'reading'],
        color: '#8b5cf6',
        icon: 'BookOpen',
        milestones: [
          { id: `g1-m1-${userId}`, title: 'Curate a list of 50 books', completed: true, completedDate: getRelativeDateString(98) },
          { id: `g1-m2-${userId}`, title: 'Read first 10 books', completed: true, completedDate: getRelativeDateString(12) },
          { id: `g1-m3-${userId}`, title: 'Read 25 books', completed: false },
          { id: `g1-m4-${userId}`, title: 'Read 50 books', completed: false }
        ],
        logs: [
          { date: getRelativeDateString(90), value: 1, note: 'Finished Bio of Steve Jobs' },
          { date: getRelativeDateString(80), value: 1, note: 'Finished Atomic Habits' },
          { date: getRelativeDateString(70), value: 2, note: 'Read Dune and Dune Messiah' },
          { date: getRelativeDateString(60), value: 1, note: 'Finished Clean Code' },
          { date: getRelativeDateString(45), value: 2, note: 'Read Zero to One and The Lean Startup' },
          { date: getRelativeDateString(30), value: 1, note: 'Finished High Output Management' },
          { date: getRelativeDateString(15), value: 1, note: 'Finished Designing Data-Intensive Applications' },
          { date: getRelativeDateString(5), value: 1, note: 'Finished Psychology of Money' }
        ],
        subGoals: [],
        dependencies: [],
        history: [
          { id: `g1-h1-${userId}`, goalId: `g1-${userId}`, eventType: 'created', timestamp: new Date().toISOString(), description: 'Goal created' },
          { id: `g1-h2-${userId}`, goalId: `g1-${userId}`, eventType: 'milestone_completed', timestamp: new Date().toISOString(), description: 'Completed milestone: Curate a list of 50 books' },
          { id: `g1-h3-${userId}`, goalId: `g1-${userId}`, eventType: 'milestone_completed', timestamp: new Date().toISOString(), description: 'Completed milestone: Read first 10 books' }
        ]
      },
      {
        id: `g2-${userId}`,
        userId,
        title: 'Build SaaS Startup MVP',
        description: 'Design and deploy a web-based productivity app to production.',
        goalType: 'milestone',
        targetValue: 6,
        currentValue: 3,
        unit: 'milestones',
        startDate: getRelativeDateString(30),
        targetDate: getRelativeDateString(-60), // 3 months total
        priority: 'critical',
        category: 'Business',
        frequency: 'weekly',
        difficulty: 'hard',
        estimatedMinutesPerUnit: 120,
        status: 'active',
        tags: ['startup', 'saas', 'coding'],
        color: '#ec4899',
        icon: 'Compass',
        milestones: [
          { id: `g2-m1-${userId}`, title: 'Conduct market research and user interviews', completed: true, completedDate: getRelativeDateString(25) },
          { id: `g2-m2-${userId}`, title: 'Create interactive Figma wireframes', completed: true, completedDate: getRelativeDateString(15) },
          { id: `g2-m3-${userId}`, title: 'Build React frontend & Node backend MVP', completed: true, completedDate: getRelativeDateString(2) },
          { id: `g2-m4-${userId}`, title: 'Launch beta testing to 50 users', completed: false },
          { id: `g2-m5-${userId}`, title: 'Integrate Stripe billing plans', completed: false },
          { id: `g2-m6-${userId}`, title: 'Get first 10 paying customers', completed: false }
        ],
        logs: [
          { date: getRelativeDateString(25), value: 1, note: 'Milestone: Research done' },
          { date: getRelativeDateString(15), value: 1, note: 'Milestone: Designs finalized' },
          { date: getRelativeDateString(2), value: 1, note: 'Milestone: MVP code deploy' }
        ],
        subGoals: [],
        dependencies: [`g3-${userId}`], // Depends on "Learn React Deeply"
        history: [
          { id: `g2-h1-${userId}`, goalId: `g2-${userId}`, eventType: 'created', timestamp: new Date().toISOString(), description: 'Goal created' },
          { id: `g2-h2-${userId}`, goalId: `g2-${userId}`, eventType: 'milestone_completed', timestamp: new Date().toISOString(), description: 'Completed milestone: Conduct market research' }
        ]
      },
      {
        id: `g3-${userId}`,
        userId,
        title: 'Learn React Deeply',
        description: 'Understand hooks, concurrent features, and state management.',
        goalType: 'habit',
        targetValue: 40,
        currentValue: 25,
        unit: 'lessons',
        startDate: getRelativeDateString(50),
        targetDate: getRelativeDateString(-10), // 60 days total
        priority: 'medium',
        category: 'Learning',
        frequency: 'daily',
        difficulty: 'medium',
        estimatedMinutesPerUnit: 30,
        status: 'active',
        tags: ['react', 'programming', 'web'],
        color: '#3b82f6',
        icon: 'Code',
        milestones: [
          { id: `g3-m1-${userId}`, title: 'Learn Hooks and State', completed: true, completedDate: getRelativeDateString(40) },
          { id: `g3-m2-${userId}`, title: 'Learn React Router & Redux', completed: true, completedDate: getRelativeDateString(20) },
          { id: `g3-m3-${userId}`, title: 'Build a complex practice dashboard', completed: false }
        ],
        logs: Array.from({ length: 25 }).map((_, idx) => ({
          date: getRelativeDateString(Math.min(48, idx * 2 + 1)),
          value: 1,
          note: `Completed lesson ${idx + 1}`
        })),
        subGoals: [],
        dependencies: [],
        history: [
          { id: `g3-h1-${userId}`, goalId: `g3-${userId}`, eventType: 'created', timestamp: new Date().toISOString(), description: 'Goal created' }
        ]
      }
    ];

    defaultGoals.forEach(g => this.saveGoal(userId, g));

    // Seed default Ideas
    const defaultIdeas: RelationalIdea[] = [
      {
        id: `i1-${userId}`,
        userId,
        title: 'AI-Powered Fitness & Workout App',
        content: 'A smart workout companion that adapts to weekly consistency logs, logs metrics, and schedules focus/exercise tasks dynamically.',
        tags: ['health', 'fitness', 'workout', 'ai'],
        createdAt: getRelativeDateString(15),
        updatedAt: getRelativeDateString(15),
        priority: 'high',
        category: 'Health',
        mood: 'energized',
        favorite: true,
        archived: false,
        complexity: 6,
        effort: 40,
        relatedTech: ['React', 'TypeScript', 'Gemini AI API'],
        isProject: true,
        projectProgress: 35
      },
      {
        id: `i2-${userId}`,
        userId,
        title: 'Diet & Meal Recommendation System',
        content: 'A custom health organizer to recommend calorie intake and suggest dynamic recipes depending on fitness level.',
        tags: ['health', 'diet', 'meal', 'nutrition'],
        createdAt: getRelativeDateString(10),
        updatedAt: getRelativeDateString(10),
        priority: 'medium',
        category: 'Health',
        mood: 'calm',
        favorite: false,
        archived: false,
        complexity: 5,
        effort: 30,
        relatedTech: ['React', 'Node.js', 'Express'],
        isProject: false
      },
      {
        id: `i3-${userId}`,
        userId,
        title: 'Food Delivery Drone Platform',
        content: 'Autonomous drone shipping for fast deliveries in local city hubs, matching restaurants directly to drop spots.',
        tags: ['food', 'delivery', 'startup', 'saas'],
        createdAt: getRelativeDateString(20),
        updatedAt: getRelativeDateString(18),
        priority: 'low',
        category: 'Business',
        mood: 'inspired',
        favorite: false,
        archived: false,
        complexity: 9,
        effort: 120,
        relatedTech: ['Python', 'Docker', 'PostgreSQL'],
        isProject: false
      },
      {
        id: `i4-${userId}`,
        userId,
        title: 'Restaurant Review & Booking Portal',
        content: 'A curation space listing cooking menus, dining slots, and food delivery integrations.',
        tags: ['food', 'restaurant', 'booking'],
        createdAt: getRelativeDateString(5),
        updatedAt: getRelativeDateString(5),
        priority: 'medium',
        category: 'Business',
        mood: 'focused',
        favorite: false,
        archived: false,
        complexity: 4,
        effort: 20,
        relatedTech: ['Next.js', 'TailwindCSS'],
        isProject: false
      },
      {
        id: `i5-${userId}`,
        userId,
        title: 'Duolingo for Software Engineering',
        content: 'Bite-sized visual programming tutorials on React, state structures, and CSS systems.',
        tags: ['learning', 'coding', 'study'],
        createdAt: getRelativeDateString(2),
        updatedAt: getRelativeDateString(2),
        priority: 'high',
        category: 'Learning',
        mood: 'curious',
        favorite: true,
        archived: false,
        complexity: 5,
        effort: 25,
        relatedTech: ['TypeScript', 'Vite', 'React'],
        isProject: false
      }
    ];

    defaultIdeas.forEach(i => this.saveIdea(userId, i));

    // Seed default Idea Links
    const defaultLinks: RelationalIdeaLink[] = [
      {
        id: `l1-${userId}`,
        userId,
        sourceIdeaId: `i2-${userId}`,
        targetIdeaId: `i1-${userId}`,
        type: 'similar_to'
      },
      {
        id: `l2-${userId}`,
        userId,
        sourceIdeaId: `i4-${userId}`,
        targetIdeaId: `i3-${userId}`,
        type: 'depends_on'
      }
    ];

    defaultLinks.forEach(l => this.saveIdeaLink(userId, l));

    // Seed default project tasks (associated with the project idea "AI-Powered Fitness & Workout App")
    const projectTasks: RelationalTask[] = [
      {
        id: `pt-i1-1-${userId}`,
        userId,
        title: 'AI-Powered Fitness & Workout App - System Setup & Wireframes',
        time: '10:00',
        subtext: 'Configure repository, directory structures, and UI layout wireframes. (Estimated: 4h)',
        completed: true,
        date: getRelativeDateString(2),
        category: 'Health',
        priority: 'high',
        notes: 'Project Task Generated from Idea: "AI-Powered Fitness & Workout App"',
        createdAt: getRelativeDateString(2),
        projectId: `i1-${userId}`,
        ideaId: `i1-${userId}`
      },
      {
        id: `pt-i1-2-${userId}`,
        userId,
        title: 'AI-Powered Fitness & Workout App - DB modeling',
        time: '11:00',
        subtext: 'Map repository types, local storage keys, and isolate user profiles. (Estimated: 3h)',
        completed: false,
        date: getRelativeDateString(0),
        category: 'Health',
        priority: 'medium',
        notes: 'Project Task Generated from Idea: "AI-Powered Fitness & Workout App"',
        createdAt: getRelativeDateString(0),
        projectId: `i1-${userId}`,
        ideaId: `i1-${userId}`
      },
      {
        id: `pt-i1-3-${userId}`,
        userId,
        title: 'AI-Powered Fitness & Workout App - Core layout screen',
        time: '14:30',
        subtext: 'Build responsive glassmorphic cards, checklists, and navigation menus. (Estimated: 6h)',
        completed: false,
        date: getRelativeDateString(0),
        category: 'Health',
        priority: 'medium',
        notes: 'Project Task Generated from Idea: "AI-Powered Fitness & Workout App"',
        createdAt: getRelativeDateString(0),
        projectId: `i1-${userId}`,
        ideaId: `i1-${userId}`
      }
    ];
    
    projectTasks.forEach(t => this.saveTask(userId, t));
  }

  // --- Ideas Table ---
  public getIdeasByUserId(userId: string): RelationalIdea[] {
    return this.getTable<RelationalIdea>('ideas').filter(i => i.userId === userId);
  }

  public saveIdea(userId: string, idea: RelationalIdea): void {
    const ideas = this.getTable<RelationalIdea>('ideas');
    const index = ideas.findIndex(i => i.id === idea.id);
    if (index >= 0) {
      ideas[index] = idea;
    } else {
      ideas.push(idea);
    }
    this.saveTable('ideas', ideas);
  }

  public deleteIdea(userId: string, ideaId: string): void {
    const ideas = this.getTable<RelationalIdea>('ideas').filter(i => i.id !== ideaId || i.userId !== userId);
    this.saveTable('ideas', ideas);
    // Also delete any associated links
    const links = this.getTable<RelationalIdeaLink>('idea_links').filter(l => l.sourceIdeaId !== ideaId && l.targetIdeaId !== ideaId);
    this.saveTable('idea_links', links);
  }

  // --- Idea Links Table ---
  public getIdeaLinksByUserId(userId: string): RelationalIdeaLink[] {
    return this.getTable<RelationalIdeaLink>('idea_links').filter(l => l.userId === userId);
  }

  public saveIdeaLink(userId: string, link: RelationalIdeaLink): void {
    const links = this.getTable<RelationalIdeaLink>('idea_links');
    const index = links.findIndex(l => l.id === link.id);
    if (index >= 0) {
      links[index] = link;
    } else {
      links.push(link);
    }
    this.saveTable('idea_links', links);
  }

  public deleteIdeaLink(userId: string, linkId: string): void {
    const links = this.getTable<RelationalIdeaLink>('idea_links').filter(l => l.id !== linkId || l.userId !== userId);
    this.saveTable('idea_links', links);
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
    
    let goals = this.getTable<RelationalGoal>('goals').filter(g => g.userId !== userId);
    this.saveTable('goals', goals);

    let ideas = this.getTable<RelationalIdea>('ideas').filter(i => i.userId !== userId);
    this.saveTable('ideas', ideas);

    let links = this.getTable<RelationalIdeaLink>('idea_links').filter(l => l.userId !== userId);
    this.saveTable('idea_links', links);
  }
}
