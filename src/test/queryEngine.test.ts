import { describe, it, expect } from 'vitest';
import { answerQuery, FinancialData } from '@/lib/queryEngine';

function makeData(overrides: Partial<FinancialData> = {}): FinancialData {
  return {
    transactions: [],
    accounts: [],
    cards: [],
    loans: [],
    assets: [],
    ...overrides,
  };
}

describe('queryEngine — answerQuery', () => {
  it('returns balance summary with correct net worth', () => {
    const data = makeData({
      accounts: [{ id: '1', name: 'SBI', type: 'savings', balance: 100000, currency: 'INR' }],
      cards: [{ id: '2', name: 'HDFC', limit: 200000, outstanding: 30000, dueDate: '', currency: 'INR' }],
      assets: [{ id: '3', name: 'Flat', type: 'property', value: 5000000, currency: 'INR' }],
      loans: [{ id: '4', name: 'Home', principal: 2000000, rate: 8.5, tenureMonths: 240, startDate: '', currency: 'INR' }],
    });

    const result = answerQuery({ queryType: 'balance' }, data);
    // Net worth = 100000 + 5000000 - 30000 - 2000000 = 3070000
    expect(result).toContain('Net Worth');
    expect(result).toContain('Bank Balance');
    expect(result).toContain('Credit Debt');
  });

  it('calculates spending for current month', () => {
    const today = new Date().toISOString();
    const data = makeData({
      transactions: [
        { id: '1', type: 'expense', amount: 500, currency: 'INR', category: 'food', description: 'lunch', date: today, createdAt: today },
        { id: '2', type: 'expense', amount: 300, currency: 'INR', category: 'food', description: 'dinner', date: today, createdAt: today },
        { id: '3', type: 'income', amount: 50000, currency: 'INR', category: 'salary', description: 'salary', date: today, createdAt: today },
      ],
    });

    const result = answerQuery({ queryType: 'spending', period: 'this_month' }, data);
    expect(result).toContain('800.00');
    expect(result).toContain('2');
  });

  it('filters spending by category', () => {
    const today = new Date().toISOString();
    const data = makeData({
      transactions: [
        { id: '1', type: 'expense', amount: 500, currency: 'INR', category: 'food', description: 'lunch', date: today, createdAt: today },
        { id: '2', type: 'expense', amount: 1000, currency: 'INR', category: 'transport', description: 'uber', date: today, createdAt: today },
      ],
    });

    const result = answerQuery({ queryType: 'spending', category: 'food', period: 'this_month' }, data);
    expect(result).toContain('500.00');
    expect(result).toContain('1');
    expect(result).toContain('Food');
  });

  it('returns income query correctly', () => {
    const today = new Date().toISOString();
    const data = makeData({
      transactions: [
        { id: '1', type: 'income', amount: 50000, currency: 'INR', category: 'salary', description: 'salary', date: today, createdAt: today },
      ],
    });

    const result = answerQuery({ queryType: 'income', period: 'this_month' }, data);
    expect(result).toContain('50,000.00');
    expect(result).toContain('earned');
  });

  it('returns summary with both income and expense', () => {
    const today = new Date().toISOString();
    const data = makeData({
      transactions: [
        { id: '1', type: 'income', amount: 50000, currency: 'INR', category: 'salary', description: 'salary', date: today, createdAt: today },
        { id: '2', type: 'expense', amount: 5000, currency: 'INR', category: 'food', description: 'food', date: today, createdAt: today },
      ],
    });

    const result = answerQuery({ queryType: 'summary', period: 'this_month' }, data);
    expect(result).toContain('Income');
    expect(result).toContain('Expenses');
    expect(result).toContain('Net');
  });

  it('excludes old transactions from "today" period', () => {
    const oldDate = '2020-01-01T00:00:00.000Z';
    const data = makeData({
      transactions: [
        { id: '1', type: 'expense', amount: 9999, currency: 'INR', category: 'food', description: 'old', date: oldDate, createdAt: oldDate },
      ],
    });

    const result = answerQuery({ queryType: 'spending', period: 'today' }, data);
    expect(result).toContain('0.00');
    expect(result).toContain('0');
  });
});
