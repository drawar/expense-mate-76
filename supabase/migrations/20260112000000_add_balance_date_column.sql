-- Add balance_date column to points_balances table
-- This allows users to specify the date their starting balance was recorded as of

ALTER TABLE points_balances
ADD COLUMN IF NOT EXISTS balance_date TIMESTAMPTZ;

-- Add comment explaining the column
COMMENT ON COLUMN points_balances.balance_date IS 'The date the starting balance was recorded as of';
