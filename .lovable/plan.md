

# Personal Finance Tracker — Local-First Build

## Approach
Build everything with local storage (localStorage) first. Data layer will be abstracted into custom hooks, making the transition to Supabase later a simple swap of the data source.

## Data Architecture

All data stored in localStorage via custom hooks:

```text
useTransactions()    → CRUD for income/expenses
useBankAccounts()    → CRUD for bank accounts
useCreditCards()     → CRUD for credit cards
useLoans()           → CRUD for home loans
useAssets()          → CRUD for manual assets (property, investments)
```

Each hook reads/writes to localStorage with a consistent pattern, so later we just replace the internals with Supabase queries.

## Pages & Navigation

**Bottom tab navigation (mobile-first) + sidebar on desktop:**

1. **Dashboard** (`/`) — Net worth card, income vs expenses chart (Recharts), recent transactions, quick stats
2. **Chat** (`/chat`) — AI-style chat interface to add expenses/income via natural language. Parses messages like "spent $50 on groceries" or "received ₹25000 salary". Photo upload button (stores locally, extracts nothing for now — placeholder for AI). Confirmation card before saving.
3. **Transactions** (`/transactions`) — Full list with filters (type, category, date range, currency). Edit/delete support.
4. **Loan Calculator** (`/loan-calculator`) — EMI calculator with inputs for amount, rate, tenure. Shows EMI, total interest, amortization table.
5. **Accounts** (`/accounts`) — Add/manage bank accounts, credit cards, manual assets. Shows balances and totals.

## Key Data Types

- **Transaction**: id, type (income/expense), amount, currency, category, description, date, receiptUrl?
- **BankAccount**: id, name, type (savings/current), balance, currency
- **CreditCard**: id, name, limit, outstanding, dueDate, currency
- **Loan**: id, name, principal, rate, tenureMonths, startDate
- **Asset**: id, name, type (property/investment/other), value, currency

## Chat Parser (Local)
Simple regex-based parser to extract:
- Amount + currency from messages (e.g., "$50", "₹500", "50 USD")
- Category keywords (groceries, rent, salary, etc.)
- Date references ("today", "yesterday", specific dates)

This will be upgraded to AI-powered parsing when backend is added.

## File Structure
```text
src/
  hooks/useLocalStorage.ts        — generic localStorage hook
  hooks/useTransactions.ts
  hooks/useBankAccounts.ts
  hooks/useCreditCards.ts
  hooks/useLoans.ts
  hooks/useAssets.ts
  lib/chatParser.ts               — regex-based message parser
  lib/currencies.ts               — currency symbols & formatting
  lib/categories.ts               — expense/income categories
  lib/loanCalculator.ts           — EMI math
  types/finance.ts                — all TypeScript types
  components/layout/AppLayout.tsx  — shell with nav
  components/layout/BottomNav.tsx
  components/dashboard/NetWorthCard.tsx
  components/dashboard/IncomeExpenseChart.tsx
  components/dashboard/RecentTransactions.tsx
  components/chat/ChatWindow.tsx
  components/chat/MessageBubble.tsx
  components/chat/TransactionConfirmCard.tsx
  components/transactions/TransactionList.tsx
  components/transactions/TransactionFilters.tsx
  components/loan/EMICalculator.tsx
  components/loan/AmortizationTable.tsx
  components/accounts/AccountCard.tsx
  components/accounts/AddAccountForm.tsx
  pages/Dashboard.tsx
  pages/Chat.tsx
  pages/Transactions.tsx
  pages/LoanCalculator.tsx
  pages/Accounts.tsx
```

## Backend Migration Path (Later)
When ready: connect Supabase, create tables matching the types, replace localStorage calls in hooks with Supabase queries. Components stay untouched.

