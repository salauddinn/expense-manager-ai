# FinTrack — Agent & Developer Guide

## Project Overview

FinTrack is a mobile-first personal finance tracker with an AI-powered chat interface. Users manage income, expenses, bank accounts, credit cards, loans, assets, and budgets using natural language. Data is stored securely in Supabase (PostgreSQL with Row Level Security), and AI parsing works via a local rule-based engine with an optional LLM fallback.

**Live stack:**
- React 18 + Vite + TypeScript frontend (PWA-ready)
- Supabase backend (Auth, PostgreSQL, Edge Functions)
- OpenAI / Google Gemini via a Deno Edge Function proxy
- Vitest test suite (274 tests, 14 test files)

---

## Architecture

```
User Input (chat)
      │
      ▼
chatParser.ts ──────────────── Rule-based NLP (7 intents, no API cost)
      │ fallback if ambiguous
      ▼
llm-proxy (Edge Function) ──── OpenAI or Gemini via server-side proxy
      │
      ▼
useChatActions.ts ─────────── Orchestrates parsing → confirmation → save
      │
      ▼
useSupabaseCrud.ts ─────────── Generic CRUD (React Query + Supabase)
      │                         Optimistic updates, cache invalidation
      ▼
Supabase PostgreSQL ─────────── 12 tables, RLS on every table
      │
      ▼
React Pages & Components ──── Dashboard, Chat, Transactions, Accounts, etc.
```

**Data transformation:**
- Database rows use `snake_case` (e.g. `linked_account_id`)
- TypeScript types use `camelCase` (e.g. `linkedAccountId`)
- `dbMapper.ts` converts bidirectionally on every read/write

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18.3, Vite 5.4 |
| Language | TypeScript 5.8 |
| Styling | Tailwind CSS 3.4 + shadcn/ui (Radix primitives) |
| Charts | Recharts 2.15 |
| Routing | React Router v6.30 |
| Forms | React Hook Form 7.61 + Zod 3.25 |
| Server state | TanStack React Query 5.83 |
| Backend | Supabase (Auth, PostgreSQL, Edge Functions) |
| LLM proxy | Deno Edge Runtime |
| Testing | Vitest 3.2 + Testing Library 16 |
| PWA | vite-plugin-pwa 1.2 (72 precached entries) |
| Package manager | Bun (also npm-compatible) |

---

## Directory Structure

```
src/
├── components/
│   ├── layout/           # AppLayout.tsx, BottomNav.tsx
│   ├── shared/           # ConfirmDialog.tsx, Section.tsx
│   ├── ui/               # 50+ shadcn/ui primitives (Button, Dialog, Input…)
│   ├── ChatComponents.tsx
│   ├── AddTransactionDialog.tsx
│   ├── AddEntityDialogs.tsx
│   ├── TransactionRow.tsx
│   ├── AlertsBanner.tsx
│   ├── LLMSettingsDialog.tsx
│   ├── ErrorBoundary.tsx
│   ├── ProtectedRoute.tsx
│   └── ThemeToggle.tsx
│
├── contexts/
│   └── AuthContext.tsx    # Supabase Auth, useAuth() hook
│
├── hooks/
│   ├── useSupabaseCrud.ts         # Generic CRUD (React Query + Supabase)
│   ├── useTransactions.ts         # Wraps useSupabaseCrud for transactions
│   ├── useBankAccounts.ts         # Wraps useSupabaseCrud for bank_accounts
│   ├── useCreditCards.ts          # Wraps useSupabaseCrud for credit_cards
│   ├── useAssets.ts               # Wraps useSupabaseCrud for assets
│   ├── useLoans.ts                # Wraps useSupabaseCrud for loans
│   ├── useBudgetGoals.ts          # Wraps useSupabaseCrud for budget_goals
│   ├── useFinancialGoals.ts       # Financial goals + contributions
│   ├── useRecurringTransactions.ts
│   ├── useChatActions.ts          # Chat parse → confirm → save flow
│   ├── useLLMSettings.ts          # LLM provider + API key management
│   ├── useDataMigration.ts        # localStorage → Supabase migration
│   ├── useLocalCrud.ts            # Legacy localStorage CRUD
│   ├── useLocalStorage.ts         # Raw localStorage hook
│   └── use-mobile.tsx             # Breakpoint detection
│
├── lib/
│   ├── chatParser.ts      # Rule-based NLP parser (7 intents)
│   ├── queryEngine.ts     # Answers financial queries from local data
│   ├── llmService.ts      # OpenAI + Gemini caller, tool/function calling
│   ├── dbMapper.ts        # snake_case ↔ camelCase conversion
│   ├── categories.ts      # Category definitions + icons
│   ├── currencies.ts      # Currency list, symbols, formatting
│   ├── analytics.ts       # Analytics abstraction (stub, replaceable)
│   ├── exportData.ts      # CSV download for transactions
│   ├── loanCalculator.ts  # EMI formula + amortization schedule
│   ├── dataMigration.ts   # Migrate localStorage data to Supabase
│   ├── backup.ts          # JSON backup export/import
│   ├── logger.ts          # Structured logger (DEBUG → ERROR)
│   ├── shared.ts          # sumBy, CHART_TOOLTIP_STYLE
│   ├── supabase.ts        # Supabase client singleton
│   └── utils.ts           # clsx/twMerge helper (cn)
│
├── pages/
│   ├── Dashboard.tsx      # Net worth, charts, recent transactions
│   ├── Chat.tsx           # AI chat interface
│   ├── Transactions.tsx   # List, filter, search, export
│   ├── Accounts.tsx       # Bank accounts + credit cards
│   ├── AccountDetail.tsx  # Single account view
│   ├── Budget.tsx         # Monthly budget progress
│   ├── Goals.tsx          # Financial goals list
│   ├── GoalDetail.tsx     # Goal contributions + progress
│   ├── LoanCalculator.tsx # EMI calculator
│   ├── Insights.tsx       # Spending analytics
│   ├── Recurring.tsx      # Recurring transactions
│   ├── Login.tsx          # Email/password + Google OAuth
│   ├── Signup.tsx
│   ├── Landing.tsx        # Public marketing page
│   ├── Install.tsx        # PWA install guide
│   └── NotFound.tsx
│
├── types/
│   ├── finance.ts         # Domain types (camelCase)
│   └── database.ts        # DB row types (snake_case)
│
└── test/
    ├── setup.ts           # Global test setup (URL stubs, etc.)
    ├── chatParser.test.ts
    ├── chatParserFull.test.ts
    ├── chatParserEdgeCases.test.ts
    ├── queryEngine.test.ts
    ├── queryEngineFull.test.ts
    ├── llmService.test.ts
    ├── categories.test.ts
    ├── currencies.test.ts
    ├── dbMapper.test.ts
    ├── exportData.test.ts
    ├── loanCalculator.test.ts
    ├── logger.test.ts
    ├── analytics.test.ts
    └── shared.test.ts

supabase/
├── functions/
│   └── llm-proxy/index.ts  # Deno Edge Function for LLM proxying
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_profiles_trigger.sql
    ├── 003_recurring_transactions.sql
    └── 004_demo_seed_data.sql
```

---

## Database Schema

All tables have Row Level Security (RLS) enabled. Every policy checks `auth.uid() = user_id`.

### Tables

| Table | Key Columns | Notes |
|-------|------------|-------|
| `profiles` | `id` (FK → auth.users), `email`, `display_name` | Auto-created on signup via trigger |
| `bank_accounts` | `name`, `type`, `balance`, `currency` | Types: savings, current, salary, cash |
| `credit_cards` | `name`, `credit_limit`, `outstanding`, `due_date` | `credit_limit` maps to `limit` in TS |
| `transactions` | `type`, `amount`, `category`, `date`, `linked_account_id`, `linked_card_id`, `cashback` | Indexed on `(user_id, date)` and `(user_id, category)` |
| `loans` | `name`, `principal`, `rate`, `tenure_months`, `start_date` | Rate is annual % |
| `assets` | `name`, `type`, `value` | Types: property, investment, vehicle, other |
| `budget_goals` | `category`, `monthly_limit` | Unique per (user_id, category) |
| `financial_goals` | `name`, `target_amount`, `current_amount`, `deadline`, `icon`, `celebrated_milestones` | |
| `goal_contributions` | `goal_id`, `amount`, `date`, `source` | source: manual, transaction |
| `goal_linked_transactions` | `goal_id`, `transaction_id` | Junction table |
| `chat_messages` | `role`, `content`, `parsed_intent` (jsonb), `confirmed` | role: user, assistant |
| `llm_settings` | `provider`, `model` | One row per user |
| `recurring_transactions` | `frequency`, `next_date`, `is_active` | frequency: daily/weekly/monthly/yearly |

### RLS Policy Pattern

Every table follows this pattern (4 separate policies, not `FOR ALL`):

```sql
-- SELECT: users read their own rows
CREATE POLICY "Users can view own rows"
  ON table_name FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: users create rows for themselves
CREATE POLICY "Users can insert own rows"
  ON table_name FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: users update their own rows
CREATE POLICY "Users can update own rows"
  ON table_name FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: users delete their own rows
CREATE POLICY "Users can delete own rows"
  ON table_name FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

---

## Core Libraries

### chatParser.ts — Rule-Based NLP Parser

Converts natural language into one of 7 structured intents. No API calls. No LLM. Fast and free.

```typescript
import { parseMessageFull } from '@/lib/chatParser';

const result = parseMessageFull('spent ₹500 on groceries yesterday');
// result.intent === 'transaction'
// result.data.amount === 500
// result.data.currency === 'INR'
// result.data.category === 'food'
// result.data.type === 'expense'
// result.data.date === '2025-06-14T...' (yesterday's date)
```

**7 Intents and example triggers:**

| Intent | Example Input |
|--------|--------------|
| `transaction` | "spent 500 on food", "earned 50000 salary" |
| `bank_account` | "add SBI savings account 25000" |
| `credit_card` | "add HDFC credit card limit 2 lakh" |
| `asset` | "add flat worth 50 lakh", "mutual fund worth 2 lakh" |
| `loan` | "home loan 30 lakh at 8.5% for 20 years" |
| `budget` | "set budget for food 5000 per month" |
| `query` | "how much did I spend this month?", "what is my net worth" |
| `unknown` | Anything with no detectable amount or intent |

**Amount parsing rules (in order):**
1. Currency symbol prefix: `₹500`, `$50`, `€30`, `£100`
2. Multiplier suffix: `5 lakh` → 500000, `2 crore` → 20000000, `50k` → 50000, `2m` → 2000000
3. ISO currency code: `500 INR`, `50 USD`
4. Natural language: `50 dollars`, `30 euros`, `1000 rupees`
5. Comma-formatted: `₹10,000` → 10000
6. Fallback: first bare number in string

**Intent detection priority:**

```
query → bank_account → credit_card → asset → loan → budget → transaction
```

Transaction overrides (these trump intent keywords):
`credit card bill`, `emi`, `cashback`, `loan payment`, `card payment`, `card due`

### queryEngine.ts — Financial Query Answering

Answers financial questions using data already loaded in React Query cache. No external calls.

```typescript
import { answerQuery } from '@/lib/queryEngine';

const answer = answerQuery(
  { queryType: 'balance', period: 'this_month' },
  { transactions, accounts, cards, loans, assets, currency: 'INR' }
);
// Returns markdown-formatted string like:
// "💰 Your Financial Summary\n🏦 Bank Balance: ₹5,00,000.00\n..."
```

**Query types:**

| Type | Returns |
|------|---------|
| `balance` | Net worth = bank balance + assets − credit debt − loan principals |
| `spending` | Total expenses for period, optionally filtered by category |
| `income` | Total income for period, optionally filtered by category |
| `summary` | All of the above: income, expense, net, transaction count |

**Period filters:** `today`, `this_week`, `this_month`, `this_year`

### llmService.ts — LLM Integration

Calls OpenAI or Google Gemini with function/tool calling to extract structured financial data.

```typescript
import { callLLMProxy, mapLLMResultToIntent } from '@/lib/llmService';

const raw = await callLLMProxy('openai', 'gpt-4o-mini', 'spent 500 on groceries');
const intent = mapLLMResultToIntent(raw);
// Same shape as parseMessageFull() output
```

**Two call paths:**

1. **Direct browser call** (`callLLM`) — uses user's own API key (BYOK pattern), key never leaves browser
2. **Edge Function proxy** (`callLLMProxy`) — server-side key, more secure, slower cold start

**Supported providers:**

| Provider | Models | Direct API URL |
|----------|--------|----------------|
| OpenAI | `gpt-4o-mini`, `gpt-4o`, `gpt-3.5-turbo` | `api.openai.com/v1/chat/completions` |
| Google Gemini | `gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-2.5-pro` | `generativelanguage.googleapis.com` |

### dbMapper.ts — Case Conversion

Every Supabase read/write passes through these two functions.

```typescript
import { toCamelCase, toSnakeCase } from '@/lib/dbMapper';

// DB row → TypeScript object
toCamelCase({ user_id: 'abc', credit_limit: 100000 })
// → { userId: 'abc', limit: 100000 }    ← note: credit_limit → limit (special case)

// TypeScript object → DB row
toSnakeCase({ userId: 'abc', limit: 100000 })
// → { user_id: 'abc', credit_limit: 100000 }
```

**Special case:** `credit_limit` ↔ `limit` exists because `CreditCard` type uses `limit` (avoiding the SQL reserved word), but the DB column is `credit_limit`.

### categories.ts — Category System

```typescript
import { getCategoryInfo, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/categories';

getCategoryInfo('food')
// → { value: 'food', label: 'Food & Dining', icon: '🍔' }

// Expense categories (11):
// food, groceries, transport, shopping, bills, entertainment,
// health, education, rent, travel, other

// Income categories (6):
// salary, freelance, investment, gift, refund, other
```

### loanCalculator.ts — EMI Calculations

```typescript
import { calculateEMI, generateAmortization } from '@/lib/loanCalculator';

const result = calculateEMI(3000000, 8.5, 240);
// result.emi           === 26,035.32  (monthly payment)
// result.totalInterest === 3,248,476.80
// result.totalPayment  === 6,248,476.80

const schedule = generateAmortization(3000000, 8.5, 240);
// schedule[0] → { month: 1, emi: 26035.32, principal: 4785.32, interest: 21250, balance: 2995214.68 }
```

**EMI formula:** `EMI = P × r(1+r)^n / ((1+r)^n − 1)` where `r = annualRate/12/100`

### currencies.ts — Currency Support

```typescript
import { getCurrencySymbol, formatCurrency, CURRENCIES, DEFAULT_CURRENCY } from '@/lib/currencies';

getCurrencySymbol('INR')       // → '₹'
formatCurrency(100000, 'INR')  // → '₹1,00,000.00'
DEFAULT_CURRENCY               // → 'INR'

// Supported: INR, USD, EUR, GBP, JPY, AED, CAD, AUD
```

### logger.ts — Structured Logging

```typescript
import { logger } from '@/lib/logger';

logger.debug('Cache hit', { key: 'transactions' });   // dev only
logger.info('[Chat] Message processed', { intent });   // dev only
logger.warn('[Parser] Ambiguous input', { text });     // dev only
logger.error('[Supabase] Query failed', error);        // always logged
```

Format: `[2025-06-15T12:00:00.000Z] [INFO] message { extra: data }`

Production builds suppress `debug`, `info`, and `warn`. Only `error` is logged.

### analytics.ts — Analytics Abstraction

Currently a stub (logs events only). Replace the class body to plug in PostHog, Mixpanel, etc. without touching call sites.

```typescript
import { analytics } from '@/lib/analytics';

analytics.init();
analytics.track('transaction_added', { category: 'food', amount: 500 });
analytics.identify(userId, { plan: 'free' });
analytics.page('Dashboard');
```

### exportData.ts — CSV Export

```typescript
import { exportTransactionsCSV } from '@/lib/exportData';

exportTransactionsCSV(transactions);
// Creates: transactions_2025-06-15.csv
// Columns: Date, Type, Category, Description, Amount, Currency
```

---

## Authentication

Uses Supabase email/password auth. Google OAuth is also supported.

```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user, session, loading, signIn, signUp, signOut } = useAuth();

// Sign in
const { error } = await signIn('user@example.com', 'password');

// Sign up (email confirmation is disabled by default)
const { error, needsConfirmation } = await signUp('user@example.com', 'password');

// Sign out
await signOut();
```

Auth state is available everywhere via the `AuthProvider` wrapper in `main.tsx`. Protected routes use `<ProtectedRoute>` which redirects unauthenticated users to `/login`.

**Important:** The `onAuthStateChange` listener uses a synchronous callback wrapper to avoid Supabase client deadlocks:

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  (async () => {
    // safe to use async code here
  })();
});
```

---

## Generic CRUD Hook

All domain hooks are thin wrappers over `useSupabaseCrud`. This is the only place Supabase queries run.

```typescript
// Generic hook (useSupabaseCrud.ts)
const { items, isLoading, add, remove, update } = useSupabaseCrud<Transaction>('transactions');

// Specialized hooks (same API, just typed)
const { transactions, isLoading, addTransaction, deleteTransaction } = useTransactions();
const { accounts, addAccount } = useBankAccounts();
const { cards, addCard } = useCreditCards();
const { assets } = useAssets();
const { loans } = useLoans();
```

**Under the hood:**
- `useQuery` fetches all rows for the authenticated user
- `useMutation` handles add/update/delete with optimistic updates
- `queryClient.invalidateQueries` keeps cache in sync after mutations
- `toCamelCase` / `toSnakeCase` convert on every read/write

---

## Edge Function: llm-proxy

**Location:** `supabase/functions/llm-proxy/index.ts`

**Runtime:** Deno (deployed to Supabase Edge)

**Purpose:** Acts as a server-side proxy so API keys for OpenAI/Gemini stay off the client.

**Request:**
```json
POST /functions/v1/llm-proxy
Authorization: Bearer <supabase-jwt>
Content-Type: application/json

{
  "message": "spent ₹500 on groceries",
  "provider": "openai",
  "model": "gpt-4o-mini"
}
```

**Response:**
```json
{
  "intent": "add_transaction",
  "data": {
    "type": "expense",
    "amount": 500,
    "currency": "INR",
    "category": "food",
    "description": "groceries",
    "message": "Recorded an expense of ₹500.00 for Groceries."
  }
}
```

**Auth:** Validates the Supabase JWT before proxying. Returns 401 if invalid.

**Environment variables (auto-configured by Supabase):**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (set via Supabase dashboard secrets)
- `GOOGLE_API_KEY` (set via Supabase dashboard secrets)

---

## Routes & Pages

| Route | Page | Auth Required |
|-------|------|:---:|
| `/` | Landing | No |
| `/login` | Login | No |
| `/signup` | Signup | No |
| `/dashboard` | Dashboard | Yes |
| `/chat` | Chat | Yes |
| `/transactions` | Transactions | Yes |
| `/accounts` | Accounts | Yes |
| `/accounts/:id` | Account Detail | Yes |
| `/budget` | Budget | Yes |
| `/goals` | Goals | Yes |
| `/goals/:id` | Goal Detail | Yes |
| `/loan-calculator` | Loan Calculator | Yes |
| `/insights` | Insights | Yes |
| `/recurring` | Recurring | Yes |
| `/install` | PWA Install Guide | No |
| `/privacy` | Privacy Policy | No |
| `/terms` | Terms & Conditions | No |

---

## LLM Settings (BYOK Pattern)

Users configure their own API key in the `LLMSettingsDialog`. The key is stored in `llm_settings` table (Supabase) per user — never in localStorage after migration.

```typescript
const { settings, isConfigured, updateSettings, clearApiKey } = useLLMSettings();

// settings.provider → 'openai' | 'google'
// settings.model    → 'gpt-4o-mini' | 'gemini-2.0-flash' | etc.
// isConfigured      → true if provider + key are set
```

The chat flow:
1. Try `parseMessageFull` (rule-based, instant)
2. If intent is `unknown` and LLM is configured → call `callLLMProxy`
3. Show parsed result to user for confirmation
4. On confirm → save to Supabase via appropriate CRUD hook

---

## Design System

- **Color tokens:** HSL-based CSS variables in `src/index.css` (light + dark modes)
- **Semantic colors:** `--primary`, `--secondary`, `--destructive`, `--success`, `--warning`, `--muted`
- **Comprehensive ramps:** Each semantic color has foreground, background, and border variants
- **Font:** Inter (sans-serif), max 3 weights
- **Spacing:** 8px grid (Tailwind default)
- **Border radius:** `0.75rem` base
- **No hardcoded hex/rgb** in components — always use Tailwind semantic classes

---

## Testing

**Run all tests:**
```bash
npm run test          # Run once
npm run test:watch    # Watch mode with re-runs
```

**Coverage:** 274 tests across 14 test files. All pass.

**Test file conventions:**
- `src/test/setup.ts` — global stubs (`URL.createObjectURL`, `URL.revokeObjectURL`)
- AAA pattern: Arrange → Act → Assert
- `vi.useFakeTimers()` for date-dependent tests
- `vi.spyOn(globalThis, 'Blob')` for blob content inspection (jsdom limitation workaround)
- `vi.spyOn(document, 'createElement')` to capture download link behavior

**Example test pattern:**

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseMessageFull } from '@/lib/chatParser';

describe('chatParser — date detection', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles "yesterday" offset', () => {
    // Arrange — freeze time to a known date
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00.000Z'));

    // Act
    const result = parseMessageFull('spent 500 on food yesterday');

    // Assert
    expect(result.intent).toBe('transaction');
    if (result.intent !== 'transaction') return;
    expect(new Date(result.data.date).getDate()).toBe(14);
  });
});
```

---

## Adding a New Feature — Checklist

When adding a new entity type (e.g., subscriptions, investments):

1. **Database migration** — create table with `IF NOT EXISTS`, enable RLS, add 4 policies
2. **DB types** — add `DbSubscription` interface to `src/types/database.ts`
3. **Domain types** — add `Subscription` interface to `src/types/finance.ts`
4. **CRUD hook** — add `useSubscriptions.ts` wrapping `useSupabaseCrud`
5. **dbMapper** — add any special case column name mappings if needed
6. **chatParser** — add intent keywords if the entity can be created via chat
7. **Page + Route** — add route in `App.tsx` and create page in `src/pages/`
8. **Tests** — add test file in `src/test/`
9. **Build verification** — run `npm run build` to confirm no TypeScript errors

---

## Common Patterns

**Fetching + displaying data:**
```typescript
const { transactions, isLoading } = useTransactions();

if (isLoading) return <Skeleton />;
return transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />);
```

**Saving data:**
```typescript
const { addTransaction } = useTransactions();

await addTransaction({
  type: 'expense',
  amount: 500,
  currency: 'INR',
  category: 'food',
  description: 'Lunch',
  date: new Date().toISOString(),
});
// React Query cache is automatically invalidated after save
```

**Formatting currency:**
```typescript
import { formatCurrency } from '@/lib/currencies';
formatCurrency(amount, 'INR')  // → '₹5,00,000.00'
```

**Summing arrays:**
```typescript
import { sumBy } from '@/lib/shared';
const totalBalance = sumBy(accounts, a => a.balance);
```

---

## Environment Variables

Create `.env` at project root (copy from `.env.example` if it exists):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

All other secrets (OpenAI, Gemini API keys) are stored per-user in the `llm_settings` table, never in environment variables.

---

## PWA Details

- 72 precached entries (all JS, CSS, HTML, images)
- Offline support via Workbox service worker
- Install prompt handled by `/install` page
- App icons: 192×192, 512×512 (PNG), maskable icon
- Theme color: `#4361ee`
- Display mode: `standalone` (full-screen, no browser chrome)

---

## Future Enhancements

- [ ] Receipt OCR via camera + AI vision
- [ ] Bank statement CSV/PDF import
- [ ] Multi-currency portfolio view with live exchange rates
- [ ] Monthly email/push notification reports
- [ ] Native iOS/Android wrapper via Capacitor (if camera/biometrics needed)
- [ ] Replace analytics stub with PostHog or Mixpanel

---

---

# Bolt Prompt

Use this prompt when starting a new Bolt (bolt.new) session for continued development on FinTrack.

---

```
You are continuing development on FinTrack, a mobile-first personal finance tracker.
Read agents.md for full context. Here is the essential summary:

## Project
React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui frontend.
Supabase backend (PostgreSQL + Auth + Edge Functions).
TanStack React Query for server state. Vitest for testing.
Package manager: Bun (also npm-compatible).

## Architecture Rules
1. All database access goes through useSupabaseCrud<T>(tableName). Never query Supabase directly in components.
2. DB rows are snake_case. TypeScript types are camelCase. dbMapper.ts handles conversion on every read/write.
3. Every new Supabase table MUST have RLS enabled with 4 separate policies (SELECT, INSERT, UPDATE, DELETE). Never use FOR ALL or USING (true).
4. New tables go in a new migration file using mcp__supabase__apply_migration. Never ALTER existing tables destructively.
5. Use maybeSingle() instead of single() for zero-or-one row queries.

## Code Standards
- No comments unless the logic is non-obvious.
- No over-engineering: no abstractions for one-time use, no error handling for impossible scenarios.
- Files stay under ~300 lines. Split by responsibility if larger.
- All new libraries must already be in package.json. Never assume a package is available.
- After all changes, run npm run build to verify no TypeScript errors.

## Patterns to Follow
- New entity type → add migration + DB type + domain type + useSomethingCrud hook + page + route in App.tsx
- All formatting: formatCurrency(amount, currency) from currencies.ts
- Array sums: sumBy(items, item => item.value) from shared.ts
- Logging: logger.info / logger.error from logger.ts (never console.log)
- Analytics events: analytics.track('event_name', { props }) from analytics.ts

## Testing
- Tests live in src/test/. Run with npm run test.
- Use vi.useFakeTimers() + vi.setSystemTime() for any date-dependent test.
- Use vi.spyOn(globalThis, 'Blob') to capture blob content (jsdom does not support blob.text()).
- All 274 tests must pass before any PR.

## Design Rules
- Colors: always use Tailwind semantic classes (bg-primary, text-muted-foreground). No hardcoded hex.
- Never use purple, indigo, or violet unless explicitly requested.
- Mobile-first: design for 390px wide first, then larger.
- 8px spacing grid. Max 3 font weights. 150% line-height for body text.
- Prefer editing existing components over creating new ones.

## LLM Integration
- Rule-based parser (chatParser.ts) runs first — it handles 7 intents with no API cost.
- LLM (OpenAI/Gemini) is the fallback for ambiguous input.
- LLM calls go through the llm-proxy Supabase Edge Function (server-side keys).
- Users can also provide their own key (BYOK) stored in llm_settings table.

## Code Review Checklist (before completing any task)
- [ ] RLS enabled on every new table with user_id check
- [ ] No console.log (use logger)
- [ ] No hardcoded colors (use Tailwind semantic classes)
- [ ] dbMapper used for all Supabase reads/writes
- [ ] npm run build passes
- [ ] npm run test passes (274 tests)
- [ ] Files under 300 lines each
- [ ] No purple/indigo colors
- [ ] maybeSingle() not single() for optional row queries
```
