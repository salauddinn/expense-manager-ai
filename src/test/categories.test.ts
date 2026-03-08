import { describe, it, expect } from 'vitest';
import { getCategoryInfo, EXPENSE_CATEGORIES, INCOME_CATEGORIES, ALL_CATEGORIES } from '@/lib/categories';

describe('categories', () => {
  describe('getCategoryInfo', () => {
    it('returns correct info for food', () => {
      const info = getCategoryInfo('food');
      expect(info.label).toBe('Food & Dining');
      expect(info.icon).toBe('🍔');
    });

    it('returns correct info for salary', () => {
      const info = getCategoryInfo('salary');
      expect(info.label).toBe('Salary');
      expect(info.icon).toBe('💰');
    });

    it('returns "Other" for unknown category', () => {
      const info = getCategoryInfo('other');
      expect(info.label).toBe('Other');
    });
  });

  describe('category lists', () => {
    it('EXPENSE_CATEGORIES has food and groceries', () => {
      const values = EXPENSE_CATEGORIES.map((c) => c.value);
      expect(values).toContain('food');
      expect(values).toContain('groceries');
      expect(values).toContain('transport');
    });

    it('INCOME_CATEGORIES has salary and freelance', () => {
      const values = INCOME_CATEGORIES.map((c) => c.value);
      expect(values).toContain('salary');
      expect(values).toContain('freelance');
    });

    it('ALL_CATEGORIES contains all unique categories', () => {
      const values = ALL_CATEGORIES.map((c) => c.value);
      expect(values).toContain('food');
      expect(values).toContain('salary');
      // No duplicates of 'other'
      const otherCount = values.filter((v) => v === 'other').length;
      expect(otherCount).toBe(1);
    });
  });
});
