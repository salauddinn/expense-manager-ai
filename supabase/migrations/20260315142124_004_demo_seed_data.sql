/*
  # Demo Seed Data

  ## Summary
  Creates a demo user account and seeds realistic financial data for testing.

  ## Demo Login Credentials
  - Email: demo@fintrack.app
  - Password: Demo@1234

  ## What this seeds
  1. Demo user + profile
  2. 4 bank accounts (HDFC, SBI, ICICI, Cash Wallet)
  3. 2 credit cards (Axis Magnus, HDFC Regalia)
  4. 2 loans (Home Loan, Car Loan)
  5. 3 assets (Apartment, Mutual Funds, Car)
  6. 5 budget goals (Food, Shopping, Transport, Entertainment, Health)
  7. 3 financial goals (Europe Vacation, Emergency Fund, New Laptop)
  8. Goal contributions for each goal
  9. 4 recurring transaction rules
  10. 60+ transactions across 6 months (Oct 2025 – Mar 2026)

  ## Notes
  - All rows use fixed UUIDs so re-running is idempotent (ON CONFLICT / WHERE NOT EXISTS guards)
*/

DO $$
DECLARE
  demo_uid     uuid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid;
  hdfc_acc_id  uuid := 'b1b2c3d4-0001-0000-0000-000000000001'::uuid;
  sbi_acc_id   uuid := 'b1b2c3d4-0001-0000-0000-000000000002'::uuid;
  icici_acc_id uuid := 'b1b2c3d4-0001-0000-0000-000000000003'::uuid;
  cash_acc_id  uuid := 'b1b2c3d4-0001-0000-0000-000000000004'::uuid;
  axis_card_id uuid := 'c1b2c3d4-0001-0000-0000-000000000001'::uuid;
  hdfc_card_id uuid := 'c1b2c3d4-0001-0000-0000-000000000002'::uuid;
  g_vacation   uuid := 'd1b2c3d4-0001-0000-0000-000000000001'::uuid;
  g_emergency  uuid := 'd1b2c3d4-0001-0000-0000-000000000002'::uuid;
  g_laptop     uuid := 'd1b2c3d4-0001-0000-0000-000000000003'::uuid;
BEGIN

  -- ── Demo User ──────────────────────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token, recovery_token,
    email_change_token_new, email_change
  )
  VALUES (
    demo_uid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated', 'authenticated',
    'demo@fintrack.app',
    crypt('Demo@1234', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Demo User"}'::jsonb,
    false, '', '', '', ''
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, email, display_name)
  VALUES (demo_uid, 'demo@fintrack.app', 'Demo User')
  ON CONFLICT (id) DO NOTHING;

  -- ── Bank Accounts ──────────────────────────────────────────────────────────
  INSERT INTO public.bank_accounts (id, user_id, name, type, balance, currency) VALUES
    (hdfc_acc_id,  demo_uid, 'HDFC Savings',       'savings', 124500, 'INR'),
    (sbi_acc_id,   demo_uid, 'SBI Salary Account', 'salary',   42800, 'INR'),
    (icici_acc_id, demo_uid, 'ICICI Current',      'current',  18200, 'INR'),
    (cash_acc_id,  demo_uid, 'Cash Wallet',        'cash',      5500, 'INR')
  ON CONFLICT (id) DO NOTHING;

  -- ── Credit Cards ───────────────────────────────────────────────────────────
  INSERT INTO public.credit_cards (id, user_id, name, credit_limit, outstanding, due_date, currency) VALUES
    (axis_card_id, demo_uid, 'Axis Magnus',  500000, 24800, '2026-03-15', 'INR'),
    (hdfc_card_id, demo_uid, 'HDFC Regalia', 300000, 12300, '2026-04-05', 'INR')
  ON CONFLICT (id) DO NOTHING;

  -- ── Loans ──────────────────────────────────────────────────────────────────
  INSERT INTO public.loans (user_id, name, principal, rate, tenure_months, start_date, currency)
  SELECT demo_uid, 'Home Loan — HDFC', 3800000, 8.5, 240, '2022-06-01', 'INR'
  WHERE NOT EXISTS (SELECT 1 FROM public.loans WHERE user_id = demo_uid AND name = 'Home Loan — HDFC');

  INSERT INTO public.loans (user_id, name, principal, rate, tenure_months, start_date, currency)
  SELECT demo_uid, 'Car Loan — SBI', 650000, 9.2, 60, '2024-01-01', 'INR'
  WHERE NOT EXISTS (SELECT 1 FROM public.loans WHERE user_id = demo_uid AND name = 'Car Loan — SBI');

  -- ── Assets ─────────────────────────────────────────────────────────────────
  INSERT INTO public.assets (user_id, name, type, value, currency)
  SELECT demo_uid, '2BHK Apartment Pune', 'property', 8500000, 'INR'
  WHERE NOT EXISTS (SELECT 1 FROM public.assets WHERE user_id = demo_uid AND name = '2BHK Apartment Pune');

  INSERT INTO public.assets (user_id, name, type, value, currency)
  SELECT demo_uid, 'Mutual Funds Portfolio', 'investment', 420000, 'INR'
  WHERE NOT EXISTS (SELECT 1 FROM public.assets WHERE user_id = demo_uid AND name = 'Mutual Funds Portfolio');

  INSERT INTO public.assets (user_id, name, type, value, currency)
  SELECT demo_uid, 'Honda City 2022', 'vehicle', 850000, 'INR'
  WHERE NOT EXISTS (SELECT 1 FROM public.assets WHERE user_id = demo_uid AND name = 'Honda City 2022');

  -- ── Budget Goals ───────────────────────────────────────────────────────────
  INSERT INTO public.budget_goals (user_id, category, monthly_limit, currency) VALUES
    (demo_uid, 'food',           8000, 'INR'),
    (demo_uid, 'shopping',      15000, 'INR'),
    (demo_uid, 'transport',      5000, 'INR'),
    (demo_uid, 'entertainment',  4000, 'INR'),
    (demo_uid, 'health',         3000, 'INR')
  ON CONFLICT (user_id, category) DO NOTHING;

  -- ── Financial Goals ────────────────────────────────────────────────────────
  INSERT INTO public.financial_goals (id, user_id, name, target_amount, current_amount, currency, deadline, icon, category, color, celebrated_milestones) VALUES
    (g_vacation,  demo_uid, 'Europe Vacation', 300000, 120000, 'INR', '2026-12-31', '✈️',  'travel',  'hsl(200, 70%, 50%)', ARRAY[25]),
    (g_emergency, demo_uid, 'Emergency Fund',  500000, 250000, 'INR', NULL,          '🛡️', 'savings', 'hsl(152, 60%, 38%)', ARRAY[25, 50]),
    (g_laptop,    demo_uid, 'New Laptop',      150000,  60000, 'INR', '2026-08-01', '💻',  'custom',  'hsl(38, 92%, 50%)',  ARRAY[25])
  ON CONFLICT (id) DO NOTHING;

  -- Goal contributions for Europe Vacation
  INSERT INTO public.goal_contributions (goal_id, user_id, amount, date, source)
  SELECT g_vacation, demo_uid, contrib_amount, contrib_date, 'manual'
  FROM (VALUES
    (50000::numeric, '2025-10-01'::text),
    (40000,          '2025-12-01'),
    (30000,          '2026-02-01')
  ) AS t(contrib_amount, contrib_date)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.goal_contributions
    WHERE goal_id = g_vacation AND user_id = demo_uid AND date = contrib_date
  );

  -- Goal contributions for Emergency Fund
  INSERT INTO public.goal_contributions (goal_id, user_id, amount, date, source)
  SELECT g_emergency, demo_uid, contrib_amount, contrib_date, 'manual'
  FROM (VALUES
    (100000::numeric, '2025-09-01'::text),
    (100000,          '2025-11-01'),
    (50000,           '2026-01-01')
  ) AS t(contrib_amount, contrib_date)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.goal_contributions
    WHERE goal_id = g_emergency AND user_id = demo_uid AND date = contrib_date
  );

  -- Goal contributions for New Laptop
  INSERT INTO public.goal_contributions (goal_id, user_id, amount, date, source)
  SELECT g_laptop, demo_uid, contrib_amount, contrib_date, 'manual'
  FROM (VALUES
    (30000::numeric, '2026-01-15'::text),
    (30000,          '2026-02-15')
  ) AS t(contrib_amount, contrib_date)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.goal_contributions
    WHERE goal_id = g_laptop AND user_id = demo_uid AND date = contrib_date
  );

  -- ── Recurring Transactions ─────────────────────────────────────────────────
  INSERT INTO public.recurring_transactions (user_id, type, amount, currency, category, description, frequency, next_date, is_active)
  SELECT demo_uid, r_type, r_amount, 'INR', r_category, r_label, 'monthly', '2026-04-01', true
  FROM (VALUES
    ('expense'::text,  299::numeric,   'entertainment', 'Netflix Premium'),
    ('expense'::text, 2000,            'health',        'Gym Membership'),
    ('expense'::text, 25000,           'housing',       'House Rent'),
    ('income'::text,  120000,          'salary',        'Monthly Salary')
  ) AS t(r_type, r_amount, r_category, r_label)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.recurring_transactions
    WHERE user_id = demo_uid AND description = r_label
  );

  -- ── Transactions — Oct 2025 ────────────────────────────────────────────────
  INSERT INTO public.transactions (user_id, type, amount, currency, category, description, date, linked_account_id, linked_card_id, cashback)
  SELECT demo_uid, r_type, r_amount, 'INR', r_category, r_label, r_date, r_acc, r_card, r_cashback
  FROM (VALUES
    ('income'::text,  120000::numeric, 'salary',        'Monthly Salary Oct 2025',  '2025-10-01', sbi_acc_id,  NULL::uuid,   NULL::numeric),
    ('expense'::text,  25000,          'housing',       'House Rent Oct 2025',      '2025-10-02', hdfc_acc_id, NULL,         NULL),
    ('expense'::text,   3200,          'food',          'Big Basket Oct',           '2025-10-04', NULL,        axis_card_id, 64),
    ('expense'::text,   1800,          'food',          'Swiggy Oct',               '2025-10-06', NULL,        axis_card_id, NULL),
    ('expense'::text,   2400,          'dining',        'Barbeque Nation Oct',      '2025-10-08', NULL,        axis_card_id, NULL),
    ('expense'::text,   1200,          'transport',     'Uber Oct',                 '2025-10-10', NULL,        NULL,         NULL),
    ('expense'::text,   8999,          'shopping',      'Myntra Sale Oct',          '2025-10-12', NULL,        hdfc_card_id, 180),
    ('expense'::text,    799,          'entertainment', 'Amazon Prime Annual',      '2025-10-15', NULL,        hdfc_card_id, NULL),
    ('expense'::text,   4500,          'health',        'Max Hospital Checkup',     '2025-10-17', hdfc_acc_id, NULL,         NULL),
    ('expense'::text,   3600,          'food',          'Kirana Oct',               '2025-10-20', NULL,        NULL,         NULL),
    ('expense'::text,   1500,          'utilities',     'Electricity Bill Oct',     '2025-10-22', hdfc_acc_id, NULL,         NULL),
    ('expense'::text,    999,          'utilities',     'Jio Postpaid Oct',         '2025-10-25', hdfc_acc_id, NULL,         NULL),
    ('expense'::text,   5000,          'transport',     'Flight Delhi Oct',         '2025-10-28', NULL,        axis_card_id, 200),
    ('income'::text,   15000,          'other',         'Freelance Payment Oct',    '2025-10-30', hdfc_acc_id, NULL,         NULL)
  ) AS t(r_type, r_amount, r_category, r_label, r_date, r_acc, r_card, r_cashback)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.transactions WHERE user_id = demo_uid AND description = r_label AND date = r_date
  );

  -- ── Transactions — Nov 2025 ────────────────────────────────────────────────
  INSERT INTO public.transactions (user_id, type, amount, currency, category, description, date, linked_account_id, linked_card_id, cashback)
  SELECT demo_uid, r_type, r_amount, 'INR', r_category, r_label, r_date, r_acc, r_card, r_cashback
  FROM (VALUES
    ('income'::text,  120000::numeric, 'salary',        'Monthly Salary Nov 2025',  '2025-11-01', sbi_acc_id,  NULL::uuid,   NULL::numeric),
    ('expense'::text,  25000,          'housing',       'House Rent Nov 2025',      '2025-11-02', hdfc_acc_id, NULL,         NULL),
    ('expense'::text,   2800,          'food',          'Big Basket Nov',           '2025-11-04', NULL,        axis_card_id, 56),
    ('expense'::text,   2200,          'food',          'Swiggy Nov',               '2025-11-07', NULL,        axis_card_id, NULL),
    ('expense'::text,   3800,          'shopping',      'Amazon Diwali',            '2025-11-10', NULL,        hdfc_card_id, 76),
    ('expense'::text,  12000,          'shopping',      'Ajio Festive',             '2025-11-12', NULL,        axis_card_id, 240),
    ('expense'::text,   1400,          'transport',     'Uber Nov',                 '2025-11-15', NULL,        NULL,         NULL),
    ('expense'::text,   2000,          'health',        'Gym Nov',                  '2025-11-05', hdfc_acc_id, NULL,         NULL),
    ('expense'::text,    299,          'entertainment', 'Netflix Nov',              '2025-11-01', NULL,        hdfc_card_id, NULL),
    ('expense'::text,   1800,          'utilities',     'Electricity Nov',          '2025-11-22', hdfc_acc_id, NULL,         NULL),
    ('expense'::text,   3200,          'dining',        'Family Dinner Nov',        '2025-11-25', NULL,        axis_card_id, NULL),
    ('income'::text,    8000,          'other',         'Stock Dividend Nov',       '2025-11-28', hdfc_acc_id, NULL,         NULL)
  ) AS t(r_type, r_amount, r_category, r_label, r_date, r_acc, r_card, r_cashback)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.transactions WHERE user_id = demo_uid AND description = r_label AND date = r_date
  );

  -- ── Transactions — Dec 2025 ────────────────────────────────────────────────
  INSERT INTO public.transactions (user_id, type, amount, currency, category, description, date, linked_account_id, linked_card_id, cashback)
  SELECT demo_uid, r_type, r_amount, 'INR', r_category, r_label, r_date, r_acc, r_card, r_cashback
  FROM (VALUES
    ('income'::text,  120000::numeric, 'salary',        'Monthly Salary Dec 2025',  '2025-12-01', sbi_acc_id,  NULL::uuid,   NULL::numeric),
    ('income'::text,   24000,          'salary',        'Year End Bonus',           '2025-12-15', sbi_acc_id,  NULL,         NULL),
    ('expense'::text,  25000,          'housing',       'House Rent Dec 2025',      '2025-12-02', hdfc_acc_id, NULL,         NULL),
    ('expense'::text,   3100,          'food',          'Big Basket Dec',           '2025-12-05', NULL,        axis_card_id, 62),
    ('expense'::text,  18000,          'shopping',      'Christmas Gifts',          '2025-12-10', NULL,        hdfc_card_id, 360),
    ('expense'::text,   9500,          'travel',        'Goa Hotel Dec',            '2025-12-20', NULL,        axis_card_id, NULL),
    ('expense'::text,   4200,          'travel',        'Goa Flights Dec',          '2025-12-20', NULL,        axis_card_id, 84),
    ('expense'::text,   3500,          'dining',        'New Year Eve Dec',         '2025-12-31', NULL,        axis_card_id, NULL),
    ('expense'::text,   2000,          'health',        'Gym Dec',                  '2025-12-05', hdfc_acc_id, NULL,         NULL),
    ('expense'::text,    299,          'entertainment', 'Netflix Dec',              '2025-12-01', NULL,        hdfc_card_id, NULL),
    ('expense'::text,   1200,          'transport',     'Uber Dec',                 '2025-12-15', NULL,        NULL,         NULL)
  ) AS t(r_type, r_amount, r_category, r_label, r_date, r_acc, r_card, r_cashback)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.transactions WHERE user_id = demo_uid AND description = r_label AND date = r_date
  );

  -- ── Transactions — Jan 2026 ────────────────────────────────────────────────
  INSERT INTO public.transactions (user_id, type, amount, currency, category, description, date, linked_account_id, linked_card_id, cashback)
  SELECT demo_uid, r_type, r_amount, 'INR', r_category, r_label, r_date, r_acc, r_card, r_cashback
  FROM (VALUES
    ('income'::text,  120000::numeric, 'salary',        'Monthly Salary Jan 2026',  '2026-01-01', sbi_acc_id,  NULL::uuid,   NULL::numeric),
    ('expense'::text,  25000,          'housing',       'House Rent Jan 2026',      '2026-01-02', hdfc_acc_id, NULL,         NULL),
    ('expense'::text,   2900,          'food',          'Big Basket Jan',           '2026-01-04', NULL,        axis_card_id, 58),
    ('expense'::text,   1600,          'food',          'Swiggy Jan',               '2026-01-08', NULL,        axis_card_id, NULL),
    ('expense'::text,   6500,          'health',        'Dental Treatment Jan',     '2026-01-10', hdfc_acc_id, NULL,         NULL),
    ('expense'::text,   2000,          'health',        'Gym Jan',                  '2026-01-05', hdfc_acc_id, NULL,         NULL),
    ('expense'::text,    299,          'entertainment', 'Netflix Jan',              '2026-01-01', NULL,        hdfc_card_id, NULL),
    ('expense'::text,   3400,          'shopping',      'Flipkart Sale Jan',        '2026-01-20', NULL,        hdfc_card_id, 68),
    ('expense'::text,   1800,          'utilities',     'Electricity Jan',          '2026-01-22', hdfc_acc_id, NULL,         NULL),
    ('expense'::text,   1100,          'transport',     'Bus Pass Uber Jan',        '2026-01-25', NULL,        NULL,         NULL),
    ('expense'::text,   4200,          'dining',        'Team Lunch Jan',           '2026-01-15', NULL,        axis_card_id, NULL),
    ('income'::text,   12000,          'other',         'FD Interest Jan',          '2026-01-31', hdfc_acc_id, NULL,         NULL)
  ) AS t(r_type, r_amount, r_category, r_label, r_date, r_acc, r_card, r_cashback)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.transactions WHERE user_id = demo_uid AND description = r_label AND date = r_date
  );

  -- ── Transactions — Feb 2026 ────────────────────────────────────────────────
  INSERT INTO public.transactions (user_id, type, amount, currency, category, description, date, linked_account_id, linked_card_id, cashback)
  SELECT demo_uid, r_type, r_amount, 'INR', r_category, r_label, r_date, r_acc, r_card, r_cashback
  FROM (VALUES
    ('income'::text,  120000::numeric, 'salary',        'Monthly Salary Feb 2026',  '2026-02-01', sbi_acc_id,  NULL::uuid,   NULL::numeric),
    ('expense'::text,  25000,          'housing',       'House Rent Feb 2026',      '2026-02-02', hdfc_acc_id, NULL,         NULL),
    ('expense'::text,   3300,          'food',          'Big Basket Feb',           '2026-02-05', NULL,        axis_card_id, 66),
    ('expense'::text,   2100,          'food',          'Zomato Feb',               '2026-02-09', NULL,        axis_card_id, NULL),
    ('expense'::text,   5500,          'shopping',      'Valentine Shopping',       '2026-02-13', NULL,        hdfc_card_id, 110),
    ('expense'::text,   2000,          'health',        'Gym Feb',                  '2026-02-05', hdfc_acc_id, NULL,         NULL),
    ('expense'::text,    299,          'entertainment', 'Netflix Feb',              '2026-02-01', NULL,        hdfc_card_id, NULL),
    ('expense'::text,   2800,          'dining',        'Anniversary Dinner',       '2026-02-14', NULL,        axis_card_id, NULL),
    ('expense'::text,   1500,          'transport',     'Cab Rides Feb',            '2026-02-18', NULL,        NULL,         NULL),
    ('expense'::text,   1700,          'utilities',     'Electricity Feb',          '2026-02-20', hdfc_acc_id, NULL,         NULL),
    ('expense'::text,  11000,          'shopping',      'Laptop Accessories',       '2026-02-22', NULL,        hdfc_card_id, 220),
    ('income'::text,    5000,          'other',         'Cashback Reward Feb',      '2026-02-28', hdfc_acc_id, NULL,         NULL)
  ) AS t(r_type, r_amount, r_category, r_label, r_date, r_acc, r_card, r_cashback)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.transactions WHERE user_id = demo_uid AND description = r_label AND date = r_date
  );

  -- ── Transactions — Mar 2026 (current month) ────────────────────────────────
  INSERT INTO public.transactions (user_id, type, amount, currency, category, description, date, linked_account_id, linked_card_id, cashback)
  SELECT demo_uid, r_type, r_amount, 'INR', r_category, r_label, r_date, r_acc, r_card, r_cashback
  FROM (VALUES
    ('income'::text,  120000::numeric, 'salary',        'Monthly Salary Mar 2026',  '2026-03-01', sbi_acc_id,  NULL::uuid,   NULL::numeric),
    ('expense'::text,  25000,          'housing',       'House Rent Mar 2026',      '2026-03-02', hdfc_acc_id, NULL,         NULL),
    ('expense'::text,   2600,          'food',          'Big Basket Mar',           '2026-03-04', NULL,        axis_card_id, 52),
    ('expense'::text,   1400,          'food',          'Swiggy Mar',               '2026-03-07', NULL,        axis_card_id, NULL),
    ('expense'::text,   3200,          'food',          'Kirana Mar',               '2026-03-10', NULL,        NULL,         NULL),
    ('expense'::text,   2000,          'health',        'Gym Mar',                  '2026-03-05', hdfc_acc_id, NULL,         NULL),
    ('expense'::text,    299,          'entertainment', 'Netflix Mar',              '2026-03-01', NULL,        hdfc_card_id, NULL),
    ('expense'::text,   9800,          'shopping',      'Spring Wardrobe Zara',     '2026-03-08', NULL,        axis_card_id, 196),
    ('expense'::text,   1800,          'transport',     'Cab Rides Mar',            '2026-03-11', NULL,        NULL,         NULL),
    ('expense'::text,   3500,          'dining',        'Friends Dinner Mar',       '2026-03-13', NULL,        axis_card_id, NULL)
  ) AS t(r_type, r_amount, r_category, r_label, r_date, r_acc, r_card, r_cashback)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.transactions WHERE user_id = demo_uid AND description = r_label AND date = r_date
  );

END $$;
