import { describe, it, expect } from 'vitest';
import { sumBy } from '@/lib/shared';

describe('shared utilities', () => {
  describe('sumBy', () => {
    it('sums numeric values from array of objects', () => {
      const items = [
        { amount: 100 },
        { amount: 200 },
        { amount: 300 },
      ];
      expect(sumBy(items, (i) => i.amount)).toBe(600);
    });

    it('returns 0 for empty array', () => {
      expect(sumBy([], (i: { v: number }) => i.v)).toBe(0);
    });

    it('works with single element', () => {
      const items = [{ value: 42 }];
      expect(sumBy(items, (i) => i.value)).toBe(42);
    });

    it('handles negative values', () => {
      const items = [{ n: 10 }, { n: -5 }, { n: -3 }];
      expect(sumBy(items, (i) => i.n)).toBe(2);
    });

    it('handles floating point values', () => {
      const items = [{ v: 1.5 }, { v: 2.3 }, { v: 0.2 }];
      expect(sumBy(items, (i) => i.v)).toBeCloseTo(4.0);
    });

    it('works with a getter that transforms values', () => {
      const accounts = [
        { balance: 1000, currency: 'INR' },
        { balance: 2000, currency: 'INR' },
        { balance: 500, currency: 'USD' },
      ];
      const total = sumBy(accounts, (a) => a.balance * 2);
      expect(total).toBe(7000);
    });

    it('handles zero values', () => {
      const items = [{ v: 0 }, { v: 0 }, { v: 0 }];
      expect(sumBy(items, (i) => i.v)).toBe(0);
    });

    it('works with large arrays', () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({ v: i + 1 }));
      expect(sumBy(items, (i) => i.v)).toBe(500500);
    });
  });
});
