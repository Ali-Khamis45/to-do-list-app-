import { ILLMProvider, LLMResponse } from './LLMProvider';

export class LocalProvider implements ILLMProvider {
  name = 'Local Fallback Agent';

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
    tools?: any[]
  ): Promise<LLMResponse> {
    const q = prompt.toLowerCase().trim();

    // Check for task creation keywords
    if (this.isTaskCreationIntent(prompt)) {
      const extracted = this.extractTasksFromMessage(prompt);
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
          text: `I noticed some potential tasks in your message. Would you like me to add them to your checklist?`,
          toolCalls: [{
            name: 'suggest_tasks',
            arguments: { tasks }
          }]
        };
      }
    }

    // Checking for emotional cues — must be checked BEFORE greeting detection
    // so "hey I feel overwhelmed" routes to empathy, not to the greeting
    if (/\b(stressed|overwhelmed|anxious|tired|sad|exhausted|burnout|struggling|down|blue|too many tasks)\b/i.test(q)) {
      return {
        text: `I'm really sorry you're feeling this way. It's completely natural to get overwhelmed when there's so much going on around you. ❤️\n\nSometimes just saying it out loud helps release a bit of that weight. What's sitting heaviest on your chest right now?`
      };
    }

    // Pure greeting detection — only match messages that are PURELY greetings
    // (short messages like "hi", "hello", "hey"), NOT messages that happen to
    // contain greeting words ("hey I need a React plan")
    const words = q.split(/\s+/);
    const isOnlyGreeting = words.length <= 4 && /^(hello|hi|hey|howdy|yo|hiya|greetings)\b/.test(q);
    const isHowAreYou = /^how are you/.test(q);
    if (isOnlyGreeting || isHowAreYou) {
      return {
        text: `Hey there! 👋 What's on your mind today?`
      };
    }

    // Idea/brainstorm queries
    if (q.includes('idea') || q.includes('brainstorm') || q.includes('startup') || q.includes('business')) {
      return {
        text: `That sounds interesting! Tell me more about what you're thinking — what problem are you trying to solve, or what excites you about this?`
      };
    }

    // Goal queries
    if (q.includes('goal') && (q.includes('show') || q.includes('list') || q.includes('my') || q.includes('what'))) {
      return {
        text: `Let me pull up your goals. You can check the Smart Goals section in the sidebar for a full breakdown. What specifically are you looking to track?`
      };
    }

    // Task queries
    if (q.includes('task') && (q.includes('show') || q.includes('list') || q.includes('today') || q.includes('my'))) {
      return {
        text: `You can see today's tasks on your Dashboard. Want me to help you reorganize or prioritize anything?`
      };
    }

    // Coding/tech queries
    if (q.includes('code') || q.includes('react') || q.includes('typescript') || q.includes('javascript') || q.includes('python')) {
      return {
        text: `Nice — what are you building? I'd love to hear more about the tech stack you're working with so I can give you more targeted advice.`
      };
    }

    // Help/capabilities
    if (q.includes('what can you do') || q.includes('how do i') || q.includes('commands')) {
      return {
        text: `We can do a lot together! I can brainstorm ideas with you, help you plan projects, organize your day, or just talk things through. What sounds useful right now?`
      };
    }

    // Default: continue the conversation naturally instead of repeating a static phrase
    return {
      text: `That's interesting — tell me more about what you're thinking. I'd like to understand where you're coming from so we can figure out the best next step together.`
    };
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

  private isTaskCreationIntent(msg: string): boolean {
    const lower = msg.toLowerCase();
    if (/(?:^|\n)\s*(?:\d+[.):–\-]|\*|-|•)\s+\S/m.test(msg)) return true;
    if (/^\s*(?:add|create|schedule|put|todo|tasks|remind me to)\b/i.test(lower)) return true;
    if (/(?:(?:add|create|schedule|put|todo|tasks|remind me to)\s*:\s*)/i.test(lower)) return true;
    return false;
  }

  private extractTasksFromMessage(msg: string): string[] {
    const lines = msg.split(/\n|,(?=\s*(?:\d+[.):–-]|\*|-|•))/);
    const tasks: string[] = [];

    for (const line of lines) {
      const match = line.match(/^[\s]*(?:\d+[.):–\-]|\*|-|•)\s*(.+)/);
      if (match && match[1].trim().length > 2) {
        tasks.push(match[1].trim());
      }
    }

    if (tasks.length === 0) {
      const inlineTrigger = msg.match(/(?:(?:add|create|schedule|put|todo|tasks|remind me to)\s*:\s*)(.+)/i);
      if (inlineTrigger) {
        const parts = inlineTrigger[1].split(/,|and /i).map(s => s.replace(/^[\d.):–\-*•\s]+/, '').trim()).filter(s => s.length > 2);
        tasks.push(...parts);
      }
    }

    return tasks;
  }
}
