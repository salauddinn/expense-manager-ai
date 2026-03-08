/**
 * Chat Parser — Natural language parser for financial commands.
 *
 * Supports 7 intents:
 *   1. transaction  — "spent ₹500 on groceries"
 *   2. bank_account — "add SBI savings account 50,000"
 *   3. credit_card  — "add HDFC credit card limit 2 lakh"
 *   4. asset        — "add flat worth 50 lakh"
 *   5. loan         — "home loan 30 lakh at 8.5% for 20 years"
 *   6. budget       — "set budget for food 5000"
 *   7. query        — "how much did I spend this month?"
 */

import { CategoryType, TransactionType } from '@/types/finance';
import { DEFAULT_CURRENCY } from './currencies';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export type ParsedIntent =
  | { intent: 'transaction'; data: ParsedTransaction }
  | { intent: 'bank_account'; data: ParsedBankAccount }
  | { intent: 'credit_card'; data: ParsedCreditCard }
  | { intent: 'asset'; data: ParsedAsset }
  | { intent: 'loan'; data: ParsedLoan }
  | { intent: 'budget'; data: ParsedBudget }
  | { intent: 'query'; data: ParsedQuery }
  | { intent: 'unknown'; data: null };

export interface ParsedTransaction {
  type: TransactionType;
  amount: number;
  currency: string;
  category: CategoryType;
  description: string;
  date: string;
  receiptUrl?: string;
  /** Source account/card name detected from "from ..." clause */
  sourceName?: string;
  /** Whether the source is a credit card (vs bank account) */
  sourceIsCard?: boolean;
}

export interface ParsedBankAccount {
  name: string;
  type: 'savings' | 'current' | 'salary' | 'cash';
  balance: number;
  currency: string;
}

export interface ParsedCreditCard {
  name: string;
  limit: number;
  outstanding: number;
  dueDate: string;
  currency: string;
}

export interface ParsedAsset {
  name: string;
  type: 'property' | 'investment' | 'vehicle' | 'other';
  value: number;
  currency: string;
}

export interface ParsedLoan {
  name: string;
  principal: number;
  rate: number;
  tenureMonths: number;
  startDate: string;
  currency: string;
}

export interface ParsedBudget {
  category: CategoryType;
  monthlyLimit: number;
  currency: string;
}

export interface ParsedQuery {
  queryType: 'spending' | 'income' | 'balance' | 'summary';
  category?: CategoryType;
  period: 'today' | 'this_week' | 'this_month' | 'this_year';
}

// ────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────

/** Map currency symbols and common names to ISO codes. */
const CURRENCY_MAP: Record<string, string> = {
  '₹': 'INR', rs: 'INR', inr: 'INR', rupees: 'INR', rupee: 'INR',
  '$': 'USD', usd: 'USD', dollars: 'USD', dollar: 'USD',
  '€': 'EUR', eur: 'EUR', euros: 'EUR', euro: 'EUR',
  '£': 'GBP', gbp: 'GBP', pounds: 'GBP', pound: 'GBP',
  '¥': 'JPY', jpy: 'JPY', yen: 'JPY',
};

/** Multiplier words (Indian & western conventions). */
const MULTIPLIERS: Record<string, number> = {
  lakh: 1e5, lakhs: 1e5, lac: 1e5, lacs: 1e5,
  crore: 1e7, crores: 1e7, cr: 1e7,
  thousand: 1e3, thousands: 1e3, k: 1e3,
  million: 1e6, mil: 1e6, m: 1e6,
  billion: 1e9, b: 1e9,
};

const MULTIPLIER_WORDS = Object.keys(MULTIPLIERS).filter((k) => k.length > 1).join('|');
const MULTIPLIER_REGEX = new RegExp(
  `([\\d,]+\\.?\\d*)\\s*(${MULTIPLIER_WORDS})\\b`,
  'i',
);
const MULTIPLIER_REGEX_GLOBAL = new RegExp(
  `([\\d,]+\\.?\\d*)\\s*(${MULTIPLIER_WORDS}|[kmb])\\b`,
  'gi',
);
const SHORT_MULTIPLIER_REGEX = /([\d,]+\.?\d*)\s?([kmb])\b/i;

const EXPENSE_KEYWORDS = [
  'spent', 'paid', 'bought', 'expense', 'cost', 'charged', 'bill', 'purchase',
];
const INCOME_KEYWORDS = [
  'received', 'earned', 'got', 'income', 'salary', 'credited', 'refund',
];

const CATEGORY_KEYWORDS: Record<string, CategoryType> = {
  // Food & Dining
  food: 'food', restaurant: 'food', dinner: 'food', lunch: 'food',
  breakfast: 'food', coffee: 'food', cafe: 'food', snack: 'food', pizza: 'food',
  biryani: 'food', swiggy: 'food', zomato: 'food',
  // Groceries
  grocery: 'groceries', groceries: 'groceries', supermarket: 'groceries',
  vegetables: 'groceries', fruits: 'groceries', bigbasket: 'groceries',
  blinkit: 'groceries', zepto: 'groceries',
  // Transport
  uber: 'transport', cab: 'transport', taxi: 'transport', fuel: 'transport',
  petrol: 'transport', diesel: 'transport', gas: 'transport', bus: 'transport',
  metro: 'transport', train: 'transport', ola: 'transport', rapido: 'transport',
  parking: 'transport', toll: 'transport',
  // Housing
  rent: 'rent', housing: 'rent', maintenance: 'rent', society: 'rent',
  // Bills & Utilities
  electricity: 'bills', water: 'bills', internet: 'bills', wifi: 'bills',
  phone: 'bills', mobile: 'bills', recharge: 'bills', dth: 'bills',
  broadband: 'bills', jio: 'bills', airtel: 'bills',
  'credit card bill': 'bills', 'card bill': 'bills', emi: 'bills',
  // Entertainment
  movie: 'entertainment', netflix: 'entertainment', spotify: 'entertainment',
  game: 'entertainment', hotstar: 'entertainment', prime: 'entertainment',
  youtube: 'entertainment', concert: 'entertainment',
  // Health
  doctor: 'health', medicine: 'health', hospital: 'health', pharmacy: 'health',
  gym: 'health', fitness: 'health', medical: 'health',
  // Education
  school: 'education', college: 'education', course: 'education',
  book: 'education', books: 'education', tuition: 'education',
  udemy: 'education', coaching: 'education',
  // Travel
  flight: 'travel', hotel: 'travel', trip: 'travel', travel: 'travel',
  vacation: 'travel', booking: 'travel', airbnb: 'travel',
  // Shopping
  shopping: 'shopping', clothes: 'shopping', amazon: 'shopping',
  flipkart: 'shopping', shoes: 'shopping', myntra: 'shopping',
  meesho: 'shopping', electronics: 'shopping',
  // Income categories
  salary: 'salary', freelance: 'freelance', investment: 'investment',
  dividend: 'investment', interest: 'investment', gift: 'gift', refund: 'refund',
};

/** Intent keyword groups — order matters (checked top → bottom). */
const INTENT_KEYWORDS = {
  query: [
    'how much', 'total spent', 'total income', 'total expense',
    'spending on', 'summary', 'what did i spend', 'show me',
    'my balance', 'net worth', 'how many',
  ],
  bank_account: [
    'bank account', 'savings account', 'current account', 'salary account',
    'add account', 'bank balance', 'open account',
  ],
  credit_card: [
    'credit card', 'add card', 'card limit', 'card outstanding',
  ],
  asset: [
    'add asset', 'add property', 'add flat', 'add house', 'add car',
    'add bike', 'add vehicle', 'add investment', 'property worth',
    'flat worth', 'house worth', 'car worth', 'investment worth',
    'add gold', 'add stocks', 'add mutual fund', 'add fd',
  ],
  loan: [
    'add loan', 'home loan', 'car loan', 'personal loan',
    'education loan', 'loan of', 'loan at', 'student loan',
    'housing loan', 'vehicle loan',
  ],
  budget: [
    'set budget', 'budget for', 'budget limit', 'monthly budget',
    'limit for', 'set limit',
  ],
} as const;

/** Common Indian bank names used for auto-naming. */
const BANK_NAMES = [
  'sbi', 'hdfc', 'icici', 'axis', 'kotak', 'pnb', 'bob', 'yes bank',
  'idbi', 'canara', 'union', 'indusind', 'federal', 'rbl',
  'chase', 'bofa', 'wells fargo', 'citi',
];

/** Card issuer names. */
const CARD_ISSUERS = [
  'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'amex', 'citi', 'rbl',
  'yes bank', 'indusind', 'au', 'idfc', 'visa', 'mastercard',
];

// ────────────────────────────────────────────────────────────────
// Amount & Currency Extraction
// ────────────────────────────────────────────────────────────────

interface AmountResult {
  amount: number | null;
  currency: string;
}

/** Parse a raw number string (e.g. "1,00,000.50") → number. */
function parseNum(raw: string): number {
  return parseFloat(raw.replace(/,/g, ''));
}

/** Extract the first amount + currency found in a message. */
function extractAmount(message: string): AmountResult {
  let amount: number | null = null;
  let currency = DEFAULT_CURRENCY;

  // 1. Multiplier words: "1 lakh", "2.5 crore"
  const multMatch = message.match(MULTIPLIER_REGEX);
  if (multMatch) {
    const multiplier = MULTIPLIERS[multMatch[2].toLowerCase()];
    amount = parseNum(multMatch[1]) * (multiplier ?? 1);
  }

  // 2. Short multiplier: "50k", "2m"
  if (amount === null) {
    const shortMatch = message.match(SHORT_MULTIPLIER_REGEX);
    if (shortMatch) {
      const multiplier = MULTIPLIERS[shortMatch[2].toLowerCase()];
      amount = parseNum(shortMatch[1]) * (multiplier ?? 1);
    }
  }

  // 3. Currency symbol prefix: "₹500", "$50"
  if (amount === null) {
    const symMatch = message.match(/([₹$€£¥])\s*([\d,]+\.?\d*)/);
    if (symMatch) {
      currency = CURRENCY_MAP[symMatch[1]] ?? DEFAULT_CURRENCY;
      amount = parseNum(symMatch[2]);
    }
  }

  // 4. Currency code suffix: "500 INR", "50 dollars"
  if (amount === null) {
    const codeMatch = message.match(
      /([\d,]+\.?\d*)\s*(INR|USD|EUR|GBP|JPY|AED|CAD|AUD|rupees?|dollars?|euros?|pounds?|yen)/i,
    );
    if (codeMatch) {
      amount = parseNum(codeMatch[1]);
      currency = CURRENCY_MAP[codeMatch[2].toLowerCase()] ?? codeMatch[2].toUpperCase();
    }
  }

  // 5. "Rs" prefix: "Rs 500", "Rs.500"
  if (amount === null) {
    const rsMatch = message.match(/rs\.?\s*([\d,]+\.?\d*)/i);
    if (rsMatch) {
      amount = parseNum(rsMatch[1]);
      currency = 'INR';
    }
  }

  // 6. Fallback: bare number
  if (amount === null) {
    const numMatch = message.match(/(\d[\d,]*\.?\d*)/);
    if (numMatch) {
      amount = parseNum(numMatch[1]);
    }
  }

  // Detect currency symbol anywhere if still default
  if (currency === DEFAULT_CURRENCY) {
    const symAnywhere = message.match(/([₹$€£¥])/);
    if (symAnywhere) {
      currency = CURRENCY_MAP[symAnywhere[1]] ?? DEFAULT_CURRENCY;
    }
  }

  return { amount, currency };
}

/** Extract ALL numbers from a message (for multi-value fields like limit + outstanding). */
function extractAllNumbers(message: string): number[] {
  const numbers: number[] = [];

  // Try multiplier words first
  let match: RegExpExecArray | null;
  const regex = new RegExp(MULTIPLIER_REGEX_GLOBAL.source, 'gi');
  while ((match = regex.exec(message)) !== null) {
    const multiplier = MULTIPLIERS[match[2].toLowerCase()] ?? 1;
    numbers.push(parseNum(match[1]) * multiplier);
  }
  if (numbers.length > 0) return numbers;

  // Fallback: plain numbers (with optional currency symbol prefix)
  const plainRegex = /(?:[₹$€£¥]\s*)?([\d,]+\.?\d*)/g;
  while ((match = plainRegex.exec(message)) !== null) {
    const val = parseNum(match[1]);
    if (val > 0) numbers.push(val);
  }
  return numbers;
}

// ────────────────────────────────────────────────────────────────
// Date & Category Detection
// ────────────────────────────────────────────────────────────────

/** Detect a relative date from natural language. */
function detectDate(text: string): string {
  const now = new Date();

  if (text.includes('yesterday')) {
    now.setDate(now.getDate() - 1);
  } else if (text.includes('day before yesterday')) {
    now.setDate(now.getDate() - 2);
  } else if (text.includes('last week')) {
    now.setDate(now.getDate() - 7);
  }

  return now.toISOString();
}

/** Detect expense/income category from keywords. */
function detectCategory(text: string): CategoryType {
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (text.includes(keyword)) return category;
  }
  return 'other';
}

// ────────────────────────────────────────────────────────────────
// Intent Detection
// ────────────────────────────────────────────────────────────────

type IntentType = keyof typeof INTENT_KEYWORDS | 'transaction';

/** Phrases that look like an intent keyword but are actually transactions. */
const TRANSACTION_OVERRIDES = [
  'credit card bill', 'card bill', 'card payment', 'card due',
  'emi', 'loan emi', 'loan payment',
];

/** Determine the user's intent from their message. */
function detectIntent(text: string): IntentType {
  // Check transaction overrides first — these trump intent keywords
  if (TRANSACTION_OVERRIDES.some((kw) => text.includes(kw))) {
    return 'transaction';
  }

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return intent as IntentType;
    }
  }
  return 'transaction';
}

// ────────────────────────────────────────────────────────────────
// Per-Intent Parsers
// ────────────────────────────────────────────────────────────────

/** Find a matching name from a list of known names in the text. */
function findKnownName(text: string, names: string[], suffix: string): string | null {
  for (const name of names) {
    if (text.includes(name)) {
      return name.toUpperCase() + ' ' + suffix;
    }
  }
  return null;
}

/** Capitalize first letter. */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function parseBankAccount(message: string, lower: string): ParsedBankAccount | null {
  const { amount, currency } = extractAmount(message);
  if (!amount) return null;

  const accountType: 'savings' | 'current' | 'salary' = lower.includes('current')
    ? 'current'
    : lower.includes('salary')
      ? 'salary'
      : 'savings';

  const name = findKnownName(lower, BANK_NAMES, capitalize(accountType))
    ?? `${capitalize(accountType)} Account`;

  return { name, type: accountType, balance: amount, currency };
}

function parseCreditCard(message: string, lower: string): ParsedCreditCard | null {
  const numbers = extractAllNumbers(message);
  if (numbers.length === 0) return null;

  const name = findKnownName(lower, CARD_ISSUERS, 'Card') ?? 'Credit Card';
  const { currency } = extractAmount(message);

  return {
    name,
    limit: numbers[0],
    outstanding: numbers[1] ?? 0,
    dueDate: new Date().toISOString(),
    currency,
  };
}

function parseAsset(message: string, lower: string): ParsedAsset | null {
  const { amount, currency } = extractAmount(message);
  if (!amount) return null;

  // Determine asset type and default name
  const assetTypeMap: [string[], 'property' | 'investment' | 'vehicle', string][] = [
    [['flat', 'house', 'property', 'apartment', 'plot', 'land'], 'property', 'Property'],
    [['car', 'bike', 'vehicle', 'scooter', 'two wheeler'], 'vehicle', 'Vehicle'],
    [['gold'], 'investment', 'Gold'],
    [['stock', 'stocks', 'shares'], 'investment', 'Stocks'],
    [['mutual fund', 'mf', 'sip'], 'investment', 'Mutual Fund'],
    [['fd', 'fixed deposit'], 'investment', 'Fixed Deposit'],
    [['ppf', 'epf', 'pf'], 'investment', 'Provident Fund'],
    [['investment'], 'investment', 'Investment'],
  ];

  let assetType: ParsedAsset['type'] = 'other';
  let name = 'Asset';

  for (const [keywords, type, defaultName] of assetTypeMap) {
    if (keywords.some((kw) => lower.includes(kw))) {
      assetType = type;
      name = defaultName;
      break;
    }
  }

  // Try to extract a custom name: "add <name> worth ..."
  const customNameMatch = message.match(
    /(?:add|my)\s+(.+?)(?:\s+worth|\s+valued|\s+of|\s+at|\s+₹|\s+\$|\s+\d)/i,
  );
  if (customNameMatch) {
    const extracted = customNameMatch[1].trim().replace(/^(add|my)\s+/i, '');
    if (extracted.length >= 2 && extracted.length <= 30) {
      name = extracted;
    }
  }

  return { name, type: assetType, value: amount, currency };
}

function parseLoan(message: string, lower: string): ParsedLoan | null {
  const numbers = extractAllNumbers(message);
  if (numbers.length === 0) return null;

  // Determine loan name
  const loanNameMap: [string[], string][] = [
    [['home loan', 'housing loan'], 'Home Loan'],
    [['car loan', 'vehicle loan'], 'Car Loan'],
    [['personal loan'], 'Personal Loan'],
    [['education loan', 'student loan'], 'Education Loan'],
    [['gold loan'], 'Gold Loan'],
    [['business loan'], 'Business Loan'],
  ];

  let name = 'Loan';
  for (const [keywords, loanName] of loanNameMap) {
    if (keywords.some((kw) => lower.includes(kw))) {
      name = loanName;
      break;
    }
  }

  const { currency } = extractAmount(message);
  const principal = numbers[0];

  // Interest rate — look for "X%" or "at X%"
  const rateMatch = message.match(/([\d.]+)\s*%/);
  const rate = rateMatch ? parseFloat(rateMatch[1]) : 8.5;

  // Tenure — "for X years" or "X months"
  const yearsMatch = lower.match(/(\d+)\s*(?:years?|yrs?)/);
  const monthsMatch = lower.match(/(\d+)\s*(?:months?|mos?)/);
  const tenureMonths = yearsMatch
    ? parseInt(yearsMatch[1], 10) * 12
    : monthsMatch
      ? parseInt(monthsMatch[1], 10)
      : 60; // Default: 5 years

  return {
    name,
    principal,
    rate,
    tenureMonths,
    startDate: new Date().toISOString(),
    currency,
  };
}

function parseBudget(lower: string): ParsedBudget | null {
  const category = detectCategory(lower);
  const { amount, currency } = extractAmount(lower);
  if (!amount) return null;
  return { category, monthlyLimit: amount, currency };
}

function parseQuery(lower: string): ParsedQuery {
  // Query type
  const queryType: ParsedQuery['queryType'] =
    lower.includes('spent') || lower.includes('spend') || lower.includes('expense')
      ? 'spending'
      : lower.includes('income') || lower.includes('earn')
        ? 'income'
        : lower.includes('balance') || lower.includes('net worth')
          ? 'balance'
          : 'summary';

  // Time period
  const period: ParsedQuery['period'] =
    lower.includes('today')
      ? 'today'
      : lower.includes('this week') || lower.includes('week')
        ? 'this_week'
        : lower.includes('this year') || lower.includes('year')
          ? 'this_year'
          : 'this_month';

  const category = detectCategory(lower);

  return {
    queryType,
    category: category !== 'other' ? category : undefined,
    period,
  };
}

/**
 * Extract a linked payment source from "from [name] [last4]" pattern.
 * Examples: "from hdfc 2427", "from sbi", "from icici card"
 */
function extractSource(lower: string): { sourceName: string; sourceIsCard: boolean } | null {
  const sourceMatch = lower.match(/(?:from|using|via|with)\s+([a-z\s]+?)(?:\s+(\d{4}))?\s*$/);
  if (!sourceMatch) return null;

  const rawName = sourceMatch[1].trim();
  const last4 = sourceMatch[2] ?? '';

  // Check if it's a credit card
  const isCard = CARD_ISSUERS.some((c) => rawName.includes(c)) &&
    (rawName.includes('card') || rawName.includes('credit') || !BANK_NAMES.some((b) => rawName.includes(b)));

  // Build a readable source name for matching
  const sourceName = [rawName, last4].filter(Boolean).join(' ').trim();

  return { sourceName, sourceIsCard: isCard };
}

function parseTransaction(
  message: string,
  lower: string,
): ParsedTransaction | null {
  const isIncome = INCOME_KEYWORDS.some((kw) => lower.includes(kw));
  const isExpense = EXPENSE_KEYWORDS.some((kw) => lower.includes(kw));
  const type: TransactionType = isIncome && !isExpense ? 'income' : 'expense';

  const { amount, currency } = extractAmount(message);
  if (!amount) return null;

  const source = extractSource(lower);

  return {
    type,
    amount,
    currency,
    category: detectCategory(lower),
    description: message,
    date: detectDate(lower),
    ...(source && { sourceName: source.sourceName, sourceIsCard: source.sourceIsCard }),
  };
}

// ────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────

/** Parse a message into a fully-typed intent result. */
export function parseMessageFull(message: string): ParsedIntent {
  const lower = message.toLowerCase().trim();
  const intent = detectIntent(lower);

  const parsers: Record<string, () => ParsedIntent> = {
    bank_account: () => {
      const data = parseBankAccount(message, lower);
      return data ? { intent: 'bank_account', data } : { intent: 'unknown', data: null };
    },
    credit_card: () => {
      const data = parseCreditCard(message, lower);
      return data ? { intent: 'credit_card', data } : { intent: 'unknown', data: null };
    },
    asset: () => {
      const data = parseAsset(message, lower);
      return data ? { intent: 'asset', data } : { intent: 'unknown', data: null };
    },
    loan: () => {
      const data = parseLoan(message, lower);
      return data ? { intent: 'loan', data } : { intent: 'unknown', data: null };
    },
    budget: () => {
      const data = parseBudget(lower);
      return data ? { intent: 'budget', data } : { intent: 'unknown', data: null };
    },
    query: () => ({ intent: 'query', data: parseQuery(lower) }),
    transaction: () => {
      const data = parseTransaction(message, lower);
      return data ? { intent: 'transaction', data } : { intent: 'unknown', data: null };
    },
  };

  return parsers[intent]();
}

/**
 * Legacy parser — returns a flat transaction result for backward compatibility.
 * @deprecated Use `parseMessageFull` for new code.
 */
export function parseMessage(message: string) {
  const result = parseMessageFull(message);

  if (result.intent === 'transaction') {
    return result.data;
  }

  const { amount, currency } = extractAmount(message);
  return {
    type: 'expense' as TransactionType,
    amount,
    currency,
    category: 'other' as CategoryType,
    description: message,
    date: new Date().toISOString(),
  };
}
