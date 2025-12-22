-- Add auto-categorization metadata fields to transactions table
-- These fields support the smart categorization system with confidence scoring

-- Add confidence score field (0.0 to 1.0)
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS auto_category_confidence DECIMAL(3,2) DEFAULT NULL;

-- Add needs_review flag for transactions requiring user attention
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE;

-- Add reason field explaining why a category was suggested
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS category_suggestion_reason TEXT DEFAULT NULL;

-- Add index for finding transactions that need review
CREATE INDEX IF NOT EXISTS idx_transactions_needs_review
ON transactions (user_id, needs_review)
WHERE needs_review = TRUE AND is_deleted IS NOT TRUE;

-- Add comment explaining the fields
COMMENT ON COLUMN transactions.auto_category_confidence IS 'Confidence score (0.0-1.0) for auto-categorization. Higher = more confident.';
COMMENT ON COLUMN transactions.needs_review IS 'Flag indicating transaction needs user review for category.';
COMMENT ON COLUMN transactions.category_suggestion_reason IS 'Explanation of why this category was auto-suggested.';
