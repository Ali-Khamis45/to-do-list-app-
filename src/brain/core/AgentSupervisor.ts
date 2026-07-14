import { ILLMProvider } from '../providers/LLMProvider';
import { BaseAgent, AgentOutput } from '../agents/BaseAgent';
import { CoachAgent } from '../agents/CoachAgent';
import { PlannerAgent } from '../agents/PlannerAgent';
import { CodingAgent } from '../agents/CodingAgent';
import { ResearchAgent } from '../agents/ResearchAgent';
import { ProjectAgent } from '../agents/ProjectAgent';
import { GoalAgent, TaskAgent, IdeaAgent, CalendarAgent } from '../agents/OtherAgents';
import { IntentType } from './IntentClassifier';
import { Logger } from './Logger';

export class AgentSupervisor {
  private agents: Record<string, BaseAgent> = {};
  private logger: Logger;

  constructor(llm: ILLMProvider) {
    this.logger = Logger.getInstance();
    
    // Register specialized agents
    this.agents['coach'] = new CoachAgent(llm);
    this.agents['planner'] = new PlannerAgent(llm);
    this.agents['coding'] = new CodingAgent(llm);
    this.agents['research'] = new ResearchAgent(llm);
    this.agents['project'] = new ProjectAgent(llm);
    this.agents['goal'] = new GoalAgent(llm);
    this.agents['task'] = new TaskAgent(llm);
    this.agents['idea'] = new IdeaAgent(llm);
    this.agents['calendar'] = new CalendarAgent(llm);
  }

  // Decides which specialized agents should participate
  selectAgents(intent: IntentType, prompt: string): BaseAgent[] {
    const selected: BaseAgent[] = [];
    const lower = prompt.toLowerCase();

    // Mapping intent to default primary agent
    if (intent === 'emotional_support') {
      selected.push(this.agents['coach']);
    } else if (intent === 'coding') {
      selected.push(this.agents['coding']);
      if (lower.includes('plan') || lower.includes('schedule') || lower.includes('weeks')) {
        selected.push(this.agents['planner']);
      }
    } else if (intent === 'planning' || intent === 'learning') {
      selected.push(this.agents['planner']);
    } else if (intent === 'research') {
      selected.push(this.agents['research']);
    } else if (intent === 'project_creation') {
      selected.push(this.agents['project']);
    } else if (intent === 'goal_creation' || intent === 'goal_update') {
      selected.push(this.agents['goal']);
    } else if (intent === 'task_creation' || intent === 'task_edit') {
      selected.push(this.agents['task']);
    } else if (intent === 'idea_capture' || intent === 'brainstorming') {
      selected.push(this.agents['idea']);
    } else if (intent === 'calendar') {
      selected.push(this.agents['calendar']);
    } else {
      selected.push(this.agents['coach']);
    }

    return selected;
  }

  async runCollaboration(agents: BaseAgent[], prompt: string, context: string, version: 'A' | 'B' = 'B'): Promise<AgentOutput> {
    const span = this.logger.startSpan('AgentSupervisor: runCollaboration', { agentsCount: agents.length });
    
    if (agents.length === 1) {
      const output = await agents[0].run(prompt, context);
      this.logger.endSpan(span.id, { resultLength: output.analysis?.length || 0 });
      return output;
    }

    // Multi-Agent collaboration:
    console.log(`[Supervisor] Collaborating between ${agents.map(a => a.name).join(' and ')}`);
    const primaryOutput = await agents[0].run(prompt, context);

    const collaborationPrompt = `User prompt: "${prompt}"\n\nPrimary agent (${agents[0].name}) drafted this answer:\n"${primaryOutput.analysis || ''}"\n\nEnhance, refine, or review this answer according to your specialty (${agents[1].name}). Ensure the response stays clean, cohesive, and concise.`;
    const secondaryOutput = await agents[1].run(collaborationPrompt, context);

    // Merge tool calls
    const mergedTools = [
      ...(primaryOutput.suggestedTools || []),
      ...(secondaryOutput.suggestedTools || [])
    ];

    const result: AgentOutput = {
      agentName: `${agents[0].name} + ${agents[1].name}`,
      analysis: secondaryOutput.analysis,
      suggestedTools: mergedTools.length > 0 ? mergedTools : undefined,
      tokensUsed: (primaryOutput.tokensUsed || 0) + (secondaryOutput.tokensUsed || 0),
      responseTimeMs: (primaryOutput.responseTimeMs || 0) + (secondaryOutput.responseTimeMs || 0)
    };

    this.logger.endSpan(span.id, { resultLength: result.analysis?.length || 0 });
    return result;
  }
}
