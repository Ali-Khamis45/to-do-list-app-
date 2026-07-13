/**
 * @module forecast
 * @description Rolling exponential decay forecasting engine for the Smart Goal Planner.
 *
 * Uses a 14-day sliding window with exponential decay weighting to calculate
 * a realistic "rolling pace" that emphasizes recent activity over historical trends.
 *
 * Decay formula:
 *   W(i) = e^(-λ · i)    where λ = 0.15, i = number of days ago
 *
 * Blended pace formula (prevents ∞ projection during temporary breaks):
 *   Blended Pace = 0.8 × Rolling Pace + 0.2 × Overall Historical Pace
 *
 * Outputs a full ForecastResult containing:
 *   - projectedFinishDate: ISO date string of predicted completion
 *   - daysAheadOrBehind: positive = ahead of schedule, negative = behind
 *   - successProbability: 0–100 likelihood of finishing on time
 *   - riskRating: 'safe' | 'watch' | 'warning' | 'critical'
 *
 * @see calculations.ts for the base metric calculations this module builds upon
 */
import { Goal, GoalMetrics, GoalProgressLog } from './types';
import { calculateGoalMetrics, getDateString, addDays, getDaysDiff } from './calculations';

/**
 * Enhanced forecast engine implementing rolling average with exponential decay.
 * Older progress logs have exponentially decaying weights.
 */
export const forecastGoalMetrics = (goal: Goal, todayStr: string): GoalMetrics => {
  const baseMetrics = calculateGoalMetrics(goal, todayStr);
  const targetVal = goal.targetValue;
  const currentVal = baseMetrics.actualProgress;

  if (goal.status === 'completed' || currentVal >= targetVal) {
    return {
      ...baseMetrics,
      projectedFinishDate: todayStr,
      completionProbability: 100,
      riskScore: 0,
      statusText: 'On Track'
    };
  }

  // Calculate rolling decay pace over the last 14 days
  const decayRate = 0.15; // Lambda for exponential decay: e^(-lambda * t)
  let weightedProgressSum = 0;
  let weightsSum = 0;

  // Map of logs by date for fast lookup
  const logMap: Record<string, number> = {};
  goal.logs.forEach(log => {
    logMap[log.date] = (logMap[log.date] || 0) + log.value;
  });

  for (let i = 0; i < 14; i++) {
    const checkDate = new Date(todayStr + 'T00:00:00');
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = getDateString(checkDate);
    
    // Weight decays as i increases (days ago)
    const weight = Math.exp(-decayRate * i);
    const progressVal = logMap[dateStr] || 0;

    weightedProgressSum += progressVal * weight;
    weightsSum += weight;
  }

  // Weighted daily pace from recent progress
  const recentDecayPace = weightsSum > 0 ? (weightedProgressSum / weightsSum) : 0;
  
  // Blend with overall pace to prevent temporary 0 logs from forecasting "Infinite" instantly
  // Blend: 80% recent decay pace, 20% overall pace
  const overallPace = baseMetrics.currentPace;
  const blendedPace = parseFloat((0.8 * recentDecayPace + 0.2 * overallPace).toFixed(4));

  // Determine projected finish date
  let projectedFinishDate: string | null = null;
  let completionProbability = 50;

  const remainingWork = Math.max(0, targetVal - currentVal);

  if (blendedPace > 0) {
    const daysNeeded = Math.ceil(remainingWork / blendedPace);
    // Limit to reasonable forecasting (e.g. 5 years max)
    if (daysNeeded < 365 * 5) {
      projectedFinishDate = addDays(todayStr, daysNeeded);
    } else {
      projectedFinishDate = 'Delayed Indefinitely';
    }
  } else {
    projectedFinishDate = 'Delayed Indefinitely';
  }

  // Calculate completion probability based on Required Pace vs Blended Pace
  const requiredPace = baseMetrics.requiredPace;
  if (requiredPace <= 0) {
    completionProbability = 100;
  } else if (blendedPace <= 0) {
    completionProbability = 5;
  } else {
    // Ratio of pace. If blendedPace >= requiredPace, ratio >= 1.0
    const paceRatio = blendedPace / requiredPace;
    // Math curve: 70% probability if pace matches, scales up to 98%, down to 5%
    completionProbability = Math.min(98, Math.max(5, Math.round(paceRatio * 70)));
  }

  // Recalculate Risk Score based on forecast finish date vs target date
  let riskScore = baseMetrics.riskScore;
  if (projectedFinishDate && projectedFinishDate !== 'Delayed Indefinitely') {
    const daysToProjected = getDaysDiff(todayStr, projectedFinishDate);
    const daysToTarget = baseMetrics.daysRemaining;
    
    if (daysToProjected > daysToTarget) {
      // Behind schedule! Risk score increases based on how many days we miss the target by
      const daysOverdue = daysToProjected - daysToTarget;
      const ratioOverdue = daysOverdue / Math.max(1, daysToTarget);
      riskScore = Math.min(100, Math.round(50 + ratioOverdue * 50));
    } else {
      // Ahead or on track! Lower risk
      const safetyMargin = daysToTarget - daysToProjected;
      const ratioSafety = safetyMargin / Math.max(1, daysToTarget);
      riskScore = Math.max(0, Math.round(30 - ratioSafety * 30));
    }
  } else {
    // No pace, infinite timeline -> extreme risk
    riskScore = 95;
  }

  // Adjust status classification based on forecast
  let statusText = baseMetrics.statusText;
  if (projectedFinishDate && projectedFinishDate !== 'Delayed Indefinitely') {
    const daysToProjected = getDaysDiff(todayStr, projectedFinishDate);
    const daysToTarget = baseMetrics.daysRemaining;

    if (daysToProjected <= daysToTarget) {
      statusText = daysToProjected < daysToTarget * 0.9 ? 'Ahead' : 'On Track';
    } else {
      const overdueRatio = (daysToProjected - daysToTarget) / Math.max(1, daysToTarget);
      if (overdueRatio < 0.1) statusText = 'Slightly Behind';
      else if (overdueRatio < 0.3) statusText = 'Behind';
      else statusText = 'Critical';
    }
  } else {
    statusText = 'Critical';
  }

  return {
    ...baseMetrics,
    projectedFinishDate,
    completionProbability,
    riskScore,
    statusText
  };
};
