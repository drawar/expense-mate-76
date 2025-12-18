-- Create table for tracking bonus points usage per rule per period
CREATE TABLE IF NOT EXISTS bonus_points_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES reward_rules(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('calendar', 'statement_month')),
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  statement_day INTEGER DEFAULT 1,
  used_bonus_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to ensure one record per user/rule/payment method/period
  UNIQUE(user_id, rule_id, payment_method_id, period_type, period_year, period_month, statement_day)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bonus_points_tracking_lookup 
  ON bonus_points_tracking(user_id, rule_id, payment_method_id, period_type, period_year, period_month);

-- Enable RLS
ALTER TABLE bonus_points_tracking ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own tracking data
CREATE POLICY "Users can manage their own bonus points tracking"
  ON bonus_points_tracking
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_bonus_points_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bonus_points_tracking_updated_at
  BEFORE UPDATE ON bonus_points_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_bonus_points_tracking_updated_at();
