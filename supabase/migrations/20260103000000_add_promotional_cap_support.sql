-- Migration: Add Promotional Cap Support
-- This migration adds support for promotional/lifetime caps that span multiple months

-- Part 1: Add missing columns to reward_rules table
-- These columns may already exist from application use, so we use IF NOT EXISTS

-- monthly_cap_type: Whether the cap is on bonus_points or spend_amount
ALTER TABLE reward_rules
ADD COLUMN IF NOT EXISTS monthly_cap_type TEXT;

-- cap_group_id: For sharing caps across multiple rules
ALTER TABLE reward_rules
ADD COLUMN IF NOT EXISTS cap_group_id TEXT;

-- valid_from: When a time-limited rule becomes active
ALTER TABLE reward_rules
ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ;

-- valid_until: When a time-limited rule expires
ALTER TABLE reward_rules
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;

-- promo_start_date: For promotional caps, when the cap tracking period starts
-- This is separate from valid_from because a rule can be valid before the promo starts
ALTER TABLE reward_rules
ADD COLUMN IF NOT EXISTS promo_start_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN reward_rules.monthly_cap_type IS 'Type of monthly cap: bonus_points (caps earned points) or spend_amount (caps eligible spending)';
COMMENT ON COLUMN reward_rules.cap_group_id IS 'Shared cap group ID - rules with same ID share a single cap pool';
COMMENT ON COLUMN reward_rules.valid_from IS 'Start date for time-limited/promotional rules';
COMMENT ON COLUMN reward_rules.valid_until IS 'End date for time-limited/promotional rules';
COMMENT ON COLUMN reward_rules.promo_start_date IS 'For promotional caps: when cap tracking starts (distinct from rule validity)';

-- Part 2: Create bonus_points_tracking table if it doesn't exist
-- This table may not exist if the original migration failed
CREATE TABLE IF NOT EXISTS bonus_points_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id TEXT NOT NULL,  -- TEXT to support both rule UUIDs and capGroupId strings
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  statement_day INTEGER DEFAULT 1,
  used_bonus_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint to ensure one record per user/rule/payment method/period
  UNIQUE(user_id, rule_id, payment_method_id, period_type, period_year, period_month, statement_day)
);

-- Part 3: Apply changes to bonus_points_tracking for promotional caps

-- Drop the FK constraint on rule_id (if it exists) since it can store capGroupId strings
ALTER TABLE bonus_points_tracking
DROP CONSTRAINT IF EXISTS bonus_points_tracking_rule_id_fkey;

-- Drop and recreate the period_type check constraint to include 'promotional'
ALTER TABLE bonus_points_tracking
DROP CONSTRAINT IF EXISTS bonus_points_tracking_period_type_check;

ALTER TABLE bonus_points_tracking
ADD CONSTRAINT bonus_points_tracking_period_type_check
CHECK (period_type IN ('calendar', 'statement_month', 'promotional'));

-- Part 4: Create indexes for faster lookups (if not exist)
CREATE INDEX IF NOT EXISTS idx_bonus_points_tracking_lookup
  ON bonus_points_tracking(user_id, rule_id, payment_method_id, period_type, period_year, period_month);

-- Part 5: Enable RLS
ALTER TABLE bonus_points_tracking ENABLE ROW LEVEL SECURITY;

-- Part 6: Create policy for users to manage their own tracking data
DROP POLICY IF EXISTS "Users can manage their own bonus points tracking" ON bonus_points_tracking;
CREATE POLICY "Users can manage their own bonus points tracking"
  ON bonus_points_tracking
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Part 7: Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_bonus_points_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Part 8: Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS bonus_points_tracking_updated_at ON bonus_points_tracking;
CREATE TRIGGER bonus_points_tracking_updated_at
  BEFORE UPDATE ON bonus_points_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_bonus_points_tracking_updated_at();

-- Part 9: Add column comments
COMMENT ON COLUMN bonus_points_tracking.rule_id IS 'Tracking identifier: can be a rule UUID or a capGroupId string (for shared caps)';
COMMENT ON COLUMN bonus_points_tracking.period_type IS 'Period type: calendar (monthly), statement_month (based on statement day), or promotional (fixed period from promo_start_date to valid_until)';

-- Part 10: Add index for efficient cap lookups by cap_group_id
CREATE INDEX IF NOT EXISTS idx_reward_rules_cap_group_id ON reward_rules(cap_group_id) WHERE cap_group_id IS NOT NULL;
