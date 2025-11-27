-- Add missing fields to reward_rules table for proper type mapping
ALTER TABLE reward_rules
ADD COLUMN IF NOT EXISTS calculation_method text DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS base_multiplier numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS bonus_multiplier numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS points_rounding_strategy text DEFAULT 'nearest',
ADD COLUMN IF NOT EXISTS amount_rounding_strategy text DEFAULT 'floor',
ADD COLUMN IF NOT EXISTS block_size numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS monthly_cap numeric,
ADD COLUMN IF NOT EXISTS monthly_min_spend numeric,
ADD COLUMN IF NOT EXISTS monthly_spend_period_type text,
ADD COLUMN IF NOT EXISTS points_currency text DEFAULT 'points';

-- Add comments to document the fields
COMMENT ON COLUMN reward_rules.calculation_method IS 'Method for calculating rewards: standard, tiered, flat_rate, or direct';
COMMENT ON COLUMN reward_rules.base_multiplier IS 'Base points multiplier for transactions';
COMMENT ON COLUMN reward_rules.bonus_multiplier IS 'Bonus points multiplier for qualifying transactions';
COMMENT ON COLUMN reward_rules.points_rounding_strategy IS 'How to round calculated points: floor, ceiling, or nearest';
COMMENT ON COLUMN reward_rules.amount_rounding_strategy IS 'How to round transaction amounts: floor, ceiling, nearest, floor5, or none';
COMMENT ON COLUMN reward_rules.block_size IS 'Transaction amount block size for point calculation';
COMMENT ON COLUMN reward_rules.monthly_cap IS 'Maximum points that can be earned per month';
COMMENT ON COLUMN reward_rules.monthly_min_spend IS 'Minimum monthly spend required to earn bonus points';
COMMENT ON COLUMN reward_rules.monthly_spend_period_type IS 'Type of monthly period: calendar, statement, or statement_month';
COMMENT ON COLUMN reward_rules.points_currency IS 'Currency/type of points earned (e.g., aeroplan, krisflyer, cashback)';
