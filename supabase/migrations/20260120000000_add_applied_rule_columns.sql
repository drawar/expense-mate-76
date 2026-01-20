-- Add columns to track which rule was applied to a transaction
-- This enables computing cap usage directly from transactions (single source of truth)

-- Add applied_rule_id column (references reward_rules but no FK constraint for flexibility)
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS applied_rule_id UUID;

-- Add cap_group_id column (denormalized from rule for efficient cap group queries)
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS cap_group_id TEXT;

-- Index for cap usage queries by payment method and rule
CREATE INDEX IF NOT EXISTS idx_transactions_cap_usage
ON transactions(user_id, payment_method_id, applied_rule_id, date);

-- Index for cap group queries (shared caps across multiple rules)
CREATE INDEX IF NOT EXISTS idx_transactions_cap_group
ON transactions(user_id, payment_method_id, cap_group_id, date);

-- Comments for documentation
COMMENT ON COLUMN transactions.applied_rule_id IS 'The reward rule that was applied to calculate bonus points for this transaction';
COMMENT ON COLUMN transactions.cap_group_id IS 'The cap group ID for shared caps (denormalized from reward_rules.cap_group_id)';
