import { coachPrompt } from '../prompts/coach';
import { plannerPrompt } from '../prompts/planner';
import { codingPrompt } from '../prompts/coding';
import { researchPrompt } from '../prompts/research';
import { brainstormingPrompt } from '../prompts/brainstorming';
import { projectPrompt } from '../prompts/project';
import { IntentType } from './IntentClassifier';

export class PromptSelector {
  private prompts: Record<string, Record<string, string>> = {
    v1: {
      coach: coachPrompt,
      planner: plannerPrompt,
      coding: codingPrompt,
      research: researchPrompt,
      brainstorming: brainstormingPrompt,
      project: projectPrompt,
      general: 'You are a general productivity coach. Help the user plan, capture, and reflect.'
    }
  };

  select(intent: IntentType, version: string = 'v1'): string {
    const registry = this.prompts[version] || this.prompts['v1'];

    switch (intent) {
      case 'emotional_support':
      case 'productivity_coaching':
        return registry.coach;
      case 'learning':
      case 'planning':
        return registry.planner;
      case 'coding':
        return registry.coding;
      case 'research':
        return registry.research;
      case 'brainstorming':
        return registry.brainstorming;
      case 'project_creation':
        return registry.project;
      default:
        return registry.general;
    }
  }
}
