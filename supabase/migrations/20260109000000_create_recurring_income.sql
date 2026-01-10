-- Create recurring_income table for storing income sources as configuration
CREATE TABLE IF NOT EXISTS public.recurring_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('biweekly', 'monthly')),
  day_of_month INTEGER CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)),
  start_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_recurring_income_user_id
  ON public.recurring_income(user_id);

-- Create index for active income sources
CREATE INDEX IF NOT EXISTS idx_recurring_income_user_active
  ON public.recurring_income(user_id, is_active);

-- Enable RLS
ALTER TABLE public.recurring_income ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - users can only access their own income records
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recurring_income' AND policyname = 'recurring_income_select_own') THEN
        CREATE POLICY "recurring_income_select_own" ON public.recurring_income FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recurring_income' AND policyname = 'recurring_income_insert_own') THEN
        CREATE POLICY "recurring_income_insert_own" ON public.recurring_income FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recurring_income' AND policyname = 'recurring_income_update_own') THEN
        CREATE POLICY "recurring_income_update_own" ON public.recurring_income FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recurring_income' AND policyname = 'recurring_income_delete_own') THEN
        CREATE POLICY "recurring_income_delete_own" ON public.recurring_income FOR DELETE TO authenticated USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_recurring_income_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recurring_income_updated_at ON public.recurring_income;
CREATE TRIGGER recurring_income_updated_at
  BEFORE UPDATE ON public.recurring_income
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_income_updated_at();
