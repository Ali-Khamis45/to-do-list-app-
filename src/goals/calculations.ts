/**
 * @module calculations
 * @description Pure mathematical calculation engine for the Smart Goal Planner.
 *
 * All functions in this module are pure (no side effects, no API calls).
 * They take goal data and return computed metrics.
 *
 * Key algorithms:
 * - Pro-rata expected progress (linear interpolation from start to target date)
 * - Streak counting (consecutive days with any progress log)
 * - Consistency scoring (percentage of days logged since start)
 * - Dashboard metric aggregation across all goals
 *
 * Date helpers are fully defensive — all operations wrap in try/catch with
 * isNaN() guards to prevent RangeError crashes from malformed date strings
 * that may exist in localStorage after data corruption.
 *
 * @see forecast.ts for the rolling decay pace forecasting engine
 * @see aiCoach.ts for AI-powered coaching briefings built on top of these metrics
 */
import { Goal, GoalMetrics, GoalProgressLog, GoalMilestone, DashboardMetrics } from './types';

// Helper to get date string in YYYY-MM-DD format safely
export const getDateString = (date: Date): string => {
  try {
    if (!date || isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch (err) {
    return new Date().toISOString().split('T')[0];
  }
};

// Helper to get difference in days safely
export const getDaysDiff = (startStr: string, endStr: string): number => {
  try {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (err) {
    return 0;
  }
};

// Add days to a date string safely
export const addDays = (dateStr: string, days: number): string => {
  try {
    if (!dateStr || isNaN(days)) return getDateString(new Date());
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return getDateString(new Date());
    date.setDate(date.getDate() + days);
    return getDateString(date);
  } catch (err) {
    return getDateString(new Date());
  }
};

// Parse date safely
export const parseDateSafe = (dateStr: string): Date => {
  try {
    if (!dateStr) return new Date();
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return new Date();
    return date;
  } catch (err) {
    return new Date();
  }
};

/**
 * Calculates completion percentage of a single goal recursively considering subgoals.
 */
export const getGoalCompletionPercent = (goal: Goal): number => {
  if (goal.status === 'completed') return 100;
  
  // If there are subgoals, parent progress is the average completion percentage of all subgoals
  if (goal.subGoals && goal.subGoals.length > 0) {
    const subGoalsPercent = goal.subGoals.reduce((sum, sg) => sum + getGoalCompletionPercent(sg), 0);
    return parseFloat((subGoalsPercent / goal.subGoals.length).toFixed(2));
  }

  // Otherwise calculate progress based on goal type
  if (goal.goalType === 'milestone') {
    if (goal.milestones.length === 0) return 0;
    const completedCount = goal.milestones.filter(m => m.completed).length;
    return parseFloat(((completedCount / goal.milestones.length) * 100).toFixed(2));
  }

  // Numeric and Habit goals
  if (goal.targetValue <= 0) return 0;
  const progressVal = goal.logs.reduce((sum, log) => sum + log.value, 0);
  return parseFloat((Math.min(100, (progressVal / goal.targetValue) * 100)).toFixed(2));
};

/**
 * Calculates actual cumulative progress value of a goal.
 */
export const getGoalActualProgressValue = (goal: Goal): number => {
  if (goal.subGoals && goal.subGoals.length > 0) {
    // If it has subgoals, return the rolled-up equivalent units based on avg completion percent
    const avgPercent = getGoalCompletionPercent(goal);
    return parseFloat(((avgPercent / 100) * goal.targetValue).toFixed(2));
  }

  if (goal.goalType === 'milestone') {
    if (goal.milestones.length === 0) return 0;
    const completedCount = goal.milestones.filter(m => m.completed).length;
    return parseFloat(((completedCount / goal.milestones.length) * goal.targetValue).toFixed(2));
  }

  return parseFloat((goal.logs.reduce((sum, log) => sum + log.value, 0)).toFixed(2));
};

/**
 * Calculates metrics for a goal on a given date.
 */
export const calculateGoalMetrics = (goal: Goal, todayStr: string): GoalMetrics => {
  const daysTotal = Math.max(1, getDaysDiff(goal.startDate, goal.targetDate));
  
  // Clamped days elapsed
  let daysElapsed = getDaysDiff(goal.startDate, todayStr);
  if (daysElapsed < 0) daysElapsed = 0;
  if (daysElapsed > daysTotal) daysElapsed = daysTotal;

  // Days remaining
  const daysRemaining = Math.max(0, getDaysDiff(todayStr, goal.targetDate));
  const weeksRemaining = parseFloat((daysRemaining / 7).toFixed(2));
  const monthsRemaining = parseFloat((daysRemaining / 30.4).toFixed(2));

  // Progress values
  const actualProgress = getGoalActualProgressValue(goal);
  const percentageCompleted = getGoalCompletionPercent(goal);

  // Expected progress (linear pro-rata)
  let expectedProgress = 0;
  if (daysTotal > 0) {
    expectedProgress = parseFloat(((daysElapsed / daysTotal) * goal.targetValue).toFixed(2));
  }
  if (expectedProgress > goal.targetValue) expectedProgress = goal.targetValue;

  // Pace calculations (units per day)
  const currentPace = daysElapsed > 0 
    ? parseFloat((actualProgress / daysElapsed).toFixed(3)) 
    : 0;

  const requiredPace = daysRemaining > 0
    ? parseFloat((Math.max(0, goal.targetValue - actualProgress) / daysRemaining).toFixed(3))
    : 0;

  // Average progress calculations
  const avgProgressDaily = currentPace;
  const avgProgressWeekly = parseFloat((currentPace * 7).toFixed(2));
  const avgProgressMonthly = parseFloat((currentPace * 30.4).toFixed(2));

  // Missed days and Streaks based on logs
  // Create set of logged dates with progress > 0
  const activeLogDates = new Set<string>();
  goal.logs.forEach(log => {
    if (log.value > 0) {
      activeLogDates.add(log.date);
    }
  });

  // Calculate missed days since start date up to today (excluding today)
  let missedDays = 0;
  for (let i = 0; i < daysElapsed; i++) {
    const checkDateStr = addDays(goal.startDate, i);
    if (checkDateStr !== todayStr && !activeLogDates.has(checkDateStr)) {
      missedDays++;
    }
  }

  // Calculate Streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Sort logs or check date sequence from startDate to todayStr
  const totalDaysSoFar = getDaysDiff(goal.startDate, todayStr);
  for (let i = 0; i <= totalDaysSoFar; i++) {
    const checkDateStr = addDays(goal.startDate, i);
    if (activeLogDates.has(checkDateStr)) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  // Current streak (working backward from today/yesterday)
  let checkDate = new Date(todayStr + 'T00:00:00');
  let loggedToday = activeLogDates.has(todayStr);
  
  if (loggedToday) {
    currentStreak = 1;
    // Walk back
    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      const walkStr = getDateString(checkDate);
      if (walkStr < goal.startDate) break;
      if (activeLogDates.has(walkStr)) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    // Check yesterday
    const yesterday = new Date(todayStr + 'T00:00:00');
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getDateString(yesterday);
    if (activeLogDates.has(yesterdayStr) && yesterdayStr >= goal.startDate) {
      currentStreak = 1;
      checkDate = yesterday;
      while (true) {
        checkDate.setDate(checkDate.getDate() - 1);
        const walkStr = getDateString(checkDate);
        if (walkStr < goal.startDate) break;
        if (activeLogDates.has(walkStr)) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }
  }

  // Consistency Score (logged days / elapsed days)
  const consistencyScore = daysElapsed > 0
    ? Math.round((activeLogDates.size / daysElapsed) * 100)
    : 100;

  // Best & Worst Weeks
  const weekTotals: Record<string, number> = {};
  goal.logs.forEach(log => {
    // Find Monday of that log date
    const d = new Date(log.date + 'T00:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    const mondayStr = getDateString(monday);
    weekTotals[mondayStr] = (weekTotals[mondayStr] || 0) + log.value;
  });

  let bestWeek: { weekStartDate: string; value: number } | null = null;
  let worstWeek: { weekStartDate: string; value: number } | null = null;

  Object.entries(weekTotals).forEach(([weekStr, val]) => {
    if (!bestWeek || val > bestWeek.value) {
      bestWeek = { weekStartDate: weekStr, value: val };
    }
    if (!worstWeek || val < worstWeek.value) {
      worstWeek = { weekStartDate: weekStr, value: val };
    }
  });

  // Schedule Status Classification
  let statusText: GoalMetrics['statusText'] = 'On Track';
  if (goal.status === 'completed') {
    statusText = 'On Track';
  } else if (actualProgress >= expectedProgress * 1.05) {
    statusText = 'Ahead';
  } else if (actualProgress >= expectedProgress * 0.95) {
    statusText = 'On Track';
  } else if (actualProgress >= expectedProgress * 0.80) {
    statusText = 'Slightly Behind';
  } else if (actualProgress >= expectedProgress * 0.50) {
    statusText = 'Behind';
  } else {
    statusText = 'Critical';
  }

  // Health Score (0-100)
  // Weighted calculation based on:
  // 1. Progress ratio (Actual vs Expected) - 45%
  // 2. Consistency Score - 35%
  // 3. Streak factor - 20%
  const progressRatio = expectedProgress > 0 ? (actualProgress / expectedProgress) : 1;
  const progressFactor = Math.min(100, progressRatio * 100);
  const streakFactor = Math.min(100, (currentStreak / 10) * 100); // 10-day streak is max score contribution

  const healthScore = Math.max(0, Math.min(100, Math.round(
    (progressFactor * 0.45) + (consistencyScore * 0.35) + (streakFactor * 0.2)
  )));

  // Risk Score (0-100)
  // Higher risk if health is low, deadline is close, and required pace is higher than current pace
  let riskScore = 100 - healthScore;
  if (daysRemaining > 0 && daysRemaining < 14) {
    // If deadline is in less than 2 weeks, amplify risk if behind
    if (requiredPace > currentPace) {
      riskScore = Math.min(100, riskScore + 20);
    }
  }
  riskScore = Math.round(riskScore);

  // Velocity (last 5 logs trend)
  const sortedLogs = [...goal.logs].sort((a, b) => b.date.localeCompare(a.date));
  let progressVelocity = 0;
  if (sortedLogs.length >= 2) {
    const recent = sortedLogs.slice(0, 5);
    const avgRecent = recent.reduce((sum, l) => sum + l.value, 0) / recent.length;
    const old = sortedLogs.slice(5, 10);
    const avgOld = old.length > 0 ? old.reduce((sum, l) => sum + l.value, 0) / old.length : 0;
    
    if (avgRecent > avgOld) progressVelocity = 0.5;
    else if (avgRecent < avgOld) progressVelocity = -0.5;
  }

  // Return full metrics (rolling forecast fields completed by forecast engine)
  return {
    daysRemaining,
    weeksRemaining,
    monthsRemaining,
    daysTotal,
    daysElapsed,
    expectedProgress,
    actualProgress,
    percentageCompleted,
    currentPace,
    requiredPace,
    projectedFinishDate: null, // Filled in forecast.ts
    completionProbability: 50,  // Filled in forecast.ts
    healthScore,
    consistencyScore,
    riskScore,
    longestStreak,
    currentStreak,
    missedDays,
    avgProgressDaily,
    avgProgressWeekly,
    avgProgressMonthly,
    bestWeek,
    worstWeek,
    progressVelocity,
    statusText
  };
};

/**
 * Calculates global aggregated metrics for the dashboard.
 */
export const calculateGlobalMetrics = (goals: Goal[], todayStr: string): DashboardMetrics => {
  const activeGoals = goals.filter(g => g.status === 'active' || g.status === 'not_started');
  const completedGoals = goals.filter(g => g.status === 'completed');
  
  let overallProgressTotal = 0;
  let totalHealth = 0;
  let totalConsistency = 0;
  let totalProbability = 0;
  let goalsAtRiskCount = 0;
  let longestActiveStreak = 0;
  let bestPerformingGoal: Goal | null = null;
  let highestHealth = -1;

  activeGoals.forEach(goal => {
    const metrics = calculateGoalMetrics(goal, todayStr);
    overallProgressTotal += metrics.percentageCompleted;
    totalHealth += metrics.healthScore;
    totalConsistency += metrics.consistencyScore;
    totalProbability += metrics.completionProbability;

    if (metrics.riskScore > 65) {
      goalsAtRiskCount++;
    }
    if (metrics.currentStreak > longestActiveStreak) {
      longestActiveStreak = metrics.currentStreak;
    }
    if (metrics.healthScore > highestHealth) {
      highestHealth = metrics.healthScore;
      bestPerformingGoal = goal;
    }
  });

  const activeCount = activeGoals.length || 1;
  const overallProgress = goals.length > 0
    ? Math.round(goals.reduce((acc, g) => acc + getGoalCompletionPercent(g), 0) / goals.length)
    : 0;

  // Generate simple weekly trend (overall progress % over last 7 days)
  const weeklyTrends = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(todayStr + 'T00:00:00');
    d.setDate(d.getDate() - (6 - idx));
    const dStr = getDateString(d);
    
    // Calculate aggregate progress for that day
    let aggregateProgress = 0;
    if (goals.length > 0) {
      const sumPercents = goals.reduce((sum, g) => {
        // Calculate progress up to that date
        const logsUpTo = g.logs.filter(l => l.date <= dStr);
        const sumVal = logsUpTo.reduce((s, l) => s + l.value, 0);
        const percent = g.targetValue > 0 ? (sumVal / g.targetValue) * 100 : 0;
        return sum + Math.min(100, percent);
      }, 0);
      aggregateProgress = Math.round(sumPercents / goals.length);
    }
    return { date: dStr, value: aggregateProgress };
  });

  return {
    totalGoals: goals.length,
    activeGoals: activeGoals.length,
    completedGoals: completedGoals.length,
    overallProgress,
    averageHealthScore: Math.round(totalHealth / activeCount),
    averageConsistency: Math.round(totalConsistency / activeCount),
    averageCompletionProbability: Math.round(totalProbability / activeCount),
    goalsAtRiskCount,
    bestPerformingGoal,
    longestActiveStreak,
    weeklyTrends
  };
};
