-- Fix conversion_rates unique constraint for upsert operations
-- The existing partial index cannot be used with ON CONFLICT

-- Drop the partial unique index
DROP INDEX IF EXISTS idx_conversion_rates_source_dest;

-- Create a proper unique constraint (not partial)
ALTER TABLE conversion_rates
  DROP CONSTRAINT IF EXISTS conversion_rates_source_target_unique;

ALTER TABLE conversion_rates
  ADD CONSTRAINT conversion_rates_source_target_unique
  UNIQUE (reward_currency_id, target_currency_id);
