-- Remove points_currency from reward_rules table
-- This column is redundant since points_currency is a property of the payment method/card,
-- not individual reward rules. All rules for a card type use the same points currency.

-- Drop the column if it exists
ALTER TABLE reward_rules
DROP COLUMN IF EXISTS points_currency;

-- Add comment explaining the removal
COMMENT ON TABLE reward_rules IS 'Reward rules for payment methods. Points currency is stored at the payment_method level, not per rule.';
