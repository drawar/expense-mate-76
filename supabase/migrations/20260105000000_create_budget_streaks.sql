-- Create budget_streaks table for gamification streak tracking
CREATE TABLE IF NOT EXISTS public.budget_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,

  -- Current streak data
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_checked_date DATE,

  -- Badge tracking - JSON array of earned badge objects
  -- Example: [{"milestone": 3, "earnedAt": "2026-01-03", "month": "2026-01"}]
  earned_badges JSONB NOT NULL DEFAULT '[]',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one streak record per user per currency
  UNIQUE(user_id, currency)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_budget_streaks_user_currency
  ON public.budget_streaks(user_id, currency);

-- Enable RLS
ALTER TABLE public.budget_streaks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - users can only access their own streaks (skip if exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_streaks' AND policyname = 'budget_streaks_select_own') THEN
        CREATE POLICY "budget_streaks_select_own" ON public.budget_streaks FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_streaks' AND policyname = 'budget_streaks_insert_own') THEN
        CREATE POLICY "budget_streaks_insert_own" ON public.budget_streaks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_streaks' AND policyname = 'budget_streaks_update_own') THEN
        CREATE POLICY "budget_streaks_update_own" ON public.budget_streaks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budget_streaks' AND policyname = 'budget_streaks_delete_own') THEN
        CREATE POLICY "budget_streaks_delete_own" ON public.budget_streaks FOR DELETE TO authenticated USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_budget_streaks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS budget_streaks_updated_at ON public.budget_streaks;
CREATE TRIGGER budget_streaks_updated_at
  BEFORE UPDATE ON public.budget_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_streaks_updated_at();
