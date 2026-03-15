import { describe, it, expect } from 'vitest';
import { toCamelCase, toSnakeCase } from '@/lib/dbMapper';

describe('dbMapper', () => {
  describe('toCamelCase', () => {
    it('converts snake_case keys to camelCase', () => {
      const input = { first_name: 'John', last_name: 'Doe' };
      const result = toCamelCase<{ firstName: string; lastName: string }>(input);
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
    });

    it('leaves already-camelCase keys unchanged', () => {
      const input = { name: 'test', value: 42 };
      const result = toCamelCase<{ name: string; value: number }>(input);
      expect(result.name).toBe('test');
      expect(result.value).toBe(42);
    });

    it('converts deeply nested snake_case key', () => {
      const input = { created_at: '2024-01-01', updated_at: '2024-01-02' };
      const result = toCamelCase<{ createdAt: string; updatedAt: string }>(input);
      expect(result.createdAt).toBe('2024-01-01');
      expect(result.updatedAt).toBe('2024-01-02');
    });

    it('applies special case: credit_limit → limit', () => {
      const input = { credit_limit: 200000, name: 'HDFC Card' };
      const result = toCamelCase<{ limit: number; name: string }>(input);
      expect(result.limit).toBe(200000);
      expect((result as Record<string, unknown>).creditLimit).toBeUndefined();
    });

    it('converts linked_account_id correctly', () => {
      const input = { linked_account_id: 'abc-123', linked_card_id: 'def-456' };
      const result = toCamelCase<{ linkedAccountId: string; linkedCardId: string }>(input);
      expect(result.linkedAccountId).toBe('abc-123');
      expect(result.linkedCardId).toBe('def-456');
    });

    it('converts boolean values correctly', () => {
      const input = { is_active: true, is_deleted: false };
      const result = toCamelCase<{ isActive: boolean; isDeleted: boolean }>(input);
      expect(result.isActive).toBe(true);
      expect(result.isDeleted).toBe(false);
    });

    it('handles null values', () => {
      const input = { end_date: null, due_date: null };
      const result = toCamelCase<{ endDate: null; dueDate: null }>(input);
      expect(result.endDate).toBeNull();
      expect(result.dueDate).toBeNull();
    });

    it('handles array values', () => {
      const input = { celebrated_milestones: [25, 50] };
      const result = toCamelCase<{ celebratedMilestones: number[] }>(input);
      expect(result.celebratedMilestones).toEqual([25, 50]);
    });

    it('handles empty object', () => {
      const result = toCamelCase<Record<string, unknown>>({});
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('converts user_id to userId', () => {
      const input = { user_id: 'uuid-123' };
      const result = toCamelCase<{ userId: string }>(input);
      expect(result.userId).toBe('uuid-123');
    });

    it('converts target_amount and current_amount', () => {
      const input = { target_amount: 500000, current_amount: 120000 };
      const result = toCamelCase<{ targetAmount: number; currentAmount: number }>(input);
      expect(result.targetAmount).toBe(500000);
      expect(result.currentAmount).toBe(120000);
    });
  });

  describe('toSnakeCase', () => {
    it('converts camelCase keys to snake_case', () => {
      const input = { firstName: 'John', lastName: 'Doe' };
      const result = toSnakeCase(input);
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Doe');
    });

    it('leaves already-snake_case keys unchanged', () => {
      const input = { name: 'test', value: 42 };
      const result = toSnakeCase(input);
      expect(result.name).toBe('test');
      expect(result.value).toBe(42);
    });

    it('applies special case: limit → credit_limit', () => {
      const input = { limit: 200000, name: 'HDFC Card' };
      const result = toSnakeCase(input);
      expect(result.credit_limit).toBe(200000);
      expect(result.limit).toBeUndefined();
    });

    it('converts monthlyLimit to monthly_limit', () => {
      const input = { monthlyLimit: 5000, category: 'food' };
      const result = toSnakeCase(input);
      expect(result.monthly_limit).toBe(5000);
    });

    it('converts isActive to is_active', () => {
      const input = { isActive: true };
      const result = toSnakeCase(input);
      expect(result.is_active).toBe(true);
    });

    it('converts nextDate to next_date', () => {
      const input = { nextDate: '2025-01-01', endDate: '2026-01-01' };
      const result = toSnakeCase(input);
      expect(result.next_date).toBe('2025-01-01');
      expect(result.end_date).toBe('2026-01-01');
    });

    it('converts linkedAccountId to linked_account_id', () => {
      const input = { linkedAccountId: 'acc-1', linkedCardId: 'card-1' };
      const result = toSnakeCase(input);
      expect(result.linked_account_id).toBe('acc-1');
      expect(result.linked_card_id).toBe('card-1');
    });

    it('handles null values', () => {
      const input = { endDate: null };
      const result = toSnakeCase(input);
      expect(result.end_date).toBeNull();
    });

    it('handles empty object', () => {
      const result = toSnakeCase({});
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('converts celebratedMilestones to celebrated_milestones', () => {
      const input = { celebratedMilestones: [25, 50, 75] };
      const result = toSnakeCase(input);
      expect(result.celebrated_milestones).toEqual([25, 50, 75]);
    });

    it('converts targetAmount and currentAmount', () => {
      const input = { targetAmount: 500000, currentAmount: 120000 };
      const result = toSnakeCase(input);
      expect(result.target_amount).toBe(500000);
      expect(result.current_amount).toBe(120000);
    });
  });

  describe('round-trip conversion', () => {
    it('snake → camel → snake preserves values', () => {
      const original = {
        user_id: 'uuid-1',
        monthly_limit: 5000,
        is_active: true,
        end_date: null,
      };
      const camel = toCamelCase<Record<string, unknown>>(original);
      const backToSnake = toSnakeCase(camel);
      expect(backToSnake.user_id).toBe('uuid-1');
      expect(backToSnake.monthly_limit).toBe(5000);
      expect(backToSnake.is_active).toBe(true);
      expect(backToSnake.end_date).toBeNull();
    });

    it('credit_limit ↔ limit round-trip works', () => {
      const dbRow = { credit_limit: 300000 };
      const ts = toCamelCase<{ limit: number }>(dbRow);
      expect(ts.limit).toBe(300000);
      const backToDb = toSnakeCase(ts as Record<string, unknown>);
      expect(backToDb.credit_limit).toBe(300000);
    });
  });
});
