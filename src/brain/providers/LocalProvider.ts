import { ILLMProvider, LLMResponse } from './LLMProvider';

/**
 * Intelligent offline fallback provider.
 * Unlike the previous version which ignored systemInstruction entirely,
 * this provider parses the compiled prompt to extract conversation history,
 * dialogue state, user context, and generates dynamic contextual responses.
 */
export class LocalProvider implements ILLMProvider {
  name = 'Local Intelligent Fallback';

  // Track recent responses to prevent repetition
  private responseHistory: string[] = [];
  private static MAX_HISTORY = 8;

  async generate(
    prompt: string,
    systemInstruction?: string,
    tools?: any[]
  ): Promise<LLMResponse> {
    const startTime = performance.now();
    const result = await this.innerGenerate(prompt, systemInstruction, tools);
    const endTime = performance.now();
    result.responseTimeMs = Math.round(endTime - startTime);
    result.tokensUsed = Math.round((prompt.length + (systemInstruction?.length || 0) + (result.text?.length || 0)) / 4);
    return result;
  }

  private async innerGenerate(
    prompt: string,
    systemInstruction?: string,
    _tools?: any[]
  ): Promise<LLMResponse> {
    const userMsg = prompt.trim();
    const q = userMsg.toLowerCase();

    // --- Extract context from systemInstruction ---
    const ctx = this.parseContext(systemInstruction || '');

    // --- 1. Natural language task detection (broadened) ---
    if (this.isTaskCreationIntent(userMsg)) {
      const extracted = this.extractTasksFromMessage(userMsg);
      if (extracted.length > 0) {
        const tasks = extracted.map(title => {
          const tl = title.toLowerCase();
          const priority =
            /urgent|asap|important|critical|deadline|must/.test(tl) ? 'high' :
            /maybe|sometime|eventually|low/.test(tl) ? 'low' : 'medium';
          const category =
            /gym|workout|exercise|run|health|fitness|yoga|diet|sleep/.test(tl) ? 'Health' :
            /read|book|study|learn|course|class|practice/.test(tl) ? 'Learning' :
            /work|meeting|email|report|client|project|deadline|task/.test(tl) ? 'Work' :
            /buy|shop|groceries|errands|pay|bill/.test(tl) ? 'Personal' :
            /code|app|feature|bug|deploy|build|test/.test(tl) ? 'Technology' :
            'General';
          return { title, priority, category };
        });

        return {
          text: `Got it! I've picked up ${tasks.length} task${tasks.length > 1 ? 's' : ''} from what you said. Adding them to your checklist now.`,
          toolCalls: [{
            name: 'suggest_tasks',
            arguments: { tasks }
          }]
        };
      }
    }

    // --- 2. Emotional support (check BEFORE greetings) ---
    if (/\b(stressed|overwhelmed|anxious|tired|sad|exhausted|burnout|struggling|down|blue|too many tasks|can't cope|falling behind|giving up)\b/i.test(q)) {
      return this.deduplicate(this.generateEmpathyResponse(ctx));
    }

    // --- 3. Greetings (only for very short messages, first turn only) ---
    const words = q.split(/\s+/);
    const isGreeting = words.length <= 4 && /^(hello|hi|hey|howdy|yo|hiya|greetings|sup|what'?s up)\b/.test(q);
    const isHowAreYou = /^how are you/.test(q);
    if ((isGreeting || isHowAreYou) && ctx.turnsCount <= 1) {
      return this.deduplicate({
        text: `Hey! 👋 Good to see you. What's on your mind today — want to brainstorm something, plan your day, or just chat?`
      });
    }

    // --- 4. Context-aware conversational response ---
    return this.deduplicate(this.generateContextualResponse(userMsg, q, ctx));
  }

  /**
   * Parse the compiled systemInstruction to extract structured context.
   */
  private parseContext(instruction: string): ParsedContext {
    const ctx: ParsedContext = {
      activeGoal: 'general',
      sentiment: 'calm',
      turnsCount: 0,
      dialogueHistory: [],
      rankedGoals: [],
      rankedIdeas: [],
      userMessage: ''
    };

    // Extract active goal
    const goalMatch = instruction.match(/Active Goal:\s*(\S+)/i);
    if (goalMatch) ctx.activeGoal = goalMatch[1];

    // Extract sentiment
    const sentimentMatch = instruction.match(/User Sentiment:\s*(\S+)/i);
    if (sentimentMatch) ctx.sentiment = sentimentMatch[1];

    // Extract turns count
    const turnsMatch = instruction.match(/Dialogue Turns:\s*(\d+)/i);
    if (turnsMatch) ctx.turnsCount = parseInt(turnsMatch[1], 10);

    // Extract dialogue history
    const historySection = instruction.match(/\[Dialogue History Summary\]([\s\S]*?)(?:\[|$)/);
    if (historySection) {
      const lines = historySection[1].trim().split('\n').filter(l => l.trim());
      ctx.dialogueHistory = lines.map(l => {
        const match = l.match(/^(User|Assistant):\s*(.+)/i);
        return match ? { role: match[1].toLowerCase() as 'user' | 'assistant', text: match[2].trim() } : null;
      }).filter(Boolean) as Array<{ role: 'user' | 'assistant'; text: string }>;
    }

    // Extract ranked goals
    const goalsSection = instruction.match(/\[Ranked Goals Context\]([\s\S]*?)(?:\[|$)/);
    if (goalsSection) {
      const goalLines = goalsSection[1].trim().split('\n').filter(l => l.startsWith('-'));
      ctx.rankedGoals = goalLines.map(l => l.replace(/^-\s*/, '').trim());
    }

    // Extract ranked ideas
    const ideasSection = instruction.match(/\[Ranked Ideas Context\]([\s\S]*?)(?:\[|$)/);
    if (ideasSection) {
      const ideaLines = ideasSection[1].trim().split('\n').filter(l => l.startsWith('-'));
      ctx.rankedIdeas = ideaLines.map(l => l.replace(/^-\s*/, '').trim());
    }

    return ctx;
  }

  /**
   * Generate empathy response using context awareness.
   */
  private generateEmpathyResponse(ctx: ParsedContext): LLMResponse {
    const responses = [
      `I hear you. It's tough when everything piles up at once. You don't have to figure it all out right now — what's weighing on you the most?`,
      `That sounds really heavy. It's okay to feel that way — you're dealing with a lot. Want to just talk it through, or would it help to untangle one thing at a time?`,
      `I'm sorry you're going through this. Sometimes just naming what's stressing you out can take some of the pressure off. What's the biggest thing on your plate right now?`,
      `Hey, it's completely valid to feel like that. You don't have to power through everything alone. What would make today feel even slightly more manageable?`,
      `I can tell things feel overwhelming right now. Let's not worry about being productive — what do you actually need right now?`
    ];

    // Pick based on turn count to avoid repetition
    const idx = ctx.turnsCount % responses.length;
    return { text: responses[idx] };
  }

  /**
   * Generate a dynamic, contextual response based on the user's message
   * AND the parsed conversation/workspace context.
   */
  private generateContextualResponse(userMsg: string, q: string, ctx: ParsedContext): LLMResponse {
    // Keep emotional conversation stable
    if (ctx.activeGoal === 'grounding_user') {
      return this.generateEmpathyResponse(ctx);
    }

    // --- Topic-specific responses ---

    // Coding/tech questions
    if (/\b(code|react|typescript|javascript|python|css|html|api|bug|error|component|hook|state|deploy|git|database|backend|frontend|node|npm|vite)\b/i.test(q)) {
      const techResponses = [
        `Nice — what part are you working on? If you share more details about the issue or what you're building, I can give you more targeted help.`,
        `I'd love to dig into that with you. What's the specific challenge you're running into? Is it a conceptual question or are you stuck on an error?`,
        `Sounds like a fun technical problem. Walk me through what you've tried so far and where things are breaking down.`
      ];
      const ref = this.getGoalReference(ctx, ['react', 'typescript', 'code', 'javascript']);
      const base = techResponses[ctx.turnsCount % techResponses.length];
      return { text: ref ? `${base}\n\n${ref}` : base };
    }

    // Ideas and brainstorming
    if (/\b(idea|brainstorm|startup|business|project|app|build|create|launch|side hustle|venture|concept)\b/i.test(q)) {
      const ideaResponses = [
        `That's exciting! What problem are you trying to solve, or what's the spark behind this idea?`,
        `Love that you're thinking about this. What makes your approach different from what's already out there?`,
        `Cool — let's flesh this out. Who's the target user, and what's the one thing they'd love most about it?`
      ];
      const ref = this.getIdeaReference(ctx);
      const base = ideaResponses[ctx.turnsCount % ideaResponses.length];
      return { text: ref ? `${base}\n\n${ref}` : base };
    }

    // Goals and progress
    if (/\b(goal|progress|track|milestone|target|achieve|accomplish|habit|streak)\b/i.test(q)) {
      const goalResponses = [
        `What specific goal are you focused on right now? I can help you break it down into smaller milestones.`,
        `Great that you're thinking about your goals. What does success look like for you in the next week or two?`,
        `Let's check in on where you are. What's been going well, and where do you feel stuck?`
      ];
      const ref = this.getGoalReference(ctx);
      const base = goalResponses[ctx.turnsCount % goalResponses.length];
      return { text: ref ? `${base}\n\n${ref}` : base };
    }

    // Schedule/planning
    if (/\b(schedule|plan|today|tomorrow|week|morning|evening|routine|organize|prioritize|time)\b/i.test(q)) {
      return {
        text: `Let's map out your plan. What are the top 2-3 things you want to make sure you get done? I'll help you figure out the best order to tackle them.`
      };
    }

    // Tasks and to-dos
    if (/\b(task|todo|to-do|checklist|do|done|finish|complete)\b/i.test(q)) {
      return {
        text: `Want me to help you organize your tasks? You can list them out naturally — like "study React, go to gym, read a chapter" — and I'll add them straight to your dashboard.`
      };
    }

    // Study and learning
    if (/\b(study|learn|course|tutorial|practice|read|book|lesson|exam|test|class)\b/i.test(q)) {
      const ref = this.getGoalReference(ctx, ['study', 'learn', 'react', 'typescript']);
      const base = `What are you studying? If you tell me the topic and how much time you have, I can help you structure a focused session.`;
      return { text: ref ? `${base}\n\n${ref}` : base };
    }

    // Fitness and health
    if (/\b(gym|workout|exercise|run|fitness|health|yoga|diet|sleep|walk|cardio|lift|weight)\b/i.test(q)) {
      return {
        text: `Keeping active is huge for both energy and focus. Are you looking to plan a specific workout, or do you want me to add it to your daily checklist?`
      };
    }

    // Help/capabilities
    if (/\b(help|what can you|how do i|commands|features|capable)\b/i.test(q)) {
      return {
        text: `Here's what we can do together:\n\n- **Chat naturally** — I'll remember our conversation and build on it\n- **Add tasks** — just say "I need to study, go to gym, call mom" and they're on your dashboard\n- **Plan projects** — break ideas into milestones and subtasks\n- **Brainstorm** — explore ideas, validate concepts, map out MVPs\n- **Track goals** — review progress and adjust your roadmap\n\nWhat sounds useful right now?`
      };
    }

    // --- Conversational continuation (no specific topic matched) ---
    return this.generateContinuationResponse(userMsg, ctx);
  }

  /**
   * When no specific topic is detected, generate a response that
   * continues the conversation naturally using context.
   */
  private generateContinuationResponse(userMsg: string, ctx: ParsedContext): LLMResponse {
    // If user shared something personal/descriptive, engage with it
    const msgWords = userMsg.split(/\s+/).length;

    // Short messages (< 6 words) — ask for more detail
    if (msgWords < 6) {
      const shortResponses = [
        `Tell me more — I want to make sure I understand what you're getting at.`,
        `Got it. Can you expand on that a bit? What's the context behind it?`,
        `Interesting — what made you think of that? I'd love to hear more.`,
        `Sure thing. What specifically about that is on your mind right now?`,
        `I'm listening. What's the full picture here?`
      ];

      // Add context-aware follow-up if we have history
      if (ctx.dialogueHistory.length > 0) {
        const lastAssistant = [...ctx.dialogueHistory].reverse().find(h => h.role === 'assistant');
        if (lastAssistant) {
          // Don't just repeat "tell me more" — reference the conversation
          const contextFollowups = [
            `Building on what we were just talking about — where does this fit in?`,
            `Okay, and how does this connect to what you mentioned earlier?`,
            `I see — is this related to what we were discussing, or something new entirely?`,
          ];
          return { text: contextFollowups[ctx.turnsCount % contextFollowups.length] };
        }
      }

      return { text: shortResponses[ctx.turnsCount % shortResponses.length] };
    }

    // Medium-length messages — engage meaningfully
    const medResponses = [
      `That makes sense. It sounds like you've got a clear sense of what needs to happen. Want to break it down into concrete steps, or are you still in the thinking phase?`,
      `I appreciate you sharing that. Let me make sure I'm tracking — what's the most important piece of this for you right now?`,
      `Okay, I think I see where you're going with this. What would be the most helpful thing I could do — organize it, brainstorm on it, or just talk it through?`,
      `That's a lot to juggle. If you had to pick the one thing that would make the biggest difference today, what would it be?`,
      `I like how you're thinking about this. What's your timeline looking like — is this something urgent, or more of a longer-term plan?`
    ];

    // Add workspace references if available
    let response = medResponses[ctx.turnsCount % medResponses.length];
    const goalRef = this.getGoalReference(ctx);
    if (goalRef && ctx.turnsCount > 2) {
      response += `\n\n${goalRef}`;
    }

    return { text: response };
  }

  /**
   * Reference user's goals naturally if relevant.
   */
  private getGoalReference(ctx: ParsedContext, keywords?: string[]): string | null {
    if (ctx.rankedGoals.length === 0) return null;

    for (const goal of ctx.rankedGoals) {
      if (!keywords || keywords.some(k => goal.toLowerCase().includes(k))) {
        const goalTitle = goal.match(/"([^"]+)"/)?.[1] || goal.split('(')[0].trim();
        return `_By the way, I see you've got a goal set for "${goalTitle}" — want to tie this into that?_`;
      }
    }
    return null;
  }

  /**
   * Reference user's ideas naturally if relevant.
   */
  private getIdeaReference(ctx: ParsedContext): string | null {
    if (ctx.rankedIdeas.length === 0) return null;
    const idea = ctx.rankedIdeas[0];
    const ideaTitle = idea.match(/"([^"]+)"/)?.[1] || idea.split(':')[0].trim();
    return `_I noticed you've captured an idea called "${ideaTitle}" — is this related, or is it a completely new direction?_`;
  }

  /**
   * Prevent returning the same response twice.
   */
  private deduplicate(response: LLMResponse): LLMResponse {
    const text = response.text;
    
    // Check if this exact response was recently used
    if (this.responseHistory.includes(text)) {
      // Generate an alternative continuation
      const alternatives = [
        `I want to make sure we're making progress here. What's the most useful thing I can do for you right now?`,
        `Let's take a step back — what's really on your mind today? I'd rather dig into something meaningful than go in circles.`,
        `I feel like there's more to unpack here. What would be the most helpful direction for us to go?`,
        `Here's what I'm thinking — instead of going back and forth, let's focus on one thing. What matters most to you right now?`,
        `You know what, let's switch gears. Tell me something you're excited about, or something that's been bugging you. I'll work with whatever you've got.`
      ];
      const altIdx = this.responseHistory.length % alternatives.length;
      response = { ...response, text: alternatives[altIdx] };
    }

    // Track this response
    this.responseHistory.push(response.text);
    if (this.responseHistory.length > LocalProvider.MAX_HISTORY) {
      this.responseHistory.shift();
    }

    return response;
  }

  // --- Task Detection (broadened) ---

  private isTaskCreationIntent(msg: string): boolean {
    const lower = msg.toLowerCase();

    // Explicit bullet points or numbered lists
    if (/(?:^|\n)\s*(?:\d+[.):–\-]|\*|-|•)\s+\S/m.test(msg)) return true;

    // Explicit command prefixes
    if (/^\s*(?:add|create|schedule|put|todo|tasks|remind me to)\b/i.test(lower)) return true;

    // Colon-separated task lists
    if (/(?:(?:add|create|schedule|put|todo|tasks|remind me to)\s*:\s*)/i.test(lower)) return true;

    // Natural language task patterns: "I have to X and Y", "I need to X, Y"
    if (/\b(?:i have to|i need to|i want to|i should|i must|i'm going to|i'm planning to|my tasks are|today i)\b/i.test(lower)) {
      // Must contain at least one actionable verb or conjunction suggesting multiple items
      if (/\b(?:and|,)\b/.test(lower) || /\b(?:study|work|go|read|call|email|buy|clean|cook|exercise|practice|write|finish|complete|submit)\b/.test(lower)) {
        return true;
      }
    }

    return false;
  }

  extractTasksFromMessage(msg: string): string[] {
    const tasks: string[] = [];

    // Try structured formats first (bullet points, numbered lists)
    const lines = msg.split(/\n|,(?=\s*(?:\d+[.):–-]|\*|-|•))/);
    for (const line of lines) {
      const match = line.match(/^[\s]*(?:\d+[.):–\-]|\*|-|•)\s*(.+)/);
      if (match && match[1].trim().length > 2) {
        tasks.push(match[1].trim());
      }
    }
    if (tasks.length > 0) return tasks;

    // Try natural language extraction: "I have to study and go to the gym"
    const lower = msg.toLowerCase();

    // Pattern: "I have to/need to/want to X and Y"
    const nlMatch = msg.match(/\b(?:i have to|i need to|i want to|i should|i must|i'm going to|i'm planning to|today i)\s+(.+)/i);
    if (nlMatch) {
      const remainder = nlMatch[1].trim();
      // Split on " and " or ", "
      const parts = remainder.split(/\s+and\s+|,\s*/i).map(p => p.trim()).filter(p => p.length > 2);
      if (parts.length > 0) return parts;
    }

    // Pattern: comma-separated after explicit prefix
    const colonMatch = msg.match(/(?:add|create|todo|tasks|my tasks are)\s*:?\s*(.+)/i);
    if (colonMatch) {
      const parts = colonMatch[1].split(/,\s*|\s+and\s+/i).map(p => p.trim()).filter(p => p.length > 2);
      if (parts.length > 0) return parts;
    }

    return tasks;
  }

  async stream(
    prompt: string,
    onChunk: (text: string) => void,
    systemInstruction?: string
  ): Promise<LLMResponse> {
    const res = await this.generate(prompt, systemInstruction);
    const words = res.text.split(' ');
    for (let i = 0; i < words.length; i++) {
      onChunk(words[i] + ' ');
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    return res;
  }
}

interface ParsedContext {
  activeGoal: string;
  sentiment: string;
  turnsCount: number;
  dialogueHistory: Array<{ role: 'user' | 'assistant'; text: string }>;
  rankedGoals: string[];
  rankedIdeas: string[];
  userMessage: string;
}
