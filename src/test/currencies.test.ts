import { describe, it, expect } from 'vitest';
import { formatCurrency, getCurrencySymbol, CURRENCIES } from '@/lib/currencies';

describe('currencies', () => {
  describe('getCurrencySymbol', () => {
    it('returns ₹ for INR', () => {
      expect(getCurrencySymbol('INR')).toBe('₹');
    });

    it('returns $ for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    it('returns code for unknown currency', () => {
      expect(getCurrencySymbol('XYZ')).toBe('XYZ');
    });
  });

  describe('formatCurrency', () => {
    it('formats INR amount correctly', () => {
      const result = formatCurrency(1500, 'INR');
      expect(result).toContain('₹');
      expect(result).toContain('1,500.00');
    });

    it('formats USD amount correctly', () => {
      const result = formatCurrency(99.5, 'USD');
      expect(result).toContain('$');
      expect(result).toContain('99.50');
    });

    it('formats zero', () => {
      const result = formatCurrency(0, 'INR');
      expect(result).toBe('₹0.00');
    });

    it('formats large numbers with commas', () => {
      const result = formatCurrency(1000000, 'INR');
      expect(result).toContain('₹');
      expect(result).toMatch(/1[,.]000[,.]000\.00/);
    });
  });

  describe('CURRENCIES constant', () => {
    it('has INR as first entry', () => {
      expect(CURRENCIES[0].code).toBe('INR');
    });

    it('has unique codes', () => {
      const codes = CURRENCIES.map((c) => c.code);
      expect(new Set(codes).size).toBe(codes.length);
    });
  });
});
