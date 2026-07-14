import { SuggestedTask } from '../types';

export interface FormattedResponse {
  text: string;
  suggestedTasks?: SuggestedTask[];
  pendingTransactionId?: string;
}

export class ResponseFormatter {
  format(text: string, suggestedTasks?: SuggestedTask[], pendingTxId?: string): FormattedResponse {
    // Standard markdown formatting checks
    let cleanText = text.trim();

    return {
      text: cleanText,
      suggestedTasks,
      pendingTransactionId: pendingTxId
    };
  }
}
