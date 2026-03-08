/**
 * LLM Service — Calls OpenAI or Google Gemini APIs directly from the browser.
 *
 * The user provides their own API key (BYOK pattern).
 * Uses function/tool calling to extract structured financial data.
 */

import { LLMProvider } from '@/hooks/useLLMSettings';
import { CategoryType, TransactionType } from '@/types/finance';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export interface LLMParsedResult {
  intent: string;
  data: Record<string, unknown>;
  message: string;
}

// ────────────────────────────────────────────────────────────────
// System Prompt
// ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are FinTrack, a smart personal finance assistant. Parse the user's message and extract structured financial data.

You MUST call one of the provided tools based on what the user wants. Choose the right tool:

1. **add_transaction** — When they mention spending, earning, paying, receiving money
2. **add_bank_account** — When they mention adding a bank/savings/current/salary account
3. **add_credit_card** — When they mention adding a credit card
4. **add_asset** — When they mention property, investments, vehicles, gold, stocks, mutual funds
5. **add_loan** — When they mention loans (home, car, personal, education)
6. **set_budget** — When they mention setting budget limits for categories
7. **answer_query** — When they ask about spending, income, balances, or summaries

Important rules:
- "lakh" = 100,000 and "crore" = 10,000,000 (Indian number system)
- "k" = 1,000, "m" = 1,000,000
- Default currency is INR unless specified otherwise
- For transactions, determine if it's income or expense from context
- Detect the category from context (food, groceries, transport, shopping, bills, entertainment, health, education, rent, travel, salary, freelance, investment, gift, refund, other)
- Be friendly and confirm what you understood in the message field`;

// ────────────────────────────────────────────────────────────────
// Tool Definitions (OpenAI format)
// ────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'add_transaction',
      description: 'Add an income or expense transaction',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['income', 'expense'] },
          amount: { type: 'number', description: 'Amount in the detected currency' },
          currency: { type: 'string', default: 'INR' },
          category: {
            type: 'string',
            enum: ['food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'education', 'rent', 'groceries', 'travel', 'salary', 'freelance', 'investment', 'gift', 'refund', 'other'],
          },
          description: { type: 'string', description: 'Brief description of the transaction' },
          message: { type: 'string', description: 'Friendly confirmation message to show the user' },
        },
        required: ['type', 'amount', 'currency', 'category', 'description', 'message'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_bank_account',
      description: 'Add a bank account',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Account name (e.g. SBI Savings)' },
          type: { type: 'string', enum: ['savings', 'current', 'salary'] },
          balance: { type: 'number' },
          currency: { type: 'string', default: 'INR' },
          message: { type: 'string' },
        },
        required: ['name', 'type', 'balance', 'currency', 'message'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_credit_card',
      description: 'Add a credit card',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          limit: { type: 'number' },
          outstanding: { type: 'number', default: 0 },
          currency: { type: 'string', default: 'INR' },
          message: { type: 'string' },
        },
        required: ['name', 'limit', 'currency', 'message'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_asset',
      description: 'Add an asset (property, investment, vehicle, etc.)',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['property', 'investment', 'vehicle', 'other'] },
          value: { type: 'number' },
          currency: { type: 'string', default: 'INR' },
          message: { type: 'string' },
        },
        required: ['name', 'type', 'value', 'currency', 'message'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_loan',
      description: 'Add a loan',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          principal: { type: 'number' },
          rate: { type: 'number', description: 'Annual interest rate %' },
          tenureMonths: { type: 'number' },
          currency: { type: 'string', default: 'INR' },
          message: { type: 'string' },
        },
        required: ['name', 'principal', 'rate', 'tenureMonths', 'currency', 'message'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_budget',
      description: 'Set a monthly budget goal for a category',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'education', 'rent', 'groceries', 'travel', 'other'],
          },
          monthlyLimit: { type: 'number' },
          currency: { type: 'string', default: 'INR' },
          message: { type: 'string' },
        },
        required: ['category', 'monthlyLimit', 'currency', 'message'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'answer_query',
      description: 'Answer a financial query about spending, income, or balances',
      parameters: {
        type: 'object',
        properties: {
          queryType: { type: 'string', enum: ['spending', 'income', 'balance', 'summary'] },
          category: { type: 'string', description: 'Optional category filter' },
          period: { type: 'string', enum: ['today', 'this_week', 'this_month', 'this_year'] },
          message: { type: 'string', description: 'Friendly answer to show directly. Include computed totals if available.' },
        },
        required: ['queryType', 'period', 'message'],
      },
    },
  },
];

// ────────────────────────────────────────────────────────────────
// API Callers
// ────────────────────────────────────────────────────────────────

async function callOpenAI(
  apiKey: string,
  model: string,
  userMessage: string,
): Promise<LLMParsedResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      tools: TOOLS,
      tool_choice: 'required',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

  if (!toolCall) {
    // Fallback to content if no tool call
    return {
      intent: 'unknown',
      data: {},
      message: data.choices?.[0]?.message?.content ?? "I couldn't understand that.",
    };
  }

  const args = JSON.parse(toolCall.function.arguments);
  return {
    intent: toolCall.function.name,
    data: args,
    message: args.message ?? 'Parsed successfully.',
  };
}

async function callGemini(
  apiKey: string,
  model: string,
  userMessage: string,
): Promise<LLMParsedResult> {
  // Convert OpenAI tool format → Gemini format
  const geminiTools = [{
    function_declarations: TOOLS.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
    })),
  }];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        tools: geminiTools,
        tool_config: { function_calling_config: { mode: 'ANY' } },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const fnCall = parts.find((p: any) => p.functionCall);

  if (!fnCall) {
    const textPart = parts.find((p: any) => p.text);
    return {
      intent: 'unknown',
      data: {},
      message: textPart?.text ?? "I couldn't understand that.",
    };
  }

  const args = fnCall.functionCall.args;
  return {
    intent: fnCall.functionCall.name,
    data: args,
    message: args.message ?? 'Parsed successfully.',
  };
}

// ────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────

/** Call the configured LLM to parse a user's financial message. */
export async function callLLM(
  provider: LLMProvider,
  apiKey: string,
  model: string,
  userMessage: string,
): Promise<LLMParsedResult> {
  switch (provider) {
    case 'openai':
      return callOpenAI(apiKey, model, userMessage);
    case 'google':
      return callGemini(apiKey, model, userMessage);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/** Map LLM tool call result → ParsedIntent compatible format. */
export function mapLLMResultToIntent(result: LLMParsedResult) {
  const { intent, data } = result;

  const intentMap: Record<string, string> = {
    add_transaction: 'transaction',
    add_bank_account: 'bank_account',
    add_credit_card: 'credit_card',
    add_asset: 'asset',
    add_loan: 'loan',
    set_budget: 'budget',
    answer_query: 'query',
  };

  const mappedIntent = intentMap[intent] ?? 'unknown';

  if (mappedIntent === 'transaction') {
    return {
      intent: 'transaction' as const,
      data: {
        type: (data.type as TransactionType) ?? 'expense',
        amount: (data.amount as number) ?? 0,
        currency: (data.currency as string) ?? 'INR',
        category: (data.category as CategoryType) ?? 'other',
        description: (data.description as string) ?? '',
        date: new Date().toISOString(),
      },
    };
  }

  if (mappedIntent === 'bank_account') {
    return {
      intent: 'bank_account' as const,
      data: {
        name: (data.name as string) ?? 'Account',
        type: (data.type as 'savings' | 'current' | 'salary') ?? 'savings',
        balance: (data.balance as number) ?? 0,
        currency: (data.currency as string) ?? 'INR',
      },
    };
  }

  if (mappedIntent === 'credit_card') {
    return {
      intent: 'credit_card' as const,
      data: {
        name: (data.name as string) ?? 'Credit Card',
        limit: (data.limit as number) ?? 0,
        outstanding: (data.outstanding as number) ?? 0,
        dueDate: new Date().toISOString(),
        currency: (data.currency as string) ?? 'INR',
      },
    };
  }

  if (mappedIntent === 'asset') {
    return {
      intent: 'asset' as const,
      data: {
        name: (data.name as string) ?? 'Asset',
        type: (data.type as 'property' | 'investment' | 'vehicle' | 'other') ?? 'other',
        value: (data.value as number) ?? 0,
        currency: (data.currency as string) ?? 'INR',
      },
    };
  }

  if (mappedIntent === 'loan') {
    return {
      intent: 'loan' as const,
      data: {
        name: (data.name as string) ?? 'Loan',
        principal: (data.principal as number) ?? 0,
        rate: (data.rate as number) ?? 8.5,
        tenureMonths: (data.tenureMonths as number) ?? 60,
        startDate: new Date().toISOString(),
        currency: (data.currency as string) ?? 'INR',
      },
    };
  }

  if (mappedIntent === 'budget') {
    return {
      intent: 'budget' as const,
      data: {
        category: (data.category as CategoryType) ?? 'other',
        monthlyLimit: (data.monthlyLimit as number) ?? 0,
        currency: (data.currency as string) ?? 'INR',
      },
    };
  }

  if (mappedIntent === 'query') {
    return {
      intent: 'query' as const,
      data: {
        queryType: (data.queryType as string) ?? 'summary',
        category: data.category as string | undefined,
        period: (data.period as string) ?? 'this_month',
      },
    };
  }

  return { intent: 'unknown' as const, data: null };
}
