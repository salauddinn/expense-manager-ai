import { CategoryType, TransactionType } from '@/types/finance';
import { DEFAULT_CURRENCY } from './currencies';

interface ParsedResult {
  type: TransactionType;
  amount: number | null;
  currency: string;
  category: CategoryType;
  description: string;
  date: string;
}

const CURRENCY_MAP: Record<string, string> = {
  '₹': 'INR', 'rs': 'INR', 'inr': 'INR', 'rupees': 'INR', 'rupee': 'INR',
  '$': 'USD', 'usd': 'USD', 'dollars': 'USD', 'dollar': 'USD',
  '€': 'EUR', 'eur': 'EUR', 'euros': 'EUR', 'euro': 'EUR',
  '£': 'GBP', 'gbp': 'GBP', 'pounds': 'GBP', 'pound': 'GBP',
  '¥': 'JPY', 'jpy': 'JPY', 'yen': 'JPY',
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

export function parseMessage(message: string): ParsedResult {
  const lower = message.toLowerCase();

  // Detect type
  const isIncome = INCOME_KEYWORDS.some((k) => lower.includes(k));
  const isExpense = EXPENSE_KEYWORDS.some((k) => lower.includes(k));
  const type: TransactionType = isIncome && !isExpense ? 'income' : 'expense';

  // Detect amount and currency
  let amount: number | null = null;
  let currency = DEFAULT_CURRENCY;

  // Indian multiplier words
  const MULTIPLIERS: Record<string, number> = {
    lakh: 100000, lakhs: 100000, lac: 100000, lacs: 100000,
    crore: 10000000, crores: 10000000, cr: 10000000,
    thousand: 1000, thousands: 1000, k: 1000,
    million: 1000000, mil: 1000000, m: 1000000,
    billion: 1000000000, b: 1000000000,
  };

  // Pattern: 1 lakh, 2.5 crore, 50k, 10 thousand
  const multiplierMatch = message.match(/([\d,]+\.?\d*)\s*(lakh|lakhs|lac|lacs|crore|crores|cr|thousand|thousands|million|mil|billion)\b/i);
  if (multiplierMatch) {
    const base = parseFloat(multiplierMatch[1].replace(/,/g, ''));
    const mult = MULTIPLIERS[multiplierMatch[2].toLowerCase()];
    if (mult) amount = base * mult;
  }

  // Pattern: 50k (number immediately followed by k/m/b)
  if (!amount) {
    const shortMatch = message.match(/([\d,]+\.?\d*)\s?([kmb])\b/i);
    if (shortMatch) {
      const base = parseFloat(shortMatch[1].replace(/,/g, ''));
      const mult = MULTIPLIERS[shortMatch[2].toLowerCase()];
      if (mult) amount = base * mult;
    }
  }

  // Pattern: ₹500, $50, €30, £20
  if (!amount) {
    const symbolMatch = message.match(/([₹$€£¥])\s*([\d,]+\.?\d*)/);
    if (symbolMatch) {
      currency = CURRENCY_MAP[symbolMatch[1]] || DEFAULT_CURRENCY;
      amount = parseFloat(symbolMatch[2].replace(/,/g, ''));
    }
  }

  // Pattern: 500 INR, 50 USD, 30 EUR
  if (!amount) {
    const codeAfter = message.match(/([\d,]+\.?\d*)\s*(INR|USD|EUR|GBP|JPY|AED|CAD|AUD|rupees?|dollars?|euros?|pounds?|yen)/i);
    if (codeAfter) {
      amount = parseFloat(codeAfter[1].replace(/,/g, ''));
      currency = CURRENCY_MAP[codeAfter[2].toLowerCase()] || codeAfter[2].toUpperCase();
    }
  }

  // Pattern: Rs 500, Rs. 500
  if (!amount) {
    const rsMatch = message.match(/rs\.?\s*([\d,]+\.?\d*)/i);
    if (rsMatch) {
      amount = parseFloat(rsMatch[1].replace(/,/g, ''));
      currency = 'INR';
    }
  }

  // Fallback: just a number
  if (!amount) {
    const numMatch = message.match(/(\d[\d,]*\.?\d*)/);
    if (numMatch) {
      amount = parseFloat(numMatch[1].replace(/,/g, ''));
    }
  }

  // Detect currency from multiplier context if not yet set
  if (multiplierMatch && currency === DEFAULT_CURRENCY) {
    const currSymbol = message.match(/([₹$€£¥])/);
    if (currSymbol) currency = CURRENCY_MAP[currSymbol[1]] || DEFAULT_CURRENCY;
  }

  // Detect category
  let category: CategoryType = 'other';
  for (const [keyword, cat] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) {
      category = cat;
      break;
    }
  }

  // Detect date
  let date = new Date().toISOString();
  if (lower.includes('yesterday')) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    date = d.toISOString();
  }

  return { type, amount, currency, category, description: message, date };
}
