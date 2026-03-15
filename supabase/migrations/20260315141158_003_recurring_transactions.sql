/*
  # Recurring Transactions

  ## Summary
  Adds support for recurring/scheduled transactions that automatically repeat on a defined frequency.

  ## New Tables
  - `recurring_transactions`
    - `id` (uuid, PK)
    - `user_id` (uuid, FK auth.users)
    - `type` - 'income' or 'expense'
    - `amount` - transaction amount
    - `currency` - currency code
    - `category` - spending category
    - `description` - transaction label
    - `frequency` - 'daily' | 'weekly' | 'monthly' | 'yearly'
    - `next_date` - date when next occurrence should be created
    - `end_date` - optional end date for the recurrence
    - `is_active` - whether the rule is currently active
    - `linked_account_id` - optional bank account link
    - `linked_card_id` - optional credit card link
    - `created_at`

  ## Security
  - RLS enabled with user ownership policies for all operations
  - Users can only see and manage their own recurring transaction rules

  ## Notes
  - `next_date` is stored as text (ISO date string) matching the pattern used by the transactions table
  - Frontend handles creating actual transactions when `next_date` is due
*/

CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  category text NOT NULL,
  description text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_date text NOT NULL,
  end_date text,
  is_active boolean NOT NULL DEFAULT true,
  linked_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  linked_card_id uuid REFERENCES public.credit_cards(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON public.recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_date ON public.recurring_transactions(user_id, next_date);

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_transactions_select"
  ON public.recurring_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "recurring_transactions_insert"
  ON public.recurring_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recurring_transactions_update"
  ON public.recurring_transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recurring_transactions_delete"
  ON public.recurring_transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
