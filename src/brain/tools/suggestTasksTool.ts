// Shared function-calling declaration for the "suggest_tasks" convention.
// LocalProvider already emits this tool call shape from regex-based task
// detection; this declaration lets GeminiProvider offer the same function
// to the real model so natural-language task mentions ("I have to do X and Y")
// get picked up the same way regardless of which LLM provider is active.
export const SUGGEST_TASKS_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'suggest_tasks',
        description: 'Call this whenever the user mentions one or more concrete to-do tasks they need to do (e.g. "I need to study React and go to the gym"). Extract each distinct task as a separate item.',
        parametersJsonSchema: {
          type: 'object',
          properties: {
            tasks: {
              type: 'array',
              description: 'The list of tasks extracted from the user message.',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'Short, clear title for the task.' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Urgency of the task.' },
                  category: { type: 'string', description: 'e.g. Work, Health, Personal, Learning, Technology, General' }
                },
                required: ['title']
              }
            }
          },
          required: ['tasks']
        }
      }
    ]
  }
];
