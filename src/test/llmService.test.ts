import { describe, it, expect } from 'vitest';
import { mapLLMResultToIntent, LLMParsedResult } from '@/lib/llmService';

describe('llmService — mapLLMResultToIntent', () => {
  it('maps add_transaction to transaction intent with correct fields', () => {
    const input: LLMParsedResult = {
      intent: 'add_transaction',
      data: { type: 'expense', amount: 500, currency: 'INR', category: 'food', description: 'lunch' },
      message: 'ok',
    };
    const result = mapLLMResultToIntent(input);
    expect(result.intent).toBe('transaction');
    expect(result.data).toMatchObject({
      type: 'expense',
      amount: 500,
      currency: 'INR',
      category: 'food',
      description: 'lunch',
    });
  });

  it('maps add_bank_account correctly', () => {
    const result = mapLLMResultToIntent({
      intent: 'add_bank_account',
      data: { name: 'SBI Savings', type: 'savings', balance: 50000, currency: 'INR' },
      message: 'ok',
    });
    expect(result.intent).toBe('bank_account');
    expect(result.data).toMatchObject({ name: 'SBI Savings', type: 'savings', balance: 50000 });
  });

  it('maps add_credit_card correctly', () => {
    const result = mapLLMResultToIntent({
      intent: 'add_credit_card',
      data: { name: 'HDFC Card', limit: 200000, outstanding: 15000, currency: 'INR' },
      message: 'ok',
    });
    expect(result.intent).toBe('credit_card');
    expect(result.data).toMatchObject({ name: 'HDFC Card', limit: 200000, outstanding: 15000 });
  });

  it('maps add_asset correctly', () => {
    const result = mapLLMResultToIntent({
      intent: 'add_asset',
      data: { name: 'Flat', type: 'property', value: 5000000, currency: 'INR' },
      message: 'ok',
    });
    expect(result.intent).toBe('asset');
    expect(result.data).toMatchObject({ type: 'property', value: 5000000 });
  });

  it('maps add_loan correctly', () => {
    const result = mapLLMResultToIntent({
      intent: 'add_loan',
      data: { name: 'Home Loan', principal: 3000000, rate: 8.5, tenureMonths: 240, currency: 'INR' },
      message: 'ok',
    });
    expect(result.intent).toBe('loan');
    expect(result.data).toMatchObject({ principal: 3000000, rate: 8.5, tenureMonths: 240 });
  });

  it('maps set_budget correctly', () => {
    const result = mapLLMResultToIntent({
      intent: 'set_budget',
      data: { category: 'food', monthlyLimit: 5000, currency: 'INR' },
      message: 'ok',
    });
    expect(result.intent).toBe('budget');
    expect(result.data).toMatchObject({ category: 'food', monthlyLimit: 5000 });
  });

  it('maps answer_query correctly', () => {
    const result = mapLLMResultToIntent({
      intent: 'answer_query',
      data: { queryType: 'spending', period: 'this_month' },
      message: 'ok',
    });
    expect(result.intent).toBe('query');
    expect(result.data).toMatchObject({ queryType: 'spending', period: 'this_month' });
  });

  it('returns unknown for unrecognized intent', () => {
    const result = mapLLMResultToIntent({
      intent: 'do_something_random',
      data: {},
      message: 'huh',
    });
    expect(result.intent).toBe('unknown');
    expect(result.data).toBeNull();
  });

  it('defaults missing transaction fields gracefully', () => {
    const result = mapLLMResultToIntent({
      intent: 'add_transaction',
      data: {},
      message: 'ok',
    });
    expect(result.intent).toBe('transaction');
    expect(result.data).toMatchObject({
      type: 'expense',
      amount: 0,
      currency: 'INR',
      category: 'other',
      description: '',
    });
  });
});
