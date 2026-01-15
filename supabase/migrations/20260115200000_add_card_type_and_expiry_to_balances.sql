-- Add card_type_id and expiry_date columns to points_balances table
-- This allows card-specific balance tracking (e.g., separate Citi ThankYou balances per card type)
-- and tracking of points expiry dates

-- Add card_type_id column (nullable - NULL means pooled balance)
ALTER TABLE points_balances
ADD COLUMN IF NOT EXISTS card_type_id TEXT;

-- Add expiry_date column
ALTER TABLE points_balances
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;

-- Add comments
COMMENT ON COLUMN points_balances.card_type_id IS 'Card type ID for card-specific balances (e.g., citi-rewards-visa). NULL means pooled balance.';
COMMENT ON COLUMN points_balances.expiry_date IS 'Date when the points balance expires';

-- Drop old unique index and create new one that includes card_type_id
-- This allows multiple balances per currency when card_type_id differs
DROP INDEX IF EXISTS idx_points_balances_user_currency;

CREATE UNIQUE INDEX idx_points_balances_user_currency_card
  ON points_balances(user_id, reward_currency_id, COALESCE(card_type_id, ''));

-- Add index for expiry date queries
CREATE INDEX IF NOT EXISTS idx_points_balances_expiry
  ON points_balances(expiry_date)
  WHERE expiry_date IS NOT NULL;
