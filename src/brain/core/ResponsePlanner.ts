import { DialogueGoal } from './DialogueStateManager';

export type ResponseStep = 
  | 'validate_empathy' 
  | 'ask_clarification' 
  | 'summarize_status' 
  | 'suggest_tasks' 
  | 'recommend_tech'
  | 'brainstorm_monetization'
  | 'list_plan_phases'
  | 'chat_naturally';

export interface ResponsePlan {
  steps: ResponseStep[];
}

export class ResponsePlanner {
  plan(goal: DialogueGoal): ResponsePlan {
    const steps: ResponseStep[] = [];

    switch (goal) {
      case 'grounding_user':
        steps.push('validate_empathy');
        steps.push('ask_clarification');
        break;
      case 'planning_roadmap':
        steps.push('list_plan_phases');
        steps.push('suggest_tasks');
        steps.push('ask_clarification');
        break;
      case 'brainstorming_mvp':
        steps.push('recommend_tech');
        steps.push('brainstorm_monetization');
        steps.push('ask_clarification');
        break;
      case 'tracking_progress':
        steps.push('summarize_status');
        steps.push('chat_naturally');
        break;
      case 'exploring_tech':
        steps.push('recommend_tech');
        steps.push('chat_naturally');
        break;
      default:
        steps.push('chat_naturally');
    }

    return { steps };
  }
}
