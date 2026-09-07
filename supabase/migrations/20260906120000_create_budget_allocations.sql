-- Create budget_allocations table for per-user, per-parent-category budget percentage settings
-- One row per (user_id, parent_category_id). Sparse — the client seeds DEFAULT_ALLOCATIONS
-- when a user has no rows and only persists on edit.
CREATE TABLE IF NOT EXISTS public.budget_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_category_id TEXT NOT NULL,
  percentage NUMERIC NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, parent_category_id)
);

-- Index for lookup by user
CREATE INDEX IF NOT EXISTS idx_budget_allocations_user
  ON public.budget_allocations(user_id);

-- Enable RLS
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own allocations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_allocations' AND policyname = 'budget_allocations_select_own') THEN
        CREATE POLICY "budget_allocations_select_own" ON public.budget_allocations FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_allocations' AND policyname = 'budget_allocations_insert_own') THEN
        CREATE POLICY "budget_allocations_insert_own" ON public.budget_allocations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_allocations' AND policyname = 'budget_allocations_update_own') THEN
        CREATE POLICY "budget_allocations_update_own" ON public.budget_allocations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_allocations' AND policyname = 'budget_allocations_delete_own') THEN
        CREATE POLICY "budget_allocations_delete_own" ON public.budget_allocations FOR DELETE TO authenticated USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_budget_allocations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS budget_allocations_updated_at ON public.budget_allocations;
CREATE TRIGGER budget_allocations_updated_at
  BEFORE UPDATE ON public.budget_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_allocations_updated_at();
