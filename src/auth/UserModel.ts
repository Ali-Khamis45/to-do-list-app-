export interface NotificationSettings {
  enableReminders: boolean;
  alertSound: boolean;
  weeklyDigest: boolean;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  themePreference: 'light' | 'dark' | 'stone';
  notificationSettings: NotificationSettings;
  createdAt: string; // ISO String
  lastLogin: string; // ISO String
}

export interface RelationalTask {
  id: string;
  userId: string;
  title: string;
  time: string; // HH:MM
  subtext: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface RelationalHabit {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  colorHex: string;
  streakGoal: number;
  createdAt: string;
}

export interface RelationalDailyProgress {
  id: string;
  userId: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  status: 'completed' | 'missed' | 'half' | null;
}

export interface RelationalAchievement {
  id: string;
  userId: string;
  achievementType: string;
  title: string;
  desc: string;
  unlockedAt: string; // ISO String
}

export interface RelationalFocusSession {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  intensity: number;
  durationMinutes: number;
}

export interface RelationalNote {
  id: string;
  userId: string;
  taskId: string;
  text: string;
  createdAt: string;
}

export interface RelationalStatistic {
  id: string;
  userId: string;
  key: string;
  value: string;
}
