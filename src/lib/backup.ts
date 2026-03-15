/**
 * JSON backup & restore.
 * Exports from Supabase (primary) with localStorage fallback.
 */
import { supabase } from './supabase';
import { triggerFileDownload } from './shared';
import { BACKUP_FILENAME_PREFIX, FINANCE_STORAGE_KEYS } from './constants';
import { logger } from './logger';
import { analytics } from './analytics';

const TABLE_MAP: Record<string, string> = {
  bank_accounts: 'bank_accounts',
  credit_cards: 'credit_cards',
  transactions: 'transactions',
  loans: 'loans',
  assets: 'assets',
  budget_goals: 'budget_goals',
  financial_goals: 'financial_goals',
  goal_contributions: 'goal_contributions',
  chat_messages: 'chat_messages',
};

/** Exports all user data as a JSON file and triggers a browser download. */
export async function exportBackup() {
  const data: Record<string, unknown> = {};

  try {
    const [accounts, cards, transactions, loans, assets, budgetGoals, goals, contributions, chatMessages] = await Promise.all([
      supabase.from('bank_accounts').select('*'),
      supabase.from('credit_cards').select('*'),
      supabase.from('transactions').select('*'),
      supabase.from('loans').select('*'),
      supabase.from('assets').select('*'),
      supabase.from('budget_goals').select('*'),
      supabase.from('financial_goals').select('*'),
      supabase.from('goal_contributions').select('*'),
      supabase.from('chat_messages').select('*'),
    ]);

    data['bank_accounts'] = accounts.data ?? [];
    data['credit_cards'] = cards.data ?? [];
    data['transactions'] = transactions.data ?? [];
    data['loans'] = loans.data ?? [];
    data['assets'] = assets.data ?? [];
    data['budget_goals'] = budgetGoals.data ?? [];
    data['financial_goals'] = goals.data ?? [];
    data['goal_contributions'] = contributions.data ?? [];
    data['chat_messages'] = chatMessages.data ?? [];
  } catch (err) {
    logger.warn('[Backup] Supabase export failed, falling back to localStorage', err);
    FINANCE_STORAGE_KEYS.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          data[key] = JSON.parse(raw);
        } catch {
          logger.warn(`[Backup] Failed to parse key "${key}"`);
        }
      }
    });
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerFileDownload(blob, `${BACKUP_FILENAME_PREFIX}${new Date().toISOString().slice(0, 10)}.json`);

  analytics.track('backup_exported');
  logger.info('[Backup] Export complete', { keys: Object.keys(data).length });
}

export interface ImportBackupResult {
  success: boolean;
  keysRestored: number;
  errorMessage?: string;
}

/** Reads a JSON backup file and restores its data to Supabase (or localStorage as fallback). */
export function importBackup(file: File): Promise<ImportBackupResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result as string);
        let keysRestored = 0;

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user?.id) {
          for (const [key, tableName] of Object.entries(TABLE_MAP)) {
            const rows = data[key];
            if (!Array.isArray(rows) || rows.length === 0) continue;

            const rowsWithUser = rows.map((row: Record<string, unknown>) => ({
              ...row,
              user_id: session.user.id,
            }));

            const { error } = await supabase
              .from(tableName)
              .upsert(rowsWithUser, { onConflict: 'id', ignoreDuplicates: true });

            if (error) {
              logger.warn(`[Backup] Failed to upsert ${tableName}`, error.message);
            } else {
              keysRestored++;
            }
          }

          analytics.track('backup_imported', { keysRestored, target: 'supabase' });
          logger.info('[Backup] Import to Supabase complete', { keysRestored });
          resolve({ success: true, keysRestored });
        } else {
          FINANCE_STORAGE_KEYS.forEach((key) => {
            if (data[key] !== undefined) {
              localStorage.setItem(key, JSON.stringify(data[key]));
              keysRestored++;
            }
          });

          analytics.track('backup_imported', { keysRestored, target: 'localStorage' });
          logger.info('[Backup] Import to localStorage complete — reload to trigger migration', { keysRestored });
          resolve({ success: true, keysRestored });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error during import';
        logger.error('[Backup] Import failed', errorMessage);
        resolve({ success: false, keysRestored: 0, errorMessage });
      }
    };
    reader.onerror = () => resolve({ success: false, keysRestored: 0, errorMessage: 'Failed to read file' });
    reader.readAsText(file);
  });
}
