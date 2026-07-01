export type HabitStatus = 'completed' | 'missed' | 'half' | null;

export interface Habit {
  id: string;
  name: string;
  icon: string; // Lucide icon identifier (e.g., 'BookOpen', 'Dumbbell', 'Terminal', 'BookOpen')
  color: string; // Tailwind text color class, e.g. 'text-blue-500'
  colorHex: string; // HEX color for custom SVG/Canvas elements if needed
  logs: Record<string, HabitStatus>; // key: YYYY-MM-DD
  createdAt: string;
  streakGoal?: number;
}

export interface Task {
  id: string;
  title: string;
  time: string; // HH:MM
  subtext: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
}

export interface FocusSession {
  id: string;
  date: string; // YYYY-MM-DD
  intensity: number; // 0.1 to 1.0 (opacity representation)
  durationMinutes: number;
}

export interface UserProfile {
  name: string;
  avatar: string;
  tagline: string;
}

export interface Milestone {
  id: string;
  habitId: string;
  habitName: string;
  streakCount: number;
  allTimeRecord: number;
  icon: string;
  color: string;
}
