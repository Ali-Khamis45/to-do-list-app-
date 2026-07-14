import { ILLMProvider } from '../providers/LLMProvider';
import { BaseAgent, AgentOutput } from '../agents/BaseAgent';
import { CoachAgent } from '../agents/CoachAgent';
import { PlannerAgent } from '../agents/PlannerAgent';
import { CodingAgent } from '../agents/CodingAgent';
import { ResearchAgent } from '../agents/ResearchAgent';
import { ProjectAgent } from '../agents/ProjectAgent';
import { GoalAgent, TaskAgent, IdeaAgent, CalendarAgent } from '../agents/OtherAgents';
import { IntentType } from './IntentClassifier';
import { DialogueState } from './DialogueStateManager';
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

  /**
   * Selects agent based on the top of the DialogueState agentStack,
   * preserving conversational stack ownership.
   */
  selectAgents(intent: IntentType, prompt: string, state?: DialogueState): BaseAgent[] {
    const selected: BaseAgent[] = [];
    
    if (state && state.agentStack && state.agentStack.length > 0) {
      const topAgentId = state.agentStack[state.agentStack.length - 1];
      const primaryAgent = this.agents[topAgentId];
      if (primaryAgent) {
        selected.push(primaryAgent);
        return selected;
      }
    }

    // Fallback if no stack is provided
    const lower = prompt.toLowerCase();
    if (intent === 'emotional_support') {
      selected.push(this.agents['coach']);
    } else if (intent === 'coding') {
      selected.push(this.agents['coding']);
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

  /**
   * Process active agent handoff requests and updates the dialogue stack.
   */
  processHandoff(
    output: AgentOutput,
    state: DialogueState,
    updateState: (updates: Partial<DialogueState>) => void
  ): AgentOutput {
    if (!output.handoff || !output.handoff.shouldHandoff) {
      return output;
    }

    const { nextAgent, reason } = output.handoff;
    const currentStack = [...state.agentStack];

    console.log(`[Supervisor Handoff] Request to: ${nextAgent} (Reason: ${reason})`);

    if (nextAgent === 'pop') {
      if (currentStack.length > 1) {
        currentStack.pop();
      }
    } else {
      // Push next agent if not already on the stack
      if (!currentStack.includes(nextAgent) && this.agents[nextAgent]) {
        currentStack.push(nextAgent);
      }
    }

    updateState({ agentStack: currentStack });
    return output;
  }

  /**
   * Triggers conversation repair if routing confidence is low to confirm intent.
   */
  applyRepairMessage(output: AgentOutput, topic?: string): AgentOutput {
    const repairIntro = `I want to make sure I understood you correctly. So you're talking about ${
      topic || 'your current goals'
    }, right?\n\n`;
    
    return {
      ...output,
      analysis: output.analysis ? repairIntro + output.analysis : repairIntro + "Let me know how you'd like to proceed."
    };
  }

  async runCollaboration(agents: BaseAgent[], prompt: string, context: string, _version: 'A' | 'B' = 'B'): Promise<AgentOutput> {
    const span = this.logger.startSpan('AgentSupervisor: runCollaboration', { agentsCount: agents.length });
    
    if (agents.length === 1) {
      const output = await agents[0].run(prompt, context);
      this.logger.endSpan(span.id, { resultLength: output.analysis?.length || 0 });
      return output;
    }

    // Multi-Agent collaboration
    const primaryOutput = await agents[0].run(prompt, context);
    const collaborationPrompt = `User prompt: "${prompt}"\n\nPrimary agent (${agents[0].name}) drafted this answer:\n"${primaryOutput.analysis || ''}"\n\nEnhance, refine, or review this answer according to your specialty (${agents[1].name}). Ensure the response stays clean, cohesive, and concise.`;
    const secondaryOutput = await agents[1].run(collaborationPrompt, context);

    const mergedTools = [
      ...(primaryOutput.suggestedTools || []),
      ...(secondaryOutput.suggestedTools || [])
    ];

    const result: AgentOutput = {
      agentName: `${agents[0].name} + ${agents[1].name}`,
      analysis: secondaryOutput.analysis,
      suggestedTools: mergedTools.length > 0 ? mergedTools : undefined,
      tokensUsed: (primaryOutput.tokensUsed || 0) + (secondaryOutput.tokensUsed || 0),
      responseTimeMs: (primaryOutput.responseTimeMs || 0) + (secondaryOutput.responseTimeMs || 0),
      handoff: primaryOutput.handoff || secondaryOutput.handoff
    };

    this.logger.endSpan(span.id, { resultLength: result.analysis?.length || 0 });
    return result;
  }
}
