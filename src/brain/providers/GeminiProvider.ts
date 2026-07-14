import { GoogleGenAI } from '@google/genai';
import { ILLMProvider, LLMResponse } from './LLMProvider';

export class GeminiProvider implements ILLMProvider {
  name = 'Gemini 2.5 Flash';
  private client: GoogleGenAI | null = null;

  constructor() {
    const apiKey = (import.meta.env?.VITE_GEMINI_API_KEY as string) || '';
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  async generate(
    prompt: string,
    systemInstruction?: string,
    tools?: any[]
  ): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error('Gemini API key is not configured.');
    }

    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    if (tools && tools.length > 0) {
      config.tools = tools;
    }

    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config
    });

    const text = response.text || '';
    let toolCalls: LLMResponse['toolCalls'] | undefined;

    // Check for function calls in response
    if (response.functionCalls && response.functionCalls.length > 0) {
      toolCalls = response.functionCalls.map(call => ({
        name: call.name,
        arguments: call.args
      }));
    }

    return { text, toolCalls };
  }

  async stream(
    prompt: string,
    systemInstruction?: string,
    onChunk: (text: string) => void
  ): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error('Gemini API key is not configured.');
    }

    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const responseStream = await this.client.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config
    });

    let fullText = '';
    for await (const chunk of responseStream) {
      const chunkText = chunk.text || '';
      fullText += chunkText;
      if (chunkText) {
        onChunk(chunkText);
      }
    }

    return { text: fullText };
  }
}
