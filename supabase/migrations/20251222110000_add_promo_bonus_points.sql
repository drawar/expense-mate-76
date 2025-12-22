-- Add promotional bonus points column to transactions table
-- This column stores one-time promotional bonuses that can't be encoded as regular reward rules
-- (e.g., first-time purchase bonuses, limited-time promotions)

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS promo_bonus_points integer DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN transactions.promo_bonus_points IS 'One-time promotional bonus points not derived from regular reward rules';
