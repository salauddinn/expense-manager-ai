import { describe, it, expect } from 'vitest';
import { buildIntentResponse } from '@/lib/chatFormatter';
import type { ParsedIntent } from '@/lib/chatParser';
import type { FinancialData } from '@/lib/queryEngine';

const emptyFinancialData: FinancialData = {
  transactions: [],
  accounts: [],
  cards: [],
  loans: [],
  assets: [],
  currency: 'INR',
};

describe('chatFormatter — buildIntentResponse', () => {
  describe('transaction intent', () => {
    const baseTx: ParsedIntent = {
      intent: 'transaction',
      data: {
        type: 'expense',
        amount: 500,
        currency: 'INR',
        category: 'food',
        description: 'lunch',
        date: '2025-06-15T12:00:00.000Z',
      },
    };

    it('formats a basic expense confirmation', () => {
      const result = buildIntentResponse(baseTx, emptyFinancialData);
      expect(result.content).toContain('expense');
      expect(result.content).toContain('₹');
      expect(result.content).toContain('500');
      expect(result.content).toContain('Food');
      expect(result.content).toContain('Shall I save this?');
      expect(result.parsedIntent?.intent).toBe('transaction');
    });

    it('includes cashback when present', () => {
      const withCashback: ParsedIntent = {
        intent: 'transaction',
        data: { ...baseTx.data, cashback: 25 },
      };
      const result = buildIntentResponse(withCashback, emptyFinancialData);
      expect(result.content).toContain('cashback');
      expect(result.content).toContain('25');
    });

    it('includes source name when present', () => {
      const withSource: ParsedIntent = {
        intent: 'transaction',
        data: { ...baseTx.data, sourceName: 'HDFC' },
      };
      const result = buildIntentResponse(withSource, emptyFinancialData);
      expect(result.content).toContain('from');
      expect(result.content).toContain('HDFC');
    });

    it('attaches receipt URL to parsedIntent when provided', () => {
      const result = buildIntentResponse(baseTx, emptyFinancialData, 'https://example.com/receipt.jpg');
      expect(result.parsedIntent?.intent).toBe('transaction');
      if (result.parsedIntent?.intent !== 'transaction') return;
      expect(result.parsedIntent.data.receiptUrl).toBe('https://example.com/receipt.jpg');
    });
  });

  describe('bank_account intent', () => {
    it('formats bank account confirmation', () => {
      const intent: ParsedIntent = {
        intent: 'bank_account',
        data: { name: 'SBI Savings', type: 'savings', balance: 25000, currency: 'INR' },
      };
      const result = buildIntentResponse(intent, emptyFinancialData);
      expect(result.content).toContain('SBI Savings');
      expect(result.content).toContain('savings account');
      expect(result.content).toContain('25,000');
      expect(result.parsedIntent).toEqual(intent);
    });
  });

  describe('credit_card intent', () => {
    it('formats credit card without outstanding', () => {
      const intent: ParsedIntent = {
        intent: 'credit_card',
        data: { name: 'HDFC Card', limit: 200000, outstanding: 0, dueDate: '2025-06-15', currency: 'INR' },
      };
      const result = buildIntentResponse(intent, emptyFinancialData);
      expect(result.content).toContain('HDFC Card');
      expect(result.content).toContain('2,00,000');
      expect(result.content).not.toContain('outstanding');
    });

    it('includes outstanding when non-zero', () => {
      const intent: ParsedIntent = {
        intent: 'credit_card',
        data: { name: 'HDFC Card', limit: 200000, outstanding: 5000, dueDate: '2025-06-15', currency: 'INR' },
      };
      const result = buildIntentResponse(intent, emptyFinancialData);
      expect(result.content).toContain('outstanding');
      expect(result.content).toContain('5,000');
    });
  });

  describe('asset intent', () => {
    it('formats asset confirmation', () => {
      const intent: ParsedIntent = {
        intent: 'asset',
        data: { name: 'Flat', type: 'property', value: 5000000, currency: 'INR' },
      };
      const result = buildIntentResponse(intent, emptyFinancialData);
      expect(result.content).toContain('Flat');
      expect(result.content).toContain('property');
      expect(result.content).toContain('50,00,000');
      expect(result.parsedIntent).toEqual(intent);
    });
  });

  describe('loan intent', () => {
    it('formats loan confirmation with rate and tenure', () => {
      const intent: ParsedIntent = {
        intent: 'loan',
        data: {
          name: 'Home Loan',
          principal: 3000000,
          rate: 8.5,
          tenureMonths: 240,
          startDate: '2025-01-01',
          currency: 'INR',
        },
      };
      const result = buildIntentResponse(intent, emptyFinancialData);
      expect(result.content).toContain('Home Loan');
      expect(result.content).toContain('30,00,000');
      expect(result.content).toContain('8.5%');
      expect(result.content).toContain('240 months');
    });
  });

  describe('budget intent', () => {
    it('formats budget goal confirmation', () => {
      const intent: ParsedIntent = {
        intent: 'budget',
        data: { category: 'food', monthlyLimit: 5000, currency: 'INR' },
      };
      const result = buildIntentResponse(intent, emptyFinancialData);
      expect(result.content).toContain('5,000');
      expect(result.content).toContain('Food');
    });
  });

  describe('query intent', () => {
    it('returns an answer with no parsedIntent', () => {
      const intent: ParsedIntent = {
        intent: 'query',
        data: { queryType: 'balance', period: 'this_month' },
      };
      const result = buildIntentResponse(intent, emptyFinancialData);
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.parsedIntent).toBeUndefined();
    });
  });

  describe('unknown intent', () => {
    it('returns HELP_TEXT with no parsedIntent', () => {
      const intent: ParsedIntent = { intent: 'unknown', data: null };
      const result = buildIntentResponse(intent, emptyFinancialData);
      expect(result.content).toMatch(/couldn't understand|try/i);
      expect(result.parsedIntent).toBeUndefined();
    });
  });
});
