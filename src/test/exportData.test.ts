import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from 'vitest';
import { exportTransactionsCSV } from '@/lib/exportData';
import { Transaction } from '@/types/finance';

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    type: 'expense',
    amount: 500,
    currency: 'INR',
    category: 'food',
    description: 'Lunch at restaurant',
    date: '2025-03-15T10:00:00.000Z',
    createdAt: '2025-03-15T10:00:00.000Z',
    ...overrides,
  };
}

function captureCSV(): { getCsv: () => string } {
  let csv = '';
  const OrigBlob = globalThis.Blob;
  vi.spyOn(globalThis, 'Blob').mockImplementation((parts?: BlobPart[], options?: BlobPropertyBag) => {
    if (parts && parts.length > 0 && typeof parts[0] === 'string') {
      csv = parts[0] as string;
    }
    return new OrigBlob(parts, options);
  });
  return { getCsv: () => csv };
}

describe('exportData', () => {
  let createObjectURLSpy: MockInstance<(obj: Blob | MediaSource) => string>;
  let revokeObjectURLSpy: MockInstance<(url: string) => void>;
  let clickSpy: MockInstance<() => void>;
  let createdLink: HTMLAnchorElement;

  beforeEach(() => {
    createdLink = document.createElement('a');
    clickSpy = vi.spyOn(createdLink, 'click').mockImplementation(() => {});

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return createdLink;
      return document.createElement(tag);
    });

    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportTransactionsCSV', () => {
    it('creates a blob and triggers download', () => {
      const transactions = [makeTransaction()];
      exportTransactionsCSV(transactions);
      expect(createObjectURLSpy).toHaveBeenCalledOnce();
      expect(clickSpy).toHaveBeenCalledOnce();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('sets correct download filename with date', () => {
      const transactions = [makeTransaction()];
      exportTransactionsCSV(transactions);
      expect(createdLink.download).toMatch(/^transactions_\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it('sets the href to the blob URL', () => {
      exportTransactionsCSV([makeTransaction()]);
      expect(createdLink.href).toContain('blob:mock-url');
    });

    it('handles empty transaction array', () => {
      expect(() => exportTransactionsCSV([])).not.toThrow();
      expect(createObjectURLSpy).toHaveBeenCalledOnce();
      expect(clickSpy).toHaveBeenCalledOnce();
    });

    it('generates CSV with correct headers', () => {
      const { getCsv } = captureCSV();
      exportTransactionsCSV([makeTransaction()]);
      expect(getCsv()).toContain('Date,Type,Category,Description,Amount,Currency');
    });

    it('escapes double quotes in description', () => {
      const { getCsv } = captureCSV();
      const tx = makeTransaction({ description: 'He said "hello" to me' });
      exportTransactionsCSV([tx]);
      expect(getCsv()).toContain('He said ""hello"" to me');
    });

    it('includes transaction data in CSV', () => {
      const { getCsv } = captureCSV();
      const tx = makeTransaction({
        date: '2025-03-15T10:00:00.000Z',
        type: 'expense',
        amount: 500,
        currency: 'INR',
        category: 'food',
        description: 'Test lunch',
      });
      exportTransactionsCSV([tx]);
      const csv = getCsv();
      expect(csv).toContain('2025-03-15');
      expect(csv).toContain('expense');
      expect(csv).toContain('500');
      expect(csv).toContain('INR');
    });

    it('exports multiple transactions', () => {
      const transactions = [
        makeTransaction({ id: 'tx-1', description: 'First' }),
        makeTransaction({ id: 'tx-2', description: 'Second', amount: 1000, type: 'income', category: 'salary' }),
        makeTransaction({ id: 'tx-3', description: 'Third', amount: 250 }),
      ];

      expect(() => exportTransactionsCSV(transactions)).not.toThrow();
      expect(clickSpy).toHaveBeenCalledOnce();
    });

    it('handles income transactions correctly', () => {
      const { getCsv } = captureCSV();
      const tx = makeTransaction({ type: 'income', category: 'salary', description: 'Monthly salary' });
      exportTransactionsCSV([tx]);
      const csv = getCsv();
      expect(csv).toContain('income');
      expect(csv).toContain('Salary');
    });
  });
});
