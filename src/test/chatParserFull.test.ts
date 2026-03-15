/**
 * Comprehensive chatParser tests covering all branches and the legacy parseMessage API.
 * These complement chatParser.test.ts and chatParserEdgeCases.test.ts.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseMessageFull, parseMessage } from '@/lib/chatParser';

describe('chatParser — parseMessage (legacy API)', () => {
  it('returns transaction data for expense input', () => {
    const result = parseMessage('spent 500 on groceries');
    expect(result.type).toBe('expense');
    expect(result.amount).toBe(500);
    expect(result.category).toBe('groceries');
  });

  it('returns flat object with required fields for income input', () => {
    const result = parseMessage('received salary 50000');
    expect(result.type).toBe('income');
    expect(result.amount).toBe(50000);
    expect(result.currency).toBe('INR');
  });

  it('falls back to generic expense for non-transaction intents (bank account)', () => {
    const result = parseMessage('add SBI savings account 50000');
    expect(result).toBeDefined();
    expect(result.amount).toBe(50000);
    expect(result.currency).toBe('INR');
    expect(result.type).toBe('expense');
    expect(result.category).toBe('other');
  });

  it('falls back for query intent with message field', () => {
    const result = parseMessage('how much did I spend this month');
    expect(result).toBeDefined();
    expect(result.type).toBe('expense');
  });

  it('handles message with no recognizable amount', () => {
    const result = parseMessage('hello world');
    expect(result).toBeDefined();
    expect(result.amount).toBeNull();
  });

  it('returns date as ISO string', () => {
    const result = parseMessage('spent 100 on food');
    expect(result.date).toBeDefined();
    expect(new Date(result.date).getTime()).not.toBeNaN();
  });
});

describe('chatParser — currency branches', () => {
  it('detects EUR symbol', () => {
    const result = parseMessageFull('spent €50 on shopping');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.currency).toBe('EUR');
    expect(result.data.amount).toBe(50);
  });

  it('detects GBP symbol', () => {
    const result = parseMessageFull('spent £100 on shopping');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.currency).toBe('GBP');
  });

  it('detects JPY symbol', () => {
    const result = parseMessageFull('spent ¥500 on food');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.currency).toBe('JPY');
  });

  it('detects currency from word "dollars"', () => {
    const result = parseMessageFull('spent 50 dollars on food');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.currency).toBe('USD');
  });

  it('detects currency from word "euros"', () => {
    const result = parseMessageFull('spent 30 euros on transport');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.currency).toBe('EUR');
  });

  it('detects currency from word "pounds"', () => {
    const result = parseMessageFull('earned 500 pounds from freelance');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.currency).toBe('GBP');
  });

  it('detects INR from word "rupees"', () => {
    const result = parseMessageFull('spent 1000 rupees on groceries');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.currency).toBe('INR');
  });

  it('detects currency code USD directly', () => {
    const result = parseMessageFull('spent 100 USD on flight');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.currency).toBe('USD');
  });

  it('detects EUR code directly', () => {
    const result = parseMessageFull('paid 200 EUR for hotel');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.currency).toBe('EUR');
  });
});

describe('chatParser — amount multiplier branches', () => {
  it('handles thousand multiplier word', () => {
    const result = parseMessageFull('spent 5 thousand on shopping');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.amount).toBe(5000);
  });

  it('handles million multiplier', () => {
    const result = parseMessageFull('add investment worth 2 million');
    expect(result.intent).toBe('asset');
    if (result.intent !== 'asset') return;
    expect(result.data.value).toBe(2000000);
  });

  it('handles crore short form (cr)', () => {
    const result = parseMessageFull('add flat worth 1 cr');
    expect(result.intent).toBe('asset');
    if (result.intent !== 'asset') return;
    expect(result.data.value).toBe(10000000);
  });

  it('handles m shorthand multiplier in transaction', () => {
    const result = parseMessageFull('spent 2m on investment');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.amount).toBe(2000000);
  });

  it('handles comma-formatted number 10,000', () => {
    const result = parseMessageFull('spent ₹10,000 on shopping');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.amount).toBe(10000);
  });
});

describe('chatParser — date detection branches', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles "yesterday" offset', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00.000Z'));
    const result = parseMessageFull('spent 500 on food yesterday');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    const txDate = new Date(result.data.date);
    expect(txDate.getDate()).toBe(14);
  });

  it('handles "last week" offset', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00.000Z'));
    const result = parseMessageFull('spent 500 on entertainment last week');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    const txDate = new Date(result.data.date);
    expect(txDate.getDate()).toBe(8);
  });

  it('handles "day before yesterday" offset', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00.000Z'));
    const result = parseMessageFull('spent 200 on food day before yesterday');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    const txDate = new Date(result.data.date);
    expect(txDate.getDate()).toBe(14);
  });
});

describe('chatParser — bank account type branches', () => {
  it('detects salary account type', () => {
    const result = parseMessageFull('add HDFC salary account 30000');
    expect(result.intent).toBe('bank_account');
    if (result.intent !== 'bank_account') return;
    expect(result.data.type).toBe('salary');
  });

  it('detects cash wallet type', () => {
    const result = parseMessageFull('cash in hand 5000');
    expect(result.intent).toBe('bank_account');
    if (result.intent !== 'bank_account') return;
    expect(result.data.type).toBe('cash');
  });

  it('defaults to savings when no type specified', () => {
    const result = parseMessageFull('add bank account 25000');
    expect(result.intent).toBe('bank_account');
    if (result.intent !== 'bank_account') return;
    expect(result.data.type).toBe('savings');
  });

  it('uses generic name when no known bank is mentioned', () => {
    const result = parseMessageFull('add savings account 10000');
    expect(result.intent).toBe('bank_account');
    if (result.intent !== 'bank_account') return;
    expect(result.data.name).toBe('Savings Account');
  });

  it('returns unknown when no amount for bank account', () => {
    const result = parseMessageFull('add savings account');
    expect(result.intent).toBe('unknown');
  });
});

describe('chatParser — credit card branches', () => {
  it('returns unknown when no numbers found for credit card', () => {
    const result = parseMessageFull('add credit card');
    expect(result.intent).toBe('unknown');
  });

  it('uses generic name when no known card issuer', () => {
    const result = parseMessageFull('add credit card limit 100000');
    expect(result.intent).toBe('credit_card');
    if (result.intent !== 'credit_card') return;
    expect(result.data.name).toBe('Credit Card');
  });

  it('defaults outstanding to 0 when only limit given', () => {
    const result = parseMessageFull('add HDFC credit card limit 200000');
    expect(result.intent).toBe('credit_card');
    if (result.intent !== 'credit_card') return;
    expect(result.data.outstanding).toBe(0);
  });
});

describe('chatParser — asset type branches', () => {
  it('detects property from "add property worth"', () => {
    const result = parseMessageFull('add property worth 50 lakh');
    expect(result.intent).toBe('asset');
    if (result.intent !== 'asset') return;
    expect(result.data.type).toBe('property');
  });

  it('detects flat from "flat worth"', () => {
    const result = parseMessageFull('flat worth 80 lakh');
    expect(result.intent).toBe('asset');
    if (result.intent !== 'asset') return;
    expect(result.data.type).toBe('property');
  });

  it('detects bike as vehicle', () => {
    const result = parseMessageFull('add bike worth 1.2 lakh');
    expect(result.intent).toBe('asset');
    if (result.intent !== 'asset') return;
    expect(result.data.type).toBe('vehicle');
  });

  it('detects vehicle as vehicle', () => {
    const result = parseMessageFull('add vehicle worth 5 lakh');
    expect(result.intent).toBe('asset');
    if (result.intent !== 'asset') return;
    expect(result.data.type).toBe('vehicle');
  });

  it('detects mutual fund as investment', () => {
    const result = parseMessageFull('add mutual fund worth 2 lakh');
    expect(result.intent).toBe('asset');
    if (result.intent !== 'asset') return;
    expect(result.data.type).toBe('investment');
  });

  it('detects investment keyword for investment type', () => {
    const result = parseMessageFull('add investment worth 3 lakh');
    expect(result.intent).toBe('asset');
    if (result.intent !== 'asset') return;
    expect(result.data.type).toBe('investment');
  });

  it('asset name extraction works for "add flat worth"', () => {
    const result = parseMessageFull('add flat worth 50 lakh');
    expect(result.intent).toBe('asset');
    if (result.intent !== 'asset') return;
    expect(result.data.name.toLowerCase()).toContain('flat');
  });

  it('defaults to other for unrecognized asset type (add asset worth)', () => {
    const result = parseMessageFull('add asset worth 50000');
    expect(result.intent).toBe('asset');
    if (result.intent !== 'asset') return;
    expect(result.data.type).toBe('other');
  });

  it('returns unknown when no amount for asset', () => {
    const result = parseMessageFull('add flat worth nothing');
    expect(result.intent).toBe('unknown');
  });
});

describe('chatParser — loan name branches', () => {
  it('detects housing loan as Home Loan', () => {
    const result = parseMessageFull('housing loan 25 lakh at 8%');
    expect(result.intent).toBe('loan');
    if (result.intent !== 'loan') return;
    expect(result.data.name).toBe('Home Loan');
  });

  it('detects vehicle loan as Car Loan', () => {
    const result = parseMessageFull('vehicle loan 6 lakh at 9%');
    expect(result.intent).toBe('loan');
    if (result.intent !== 'loan') return;
    expect(result.data.name).toBe('Car Loan');
  });

  it('detects education loan', () => {
    const result = parseMessageFull('education loan 10 lakh at 7.5%');
    expect(result.intent).toBe('loan');
    if (result.intent !== 'loan') return;
    expect(result.data.name).toBe('Education Loan');
  });

  it('detects student loan as Education Loan', () => {
    const result = parseMessageFull('student loan 5 lakh at 8%');
    expect(result.intent).toBe('loan');
    if (result.intent !== 'loan') return;
    expect(result.data.name).toBe('Education Loan');
  });

  it('uses generic Loan name when no specific type detected', () => {
    const result = parseMessageFull('add loan 5 lakh at 10%');
    expect(result.intent).toBe('loan');
    if (result.intent !== 'loan') return;
    expect(result.data.name).toBe('Loan');
  });

  it('returns unknown when no numbers for loan', () => {
    const result = parseMessageFull('add loan at interest');
    expect(result.intent).toBe('unknown');
  });

  it('detects personal loan', () => {
    const result = parseMessageFull('personal loan 3 lakh at 11%');
    expect(result.intent).toBe('loan');
    if (result.intent !== 'loan') return;
    expect(result.data.name).toBe('Personal Loan');
  });
});

describe('chatParser — transaction type branches', () => {
  it('detects income from "earned" keyword', () => {
    const result = parseMessageFull('earned 5000 freelance');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.type).toBe('income');
  });

  it('detects income from "got" keyword', () => {
    const result = parseMessageFull('got 2000 gift');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.type).toBe('income');
  });

  it('detects income from "credited" keyword', () => {
    const result = parseMessageFull('credited 50000 salary');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.type).toBe('income');
  });

  it('detects income from "refund" keyword', () => {
    const result = parseMessageFull('refund 1000 from amazon');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.type).toBe('income');
  });

  it('expense keyword overrides income keyword', () => {
    const result = parseMessageFull('paid and received 500 for groceries');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.type).toBe('expense');
  });

  it('detects cashback from "cashback 50" pattern', () => {
    const result = parseMessageFull('spent 1000 on shopping cashback 50');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.cashback).toBe(50);
  });

  it('detects cashback from "cashback of 100" pattern', () => {
    const result = parseMessageFull('paid 5000 on electronics cashback of 200');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.cashback).toBe(200);
  });

  it('detects cashback from "got X back" pattern', () => {
    const result = parseMessageFull('spent 2000 on amazon got 100 back');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.cashback).toBe(100);
  });

  it('returns unknown when no amount in transaction', () => {
    const result = parseMessageFull('spent on food');
    expect(result.intent).toBe('unknown');
  });
});

describe('chatParser — query type branches', () => {
  it('detects summary query type for "summary" keyword', () => {
    const result = parseMessageFull('show me a summary');
    expect(result.intent).toBe('query');
    if (result.intent !== 'query') return;
    expect(result.data.queryType).toBe('summary');
  });

  it('detects balance from "my balance" keyword', () => {
    const result = parseMessageFull('what is my balance');
    expect(result.intent).toBe('query');
    if (result.intent !== 'query') return;
    expect(result.data.queryType).toBe('balance');
  });

  it('detects income query from "earn" keyword', () => {
    const result = parseMessageFull('how much did I earn this year');
    expect(result.intent).toBe('query');
    if (result.intent !== 'query') return;
    expect(result.data.queryType).toBe('income');
    expect(result.data.period).toBe('this_year');
  });

  it('detects today period', () => {
    const result = parseMessageFull('how much did I spend today');
    expect(result.intent).toBe('query');
    if (result.intent !== 'query') return;
    expect(result.data.period).toBe('today');
  });

  it('detects this_week period from "week" keyword', () => {
    const result = parseMessageFull('what did I spend this week');
    expect(result.intent).toBe('query');
    if (result.intent !== 'query') return;
    expect(result.data.period).toBe('this_week');
  });

  it('defaults to this_month period', () => {
    const result = parseMessageFull('total income');
    expect(result.intent).toBe('query');
    if (result.intent !== 'query') return;
    expect(result.data.period).toBe('this_month');
  });

  it('omits category when "other" is detected', () => {
    const result = parseMessageFull('how much did I spend this month');
    expect(result.intent).toBe('query');
    if (result.intent !== 'query') return;
    expect(result.data.category).toBeUndefined();
  });

  it('includes specific category when detected', () => {
    const result = parseMessageFull('how much did I spend on groceries this month');
    expect(result.intent).toBe('query');
    if (result.intent !== 'query') return;
    expect(result.data.category).toBe('groceries');
  });

  it('detects spending from "total spent" keyword', () => {
    const result = parseMessageFull('total spent this month');
    expect(result.intent).toBe('query');
    if (result.intent !== 'query') return;
    expect(result.data.queryType).toBe('spending');
  });

  it('detects net worth balance query', () => {
    const result = parseMessageFull('what is my net worth?');
    expect(result.intent).toBe('query');
    if (result.intent !== 'query') return;
    expect(result.data.queryType).toBe('balance');
  });
});

describe('chatParser — transaction override branches', () => {
  it('card payment is treated as transaction', () => {
    const result = parseMessageFull('card payment 15000');
    expect(result.intent).toBe('transaction');
  });

  it('card due treated as transaction', () => {
    const result = parseMessageFull('paid card due 8000');
    expect(result.intent).toBe('transaction');
  });

  it('cashback text forces transaction intent', () => {
    const result = parseMessageFull('cashback 500 from amazon purchase');
    expect(result.intent).toBe('transaction');
  });

  it('loan payment treated as transaction', () => {
    const result = parseMessageFull('paid loan payment 20000');
    expect(result.intent).toBe('transaction');
  });

  it('loan emi treated as transaction', () => {
    const result = parseMessageFull('paid loan emi 15000');
    expect(result.intent).toBe('transaction');
  });
});

describe('chatParser — source extraction branches', () => {
  it('extracts card source from "using hdfc card"', () => {
    const result = parseMessageFull('spent 2000 on electronics using hdfc card');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.sourceName).toContain('hdfc');
    expect(result.data.sourceIsCard).toBe(true);
  });

  it('extracts source with last 4 digits', () => {
    const result = parseMessageFull('spent 500 on food from sbi 4321');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.sourceName).toContain('4321');
  });

  it('handles "via" preposition', () => {
    const result = parseMessageFull('paid 1000 for groceries via icici');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.sourceName).toContain('icici');
  });

  it('handles "with" preposition', () => {
    const result = parseMessageFull('bought 3000 worth electronics with kotak');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.sourceName).toContain('kotak');
  });
});

describe('chatParser — budget intent branches', () => {
  it('returns unknown when no amount for budget', () => {
    const result = parseMessageFull('set budget for food');
    expect(result.intent).toBe('unknown');
  });

  it('detects food category for budget with food keyword', () => {
    const result = parseMessageFull('set budget for food 5000');
    expect(result.intent).toBe('budget');
    if (result.intent !== 'budget') return;
    expect(result.data.category).toBe('food');
    expect(result.data.monthlyLimit).toBe(5000);
  });

  it('budget with entertainment category', () => {
    const result = parseMessageFull('monthly budget for netflix 500');
    expect(result.intent).toBe('budget');
    if (result.intent !== 'budget') return;
    expect(result.data.category).toBe('entertainment');
  });

  it('defaults to other category when no category keyword', () => {
    const result = parseMessageFull('set budget 5000 monthly budget');
    expect(result.intent).toBe('budget');
    if (result.intent !== 'budget') return;
    expect(result.data.monthlyLimit).toBe(5000);
    expect(result.data.category).toBe('other');
  });
});

describe('chatParser — category detection', () => {
  it('detects groceries from bigbasket', () => {
    const result = parseMessageFull('spent 800 on bigbasket');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.category).toBe('groceries');
  });

  it('detects transport from metro', () => {
    const result = parseMessageFull('paid 50 for metro');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.category).toBe('transport');
  });

  it('detects bills from electricity', () => {
    const result = parseMessageFull('paid 2500 electricity bill');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.category).toBe('bills');
  });

  it('detects health from doctor', () => {
    const result = parseMessageFull('paid 1000 for doctor');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.category).toBe('health');
  });

  it('detects education from course keyword', () => {
    const result = parseMessageFull('paid 999 for course');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.category).toBe('education');
  });

  it('detects travel from hotel keyword', () => {
    const result = parseMessageFull('paid 8000 for hotel');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.category).toBe('travel');
  });

  it('detects investment from dividend', () => {
    const result = parseMessageFull('received dividend 5000');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.category).toBe('investment');
  });

  it('detects gift category', () => {
    const result = parseMessageFull('received gift 2000');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.category).toBe('gift');
  });

  it('detects rent category', () => {
    const result = parseMessageFull('paid rent 15000');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.category).toBe('rent');
  });

  it('detects bills from internet', () => {
    const result = parseMessageFull('paid 999 internet bill');
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(result.data.category).toBe('bills');
  });
});
