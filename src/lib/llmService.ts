/**
 * LLM Service — Calls OpenAI or Google Gemini via Supabase Edge Function proxy.
 * Falls back to direct browser API calls if Edge Function is unavailable.
 */

import { LLMProvider } from '@/hooks/useLLMSettings';
import { CategoryType, TransactionType } from '@/types/finance';
import type { ParsedIntent, ParsedQuery } from '@/lib/chatParser';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { DEFAULT_CURRENCY, DEFAULT_LOAN_INTEREST_RATE, DEFAULT_LOAN_TENURE_MONTHS } from '@/lib/constants';

// ── Types ──

export interface LLMParsedResult {
  intent: string;
  data: Record<string, unknown>;
  message: string;
}

// ── System Prompt ──

const SYSTEM_PROMPT = `You are FinTrack, a smart personal finance assistant. Parse the user's message and extract structured financial data.

You MUST call one of the provided tools based on what the user wants. Choose the right tool:

1. **add_transaction** — When they mention spending, earning, paying, receiving money
2. **add_bank_account** — When they mention adding a bank/savings/current/salary/cash account
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

// ── Tool Definitions ──

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
          cashback: { type: 'number', description: 'Cashback amount received on this transaction, if mentioned' },
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
          type: { type: 'string', enum: ['savings', 'current', 'salary', 'cash'] },
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

// ── API Callers ──

async function callOpenAI(
  apiKey: string,
  model: string,
  userMessage: string,
): Promise<LLMParsedResult> {
  logger.info('[LLM] Calling OpenAI', { model, messageLength: userMessage.length });

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
    logger.error('[LLM] OpenAI API error', { status: response.status, error });
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

  if (!toolCall) {
    logger.warn('[LLM] OpenAI returned no tool call, falling back to content');
    return {
      intent: 'unknown',
      data: {},
      message: data.choices?.[0]?.message?.content ?? "I couldn't understand that.",
    };
  }

  const args = JSON.parse(toolCall.function.arguments);
  logger.info('[LLM] OpenAI parsed intent', { intent: toolCall.function.name });
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
  logger.info('[LLM] Calling Gemini', { model, messageLength: userMessage.length });

  const geminiTools = [{
    function_declarations: TOOLS.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
    })),
  }];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
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
    logger.error('[LLM] Gemini API error', { status: response.status, error });
    throw new Error(`Gemini API error (${response.status}): ${error}`);
  }

  interface GeminiPart {
    functionCall?: { name: string; args: Record<string, unknown> };
    text?: string;
  }

  const data = await response.json();
  const parts: GeminiPart[] = data.candidates?.[0]?.content?.parts ?? [];
  const fnCall = parts.find((p) => p.functionCall);

  if (!fnCall || !fnCall.functionCall) {
    logger.warn('[LLM] Gemini returned no function call');
    const textPart = parts.find((p) => p.text);
    return {
      intent: 'unknown',
      data: {},
      message: textPart?.text ?? "I couldn't understand that.",
    };
  }

  const args = fnCall.functionCall.args;
  logger.info('[LLM] Gemini parsed intent', { intent: fnCall.functionCall.name });
  return {
    intent: fnCall.functionCall.name,
    data: args,
    message: typeof args.message === 'string' ? args.message : 'Parsed successfully.',
  };
}

// ── Edge Function Proxy ──

/**
 * Call LLM via Supabase Edge Function proxy (keeps API keys server-side).
 * Preferred over direct browser calls.
 */
export async function callLLMProxy(
  provider: LLMProvider,
  model: string,
  userMessage: string,
): Promise<LLMParsedResult> {
  logger.info('[LLM] Calling via Edge Function proxy', { provider, model });

  const { data, error } = await supabase.functions.invoke('llm-proxy', {
    body: { message: userMessage, provider, model },
  });

  if (error) {
    logger.error('[LLM] Edge Function error', error.message);
    throw new Error(error.message);
  }

  if (data.error) {
    logger.error('[LLM] Proxy returned error', data.error);
    throw new Error(data.error);
  }

  logger.info('[LLM] Proxy result', { intent: data.intent });
  return data as LLMParsedResult;
}

// ── Public API ──

export async function callLLM(
  provider: LLMProvider,
  apiKey: string,
  model: string,
  userMessage: string,
): Promise<LLMParsedResult> {
  logger.debug('[LLM] callLLM invoked', { provider, model });
  switch (provider) {
    case 'openai':
      return callOpenAI(apiKey, model, userMessage);
    case 'google':
      return callGemini(apiKey, model, userMessage);
    default:
      logger.error('[LLM] Unsupported provider', provider);
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// ── Intent Builder Functions ──
// Each builder maps the raw LLM data record to a strongly-typed ParsedIntent variant.

function buildTransactionIntent(data: Record<string, unknown>): ParsedIntent {
  return {
    intent: 'transaction',
    data: {
      type: (data.type as TransactionType) ?? 'expense',
      amount: (data.amount as number) ?? 0,
      currency: (data.currency as string) ?? DEFAULT_CURRENCY,
      category: (data.category as CategoryType) ?? 'other',
      description: (data.description as string) ?? '',
      date: new Date().toISOString(),
      ...(typeof data.cashback === 'number' ? { cashback: data.cashback } : {}),
    },
  };
}

function buildBankAccountIntent(data: Record<string, unknown>): ParsedIntent {
  return {
    intent: 'bank_account',
    data: {
      name: (data.name as string) ?? 'Account',
      type: (data.type as 'savings' | 'current' | 'salary' | 'cash') ?? 'savings',
      balance: (data.balance as number) ?? 0,
      currency: (data.currency as string) ?? DEFAULT_CURRENCY,
    },
  };
}

function buildCreditCardIntent(data: Record<string, unknown>): ParsedIntent {
  return {
    intent: 'credit_card',
    data: {
      name: (data.name as string) ?? 'Credit Card',
      limit: (data.limit as number) ?? 0,
      outstanding: (data.outstanding as number) ?? 0,
      dueDate: new Date().toISOString(),
      currency: (data.currency as string) ?? DEFAULT_CURRENCY,
    },
  };
}

function buildAssetIntent(data: Record<string, unknown>): ParsedIntent {
  return {
    intent: 'asset',
    data: {
      name: (data.name as string) ?? 'Asset',
      type: (data.type as 'property' | 'investment' | 'vehicle' | 'other') ?? 'other',
      value: (data.value as number) ?? 0,
      currency: (data.currency as string) ?? DEFAULT_CURRENCY,
    },
  };
}

function buildLoanIntent(data: Record<string, unknown>): ParsedIntent {
  return {
    intent: 'loan',
    data: {
      name: (data.name as string) ?? 'Loan',
      principal: (data.principal as number) ?? 0,
      rate: (data.rate as number) ?? DEFAULT_LOAN_INTEREST_RATE,
      tenureMonths: (data.tenureMonths as number) ?? DEFAULT_LOAN_TENURE_MONTHS,
      startDate: new Date().toISOString(),
      currency: (data.currency as string) ?? DEFAULT_CURRENCY,
    },
  };
}

function buildBudgetIntent(data: Record<string, unknown>): ParsedIntent {
  return {
    intent: 'budget',
    data: {
      category: (data.category as CategoryType) ?? 'other',
      monthlyLimit: (data.monthlyLimit as number) ?? 0,
      currency: (data.currency as string) ?? DEFAULT_CURRENCY,
    },
  };
}

function buildQueryIntent(data: Record<string, unknown>): ParsedIntent {
  const queryType = (data.queryType as ParsedQuery['queryType']) ?? 'summary';
  const period = (data.period as ParsedQuery['period']) ?? 'this_month';
  const category = data.category as CategoryType | undefined;
  return {
    intent: 'query',
    data: {
      queryType,
      category,
      period,
    },
  };
}

/** Maps an LLM tool name to its domain intent name. */
const LLM_INTENT_MAP: Record<string, string> = {
  add_transaction: 'transaction',
  add_bank_account: 'bank_account',
  add_credit_card: 'credit_card',
  add_asset: 'asset',
  add_loan: 'loan',
  set_budget: 'budget',
  answer_query: 'query',
};

/** Lookup table mapping a domain intent name to its builder function. */
const INTENT_BUILDERS: Record<string, (data: Record<string, unknown>) => ParsedIntent> = {
  transaction: buildTransactionIntent,
  bank_account: buildBankAccountIntent,
  credit_card: buildCreditCardIntent,
  asset: buildAssetIntent,
  loan: buildLoanIntent,
  budget: buildBudgetIntent,
  query: buildQueryIntent,
};

/** Maps an LLM tool call result to a strongly-typed ParsedIntent. */
export function mapLLMResultToIntent(result: LLMParsedResult): ParsedIntent | { intent: 'unknown'; data: null } {
  const mappedIntent = LLM_INTENT_MAP[result.intent] ?? 'unknown';
  logger.debug('[LLM] Mapped intent', { raw: result.intent, mapped: mappedIntent });

  const builder = INTENT_BUILDERS[mappedIntent];
  if (!builder) return { intent: 'unknown', data: null };

  return builder(result.data);
}
