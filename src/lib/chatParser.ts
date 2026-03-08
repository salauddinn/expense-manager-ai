import { CategoryType, TransactionType } from '@/types/finance';
import { DEFAULT_CURRENCY } from './currencies';

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
}

export interface ParsedBankAccount {
  name: string;
  type: 'savings' | 'current' | 'salary';
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
  period?: 'today' | 'this_week' | 'this_month' | 'this_year';
}

// ── Shared helpers ──

const CURRENCY_MAP: Record<string, string> = {
  '₹': 'INR', 'rs': 'INR', 'inr': 'INR', 'rupees': 'INR', 'rupee': 'INR',
  '$': 'USD', 'usd': 'USD', 'dollars': 'USD', 'dollar': 'USD',
  '€': 'EUR', 'eur': 'EUR', 'euros': 'EUR', 'euro': 'EUR',
  '£': 'GBP', 'gbp': 'GBP', 'pounds': 'GBP', 'pound': 'GBP',
  '¥': 'JPY', 'jpy': 'JPY', 'yen': 'JPY',
};

const MULTIPLIERS: Record<string, number> = {
  lakh: 100000, lakhs: 100000, lac: 100000, lacs: 100000,
  crore: 10000000, crores: 10000000, cr: 10000000,
  thousand: 1000, thousands: 1000, k: 1000,
  million: 1000000, mil: 1000000, m: 1000000,
  billion: 1000000000, b: 1000000000,
};

const EXPENSE_KEYWORDS = ['spent', 'paid', 'bought', 'expense', 'cost', 'charged', 'bill', 'purchase'];
const INCOME_KEYWORDS = ['received', 'earned', 'got', 'income', 'salary', 'credited', 'refund'];

const CATEGORY_KEYWORDS: Record<string, CategoryType> = {
  grocery: 'groceries', groceries: 'groceries', supermarket: 'groceries', vegetables: 'groceries',
  food: 'food', restaurant: 'food', dinner: 'food', lunch: 'food', breakfast: 'food', coffee: 'food', cafe: 'food',
  uber: 'transport', cab: 'transport', taxi: 'transport', fuel: 'transport', petrol: 'transport', gas: 'transport', bus: 'transport', metro: 'transport', train: 'transport',
  rent: 'rent', housing: 'rent',
  electricity: 'bills', water: 'bills', internet: 'bills', wifi: 'bills', phone: 'bills', mobile: 'bills', recharge: 'bills',
  movie: 'entertainment', netflix: 'entertainment', spotify: 'entertainment', game: 'entertainment',
  doctor: 'health', medicine: 'health', hospital: 'health', pharmacy: 'health',
  school: 'education', college: 'education', course: 'education', book: 'education', books: 'education',
  flight: 'travel', hotel: 'travel', trip: 'travel', travel: 'travel', vacation: 'travel',
  shopping: 'shopping', clothes: 'shopping', amazon: 'shopping', flipkart: 'shopping', shoes: 'shopping',
  salary: 'salary', freelance: 'freelance', investment: 'investment', dividend: 'investment',
  gift: 'gift', refund: 'refund',
};

function extractAmount(message: string): { amount: number | null; currency: string } {
  let amount: number | null = null;
  let currency = DEFAULT_CURRENCY;

  // Multiplier: 1 lakh, 2.5 crore
  const multMatch = message.match(/([\d,]+\.?\d*)\s*(lakh|lakhs|lac|lacs|crore|crores|cr|thousand|thousands|million|mil|billion)\b/i);
  if (multMatch) {
    amount = parseFloat(multMatch[1].replace(/,/g, '')) * (MULTIPLIERS[multMatch[2].toLowerCase()] || 1);
  }

  // 50k/m/b
  if (!amount) {
    const shortMatch = message.match(/([\d,]+\.?\d*)\s?([kmb])\b/i);
    if (shortMatch) {
      amount = parseFloat(shortMatch[1].replace(/,/g, '')) * (MULTIPLIERS[shortMatch[2].toLowerCase()] || 1);
    }
  }

  // ₹500, $50
  if (!amount) {
    const sym = message.match(/([₹$€£¥])\s*([\d,]+\.?\d*)/);
    if (sym) {
      currency = CURRENCY_MAP[sym[1]] || DEFAULT_CURRENCY;
      amount = parseFloat(sym[2].replace(/,/g, ''));
    }
  }

  // 500 INR
  if (!amount) {
    const code = message.match(/([\d,]+\.?\d*)\s*(INR|USD|EUR|GBP|JPY|AED|CAD|AUD|rupees?|dollars?|euros?|pounds?|yen)/i);
    if (code) {
      amount = parseFloat(code[1].replace(/,/g, ''));
      currency = CURRENCY_MAP[code[2].toLowerCase()] || code[2].toUpperCase();
    }
  }

  // Rs 500
  if (!amount) {
    const rs = message.match(/rs\.?\s*([\d,]+\.?\d*)/i);
    if (rs) { amount = parseFloat(rs[1].replace(/,/g, '')); currency = 'INR'; }
  }

  // Plain number
  if (!amount) {
    const num = message.match(/(\d[\d,]*\.?\d*)/);
    if (num) amount = parseFloat(num[1].replace(/,/g, ''));
  }

  // Currency from symbol in message
  if (currency === DEFAULT_CURRENCY) {
    const sym = message.match(/([₹$€£¥])/);
    if (sym) currency = CURRENCY_MAP[sym[1]] || DEFAULT_CURRENCY;
  }

  return { amount, currency };
}

function extractAllNumbers(message: string): number[] {
  const nums: number[] = [];
  // With multipliers
  const multRegex = /([\d,]+\.?\d*)\s*(lakh|lakhs|lac|lacs|crore|crores|cr|thousand|thousands|million|mil|billion|[kmb])\b/gi;
  let m;
  while ((m = multRegex.exec(message)) !== null) {
    const base = parseFloat(m[1].replace(/,/g, ''));
    const mult = MULTIPLIERS[m[2].toLowerCase()] || 1;
    nums.push(base * mult);
  }
  if (nums.length > 0) return nums;

  // Plain numbers
  const plainRegex = /(?:[₹$€£¥]\s*)?([\d,]+\.?\d*)/g;
  while ((m = plainRegex.exec(message)) !== null) {
    const val = parseFloat(m[1].replace(/,/g, ''));
    if (val > 0) nums.push(val);
  }
  return nums;
}

function detectDate(lower: string): string {
  let date = new Date().toISOString();
  if (lower.includes('yesterday')) {
    const d = new Date(); d.setDate(d.getDate() - 1); date = d.toISOString();
  }
  return date;
}

function detectCategory(lower: string): CategoryType {
  for (const [keyword, cat] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) return cat;
  }
  return 'other';
}

// ── Intent detection ──

const BANK_KEYWORDS = ['bank account', 'savings account', 'current account', 'salary account', 'add account', 'bank balance', 'open account'];
const CARD_KEYWORDS = ['credit card', 'add card', 'card limit', 'card outstanding'];
const ASSET_KEYWORDS = ['add asset', 'add property', 'add flat', 'add house', 'add car', 'add bike', 'add vehicle', 'add investment', 'property worth', 'flat worth', 'house worth', 'car worth', 'investment worth'];
const LOAN_KEYWORDS = ['add loan', 'home loan', 'car loan', 'personal loan', 'education loan', 'loan of', 'loan at'];
const BUDGET_KEYWORDS = ['set budget', 'budget for', 'budget limit', 'monthly budget', 'limit for', 'set limit'];
const QUERY_KEYWORDS = ['how much', 'total spent', 'total income', 'total expense', 'spending on', 'summary', 'what did i spend', 'show me', 'my balance', 'net worth'];

function detectIntent(lower: string): string {
  if (QUERY_KEYWORDS.some((k) => lower.includes(k))) return 'query';
  if (BANK_KEYWORDS.some((k) => lower.includes(k))) return 'bank_account';
  if (CARD_KEYWORDS.some((k) => lower.includes(k))) return 'credit_card';
  if (ASSET_KEYWORDS.some((k) => lower.includes(k))) return 'asset';
  if (LOAN_KEYWORDS.some((k) => lower.includes(k))) return 'loan';
  if (BUDGET_KEYWORDS.some((k) => lower.includes(k))) return 'budget';
  return 'transaction';
}

// ── Parsers per intent ──

function parseBankAccount(message: string, lower: string): ParsedBankAccount | null {
  const { amount, currency } = extractAmount(message);
  if (!amount) return null;

  let type: 'savings' | 'current' | 'salary' = 'savings';
  if (lower.includes('current')) type = 'current';
  else if (lower.includes('salary')) type = 'salary';

  // Try to extract name (common bank names)
  const bankNames = ['sbi', 'hdfc', 'icici', 'axis', 'kotak', 'pnb', 'bob', 'yes bank', 'idbi', 'canara', 'union', 'indusind', 'federal', 'rbl', 'chase', 'bofa', 'wells fargo', 'citi'];
  let name = type.charAt(0).toUpperCase() + type.slice(1) + ' Account';
  for (const bank of bankNames) {
    if (lower.includes(bank)) {
      name = bank.toUpperCase() + ' ' + type.charAt(0).toUpperCase() + type.slice(1);
      break;
    }
  }

  return { name, type, balance: amount, currency };
}

function parseCreditCard(message: string, lower: string): ParsedCreditCard | null {
  const nums = extractAllNumbers(message);
  if (nums.length === 0) return null;

  const cardNames = ['hdfc', 'icici', 'sbi', 'axis', 'kotak', 'amex', 'citi', 'rbl', 'yes bank', 'indusind', 'au', 'idfc', 'visa', 'mastercard'];
  let name = 'Credit Card';
  for (const cn of cardNames) {
    if (lower.includes(cn)) { name = cn.toUpperCase() + ' Card'; break; }
  }

  const { currency } = extractAmount(message);
  const limit = nums[0] || 0;
  const outstanding = nums.length > 1 ? nums[1] : 0;

  return { name, limit, outstanding, dueDate: new Date().toISOString(), currency };
}

function parseAsset(message: string, lower: string): ParsedAsset | null {
  const { amount, currency } = extractAmount(message);
  if (!amount) return null;

  let type: 'property' | 'investment' | 'vehicle' | 'other' = 'other';
  let name = 'Asset';
  if (lower.includes('flat') || lower.includes('house') || lower.includes('property') || lower.includes('apartment')) {
    type = 'property'; name = 'Property';
  } else if (lower.includes('car') || lower.includes('bike') || lower.includes('vehicle') || lower.includes('scooter')) {
    type = 'vehicle'; name = 'Vehicle';
  } else if (lower.includes('investment') || lower.includes('mutual fund') || lower.includes('stock') || lower.includes('fd') || lower.includes('gold')) {
    type = 'investment'; name = 'Investment';
    if (lower.includes('gold')) name = 'Gold';
    if (lower.includes('stock')) name = 'Stocks';
    if (lower.includes('mutual fund') || lower.includes('mf')) name = 'Mutual Fund';
    if (lower.includes('fd')) name = 'Fixed Deposit';
  }

  // Try to grab a descriptive name
  const worth = message.match(/(?:add|my)\s+(.+?)(?:\s+worth|\s+valued|\s+of|\s+at|\s+₹|\s+\$|\s+\d)/i);
  if (worth) name = worth[1].trim().replace(/^(add|my)\s+/i, '');
  if (name.length > 30) name = name.substring(0, 30);
  if (!name || name.length < 2) name = type.charAt(0).toUpperCase() + type.slice(1);

  return { name, type, value: amount, currency };
}

function parseLoan(message: string, lower: string): ParsedLoan | null {
  const nums = extractAllNumbers(message);
  if (nums.length === 0) return null;

  let name = 'Loan';
  if (lower.includes('home loan') || lower.includes('housing loan')) name = 'Home Loan';
  else if (lower.includes('car loan') || lower.includes('vehicle loan')) name = 'Car Loan';
  else if (lower.includes('personal loan')) name = 'Personal Loan';
  else if (lower.includes('education loan') || lower.includes('student loan')) name = 'Education Loan';

  const { currency } = extractAmount(message);
  const principal = nums[0];

  // Try to find rate (look for % or "at X%")
  let rate = 8.5; // default
  const rateMatch = message.match(/([\d.]+)\s*%/);
  if (rateMatch) rate = parseFloat(rateMatch[1]);

  // Tenure: "for X years" or "X months"
  let tenureMonths = 60; // default 5 years
  const yearsMatch = lower.match(/(\d+)\s*(?:years?|yrs?)/);
  const monthsMatch = lower.match(/(\d+)\s*(?:months?|mos?)/);
  if (yearsMatch) tenureMonths = parseInt(yearsMatch[1]) * 12;
  else if (monthsMatch) tenureMonths = parseInt(monthsMatch[1]);

  return { name, principal, rate, tenureMonths, startDate: new Date().toISOString(), currency };
}

function parseBudget(lower: string): ParsedBudget | null {
  const category = detectCategory(lower);
  const { amount, currency } = extractAmount(lower);
  if (!amount) return null;
  return { category, monthlyLimit: amount, currency };
}

function parseQuery(lower: string): ParsedQuery {
  let queryType: ParsedQuery['queryType'] = 'summary';
  if (lower.includes('spent') || lower.includes('spend') || lower.includes('expense')) queryType = 'spending';
  else if (lower.includes('income') || lower.includes('earn')) queryType = 'income';
  else if (lower.includes('balance') || lower.includes('net worth')) queryType = 'balance';

  let period: ParsedQuery['period'] = 'this_month';
  if (lower.includes('today')) period = 'today';
  else if (lower.includes('this week') || lower.includes('week')) period = 'this_week';
  else if (lower.includes('this year') || lower.includes('year')) period = 'this_year';

  const category = detectCategory(lower);

  return { queryType, category: category !== 'other' ? category : undefined, period };
}

// ── Main parser (backward-compatible) ──

// Legacy interface for existing transaction-only callers
interface LegacyParsedResult {
  type: TransactionType;
  amount: number | null;
  currency: string;
  category: CategoryType;
  description: string;
  date: string;
}

export function parseMessage(message: string): LegacyParsedResult {
  const result = parseMessageFull(message);
  if (result.intent === 'transaction' && result.data) {
    return result.data;
  }
  // Fallback for non-transaction intents
  const { amount, currency } = extractAmount(message);
  return {
    type: 'expense',
    amount,
    currency,
    category: 'other',
    description: message,
    date: new Date().toISOString(),
  };
}

export function parseMessageFull(message: string): ParsedIntent {
  const lower = message.toLowerCase();
  const intent = detectIntent(lower);

  switch (intent) {
    case 'bank_account': {
      const data = parseBankAccount(message, lower);
      return data ? { intent: 'bank_account', data } : { intent: 'unknown', data: null };
    }
    case 'credit_card': {
      const data = parseCreditCard(message, lower);
      return data ? { intent: 'credit_card', data } : { intent: 'unknown', data: null };
    }
    case 'asset': {
      const data = parseAsset(message, lower);
      return data ? { intent: 'asset', data } : { intent: 'unknown', data: null };
    }
    case 'loan': {
      const data = parseLoan(message, lower);
      return data ? { intent: 'loan', data } : { intent: 'unknown', data: null };
    }
    case 'budget': {
      const data = parseBudget(lower);
      return data ? { intent: 'budget', data } : { intent: 'unknown', data: null };
    }
    case 'query': {
      return { intent: 'query', data: parseQuery(lower) };
    }
    default: {
      // Transaction
      const isIncome = INCOME_KEYWORDS.some((k) => lower.includes(k));
      const isExpense = EXPENSE_KEYWORDS.some((k) => lower.includes(k));
      const type: TransactionType = isIncome && !isExpense ? 'income' : 'expense';
      const { amount, currency } = extractAmount(message);
      const category = detectCategory(lower);
      const date = detectDate(lower);
      if (!amount) return { intent: 'unknown', data: null };
      return {
        intent: 'transaction',
        data: { type, amount, currency, category, description: message, date },
      };
    }
  }
}
