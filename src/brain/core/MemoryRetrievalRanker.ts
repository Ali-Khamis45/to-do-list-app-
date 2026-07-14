import { Task, Habit } from '../../types';
import { Goal } from '../../goals/types';
import { Idea } from '../types';

export class MemoryRetrievalRanker {
  rankIdeas(ideas: Idea[], keywords: string[], techList: string[]): Idea[] {
    return ideas
      .map(idea => {
        let score = 0;
        const titleLower = idea.title.toLowerCase();
        const contentLower = idea.content.toLowerCase();

        keywords.forEach(kw => {
          const kwl = kw.toLowerCase();
          if (titleLower.includes(kwl)) score += 10;
          if (contentLower.includes(kwl)) score += 3;
        });

        techList.forEach(tech => {
          const tl = tech.toLowerCase();
          if (titleLower.includes(tl) || contentLower.includes(tl)) score += 5;
          if (idea.tags.map(t => t.toLowerCase()).includes(tl)) score += 5;
        });

        if (idea.favorite) score += 2;

        return { idea, score };
      })
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.idea);
  }

  rankGoals(goals: Goal[], keywords: string[]): Goal[] {
    return goals
      .map(goal => {
        let score = 0;
        const titleLower = goal.title.toLowerCase();
        const descLower = goal.description.toLowerCase();

        keywords.forEach(kw => {
          const kwl = kw.toLowerCase();
          if (titleLower.includes(kwl)) score += 10;
          if (descLower.includes(kwl)) score += 3;
        });

        return { goal, score };
      })
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.goal);
  }
}
