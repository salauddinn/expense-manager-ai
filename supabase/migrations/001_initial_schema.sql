-- FinTrack Initial Schema
-- All tables use RLS with user_id = auth.uid() policies

-- Profiles (auto-created on signup via trigger)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Bank Accounts
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('savings', 'current', 'salary', 'cash')),
  balance numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  created_at timestamptz DEFAULT now()
);

-- Credit Cards
CREATE TABLE IF NOT EXISTS public.credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  credit_limit numeric NOT NULL DEFAULT 0,
  outstanding numeric NOT NULL DEFAULT 0,
  due_date text,
  currency text NOT NULL DEFAULT 'INR',
  created_at timestamptz DEFAULT now()
);

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  category text NOT NULL,
  description text,
  date text NOT NULL,
  receipt_url text,
  linked_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  linked_card_id uuid REFERENCES public.credit_cards(id) ON DELETE SET NULL,
  cashback numeric,
  created_at timestamptz DEFAULT now()
);

-- Loans
CREATE TABLE IF NOT EXISTS public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  principal numeric NOT NULL,
  rate numeric NOT NULL,
  tenure_months integer NOT NULL,
  start_date text NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  created_at timestamptz DEFAULT now()
);

-- Assets
CREATE TABLE IF NOT EXISTS public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('property', 'investment', 'vehicle', 'other')),
  value numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  created_at timestamptz DEFAULT now()
);

-- Budget Goals
CREATE TABLE IF NOT EXISTS public.budget_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  monthly_limit numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, category)
);

-- Financial Goals
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  deadline text,
  icon text NOT NULL DEFAULT '🎯',
  category text NOT NULL DEFAULT 'custom',
  color text NOT NULL DEFAULT 'hsl(200, 70%, 50%)',
  celebrated_milestones integer[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Goal Contributions
CREATE TABLE IF NOT EXISTS public.goal_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.financial_goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  date text NOT NULL,
  source text NOT NULL CHECK (source IN ('manual', 'transaction')),
  label text,
  transaction_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Goal Linked Transactions (junction table)
CREATE TABLE IF NOT EXISTS public.goal_linked_transactions (
  goal_id uuid NOT NULL REFERENCES public.financial_goals(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (goal_id, transaction_id)
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  image_url text,
  parsed_intent jsonb,
  confirmed boolean,
  is_loading boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- LLM Settings (one row per user)
CREATE TABLE IF NOT EXISTS public.llm_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'openai',
  model text NOT NULL DEFAULT 'gpt-4o-mini',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- ── Indexes ──

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON public.bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON public.credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON public.transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_goals_user_id ON public.budget_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON public.financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal_id ON public.goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_user_id ON public.goal_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_settings_user_id ON public.llm_settings(user_id);

-- ── Row Level Security ──

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_linked_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_settings ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Bank Accounts RLS
CREATE POLICY "bank_accounts_select" ON public.bank_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bank_accounts_insert" ON public.bank_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bank_accounts_update" ON public.bank_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bank_accounts_delete" ON public.bank_accounts FOR DELETE USING (auth.uid() = user_id);

-- Credit Cards RLS
CREATE POLICY "credit_cards_select" ON public.credit_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "credit_cards_insert" ON public.credit_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "credit_cards_update" ON public.credit_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "credit_cards_delete" ON public.credit_cards FOR DELETE USING (auth.uid() = user_id);

-- Transactions RLS
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Loans RLS
CREATE POLICY "loans_select" ON public.loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "loans_insert" ON public.loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "loans_update" ON public.loans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "loans_delete" ON public.loans FOR DELETE USING (auth.uid() = user_id);

-- Assets RLS
CREATE POLICY "assets_select" ON public.assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "assets_insert" ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "assets_update" ON public.assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "assets_delete" ON public.assets FOR DELETE USING (auth.uid() = user_id);

-- Budget Goals RLS
CREATE POLICY "budget_goals_select" ON public.budget_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "budget_goals_insert" ON public.budget_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budget_goals_update" ON public.budget_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "budget_goals_delete" ON public.budget_goals FOR DELETE USING (auth.uid() = user_id);

-- Financial Goals RLS
CREATE POLICY "financial_goals_select" ON public.financial_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "financial_goals_insert" ON public.financial_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "financial_goals_update" ON public.financial_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "financial_goals_delete" ON public.financial_goals FOR DELETE USING (auth.uid() = user_id);

-- Goal Contributions RLS
CREATE POLICY "goal_contributions_select" ON public.goal_contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goal_contributions_insert" ON public.goal_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goal_contributions_update" ON public.goal_contributions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "goal_contributions_delete" ON public.goal_contributions FOR DELETE USING (auth.uid() = user_id);

-- Goal Linked Transactions RLS
CREATE POLICY "goal_linked_select" ON public.goal_linked_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goal_linked_insert" ON public.goal_linked_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goal_linked_delete" ON public.goal_linked_transactions FOR DELETE USING (auth.uid() = user_id);

-- Chat Messages RLS
CREATE POLICY "chat_messages_select" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chat_messages_insert" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_messages_update" ON public.chat_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "chat_messages_delete" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

-- LLM Settings RLS
CREATE POLICY "llm_settings_select" ON public.llm_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "llm_settings_insert" ON public.llm_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "llm_settings_update" ON public.llm_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "llm_settings_delete" ON public.llm_settings FOR DELETE USING (auth.uid() = user_id);
