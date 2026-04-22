-- ============================================================
-- MIGRATION 003: Finance Manager
-- All tables prefixed fn_ to avoid conflicts with sn_ tables
-- Run via Supabase SQL editor or migration runner
-- ============================================================

-- fn_finance_profiles: one row per user, created during onboarding
CREATE TABLE IF NOT EXISTS public.fn_finance_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id             TEXT NOT NULL UNIQUE REFERENCES public.sn_users(clerk_id) ON DELETE CASCADE,
  currency             TEXT NOT NULL CHECK (currency IN ('USD', 'COP')),
  monthly_salary       NUMERIC(15, 2) NOT NULL DEFAULT 0,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fn_finance_profiles_clerk_id ON public.fn_finance_profiles(clerk_id);

-- fn_transaction_categories: per-user categories, seeded on onboarding
CREATE TABLE IF NOT EXISTS public.fn_transaction_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id   TEXT NOT NULL REFERENCES public.sn_users(clerk_id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color      TEXT NOT NULL DEFAULT '#ff003c',
  icon       TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fn_categories_clerk_id ON public.fn_transaction_categories(clerk_id);

-- fn_recurring_templates: declared before fn_transactions (FK dependency)
CREATE TABLE IF NOT EXISTS public.fn_recurring_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id    TEXT NOT NULL REFERENCES public.sn_users(clerk_id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.fn_transaction_categories(id) ON DELETE SET NULL,
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount      NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  description TEXT,
  frequency   TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  start_date  DATE NOT NULL,
  next_due    DATE NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fn_recurring_clerk_id ON public.fn_recurring_templates(clerk_id);
CREATE INDEX IF NOT EXISTS idx_fn_recurring_next_due ON public.fn_recurring_templates(next_due);

-- fn_transactions: main ledger
CREATE TABLE IF NOT EXISTS public.fn_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id     TEXT NOT NULL REFERENCES public.sn_users(clerk_id) ON DELETE CASCADE,
  category_id  UUID REFERENCES public.fn_transaction_categories(id) ON DELETE SET NULL,
  type         TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount       NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  description  TEXT,
  date         DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_id UUID REFERENCES public.fn_recurring_templates(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fn_transactions_clerk_id ON public.fn_transactions(clerk_id);
CREATE INDEX IF NOT EXISTS idx_fn_transactions_date     ON public.fn_transactions(date);
CREATE INDEX IF NOT EXISTS idx_fn_transactions_type     ON public.fn_transactions(type);

-- fn_budgets: monthly category spending limits
CREATE TABLE IF NOT EXISTS public.fn_budgets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id        TEXT NOT NULL REFERENCES public.sn_users(clerk_id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES public.fn_transaction_categories(id) ON DELETE CASCADE,
  month           SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year            SMALLINT NOT NULL CHECK (year >= 2000),
  limit_amount    NUMERIC(15, 2) NOT NULL CHECK (limit_amount > 0),
  alert_threshold NUMERIC(5, 2) NOT NULL DEFAULT 80.00,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (clerk_id, category_id, month, year)
);
CREATE INDEX IF NOT EXISTS idx_fn_budgets_clerk_id ON public.fn_budgets(clerk_id);

-- fn_savings_goals
CREATE TABLE IF NOT EXISTS public.fn_savings_goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id      TEXT NOT NULL REFERENCES public.sn_users(clerk_id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount > 0),
  deadline      DATE,
  is_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fn_savings_goals_clerk_id ON public.fn_savings_goals(clerk_id);

-- fn_savings_contributions: deposits toward a goal
CREATE TABLE IF NOT EXISTS public.fn_savings_contributions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id        UUID NOT NULL REFERENCES public.fn_savings_goals(id) ON DELETE CASCADE,
  clerk_id       TEXT NOT NULL REFERENCES public.sn_users(clerk_id) ON DELETE CASCADE,
  amount         NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  note           TEXT,
  contributed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fn_contributions_goal_id ON public.fn_savings_contributions(goal_id);

-- fn_debts
CREATE TABLE IF NOT EXISTS public.fn_debts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id        TEXT NOT NULL REFERENCES public.sn_users(clerk_id) ON DELETE CASCADE,
  creditor_name   TEXT NOT NULL,
  original_amount NUMERIC(15, 2) NOT NULL CHECK (original_amount > 0),
  current_balance NUMERIC(15, 2) NOT NULL CHECK (current_balance >= 0),
  interest_rate   NUMERIC(6, 3) NOT NULL DEFAULT 0,
  minimum_payment NUMERIC(15, 2),
  due_day         SMALLINT CHECK (due_day BETWEEN 1 AND 31),
  notes           TEXT,
  is_paid_off     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fn_debts_clerk_id ON public.fn_debts(clerk_id);

-- fn_debt_payments: payment history per debt
CREATE TABLE IF NOT EXISTS public.fn_debt_payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id      UUID NOT NULL REFERENCES public.fn_debts(id) ON DELETE CASCADE,
  clerk_id     TEXT NOT NULL REFERENCES public.sn_users(clerk_id) ON DELETE CASCADE,
  amount       NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fn_payments_debt_id ON public.fn_debt_payments(debt_id);

-- fn_market_list: shopping checklist
CREATE TABLE IF NOT EXISTS public.fn_market_list (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id        TEXT NOT NULL REFERENCES public.sn_users(clerk_id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  quantity        TEXT,
  estimated_price NUMERIC(15, 2),
  is_checked      BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fn_market_clerk_id ON public.fn_market_list(clerk_id);

-- ============================================================
-- RLS (safety net — server always uses service role key)
-- ============================================================
ALTER TABLE public.fn_finance_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fn_transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fn_recurring_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fn_transactions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fn_budgets                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fn_savings_goals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fn_savings_contributions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fn_debts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fn_debt_payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fn_market_list            ENABLE ROW LEVEL SECURITY;
