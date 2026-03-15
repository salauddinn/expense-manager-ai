/**
 * Application-wide constants.
 * All magic strings and numbers should live here so changes are made in one place.
 */

// ── localStorage Keys ──

/** All finance-related localStorage keys, ordered by FK dependency (accounts → cards → transactions). */
export const FINANCE_STORAGE_KEYS = [
  'finance_bank_accounts',
  'finance_credit_cards',
  'finance_transactions',
  'finance_loans',
  'finance_assets',
  'finance_budget_goals',
  'finance_goals',
  'finance_chat_messages',
] as const;

/** localStorage key used to persist LLM API settings. */
export const LLM_SETTINGS_STORAGE_KEY = 'finance_llm_api_key';

// ── Default Financial Values ──

/** Default annual interest rate (%) used when no rate is specified for a loan. */
export const DEFAULT_LOAN_INTEREST_RATE = 8.5;

/** Default loan tenure in months (5 years) used when no tenure is specified. */
export const DEFAULT_LOAN_TENURE_MONTHS = 60;

/** Default currency code used throughout the app when no currency is specified. */
export const DEFAULT_CURRENCY = 'INR';

// ── UI / Display Constants ──

/** Number of months of history shown on the dashboard chart. */
export const DASHBOARD_CHART_MONTHS = 6;

/** Number of decimal places used when formatting currency amounts. */
export const CURRENCY_DECIMAL_PLACES = 2;

// ── File & Download Constants ──

/** Prefix applied to backup JSON filenames. */
export const BACKUP_FILENAME_PREFIX = 'fintrack_backup_';

/** Prefix applied to CSV export filenames. */
export const EXPORT_CSV_FILENAME_PREFIX = 'transactions_';

// ── Chat Constants ──

/** Placeholder text shown in the assistant loading bubble while the LLM processes a request. */
export const CHAT_LOADING_PLACEHOLDER = 'Thinking...';

/** User-facing message text shown when a receipt image is uploaded without accompanying text. */
export const CHAT_RECEIPT_UPLOAD_MESSAGE =
  '📷 Receipt received! Please describe the transaction (e.g., "spent ₹500 on groceries") so I can save it.';

/** Label shown in the user message bubble when only an image was uploaded (no text). */
export const CHAT_IMAGE_ONLY_LABEL = '📷 Receipt uploaded';

// ── Routing ──

/** Path users are redirected to after successful authentication. */
export const AUTH_REDIRECT_PATH = '/dashboard';

// ── Optimistic Updates ──

/** Prefix applied to optimistic IDs generated during Supabase mutations. */
export const OPTIMISTIC_ID_PREFIX = 'optimistic-';
