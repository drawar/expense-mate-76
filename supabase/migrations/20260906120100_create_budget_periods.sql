-- Create budget_periods table: materialized snapshot of a pay-period budget derived
-- from a salary income event. One row per (user_id, income_id). The allocations
-- JSONB is an atomic snapshot ({parent_category_id -> dollar_amount}) computed at
-- write time from the user's current budget_allocations percentages. Historical
-- periods keep the % they were computed with even if the user later edits their
-- allocation percentages.
CREATE TABLE IF NOT EXISTS public.budget_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  income_id UUID NOT NULL REFERENCES public.recurring_income(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  salary_amount NUMERIC NOT NULL CHECK (salary_amount > 0),
  allocations JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, income_id)
);

-- Index for the "most recent active period" lookup
CREATE INDEX IF NOT EXISTS idx_budget_periods_active
  ON public.budget_periods(user_id, period_start DESC);

-- Index for FK reverse lookup (delete-by-income, upsert-by-income)
CREATE INDEX IF NOT EXISTS idx_budget_periods_income
  ON public.budget_periods(income_id);

-- Enable RLS
ALTER TABLE public.budget_periods ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own periods
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_periods' AND policyname = 'budget_periods_select_own') THEN
        CREATE POLICY "budget_periods_select_own" ON public.budget_periods FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_periods' AND policyname = 'budget_periods_insert_own') THEN
        CREATE POLICY "budget_periods_insert_own" ON public.budget_periods FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_periods' AND policyname = 'budget_periods_update_own') THEN
        CREATE POLICY "budget_periods_update_own" ON public.budget_periods FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_periods' AND policyname = 'budget_periods_delete_own') THEN
        CREATE POLICY "budget_periods_delete_own" ON public.budget_periods FOR DELETE TO authenticated USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_budget_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS budget_periods_updated_at ON public.budget_periods;
CREATE TRIGGER budget_periods_updated_at
  BEFORE UPDATE ON public.budget_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_periods_updated_at();
