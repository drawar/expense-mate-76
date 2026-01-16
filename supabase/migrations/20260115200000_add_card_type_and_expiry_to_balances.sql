-- Add expiry_date column to points_balances table
-- NOTE: card_type_id was originally added here but has been replaced by payment_method_id
-- (see migration 20260116200000 and 20260116210000)

-- Add expiry_date column
ALTER TABLE points_balances
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN points_balances.expiry_date IS 'Date when the points balance expires';

-- Add index for expiry date queries
CREATE INDEX IF NOT EXISTS idx_points_balances_expiry
  ON points_balances(expiry_date)
  WHERE expiry_date IS NOT NULL;
