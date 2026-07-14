import { Task, Habit } from '../../types';
import { Goal } from '../../goals/types';
import { Idea } from '../types';
import { MemoryManager } from './MemoryManager';

export interface ContextParams {
  userId: string;
  tasks: Task[];
  goals: Goal[];
  habits: Habit[];
  ideas: Idea[];
  currentFile?: string;
}

export class ContextBuilder {
  build(params: ContextParams): string {
    const memory = MemoryManager.getInstance(params.userId);
    const prefs = memory.userMemory.getPreferences();
    const todayStr = new Date().toISOString().split('T')[0];

    const contextBlocks = [
      `[Workspace & TimeContext]`,
      `Today's Date: ${todayStr}`,
      `Preferred work hours: ${prefs.workHoursStart} to ${prefs.workHoursEnd}`,
      prefs.skills.length > 0 ? `User skills: ${prefs.skills.join(', ')}` : '',
      prefs.favoriteTech.length > 0 ? `Favorite Tech: ${prefs.favoriteTech.join(', ')}` : '',
      params.currentFile ? `Active Workspace File open: ${params.currentFile}` : '',
      ``,
      `[Tasks Snapshot]`,
      `Total tracked tasks: ${params.tasks.length}`,
      `Tasks scheduled for today: ${params.tasks.filter(t => t.date === todayStr).length}`,
      `Pending tasks today: ${params.tasks.filter(t => t.date === todayStr && !t.completed).length}`,
      ``,
      `[Goals Snapshot]`,
      `Active target goals: ${params.goals.filter(g => g.status === 'active').length}`,
      params.goals.length > 0
        ? params.goals.slice(0, 3).map(g => `- "${g.title}" (${g.category}) - ${g.currentValue}/${g.targetValue} ${g.unit}`).join('\n')
        : 'No goals set yet.',
      ``,
      `[Habits Snapshot]`,
      `Total habits tracked: ${params.habits.length}`,
      ``,
      `[Ideas Brain Snapshot]`,
      `Total captured ideas: ${params.ideas.length}`,
      `Archived ideas count: ${memory.ideaMemory.getArchivedIdeasCount()}`,
      params.ideas.length > 0
        ? params.ideas.slice(0, 3).map(i => `- "${i.title}" (${i.category})`).join('\n')
        : 'No ideas in Second Brain yet.'
    ];

    return contextBlocks.filter(b => b !== '').join('\n');
  }
}
