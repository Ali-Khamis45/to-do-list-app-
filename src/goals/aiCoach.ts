import { GoogleGenAI } from '@google/genai';
import { Goal, GoalMetrics } from './types';
import { getDateString, addDays, getDaysDiff } from './calculations';

/**
 * Generate AI Coach feedback for a specific goal.
 * Uses Gemini API if available, else falls back to a high-fidelity local rule-based template.
 */
export const generateAICoachMessage = async (
  goal: Goal,
  metrics: GoalMetrics,
  todayStr: string
): Promise<string> => {
  const apiKey = (import.meta.env?.VITE_GEMINI_API_KEY as string) || '';

  // Get yesterday's date
  const today = new Date(todayStr + 'T00:00:00');
  const yesterday = new Date(today.getTime());
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getDateString(yesterday);

  // Find yesterday's progress
  const yesterdayLog = goal.logs.find(log => log.date === yesterdayStr);
  const yesterdayValue = yesterdayLog ? yesterdayLog.value : 0;
  const yesterdaySkipped = yesterdayValue <= 0;

  // Today's target value
  const targetToday = metrics.requiredPace > 0 
    ? metrics.requiredPace 
    : (goal.targetValue / Math.max(1, metrics.daysTotal));

  // Time estimate for today's target
  const minutesEstimate = Math.round(targetToday * goal.estimatedMinutesPerUnit);
  const timeStr = minutesEstimate > 0 ? `${minutesEstimate} minutes` : null;

  // Target label formatting
  let targetAction = '';
  if (goal.goalType === 'milestone') {
    const nextMilestone = goal.milestones.find(m => !m.completed);
    targetAction = nextMilestone ? `Work on milestone: "${nextMilestone.title}"` : 'Complete remaining objectives';
  } else {
    // Round numeric value nicely
    const roundedTarget = targetToday < 1 ? targetToday.toFixed(2) : Math.round(targetToday);
    targetAction = `${roundedTarget} ${goal.unit}`;
  }

  // Early/Late forecast analysis
  let forecastMessage = '';
  if (metrics.projectedFinishDate && metrics.projectedFinishDate !== 'Delayed Indefinitely') {
    const daysToProjected = getDaysDiff(todayStr, metrics.projectedFinishDate);
    const daysToTarget = metrics.daysRemaining;

    if (daysToProjected < daysToTarget) {
      const daysEarly = daysToTarget - daysToProjected;
      forecastMessage = `You are projected to finish ${daysEarly} days early if you maintain this pace!`;
    } else if (daysToProjected > daysToTarget) {
      const daysLate = daysToProjected - daysToTarget;
      forecastMessage = `You are trailing by ${daysLate} days. Increasing progress today will help you catch up.`;
    } else {
      forecastMessage = `You are perfectly on track to finish on time.`;
    }
  } else {
    forecastMessage = `You need to log progress today to establish a completion forecast.`;
  }

  // If Gemini API Key is available, use LLM for natural-sounding voice
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
        You are a highly motivating, professional, and friendly AI Goal Coach.
        Generate a short, impact-oriented daily briefing message (3-4 sentences max) for a user pursuing a goal:
        - Goal: "${goal.title}" (${goal.description})
        - Goal Type: ${goal.goalType}
        - Current Progress: ${metrics.actualProgress} out of ${goal.targetValue} ${goal.unit} (${metrics.percentageCompleted}% complete)
        - Days Remaining: ${metrics.daysRemaining} days left (ends on ${goal.targetDate})
        - Yesterday's performance: ${yesterdaySkipped ? 'Skipped/No progress logged' : `Completed ${yesterdayValue} ${goal.unit}`}
        - Recommended target today: ${targetAction} ${timeStr ? `(estimated time: ${timeStr})` : ''}
        - Current Schedule Status: ${metrics.statusText}
        - Forecast status: ${forecastMessage}
        - Difficulty level: ${goal.difficulty}

        Requirements:
        - Start with a quick, customized morning greeting.
        - Reference yesterday's result contextually (encourage if they did well, motivate if they skipped).
        - Clearly state today's target action and estimated time (if applicable).
        - Mention the forecast projection to create positive urgency.
        - Keep the tone premium, encouraging, and highly actionable. No placeholders, no emojis except status indicator symbols if helpful.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response.text) {
        return response.text.trim();
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to rule-based coach.', err);
    }
  }

  // --- Rich Rule-Based Fallback Engine ---
  const greeting = 'Good morning!';
  let yesterdayRecap = '';
  if (yesterdaySkipped) {
    yesterdayRecap = `Yesterday you skipped progress for your "${goal.title}" goal. Let's make today count.`;
  } else {
    yesterdayRecap = `Great job yesterday! You successfully logged ${yesterdayValue} ${goal.unit} for your "${goal.title}" goal.`;
  }

  const recommendation = timeStr 
    ? `To stay on schedule today: ${targetAction}. Estimated time is ${timeStr}.`
    : `To stay on schedule today: ${targetAction}.`;

  const closing = forecastMessage;

  return `${greeting} ${yesterdayRecap} ${recommendation} ${closing}`;
};

/**
 * Generate actionable smart suggestions based on status and required pace.
 */
export const generateSmartSuggestions = (goal: Goal, metrics: GoalMetrics): string[] => {
  const suggestions: string[] = [];
  const unit = goal.unit;

  if (metrics.statusText === 'Ahead') {
    suggestions.push(`🌟 You are ahead of schedule! You can log 20% less today and still finish on time.`);
    suggestions.push(`💡 Keep building your streak! Consistency now acts as a buffer for busy days ahead.`);
  } else if (metrics.statusText === 'On Track') {
    suggestions.push(`✨ You are perfectly on track! Completing today's recommendation maintains your finish date.`);
    suggestions.push(`🔥 You have a current streak of ${metrics.currentStreak} days. Keep it alive today!`);
  } else if (metrics.statusText === 'Slightly Behind') {
    const catchupAmt = parseFloat((metrics.expectedProgress - metrics.actualProgress).toFixed(2));
    const catchupMinutes = Math.round(catchupAmt * goal.estimatedMinutesPerUnit);
    suggestions.push(`⚠️ You are slightly behind. If you do an extra ${catchupAmt} ${unit} today (${catchupMinutes > 0 ? `${catchupMinutes}m` : 'one session'}), you will return to "On Track".`);
    suggestions.push(`⏰ Stack this goal early in your routine to prevent missing today's target.`);
  } else if (metrics.statusText === 'Behind' || metrics.statusText === 'Critical') {
    const catchupAmt = parseFloat((metrics.expectedProgress - metrics.actualProgress).toFixed(2));
    const dailyIncrease = parseFloat((metrics.requiredPace - (goal.targetValue / metrics.daysTotal)).toFixed(2));
    
    suggestions.push(`🚨 Critical schedule warning: You are behind expected progress by ${catchupAmt} ${unit}.`);
    if (dailyIncrease > 0) {
      suggestions.push(`⚙️ Adaptive planning has recalculated your workload: daily target increased by ${dailyIncrease} ${unit}/day. Let's start catching up.`);
    }
    suggestions.push(`💪 Breakdown your daily target: aim for 2 small half-sessions today to rebuild momentum.`);
  }

  // Goal dependency advice
  if (goal.dependencies.length > 0) {
    suggestions.push(`🔗 Remember, this goal depends on parent milestones. Keep them synchronized!`);
  }

  return suggestions;
};
