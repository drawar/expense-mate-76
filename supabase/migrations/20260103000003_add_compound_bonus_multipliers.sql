-- Migration: Add Compound Bonus Multipliers Support
-- Allows rules to specify multiple bonus multipliers that are calculated and rounded separately, then summed.
-- Example: [1.5, 2.5] for a $25 transaction = round(25*1.5) + round(25*2.5) = 38 + 63 = 101
-- This is different from a single 4x multiplier which would give round(25*4) = 100

-- Add compound_bonus_multipliers column to reward_rules table
ALTER TABLE reward_rules
ADD COLUMN IF NOT EXISTS compound_bonus_multipliers JSONB;

-- Add comment for documentation
COMMENT ON COLUMN reward_rules.compound_bonus_multipliers IS 'Array of bonus multipliers to be calculated and rounded separately, then summed. Example: [1.5, 2.5] = round(amount*1.5) + round(amount*2.5)';
