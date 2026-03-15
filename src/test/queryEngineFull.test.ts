/**
 * Comprehensive queryEngine tests covering all branches,
 * edge cases, and the resolveCurrency fallback logic.
 */

import { describe, it, expect } from 'vitest';
import { answerQuery, FinancialData } from '@/lib/queryEngine';
import { Transaction } from '@/types/finance';

function tx(overrides: Partial<Transaction> = {}): Transaction {
  const now = new Date().toISOString();
  return {
    id: 'tx-1',
    type: 'expense',
    amount: 500,
    currency: 'INR',
    category: 'food',
    description: 'test',
    date: now,
    createdAt: now,
    ...overrides,
  };
}

function makeData(overrides: Partial<FinancialData> = {}): FinancialData {
  return { transactions: [], accounts: [], cards: [], loans: [], assets: [], ...overrides };
}

describe('queryEngine — resolveCurrency', () => {
  it('uses explicit currency from data object', () => {
    const data = makeData({ currency: 'USD' });
    const result = answerQuery({ queryType: 'spending', period: 'this_month' }, data);
    expect(result).toContain('$');
  });

  it('uses first account currency when no explicit currency', () => {
    const data = makeData({
      accounts: [{ id: '1', name: 'Chase', type: 'savings', balance: 5000, currency: 'USD' }],
    });
    const result = answerQuery({ queryType: 'balance' }, data);
    expect(result).toContain('$');
  });

  it('falls back to DEFAULT_CURRENCY (INR) when no accounts and no explicit currency', () => {
    const data = makeData();
    const result = answerQuery({ queryType: 'spending', period: 'this_month' }, data);
    expect(result).toContain('₹');
  });
});

describe('queryEngine — balance query', () => {
  it('shows Net Worth heading', () => {
    const data = makeData({
      accounts: [{ id: '1', name: 'SBI', type: 'savings', balance: 50000, currency: 'INR' }],
    });
    const result = answerQuery({ queryType: 'balance' }, data);
    expect(result).toContain('Net Worth');
  });

  it('shows negative net worth label when negative', () => {
    const data = makeData({
      loans: [{ id: '1', name: 'Home', principal: 5000000, rate: 8, tenureMonths: 240, startDate: '', currency: 'INR' }],
    });
    const result = answerQuery({ queryType: 'balance' }, data);
    expect(result).toContain('negative');
  });

  it('no negative label for positive net worth', () => {
    const data = makeData({
      assets: [{ id: '1', name: 'Flat', type: 'property', value: 5000000, currency: 'INR' }],
    });
    const result = answerQuery({ queryType: 'balance' }, data);
    expect(result).not.toContain('negative');
  });

  it('shows all sections: Bank Balance, Credit Debt, Assets, Loans', () => {
    const data = makeData({
      accounts: [{ id: 'a1', name: 'SBI', type: 'savings', balance: 100000, currency: 'INR' }],
      cards: [{ id: 'c1', name: 'HDFC', limit: 200000, outstanding: 30000, dueDate: '', currency: 'INR' }],
      assets: [{ id: 'as1', name: 'Flat', type: 'property', value: 5000000, currency: 'INR' }],
      loans: [{ id: 'l1', name: 'Home', principal: 2000000, rate: 8.5, tenureMonths: 240, startDate: '', currency: 'INR' }],
    });
    const result = answerQuery({ queryType: 'balance' }, data);
    expect(result).toContain('Bank Balance');
    expect(result).toContain('Credit Debt');
    expect(result).toContain('Assets');
    expect(result).toContain('Loans');
  });

  it('handles zero values in balance query', () => {
    const data = makeData();
    const result = answerQuery({ queryType: 'balance' }, data);
    expect(result).toContain('0.00');
  });
});

describe('queryEngine — spending query', () => {
  it('returns 0 spending when no transactions', () => {
    const data = makeData();
    const result = answerQuery({ queryType: 'spending', period: 'this_month' }, data);
    expect(result).toContain('0.00');
    expect(result).toContain('0');
  });

  it('includes transaction count in result', () => {
    const now = new Date().toISOString();
    const data = makeData({
      transactions: [
        tx({ id: '1', amount: 100, date: now }),
        tx({ id: '2', amount: 200, date: now }),
        tx({ id: '3', amount: 300, date: now }),
      ],
    });
    const result = answerQuery({ queryType: 'spending', period: 'this_month' }, data);
    expect(result).toContain('3');
    expect(result).toContain('600.00');
  });

  it('excludes income transactions from spending', () => {
    const now = new Date().toISOString();
    const data = makeData({
      transactions: [
        tx({ id: '1', type: 'expense', amount: 500, date: now }),
        tx({ id: '2', type: 'income', amount: 50000, date: now }),
      ],
    });
    const result = answerQuery({ queryType: 'spending', period: 'this_month' }, data);
    expect(result).toContain('500.00');
    expect(result).not.toContain('50,000.00');
  });

  it('filters by category correctly', () => {
    const now = new Date().toISOString();
    const data = makeData({
      transactions: [
        tx({ id: '1', category: 'food', amount: 500, date: now }),
        tx({ id: '2', category: 'transport', amount: 300, date: now }),
      ],
    });
    const result = answerQuery({ queryType: 'spending', category: 'transport', period: 'this_month' }, data);
    expect(result).toContain('300.00');
    expect(result).toContain('1');
    expect(result).not.toContain('500.00');
  });

  it('excludes transactions before period start', () => {
    const past = '2020-06-15T00:00:00.000Z';
    const data = makeData({
      transactions: [
        tx({ id: '1', amount: 9999, date: past }),
      ],
    });
    const result = answerQuery({ queryType: 'spending', period: 'this_month' }, data);
    expect(result).toContain('0.00');
  });

  it('uses this_week period correctly', () => {
    const now = new Date().toISOString();
    const data = makeData({
      transactions: [tx({ id: '1', amount: 200, date: now })],
    });
    const result = answerQuery({ queryType: 'spending', period: 'this_week' }, data);
    expect(result).toContain('200.00');
  });

  it('uses today period correctly', () => {
    const now = new Date().toISOString();
    const data = makeData({
      transactions: [tx({ id: '1', amount: 150, date: now })],
    });
    const result = answerQuery({ queryType: 'spending', period: 'today' }, data);
    expect(result).toContain('150.00');
  });

  it('uses this_year period correctly', () => {
    const now = new Date().toISOString();
    const data = makeData({
      transactions: [tx({ id: '1', amount: 300, date: now })],
    });
    const result = answerQuery({ queryType: 'spending', period: 'this_year' }, data);
    expect(result).toContain('300.00');
  });

  it('defaults to this_month when period is unknown', () => {
    const now = new Date().toISOString();
    const data = makeData({
      transactions: [tx({ id: '1', amount: 400, date: now })],
    });
    const result = answerQuery({ queryType: 'spending', period: 'unknown_period' }, data);
    expect(result).toContain('400.00');
  });

  it('shows category label in result when category given', () => {
    const now = new Date().toISOString();
    const data = makeData({
      transactions: [tx({ id: '1', category: 'food', amount: 500, date: now })],
    });
    const result = answerQuery({ queryType: 'spending', category: 'food', period: 'this_month' }, data);
    expect(result).toContain('Food');
  });
});

describe('queryEngine — income query', () => {
  it('returns 0 income when no transactions', () => {
    const data = makeData();
    const result = answerQuery({ queryType: 'income', period: 'this_month' }, data);
    expect(result).toContain('0.00');
    expect(result).toContain('earned');
  });

  it('sums only income transactions', () => {
    const now = new Date().toISOString();
    const data = makeData({
      transactions: [
        tx({ id: '1', type: 'income', amount: 50000, date: now }),
        tx({ id: '2', type: 'income', amount: 10000, date: now }),
        tx({ id: '3', type: 'expense', amount: 5000, date: now }),
      ],
    });
    const result = answerQuery({ queryType: 'income', period: 'this_month' }, data);
    expect(result).toContain('60,000.00');
    expect(result).toContain('2');
  });

  it('filters income by category', () => {
    const now = new Date().toISOString();
    const data = makeData({
      transactions: [
        tx({ id: '1', type: 'income', category: 'salary', amount: 50000, date: now }),
        tx({ id: '2', type: 'income', category: 'freelance', amount: 10000, date: now }),
      ],
    });
    const result = answerQuery({ queryType: 'income', category: 'salary', period: 'this_month' }, data);
    expect(result).toContain('50,000.00');
    expect(result).not.toContain('60,000.00');
  });
});

describe('queryEngine — summary query', () => {
  it('shows Income, Expenses and Net in summary', () => {
    const now = new Date().toISOString();
    const data = makeData({
      transactions: [
        tx({ id: '1', type: 'income', amount: 50000, date: now }),
        tx({ id: '2', type: 'expense', amount: 10000, date: now }),
      ],
    });
    const result = answerQuery({ queryType: 'summary', period: 'this_month' }, data);
    expect(result).toContain('Income');
    expect(result).toContain('Expenses');
    expect(result).toContain('Net');
  });

  it('shows transaction count in summary', () => {
    const now = new Date().toISOString();
    const data = makeData({
      transactions: [
        tx({ id: '1', type: 'income', amount: 50000, date: now }),
        tx({ id: '2', type: 'expense', amount: 5000, date: now }),
        tx({ id: '3', type: 'expense', amount: 3000, date: now }),
      ],
    });
    const result = answerQuery({ queryType: 'summary', period: 'this_month' }, data);
    expect(result).toContain('3');
  });

  it('computes net correctly (income - expense)', () => {
    const now = new Date().toISOString();
    const data = makeData({
      transactions: [
        tx({ id: '1', type: 'income', amount: 50000, date: now }),
        tx({ id: '2', type: 'expense', amount: 20000, date: now }),
      ],
    });
    const result = answerQuery({ queryType: 'summary', period: 'this_month' }, data);
    expect(result).toContain('30,000.00');
  });

  it('handles empty transactions in summary', () => {
    const data = makeData();
    const result = answerQuery({ queryType: 'summary', period: 'this_month' }, data);
    expect(result).toContain('Income');
    expect(result).toContain('0.00');
  });
});

describe('queryEngine — period labels', () => {
  it('includes "today" in spending result for today period', () => {
    const data = makeData();
    const result = answerQuery({ queryType: 'spending', period: 'today' }, data);
    expect(result).toContain('today');
  });

  it('includes "this week" in spending result', () => {
    const data = makeData();
    const result = answerQuery({ queryType: 'spending', period: 'this_week' }, data);
    expect(result).toContain('this week');
  });

  it('includes "this year" in spending result', () => {
    const data = makeData();
    const result = answerQuery({ queryType: 'spending', period: 'this_year' }, data);
    expect(result).toContain('this year');
  });

  it('includes "this month" in spending result', () => {
    const data = makeData();
    const result = answerQuery({ queryType: 'spending', period: 'this_month' }, data);
    expect(result).toContain('this month');
  });

  it('defaults period label to "this month" for unknown period', () => {
    const data = makeData();
    const result = answerQuery({ queryType: 'spending' }, data);
    expect(result).toContain('this month');
  });
});
