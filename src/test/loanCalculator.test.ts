import { describe, it, expect } from 'vitest';
import { calculateEMI, generateAmortization } from '@/lib/loanCalculator';

describe('loanCalculator', () => {
  describe('calculateEMI', () => {
    it('calculates EMI for a standard home loan', () => {
      // 30 lakh at 8.5% for 20 years (240 months)
      const result = calculateEMI(3000000, 8.5, 240);
      // Known EMI ≈ ₹26,035
      expect(result.emi).toBeCloseTo(26035, -1);
      expect(result.totalPayment).toBeGreaterThan(3000000);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.totalPayment).toBeCloseTo(result.totalInterest + 3000000, 0);
    });

    it('calculates correctly for 0% interest', () => {
      const result = calculateEMI(120000, 0, 12);
      expect(result.emi).toBe(10000);
      expect(result.totalInterest).toBe(0);
      expect(result.totalPayment).toBe(120000);
    });

    it('higher rate means higher EMI for same principal and tenure', () => {
      const low = calculateEMI(1000000, 8, 120);
      const high = calculateEMI(1000000, 12, 120);
      expect(high.emi).toBeGreaterThan(low.emi);
      expect(high.totalInterest).toBeGreaterThan(low.totalInterest);
    });

    it('shorter tenure means higher EMI but lower total interest', () => {
      const short = calculateEMI(1000000, 10, 60);
      const long = calculateEMI(1000000, 10, 120);
      expect(short.emi).toBeGreaterThan(long.emi);
      expect(short.totalInterest).toBeLessThan(long.totalInterest);
    });

    it('EMI * tenure equals totalPayment', () => {
      const result = calculateEMI(500000, 9, 36);
      expect(result.emi * 36).toBeCloseTo(result.totalPayment, 2);
    });
  });

  describe('generateAmortization', () => {
    it('returns correct number of rows', () => {
      const rows = generateAmortization(100000, 10, 12);
      expect(rows).toHaveLength(12);
    });

    it('first month has highest interest, last month has lowest', () => {
      const rows = generateAmortization(1000000, 10, 60);
      expect(rows[0].interest).toBeGreaterThan(rows[59].interest);
    });

    it('first month has lowest principal, last month has highest', () => {
      const rows = generateAmortization(1000000, 10, 60);
      expect(rows[0].principal).toBeLessThan(rows[59].principal);
    });

    it('final balance is approximately zero', () => {
      const rows = generateAmortization(500000, 8.5, 36);
      const lastRow = rows[rows.length - 1];
      expect(lastRow.balance).toBeCloseTo(0, 0);
    });

    it('each row EMI equals principal + interest', () => {
      const rows = generateAmortization(200000, 12, 24);
      for (const row of rows) {
        expect(row.principal + row.interest).toBeCloseTo(row.emi, 2);
      }
    });

    it('sum of all principal payments equals original principal', () => {
      const principal = 1000000;
      const rows = generateAmortization(principal, 9, 120);
      const totalPrincipalPaid = rows.reduce((s, r) => s + r.principal, 0);
      expect(totalPrincipalPaid).toBeCloseTo(principal, 0);
    });

    it('month numbers are sequential 1..N', () => {
      const rows = generateAmortization(100000, 10, 6);
      expect(rows.map((r) => r.month)).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });
});
