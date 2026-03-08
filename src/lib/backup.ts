/**
 * JSON backup & restore for all localStorage data.
 */
import { logger } from './logger';
import { analytics } from './analytics';

const STORAGE_KEYS = [
  'finance_transactions',
  'finance_bank_accounts',
  'finance_credit_cards',
  'finance_assets',
  'finance_loans',
  'finance_budget_goals',
  'finance_goals',
  'finance_llm_settings',
  'finance_chat_messages',
];

export function exportBackup() {
  const data: Record<string, unknown> = {};
  STORAGE_KEYS.forEach((key) => {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        logger.warn(`[Backup] Failed to parse key "${key}"`);
      }
    }
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fintrack_backup_${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);

  analytics.track('backup_exported');
  logger.info('[Backup] Export complete', { keys: Object.keys(data).length });
}

export function importBackup(file: File): Promise<{ success: boolean; keysRestored: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        let keysRestored = 0;

        STORAGE_KEYS.forEach((key) => {
          if (data[key] !== undefined) {
            localStorage.setItem(key, JSON.stringify(data[key]));
            keysRestored++;
          }
        });

        analytics.track('backup_imported', { keysRestored });
        logger.info('[Backup] Import complete', { keysRestored });
        resolve({ success: true, keysRestored });
      } catch (err) {
        logger.error('[Backup] Import failed', err);
        resolve({ success: false, keysRestored: 0 });
      }
    };
    reader.onerror = () => resolve({ success: false, keysRestored: 0 });
    reader.readAsText(file);
  });
}
