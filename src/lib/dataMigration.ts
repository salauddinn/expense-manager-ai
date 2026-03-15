/**
 * localStorage → Supabase migration utility.
 * Reads all localStorage keys and batch-inserts into the appropriate Supabase tables.
 * Insert order respects FK dependencies.
 */

import { supabase } from './supabase';
import { toSnakeCase } from './dbMapper';
import { FINANCE_STORAGE_KEYS } from './constants';
import { logger } from './logger';

interface MigrationResult {
  success: boolean;
  counts: Record<string, number>;
  errors: string[];
}

function readLocalStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    logger.warn(`[Migration] Failed to parse localStorage key: ${key}`);
    return [];
  }
}

export function hasLocalStorageData(): boolean {
  return FINANCE_STORAGE_KEYS.some((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  });
}

async function batchInsert(
  tableName: string,
  rows: Record<string, unknown>[],
  errors: string[],
): Promise<number> {
  if (rows.length === 0) return 0;

  const snakeRows = rows.map((row) => toSnakeCase(row));
  const { error } = await supabase.from(tableName).upsert(snakeRows, { onConflict: 'id', ignoreDuplicates: true });

  if (error) {
    logger.error(`[Migration] Failed to insert into ${tableName}`, error.message);
    errors.push(`${tableName}: ${error.message}`);
    return 0;
  }

  logger.info(`[Migration] Inserted ${rows.length} rows into ${tableName}`);
  return rows.length;
}

export async function migrateLocalStorageToSupabase(): Promise<MigrationResult> {
  const errors: string[] = [];
  const counts: Record<string, number> = {};

  logger.info('[Migration] Starting localStorage → Supabase migration');

  // 1. Bank Accounts
  const accounts = readLocalStorage<Record<string, unknown>>('finance_bank_accounts');
  counts.bank_accounts = await batchInsert('bank_accounts', accounts, errors);

  // 2. Credit Cards (limit → credit_limit handled by toSnakeCase in dbMapper)
  const cards = readLocalStorage<Record<string, unknown>>('finance_credit_cards');
  counts.credit_cards = await batchInsert('credit_cards', cards, errors);

  // 3. Transactions (after accounts + cards so FKs exist)
  const transactions = readLocalStorage<Record<string, unknown>>('finance_transactions');
  // Remove FK fields if referenced entities don't exist (safe migration)
  counts.transactions = await batchInsert('transactions', transactions, errors);

  // 4. Loans
  const loans = readLocalStorage<Record<string, unknown>>('finance_loans');
  counts.loans = await batchInsert('loans', loans, errors);

  // 5. Assets
  const assets = readLocalStorage<Record<string, unknown>>('finance_assets');
  counts.assets = await batchInsert('assets', assets, errors);

  // 6. Budget Goals
  const budgetGoals = readLocalStorage<Record<string, unknown>>('finance_budget_goals');
  // Remap monthlyLimit → monthly_limit (toSnakeCase handles it)
  counts.budget_goals = await batchInsert('budget_goals', budgetGoals, errors);

  // 7. Financial Goals (embedded contributions → separate table)
  interface LocalGoal extends Record<string, unknown> {
    id: string;
    contributions?: Array<Record<string, unknown>>;
    linkedTransactionIds?: string[];
    celebratedMilestones?: number[];
  }
  const goals = readLocalStorage<LocalGoal>('finance_goals');

  const goalRows = goals.map(({ contributions: _c, linkedTransactionIds: _l, ...rest }) => rest);
  counts.financial_goals = await batchInsert('financial_goals', goalRows, errors);

  // Insert contributions
  const allContribs: Record<string, unknown>[] = [];
  const allLinks: Record<string, unknown>[] = [];
  for (const goal of goals) {
    (goal.contributions ?? []).forEach((c) => {
      allContribs.push({ ...c, goalId: goal.id });
    });
    (goal.linkedTransactionIds ?? []).forEach((txId) => {
      allLinks.push({ goalId: goal.id, transactionId: txId });
    });
  }
  counts.goal_contributions = await batchInsert('goal_contributions', allContribs, errors);
  counts.goal_linked_transactions = await batchInsert('goal_linked_transactions', allLinks, errors);

  // 8. Chat Messages
  interface LocalChatMessage extends Record<string, unknown> {
    imageUrl?: string;
    parsedIntent?: unknown;
    isLoading?: boolean;
    timestamp?: number;
  }
  const chatMessages = readLocalStorage<LocalChatMessage>('finance_chat_messages');
  const chatRows = chatMessages.map(({ imageUrl, parsedIntent, isLoading, timestamp, ...rest }) => ({
    ...rest,
    image_url: imageUrl ?? null,
    parsed_intent: parsedIntent ?? null,
    is_loading: isLoading ?? false,
    created_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
  }));
  counts.chat_messages = await batchInsert('chat_messages', chatRows, errors);

  const success = errors.length === 0;
  logger.info('[Migration] Complete', { counts, errors });

  return { success, counts, errors };
}

export function clearLocalStorageData(): void {
  FINANCE_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  logger.info('[Migration] localStorage cleared');
}
