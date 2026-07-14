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
  intent: string;
  goal: string;
  strategy: string[];
}

export class ResponsePlanner {
  plan(goal: DialogueGoal): ResponsePlan {
    const steps: ResponseStep[] = [];
    let intent = 'general_conversation';
    let g = 'chat naturally with user';
    let strategy: string[] = ['respond friendly', 'keep conversation flowing'];

    switch (goal) {
      case 'grounding_user':
        steps.push('validate_empathy');
        steps.push('ask_clarification');
        intent = 'emotional_support';
        g = 'understand problem and calm user';
        strategy = [
          'acknowledge emotion with deep empathy',
          'connect response to their specific stress or burden',
          'ask exactly ONE gentle follow-up question to let them share more'
        ];
        break;
      case 'planning_roadmap':
        steps.push('list_plan_phases');
        steps.push('suggest_tasks');
        steps.push('ask_clarification');
        intent = 'planning';
        g = 'structure goals and roadmap phases';
        strategy = [
          'break down the learning or work target into clear phases',
          'suggest 2-3 specific, actionable tasks',
          'ask if this timeline or set of tasks feels manageable'
        ];
        break;
      case 'brainstorming_mvp':
        steps.push('recommend_tech');
        steps.push('brainstorm_monetization');
        steps.push('ask_clarification');
        intent = 'brainstorming';
        g = 'explore creative ideas and product MVPs';
        strategy = [
          'propose unique selling propositions (USPs)',
          'recommend tech stack and potential monetization strategies',
          'ask one question about the target audience or primary feature'
        ];
        break;
      case 'tracking_progress':
        steps.push('summarize_status');
        steps.push('chat_naturally');
        intent = 'goal_tracking';
        g = 'review active goals and progress stats';
        strategy = [
          'summarize status of active goals and completed milestones',
          'provide a motivating insight on their progress',
          'ask what milestone they want to focus on next'
        ];
        break;
      case 'exploring_tech':
        steps.push('recommend_tech');
        steps.push('chat_naturally');
        intent = 'coding';
        g = 'resolve technical and coding challenges';
        strategy = [
          'give specific, concise code recommendations or explanation',
          'ensure typescript best practices are highlighted',
          'ask if they need help writing unit tests or debugging this component'
        ];
        break;
      default:
        steps.push('chat_naturally');
    }

    return { steps, intent, goal: g, strategy };
  }
}
