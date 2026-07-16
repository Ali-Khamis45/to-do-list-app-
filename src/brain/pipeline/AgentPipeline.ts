import { ILLMProvider } from '../providers/LLMProvider';
import { GeminiProvider } from '../providers/GeminiProvider';
import { LocalProvider } from '../providers/LocalProvider';
import { IntentClassifier } from '../core/IntentClassifier';
import { EntityExtractor } from '../core/EntityExtractor';
import { ContextBuilder, ContextParams } from '../core/ContextBuilder';
import { AgentSupervisor } from '../core/AgentSupervisor';
import { ResponseFormatter, FormattedResponse } from '../core/ResponseFormatter';
import { ConfirmationEngine } from '../core/ConfirmationEngine';
import { ToolRouter } from '../tools/ToolRouter';
import { ToolRegistry } from '../tools/ToolRegistry';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/Logger';

// Import reasoning-first layers
import { DialogueStateManager } from '../core/DialogueStateManager';
import { ResponsePlanner } from '../core/ResponsePlanner';
import { PromptBuilder } from '../core/PromptBuilder';
import { MemoryRetrievalRanker } from '../core/MemoryRetrievalRanker';
import { ReflectionEngine } from '../core/ReflectionEngine';
import { ResponseValidator } from '../core/ResponseValidator';
import { ConversationManager } from '../core/ConversationManager';
import { UserMemory } from '../memory/UserMemory';

// Import tool definitions
import { ListTasksTool, CreateTaskTool } from '../tools/TodoTool';
import { ListGoalsTool, CreateGoalTool } from '../tools/GoalTool';
import { ListHabitsTool } from '../tools/HabitTool';
import { ListIdeasTool, CreateIdeaTool } from '../tools/IdeaTool';
import { GetCalendarEventsTool } from '../tools/CalendarTool';
import { GetAnalyticsTool } from '../tools/AnalyticsTool';
import { SearchTool } from '../tools/SearchTool';
import { ProjectTool } from '../tools/ProjectTool';
import { SuggestedTask } from '../types';

export interface PipelineParams {
  userId: string;
  userMessage: string;
  contextParams: Omit<ContextParams, 'userId'>;
  promptVersion?: 'A' | 'B';
  callbacks: {
    onAddTask: (task: any) => void;
    onAddGoal: (goal: any) => void;
    onSaveIdea: (idea: any) => void;
  };
}

export class AgentPipeline {
  private provider: ILLMProvider;
  private classifier: IntentClassifier;
  private extractor: EntityExtractor;
  private contextBuilder: ContextBuilder;
  private router: ToolRouter;
  private eventBus: EventBus;
  private logger: Logger;
  private supervisor: AgentSupervisor;
  private formatter: ResponseFormatter;
  private confirmationEngine: ConfirmationEngine;

  // Reasoning-first layers
  private stateManager: DialogueStateManager;
  private planner: ResponsePlanner;
  private promptBuilder: PromptBuilder;
  private ranker: MemoryRetrievalRanker;
  private reflection: ReflectionEngine;
  private validator: ResponseValidator;
  private convManager: ConversationManager;

  constructor(userId: string, callbacks: PipelineParams['callbacks']) {
    this.logger = Logger.getInstance();
    this.eventBus = EventBus.getInstance();
    
    const apiKey = (import.meta.env?.VITE_GEMINI_API_KEY as string) || '';
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      this.provider = new GeminiProvider();
    } else {
      this.provider = new LocalProvider();
    }

    this.classifier = new IntentClassifier();
    this.extractor = new EntityExtractor();
    this.contextBuilder = new ContextBuilder();
    this.router = new ToolRouter();
    this.formatter = new ResponseFormatter();
    this.confirmationEngine = ConfirmationEngine.getInstance();
    this.supervisor = new AgentSupervisor(this.provider);

    // Instantiate reasoning layers
    this.stateManager = new DialogueStateManager(userId);
    this.planner = new ResponsePlanner();
    this.promptBuilder = new PromptBuilder();
    this.ranker = new MemoryRetrievalRanker();
    this.reflection = new ReflectionEngine();
    this.validator = new ResponseValidator();
    this.convManager = new ConversationManager(userId);
  }

  getDialogueState() {
    return this.stateManager.getState();
  }

  async execute(params: PipelineParams): Promise<FormattedResponse> {
    // Register active application tools
    const registry = ToolRegistry.getInstance();
    registry.clear();
    registry.registerTool(new ListTasksTool(() => params.contextParams.tasks));
    registry.registerTool(new CreateTaskTool(params.callbacks.onAddTask));
    registry.registerTool(new ListGoalsTool(() => params.contextParams.goals));
    registry.registerTool(new CreateGoalTool(params.callbacks.onAddGoal));
    registry.registerTool(new ListHabitsTool(() => params.contextParams.habits));
    registry.registerTool(new ListIdeasTool(() => params.contextParams.ideas));
    registry.registerTool(new CreateIdeaTool(params.callbacks.onSaveIdea));
    registry.registerTool(new GetCalendarEventsTool(() => params.contextParams.tasks));
    registry.registerTool(new GetAnalyticsTool(() => params.contextParams.tasks, () => params.contextParams.goals, () => params.contextParams.habits));
    registry.registerTool(new SearchTool(() => params.contextParams.ideas));
    registry.registerTool(new ProjectTool(() => params.contextParams.ideas, params.callbacks.onSaveIdea));

    const span = this.logger.startSpan('AgentPipeline: execute', { userMessage: params.userMessage });
    this.eventBus.publish('user_message_received', { msg: params.userMessage });

    try {
      // 1. Dialogue history retrieval and optimization
      this.convManager.optimizeContext(params.userId);
      const dialogueHistory = this.convManager.getHistory(params.userId);

      // Save user message to persistent history immediately
      this.convManager.saveMessage(params.userId, 'user', params.userMessage);

      // 2. Understand intent and extract entities
      const intentResult = this.classifier.classify(params.userMessage);
      const entities = this.extractor.extract(params.userMessage);

      // 3. Reason: Update active dialogue goals & stack
      const {
        goal: activeGoal,
        primaryAgent,
        activeTopic,
        conversationObjective,
        assistantExpectation,
        userExpectation
      } = this.stateManager.determineGoalAndAgent(
        intentResult.primary,
        params.userMessage,
        intentResult.confidence,
        dialogueHistory
      );

      const isStressed = activeGoal === 'grounding_user';

      this.stateManager.updateState({
        activeGoal,
        activeTopic,
        conversationObjective,
        assistantExpectation,
        userExpectation,
        sentiment: isStressed ? 'stressed' : 'calm',
        turnsCount: this.stateManager.getState().turnsCount + 1
      });

      const state = this.stateManager.getState();

      // 4. Plan: Response planning
      const responsePlan = this.planner.plan(activeGoal);

      // 5. Retrieve Memory & Semantic Ranking
      const rankedIdeas = this.ranker.rankIdeas(params.contextParams.ideas, intentResult.keywords, entities.technologies);
      const rankedGoals = this.ranker.rankGoals(params.contextParams.goals, intentResult.keywords);

      const workspaceContext = this.contextBuilder.build({
        userId: params.userId,
        tasks: params.contextParams.tasks,
        goals: params.contextParams.goals,
        habits: params.contextParams.habits,
        ideas: params.contextParams.ideas,
        currentFile: params.contextParams.currentFile
      });

      const memoryContext = [
        `[Ranked Goals Context]`,
        rankedGoals.length > 0 
          ? rankedGoals.map(g => `- "${g.title}" (Pace: ${g.unit})`).join('\n') 
          : 'No relevant goals found.',
        ``,
        `[Ranked Ideas Context]`,
        rankedIdeas.length > 0 
          ? rankedIdeas.map(i => `- "${i.title}": ${i.content.substring(0, 100)}`).join('\n') 
          : 'No relevant ideas found.',
        ``,
        `[Dialogue History Summary]`,
        dialogueHistory.map(turn => `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.text}`).join('\n')
      ].join('\n');

      // 6. Prompt Builder: Build combined instructions matching stack top
      const delegatedAgents = this.supervisor.selectAgents(intentResult.primary, params.userMessage, state);
      
      const systemPrompt = `Select instructions for primary agent ${delegatedAgents[0].name}. Be warm, supportive, and conversational.`;
      
      const compiledPrompt = this.promptBuilder.build({
        systemPrompt,
        dialogueState: state,
        responsePlan,
        workspaceContext,
        memoryContext,
        promptVersion: params.promptVersion
      });

      // 7. Collaborative Reasoning
      let agentOutput = await this.supervisor.runCollaboration(delegatedAgents, params.userMessage, compiledPrompt);
      
      // Apply Conversation Repair if classification confidence is low
      if (intentResult.confidence < 0.8 && intentResult.primary !== 'emotional_support') {
        agentOutput = this.supervisor.applyRepairMessage(agentOutput, state.activeTopic);
      }

      // Process handoffs/releases
      agentOutput = this.supervisor.processHandoff(
        agentOutput,
        this.stateManager.getState(),
        (updates) => this.stateManager.updateState(updates)
      );

      let draftText = agentOutput.analysis || 'I am processing your thoughts.';
      let suggestedTasks: SuggestedTask[] = [];

      // 8. Decide Tools
      const proposedCalls = agentOutput.suggestedTools;
      if (proposedCalls && proposedCalls.length > 0) {
        for (const call of proposedCalls) {
          if (call.name === 'suggest_tasks') {
            const tasksList = call.arguments.tasks || [];
            tasksList.forEach((t: any, idx: number) => {
              params.callbacks.onAddTask({
                id: `ai-task-${Date.now()}-${idx}-${Math.random()}`,
                title: t.title,
                time: '09:00',
                subtext: 'Added automatically by AI Assistant',
                completed: false,
                date: new Date().toISOString().split('T')[0],
                category: t.category || 'General',
                priority: t.priority || 'medium',
                createdAt: new Date().toISOString().split('T')[0],
                logs: {}
              });
            });
            draftText = `I've automatically added these tasks to your checklist: \n` + 
              tasksList.map((t: any) => `- **${t.title}** (${t.priority || 'medium'})`).join('\n') + 
              `\n\nWhat would you like to tackle first?`;
          } else {
            const routeResult = await this.router.route(call.name, call.arguments, () => {});
            if (routeResult.suspended) {
              const tasksList = call.arguments.tasks || [];
              suggestedTasks = tasksList;
              
              const transaction = this.confirmationEngine.suspend(call.name, call.arguments, async () => {
                tasksList.forEach((t: any, idx: number) => {
                  params.callbacks.onAddTask({
                    id: `ai-task-${Date.now()}-${idx}`,
                    title: t.title,
                    time: '09:00',
                    subtext: 'Added by AI Coach OS',
                    completed: false,
                    date: new Date().toISOString().split('T')[0],
                    category: t.category || 'General',
                    priority: t.priority || 'medium',
                    createdAt: new Date().toISOString().split('T')[0],
                    logs: {}
                  });
                });
              });

              this.convManager.saveMessage(params.userId, 'model', draftText);
              this.logger.endSpan(span.id, { status: 'suspended_for_confirm' });

              const metrics = {
                tokensUsed: agentOutput.tokensUsed,
                responseTimeMs: agentOutput.responseTimeMs,
                intent: intentResult.primary,
                confidence: intentResult.confidence,
                agentName: agentOutput.agentName,
                examplesCount: params.promptVersion === 'A' ? 0 : 4
              };

              return this.formatter.format(draftText, suggestedTasks, transaction.id, metrics);
            }
          }
        }
      }

      // 9. Reflection & Self-Correction (with single retry limit)
      const contextKeywords = [
        ...rankedGoals.map(g => g.title),
        ...rankedIdeas.map(i => i.title),
        ...entities.technologies
      ];

      if (params.promptVersion !== 'A') {
        const reflectionResult = this.reflection.reflectAndImprove(draftText, isStressed, {
          state,
          userMessage: params.userMessage,
          contextKeywords
        });
        draftText = reflectionResult.cleanedText;

        // Only checks that indicate a genuinely broken reply (asking multiple
        // questions, repeating a question, or resetting the conversation) are
        // worth spending a second LLM call on. `no_context_reference` and
        // `did_not_answer` are common, softer quality signals - logged for
        // visibility but not worth doubling API usage on every turn.
        const HARD_RETRY_CHECKS = ['question_overload', 'restarted_pending_question', 'restarted_conversation'];
        const hardFailures = reflectionResult.failedChecks.filter(c => HARD_RETRY_CHECKS.includes(c));

        if (!reflectionResult.passed) {
          console.log('[Pipeline Reflection] Checks failed:', reflectionResult.failedChecks, hardFailures.length > 0 ? '(retrying)' : '(soft failure, no retry)');
        }

        if (hardFailures.length > 0) {
          const feedbackSentences: Record<string, string> = {
            restarted_conversation: "Don't restart the conversation with a generic greeting - continue naturally from where things left off.",
            no_context_reference: 'Reference at least one concrete fact from the current goals, ideas, or dialogue state.',
            did_not_answer: "Directly address what the user just said instead of a generic reply.",
            question_overload: 'Ask at most one follow-up question, not several.',
            restarted_pending_question: 'You already asked this question - build on the user\'s last answer instead of repeating it.'
          };
          const feedbackLines = hardFailures.map(code => `- ${feedbackSentences[code] || code}`);
          const correctionPrompt = compiledPrompt +
            '\n\n=== SELF-CORRECTION FEEDBACK ===\nYour previous draft failed these checks:\n' +
            feedbackLines.join('\n') +
            '\nRegenerate your reply fixing these issues.';

          const retryOutput = await this.supervisor.runCollaboration(delegatedAgents, params.userMessage, correctionPrompt);
          const retryReflection = this.reflection.reflectAndImprove(retryOutput.analysis || draftText, isStressed, {
            state,
            userMessage: params.userMessage,
            contextKeywords
          });
          draftText = retryReflection.cleanedText;
        }
      }

      // 10. Validate Constraints
      const validationResult = this.validator.validate(draftText);
      const finalText = validationResult.cleanedText;

      // Update expectations and pending questions for the next turn, using the
      // agent's actual trailing question rather than a canned per-agent constant.
      const askedQuestion = (finalText.match(/[^.!?]*\?\s*$/) || [])[0]?.trim() || '';
      const expectedInformationByAgent: Record<string, string> = {
        coach: 'stress_reason',
        planner: 'project_details',
        coding: 'bug_details',
        project: 'idea_details',
        goal: 'goal_details'
      };
      const pendingQuestion = askedQuestion;
      const expectedInformation = pendingQuestion ? (expectedInformationByAgent[primaryAgent] || '') : '';

      const lastMeaningfulSummary = finalText.length > 40
        ? (finalText.length > 180 ? finalText.slice(0, 177) + '...' : finalText)
        : state.lastMeaningfulSummary;

      this.stateManager.updateState({
        pendingQuestion,
        expectedInformation,
        lastMeaningfulSummary
      });

      // Log assistant reply to history
      this.convManager.saveMessage(params.userId, 'model', finalText);

      // Learn user preferences dynamically over time
      if (entities.technologies.length > 0) {
        const userMem = new UserMemory(params.userId);
        entities.technologies.forEach(t => userMem.addFavoriteTech(t));
      }

      this.logger.endSpan(span.id, { status: 'success' });

      const metrics = {
        tokensUsed: agentOutput.tokensUsed,
        responseTimeMs: agentOutput.responseTimeMs,
        intent: intentResult.primary,
        confidence: intentResult.confidence,
        agentName: agentOutput.agentName,
        examplesCount: params.promptVersion === 'A' ? 0 : 4
      };

      return this.formatter.format(finalText, suggestedTasks.length > 0 ? suggestedTasks : undefined, undefined, metrics);
    } catch (err: any) {
      this.logger.endSpan(span.id, {}, err.message);
      throw err;
    }
  }
}
