

## Fix: Chat Cashback Parsing + Manual Add Transaction UI

### Issue 1: Chat cashback not saving
The code in `useChatActions.ts` looks correct after the last edit — cashback IS being destructured and passed to `addTransaction` at line 220-222. However, since your previous edit was **cancelled mid-request**, the file may be in a partially-saved state. I'll re-apply the fix cleanly to ensure:
- `buildResponse` shows cashback in the confirmation message
- `handleConfirm` passes cashback to `addTransaction`

### Issue 2: Manual Add Transaction dialog
The `AddTransactionDialog` component exists and renders on the Transactions page. I'll verify it's working and improve the dialog with:
- Make the dialog scrollable (7 fields may overflow on mobile)
- Ensure the `onAdd` callback properly creates the transaction with all fields including cashback

### Changes

**`src/hooks/useChatActions.ts`**
- Re-verify and clean up the transaction confirmation handler to ensure cashback flows through correctly

**`src/components/AddTransactionDialog.tsx`**
- Add `ScrollArea` wrapper inside the dialog for mobile-friendly scrolling
- Ensure form reset works properly

**`src/lib/chatParser.ts`**
- Add "cashback" to `TRANSACTION_OVERRIDES` so messages containing "cashback" always get parsed as transactions (prevents misclassification)

