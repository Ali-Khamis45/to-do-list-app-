export interface ExtractedEntities {
  dates: string[];
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  technologies: string[];
  tasksList: string[];
}

export class EntityExtractor {
  extract(msg: string): ExtractedEntities {
    const lower = msg.toLowerCase();
    const dates: string[] = [];
    const technologies: string[] = [];

    // Parse technology matches
    const techPatterns = ['react', 'typescript', 'javascript', 'node', 'express', 'postgresql', 'stripe', 'tailwind', 'vite', 'python'];
    techPatterns.forEach(tech => {
      if (lower.includes(tech)) {
        technologies.push(tech.charAt(0).toUpperCase() + tech.slice(1));
      }
    });

    // Parse priority
    let priority: 'low' | 'medium' | 'high' | undefined;
    if (/\b(urgent|asap|high|critical|must)\b/i.test(lower)) {
      priority = 'high';
    } else if (/\b(low|maybe|someday)\b/i.test(lower)) {
      priority = 'low';
    } else if (/\b(medium|normal|regular)\b/i.test(lower)) {
      priority = 'medium';
    }

    // Parse category
    let category: string | undefined;
    if (/\b(gym|fit|exercise|workout|health|diet|sleep)\b/i.test(lower)) {
      category = 'Health';
    } else if (/\b(study|read|learn|course|class)\b/i.test(lower)) {
      category = 'Learning';
    } else if (/\b(work|meeting|email|client|project|office)\b/i.test(lower)) {
      category = 'Work';
    } else if (/\b(code|app|deploy|bug|dev)\b/i.test(lower)) {
      category = 'Technology';
    }

    // Parse dates
    const dateMatch = msg.match(/\b\d{4}-\d{2}-\d{2}\b/);
    if (dateMatch) {
      dates.push(dateMatch[0]);
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      dates.push(todayStr);
    }

    // Extract inline tasks
    const tasksList: string[] = [];
    const inlineTrigger = msg.match(/(?:(?:add|create|schedule|put|todo|tasks|remind me to)\s*:\s*)(.+)/i);
    if (inlineTrigger) {
      const parts = inlineTrigger[1].split(/,|and /i).map(s => s.replace(/^[\d.):–\-*•\s]+/, '').trim()).filter(s => s.length > 2);
      tasksList.push(...parts);
    }

    return { dates, priority, category, technologies, tasksList };
  }
}
