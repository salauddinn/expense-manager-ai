/**
 * Chat intent formatter.
 * Converts a ParsedIntent into a human-readable confirmation message for the chat UI.
 * Pure functions — no hooks, no side effects.
 */

import { ParsedIntent } from '@/lib/chatParser';
import { formatCurrency } from '@/lib/currencies';
import { getCategoryInfo } from '@/lib/categories';
import { answerQuery, FinancialData } from '@/lib/queryEngine';
import { HELP_TEXT } from '@/components/ChatComponents';

export interface BuildResponseResult {
  content: string;
  parsedIntent?: ParsedIntent;
}

/**
 * Converts a ParsedIntent to the assistant's confirmation message and optional intent payload.
 * For query/unknown intents the result has no parsedIntent (no confirmation step needed).
 */
export function buildIntentResponse(
  parsed: ParsedIntent,
  financialData: FinancialData,
  imageUrl?: string,
): BuildResponseResult {
  switch (parsed.intent) {
    case 'transaction': {
      const d = parsed.data;
      const cashbackText = d.cashback ? ` with cashback **${formatCurrency(d.cashback, d.currency)}**` : '';
      const sourceText = d.sourceName ? ` from **${d.sourceName}**` : '';
      return {
        content: `I detected a **${d.type}** of **${formatCurrency(d.amount, d.currency)}** in category **${getCategoryInfo(d.category).label}**${sourceText}${cashbackText}. Shall I save this?`,
        parsedIntent: { intent: 'transaction', data: { ...d, receiptUrl: imageUrl } },
      };
    }
    case 'bank_account': {
      const d = parsed.data;
      return {
        content: `I'll add a **${d.type} account** "${d.name}" with balance **${formatCurrency(d.balance, d.currency)}**. Save it?`,
        parsedIntent: parsed,
      };
    }
    case 'credit_card': {
      const d = parsed.data;
      const outstandingText = d.outstanding ? ` and outstanding **${formatCurrency(d.outstanding, d.currency)}**` : '';
      return {
        content: `I'll add **${d.name}** with limit **${formatCurrency(d.limit, d.currency)}**${outstandingText}. Save it?`,
        parsedIntent: parsed,
      };
    }
    case 'asset': {
      const d = parsed.data;
      return {
        content: `I'll add asset **"${d.name}"** (${d.type}) worth **${formatCurrency(d.value, d.currency)}**. Save it?`,
        parsedIntent: parsed,
      };
    }
    case 'loan': {
      const d = parsed.data;
      return {
        content: `I'll add **${d.name}** of **${formatCurrency(d.principal, d.currency)}** at **${d.rate}%** for **${d.tenureMonths} months**. Save it?`,
        parsedIntent: parsed,
      };
    }
    case 'budget': {
      const d = parsed.data;
      return {
        content: `I'll set a monthly budget of **${formatCurrency(d.monthlyLimit, d.currency)}** for **${getCategoryInfo(d.category).label}**. Save it?`,
        parsedIntent: parsed,
      };
    }
    case 'query':
      return { content: answerQuery(parsed.data, financialData) };
    default:
      return { content: HELP_TEXT };
  }
}
