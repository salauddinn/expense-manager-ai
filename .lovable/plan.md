

## Feature: View Transactions per Account / Credit Card

**What you're asking for**: Tap on any bank account or credit card and see all transactions linked to it — a spending breakdown per source.

### How it works today
- Transactions have `linkedAccountId` and `linkedCardId` fields (already in the type)
- The Accounts page just shows account name, balance, and a delete button — no drill-down

### Plan

**1. Create an Account Detail page (`src/pages/AccountDetail.tsx`)**
- Route: `/accounts/:id` — works for both bank accounts and credit cards
- Shows account/card info at the top (name, balance/outstanding, type)
- Lists all transactions where `linkedAccountId` or `linkedCardId` matches
- Filter pills: All / Income / Expense
- Summary stats: total spent, total income, transaction count
- Empty state when no linked transactions

**2. Add route in `App.tsx`**
- `<Route path="/accounts/:id" element={<AccountDetail />} />`

**3. Make accounts/cards tappable on Accounts page**
- Wrap each account/card row with a `<Link to={/accounts/${id}>` so tapping navigates to the detail view
- Add a chevron icon to indicate it's tappable

**4. Add "View Transactions" link on Transactions page filter**
- Optional: add account/card filter dropdown to the existing Transactions page

This gives you a clean drill-down: tap "HDFC Savings" → see every transaction from that account with totals.

