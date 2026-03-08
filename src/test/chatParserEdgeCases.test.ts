import { describe, it, expect } from 'vitest';
import { parseMessageFull } from '@/lib/chatParser';

/**
 * Edge case tests for the chat parser.
 * These test boundary conditions, ambiguous inputs, and tricky patterns
 * that could break with code changes.
 */
describe('chatParser — edge cases', () => {
  describe('amount parsing edge cases', () => {
    it('handles comma-separated Indian format (1,00,000)', () => {
      const result = parseMessageFull('spent ₹1,00,000 on rent');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      expect(result.data.amount).toBe(100000);
    });

    it('handles crore multiplier', () => {
      const result = parseMessageFull('add property worth 2 crore');
      expect(result.intent).toBe('asset');
      if (result.intent !== 'asset') return;
      expect(result.data.value).toBe(20000000);
    });

    it('handles decimal with multiplier (1.5 lakh)', () => {
      const result = parseMessageFull('add SBI savings account 2.5 lakh');
      expect(result.intent).toBe('bank_account');
      if (result.intent !== 'bank_account') return;
      expect(result.data.balance).toBe(250000);
    });

    it('handles Rs prefix', () => {
      const result = parseMessageFull('spent Rs 300 on food');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      expect(result.data.amount).toBe(300);
      expect(result.data.currency).toBe('INR');
    });

    it('handles Rs. prefix with dot', () => {
      const result = parseMessageFull('spent Rs.450 on cab');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      expect(result.data.amount).toBe(450);
    });
  });

  describe('date detection', () => {
    it('detects yesterday', () => {
      const result = parseMessageFull('spent 200 on coffee yesterday');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      const txDate = new Date(result.data.date);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(txDate.getDate()).toBe(yesterday.getDate());
    });

    it('defaults to today if no date mentioned', () => {
      const result = parseMessageFull('spent 100 on snack');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      const txDate = new Date(result.data.date);
      expect(txDate.getDate()).toBe(new Date().getDate());
    });
  });

  describe('category detection edge cases', () => {
    it('detects swiggy as food', () => {
      const result = parseMessageFull('spent 350 on swiggy');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      expect(result.data.category).toBe('food');
    });

    it('detects amazon as shopping', () => {
      const result = parseMessageFull('spent 2000 on amazon');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      expect(result.data.category).toBe('shopping');
    });

    it('detects uber as transport', () => {
      const result = parseMessageFull('paid 250 for uber');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      expect(result.data.category).toBe('transport');
    });

    it('detects netflix as entertainment', () => {
      const result = parseMessageFull('paid 499 for netflix');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      expect(result.data.category).toBe('entertainment');
    });

    it('falls back to other for unknown category', () => {
      const result = parseMessageFull('spent 100 on random thing');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      expect(result.data.category).toBe('other');
    });
  });

  describe('intent disambiguation', () => {
    it('EMI payment is a transaction, not a loan', () => {
      const result = parseMessageFull('paid emi 15000');
      expect(result.intent).toBe('transaction');
    });

    it('loan payment is a transaction, not a loan', () => {
      const result = parseMessageFull('paid loan payment 20000');
      // Should detect as transaction due to override
      expect(result.intent).toBe('transaction');
    });

    it('"add car worth 8 lakh" is an asset, not a loan', () => {
      const result = parseMessageFull('add car worth 8 lakh');
      expect(result.intent).toBe('asset');
    });

    it('"car loan 5 lakh" is a loan, not an asset', () => {
      const result = parseMessageFull('car loan 5 lakh at 9%');
      expect(result.intent).toBe('loan');
    });
  });

  describe('source extraction', () => {
    it('extracts "from sbi" as bank account source', () => {
      const result = parseMessageFull('spent 1000 on groceries from sbi');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      expect(result.data.sourceName).toContain('sbi');
      expect(result.data.sourceIsCard).toBe(false);
    });

    it('no source when "from" is absent', () => {
      const result = parseMessageFull('spent 500 on food');
      expect(result.intent).toBe('transaction');
      if (result.intent !== 'transaction') return;
      expect(result.data.sourceName).toBeUndefined();
    });
  });

  describe('no-amount handling', () => {
    it('returns unknown for text with no amount', () => {
      const result = parseMessageFull('what is the weather today');
      expect(result.intent).toBe('unknown');
    });

    it('query intent works even without an amount', () => {
      const result = parseMessageFull('how much did I spend today');
      expect(result.intent).toBe('query');
    });
  });

  describe('loan parsing edge cases', () => {
    it('defaults to 8.5% if no rate specified', () => {
      const result = parseMessageFull('home loan 20 lakh for 15 years');
      expect(result.intent).toBe('loan');
      if (result.intent !== 'loan') return;
      expect(result.data.rate).toBe(8.5);
    });

    it('defaults to 60 months if no tenure specified', () => {
      const result = parseMessageFull('personal loan 5 lakh at 12%');
      expect(result.intent).toBe('loan');
      if (result.intent !== 'loan') return;
      expect(result.data.tenureMonths).toBe(60);
    });

    it('parses months tenure correctly', () => {
      const result = parseMessageFull('personal loan 1 lakh at 10% for 36 months');
      expect(result.intent).toBe('loan');
      if (result.intent !== 'loan') return;
      expect(result.data.tenureMonths).toBe(36);
    });
  });
});
