/**
 * Query answering engine — answers financial queries using local data.
 *
 * Extracted from Chat.tsx for testability and reuse.
 */

import { Transaction, BankAccount, CreditCard, Loan, Asset } from '@/types/finance';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currencies';
import { getCategoryInfo } from '@/lib/categories';
import { CategoryType } from '@/types/finance';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';

export interface QueryParams {
  queryType: string;
  category?: string;
  period?: string;
}

export interface FinancialData {
  transactions: Transaction[];
  accounts: BankAccount[];
  cards: CreditCard[];
  loans: Loan[];
  assets: Asset[];
  currency?: string;
}

const PERIOD_LABELS: Record<string, string> = {
  today: 'today',
  this_week: 'this week',
  this_month: 'this month',
  this_year: 'this year',
};

function getPeriodStart(period: string): Date {
  const now = new Date();
  const map: Record<string, Date> = {
    today: startOfDay(now),
    this_week: startOfWeek(now),
    this_year: startOfYear(now),
    this_month: startOfMonth(now),
  };
  return map[period] ?? startOfMonth(now);
}

function resolveCurrency(data: FinancialData): string {
  if (data.currency) return data.currency;
  return data.accounts[0]?.currency ?? DEFAULT_CURRENCY;
}

export function answerQuery(query: QueryParams, data: FinancialData): string {
  const { transactions, accounts, cards, loans, assets } = data;
  const currency = resolveCurrency(data);
  const periodStart = getPeriodStart(query.period ?? 'this_month');
  const periodLabel = PERIOD_LABELS[query.period ?? 'this_month'] ?? 'this month';

  if (query.queryType === 'balance') {
    const bankTotal = accounts.reduce((sum, a) => sum + a.balance, 0);
    const cardDebt = cards.reduce((sum, c) => sum + c.outstanding, 0);
    const loanDebt = loans.reduce((sum, l) => sum + l.principal, 0);
    const assetTotal = assets.reduce((sum, a) => sum + a.value, 0);
    const netWorth = bankTotal + assetTotal - cardDebt - loanDebt;

    return [
      '💰 **Your Financial Summary**\n',
      `🏦 Bank Balance: **${formatCurrency(bankTotal, currency)}**`,
      `💳 Credit Debt: **${formatCurrency(cardDebt, currency)}**`,
      `🏠 Assets: **${formatCurrency(assetTotal, currency)}**`,
      `📋 Loans: **${formatCurrency(loanDebt, currency)}**`,
      '',
      `**Net Worth: ${formatCurrency(Math.abs(netWorth), currency)}** ${netWorth < 0 ? '(negative)' : ''}`,
    ].join('\n');
  }

  const filtered = transactions.filter((t) => {
    const date = new Date(t.date);
    return (
      isAfter(date, periodStart) &&
      (query.queryType === 'spending' ? t.type === 'expense' :
       query.queryType === 'income' ? t.type === 'income' : true) &&
      (query.category ? t.category === query.category : true)
    );
  });

  const total = filtered.reduce((sum, t) => sum + t.amount, 0);
  const catLabel = query.category
    ? ` on **${getCategoryInfo(query.category as CategoryType).label}**`
    : '';

  if (query.queryType === 'spending') {
    return `📊 You spent **${formatCurrency(total, currency)}**${catLabel} ${periodLabel} across **${filtered.length}** transactions.`;
  }
  if (query.queryType === 'income') {
    return `📈 You earned **${formatCurrency(total, currency)}** ${periodLabel} across **${filtered.length}** transactions.`;
  }

  const income = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return [
    `📊 **Summary for ${periodLabel}**\n`,
    `📈 Income: **${formatCurrency(income, currency)}**`,
    `📉 Expenses: **${formatCurrency(expense, currency)}**`,
    `💰 Net: **${formatCurrency(income - expense, currency)}**`,
    `📝 Transactions: **${filtered.length}**`,
  ].join('\n');
}
