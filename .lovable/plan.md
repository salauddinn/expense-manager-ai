

## Cashback Tracking on Transactions

### What it does
Add an optional `cashback` field to transactions so users can log how much cashback they received on a purchase. Show cashback info on transaction rows and provide a summary of total cashbacks earned.

### Technical changes

**1. Update Transaction type (`src/types/finance.ts`)**
- Add optional `cashback?: number` field to `Transaction` interface

**2. Update Transaction edit dialog (`src/pages/Transactions.tsx`)**
- Add a "Cashback" number input field in the edit transaction dialog

**3. Update chat parser (`src/lib/chatParser.ts`)**
- Detect cashback mentions like "cashback ₹50", "got 50 back", "cashback 10%"
- Store parsed cashback amount on the transaction

**4. Update LLM service (`src/lib/llmService.ts`)**
- Add `cashback` parameter to the transaction tool definition

**5. Update TransactionRow (`src/components/TransactionRow.tsx`)**
- Show a small cashback badge (e.g., "↩ ₹50") next to the amount when present

**6. Update Dashboard (`src/pages/Dashboard.tsx`)**
- Add a small "Total Cashback" stat showing sum of all cashback amounts

**7. Update AddEntityDialogs (`src/components/AddEntityDialogs.tsx`)**
- Add cashback field when adding transactions via the dialog (if applicable)

