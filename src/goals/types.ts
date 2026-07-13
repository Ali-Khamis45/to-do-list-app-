export type GoalType = 'numeric' | 'milestone' | 'habit';
export type GoalStatus = 'not_started' | 'active' | 'paused' | 'completed' | 'cancelled' | 'archived';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Frequency = 'daily' | 'weekly' | 'monthly';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
  completedDate?: string; // YYYY-MM-DD
}

export interface GoalProgressLog {
  date: string; // YYYY-MM-DD
  value: number;
  note?: string;
}

export interface GoalHistoryEvent {
  id: string;
  goalId: string;
  eventType: 
    | 'created' 
    | 'target_changed' 
    | 'deadline_changed' 
    | 'paused' 
    | 'resumed' 
    | 'completed' 
    | 'cancelled' 
    | 'log_added' 
    | 'log_removed' 
    | 'milestone_completed' 
    | 'milestone_uncompleted'
    | 'subgoal_added'
    | 'subgoal_removed';
  timestamp: string; // ISO string
  description: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  goalType: GoalType;
  targetValue: number;
  currentValue: number; // For milestone: percentage or count, numeric: units done, habit: completions
  unit: string; // e.g. 'books', 'apps', 'kg', 'dollars', 'lessons', 'hours', 'custom'
  startDate: string; // YYYY-MM-DD
  targetDate: string; // YYYY-MM-DD
  priority: Priority;
  category: string;
  frequency: Frequency;
  difficulty: Difficulty;
  estimatedMinutesPerUnit: number;
  status: GoalStatus;
  tags: string[];
  color: string; // Hex color or styling helper
  icon: string; // Lucide icon name
  milestones: GoalMilestone[];
  logs: GoalProgressLog[];
  subGoals: Goal[]; // Nested goals
  dependencies: string[]; // List of parent Goal IDs this goal depends on
  history: GoalHistoryEvent[];
}

export interface GoalMetrics {
  daysRemaining: number;
  weeksRemaining: number;
  monthsRemaining: number;
  daysTotal: number;
  daysElapsed: number;
  expectedProgress: number; // Expected cumulative progress value by today
  actualProgress: number;   // Current progress value
  percentageCompleted: number;
  currentPace: number;      // Actual units per day elapsed
  requiredPace: number;     // Units per day needed for remaining days
  projectedFinishDate: string | null;
  completionProbability: number; // 0 to 100
  healthScore: number;      // 0 to 100
  consistencyScore: number; // 0 to 100 (percentage of active days logged)
  riskScore: number;        // 0 to 100 (probability of failure)
  longestStreak: number;    // Streak of consecutive active days
  currentStreak: number;
  missedDays: number;       // Elapsed days with zero progress logged
  avgProgressDaily: number;
  avgProgressWeekly: number;
  avgProgressMonthly: number;
  bestWeek: { weekStartDate: string; value: number } | null;
  worstWeek: { weekStartDate: string; value: number } | null;
  progressVelocity: number; // Rolling average change trend (-1 to 1 or scale)
  statusText: 'Ahead' | 'On Track' | 'Slightly Behind' | 'Behind' | 'Critical';
}

export interface DashboardMetrics {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  overallProgress: number; // weighted average %
  averageHealthScore: number;
  averageConsistency: number;
  averageCompletionProbability: number;
  goalsAtRiskCount: number;
  bestPerformingGoal: Goal | null;
  longestActiveStreak: number;
  weeklyTrends: { date: string; value: number }[]; // overall progress per day last 7 days
}
