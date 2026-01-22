-- Add tags column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tags TEXT;

-- Comment explaining the format
COMMENT ON COLUMN transactions.tags IS 'Comma-separated tag slugs for grouping transactions (e.g., paris-2025,travel-2025)';
