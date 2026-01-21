-- Add split_group_id column to transactions for linking split payments
ALTER TABLE transactions
  ADD COLUMN split_group_id UUID REFERENCES split_groups(id) ON DELETE SET NULL;

-- Partial index for efficient lookup of split transactions
CREATE INDEX idx_transactions_split_group ON transactions(split_group_id)
  WHERE split_group_id IS NOT NULL;
