export interface LLMResponse {
  text: string;
  toolCalls?: Array<{ name: string; arguments: any }>;
}

export interface ILLMProvider {
  name: string;
  generate(
    prompt: string,
    systemInstruction?: string,
    tools?: any[]
  ): Promise<LLMResponse>;
  stream(
    prompt: string,
    onChunk: (text: string) => void,
    systemInstruction?: string
  ): Promise<LLMResponse>;
}
