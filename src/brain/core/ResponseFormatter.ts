import { SuggestedTask } from '../types';

export interface FormattedResponse {
  text: string;
  suggestedTasks?: SuggestedTask[];
  pendingTransactionId?: string;
  metrics?: {
    tokensUsed?: number;
    responseTimeMs?: number;
    intent?: string;
    confidence?: number;
    agentName?: string;
    examplesCount?: number;
  };
}

export class ResponseFormatter {
  format(
    text: string, 
    suggestedTasks?: SuggestedTask[], 
    pendingTxId?: string,
    metrics?: FormattedResponse['metrics']
  ): FormattedResponse {
    let cleanText = text.trim();

    return {
      text: cleanText,
      suggestedTasks,
      pendingTransactionId: pendingTxId,
      metrics
    };
  }
}
