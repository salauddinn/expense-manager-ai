import { describe, it, expect } from 'vitest';
import { parseMessageFull } from '@/lib/chatParser';

describe('chatParser — parseMessageFull', () => {
  // ── Transaction Parsing ──

  describe('transactions', () => {
    it('parses a basic expense', () => {
      const result = parseMessageFull('spent ₹500 on groceries');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      expect(result.data.type).toBe('expense');
      expect(result.data.amount).toBe(500);
      expect(result.data.currency).toBe('INR');
      expect(result.data.category).toBe('groceries');
    });

    it('parses income', () => {
      const result = parseMessageFull('received salary 50000');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      expect(result.data.type).toBe('income');
      expect(result.data.amount).toBe(50000);
      expect(result.data.category).toBe('salary');
    });

    it('parses amount with lakh multiplier', () => {
      const result = parseMessageFull('spent 1.5 lakh on rent');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      expect(result.data.amount).toBe(150000);
      expect(result.data.category).toBe('rent');
    });

    it('parses amount with k shorthand', () => {
      const result = parseMessageFull('paid 5k for gym');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      expect(result.data.amount).toBe(5000);
      expect(result.data.category).toBe('health');
    });

    it('detects USD currency', () => {
      const result = parseMessageFull('spent $100 on shopping');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      expect(result.data.currency).toBe('USD');
      expect(result.data.amount).toBe(100);
    });

    it('extracts source account from "from hdfc"', () => {
      const result = parseMessageFull('spent 500 on food from hdfc');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      expect(result.data.sourceName).toBe('hdfc');
    });

    it('detects credit card bill as transaction not credit_card', () => {
      const result = parseMessageFull('paid credit card bill 15000');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      expect(result.data.amount).toBe(15000);
      expect(result.data.category).toBe('bills');
    });
  });

  // ── Bank Account Parsing ──

  describe('bank accounts', () => {
    it('parses add savings account', () => {
      const result = parseMessageFull('add SBI savings account 50000');
      expect(result.intent).toBe('bank_account');
      if (result.intent !== 'bank_account') return;
      expect(result.data.name).toContain('SBI');
      expect(result.data.type).toBe('savings');
      expect(result.data.balance).toBe(50000);
    });

    it('parses current account', () => {
      const result = parseMessageFull('add HDFC current account 1 lakh');
      expect(result.intent).toBe('bank_account');
      if (result.intent !== 'bank_account') return;
      expect(result.data.type).toBe('current');
      expect(result.data.balance).toBe(100000);
    });
  });

  // ── Credit Card Parsing ──

  describe('credit cards', () => {
    it('parses credit card with limit', () => {
      const result = parseMessageFull('add HDFC credit card limit 2 lakh');
      expect(result.intent).toBe('credit_card');
      if (result.intent !== 'credit_card') return;
      expect(result.data.name).toContain('HDFC');
      expect(result.data.limit).toBe(200000);
    });

    it('parses credit card with limit and outstanding (same format)', () => {
      const result = parseMessageFull('add ICICI credit card limit 3 lakh outstanding 50k');
      expect(result.intent).toBe('credit_card');
      if (result.intent !== 'credit_card') return;
      expect(result.data.limit).toBe(300000);
      expect(result.data.outstanding).toBe(50000);
    });
  });

  // ── Asset Parsing ──

  describe('assets', () => {
    it('parses property asset', () => {
      const result = parseMessageFull('add flat worth 50 lakh');
      expect(result.intent).toBe('asset');
      if (result.intent !== 'asset') return;
      expect(result.data.type).toBe('property');
      expect(result.data.value).toBe(5000000);
    });

    it('parses vehicle asset', () => {
      const result = parseMessageFull('add car worth 8 lakh');
      expect(result.intent).toBe('asset');
      if (result.intent !== 'asset') return;
      expect(result.data.type).toBe('vehicle');
      expect(result.data.value).toBe(800000);
    });

    it('parses investment asset', () => {
      const result = parseMessageFull('add mutual fund worth 2 lakh');
      expect(result.intent).toBe('asset');
      if (result.intent !== 'asset') return;
      expect(result.data.type).toBe('investment');
    });
  });

  // ── Loan Parsing ──

  describe('loans', () => {
    it('parses home loan with rate and tenure', () => {
      const result = parseMessageFull('home loan 30 lakh at 8.5% for 20 years');
      expect(result.intent).toBe('loan');
      if (result.intent !== 'loan') return;
      expect(result.data.name).toBe('Home Loan');
      expect(result.data.principal).toBe(3000000);
      expect(result.data.rate).toBe(8.5);
      expect(result.data.tenureMonths).toBe(240);
    });

    it('parses car loan', () => {
      const result = parseMessageFull('car loan 5 lakh at 9% for 5 years');
      expect(result.intent).toBe('loan');
      if (result.intent !== 'loan') return;
      expect(result.data.name).toBe('Car Loan');
      expect(result.data.principal).toBe(500000);
      expect(result.data.tenureMonths).toBe(60);
    });
  });

  // ── Budget Parsing ──

  describe('budgets', () => {
    it('parses set budget for category', () => {
      const result = parseMessageFull('set budget for food 5000');
      expect(result.intent).toBe('budget');
      if (result.intent !== 'budget') return;
      expect(result.data.category).toBe('food');
      expect(result.data.monthlyLimit).toBe(5000);
    });
  });

  // ── Query Parsing ──

  describe('queries', () => {
    it('parses spending query', () => {
      const result = parseMessageFull('how much did I spend this month?');
      expect(result.intent).toBe('query');
      if (result.intent !== 'query') return;
      expect(result.data.queryType).toBe('spending');
      expect(result.data.period).toBe('this_month');
    });

    it('parses income query for this year', () => {
      const result = parseMessageFull('total income this year');
      expect(result.intent).toBe('query');
      if (result.intent !== 'query') return;
      expect(result.data.queryType).toBe('income');
      expect(result.data.period).toBe('this_year');
    });

    it('parses spending query with category', () => {
      const result = parseMessageFull('how much did I spend on food this week?');
      expect(result.intent).toBe('query');
      if (result.intent !== 'query') return;
      expect(result.data.queryType).toBe('spending');
      expect(result.data.category).toBe('food');
      expect(result.data.period).toBe('this_week');
    });

    it('parses net worth / balance query', () => {
      const result = parseMessageFull('what is my net worth?');
      expect(result.intent).toBe('query');
      if (result.intent !== 'query') return;
      expect(result.data.queryType).toBe('balance');
    });
  });

  // ── Unknown Intent ──

  describe('unknown', () => {
    it('returns unknown for gibberish without amounts', () => {
      const result = parseMessageFull('hello there');
      expect(result.intent).toBe('unknown');
    });
  });
});
