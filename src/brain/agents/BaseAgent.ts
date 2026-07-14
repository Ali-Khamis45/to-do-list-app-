import { ILLMProvider } from '../providers/LLMProvider';

export interface AgentOutput {
  agentName: string;
  analysis?: string;
  criticalQuestions?: string[];
  mvpChecklist?: string[];
  technicalRoadmap?: string[];
  suggestedTools?: Array<{ name: string; arguments: any }>;
  tokensUsed?: number;
  responseTimeMs?: number;
}

export abstract class BaseAgent {
  abstract name: string;
  abstract description: string;

  protected llm: ILLMProvider;

  constructor(llm: ILLMProvider) {
    this.llm = llm;
  }

  abstract run(prompt: string, context: string): Promise<AgentOutput>;
}
