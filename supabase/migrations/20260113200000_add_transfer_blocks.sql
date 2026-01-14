-- Add minimum transfer and increment block columns to conversion_rates
--
-- These fields define transfer requirements for loyalty program transfers:
-- - minimum_transfer: Minimum number of points required to initiate a transfer (e.g., 1000)
-- - transfer_increment: Points must be transferred in multiples of this value (e.g., 500)
--
-- Example: minimum_transfer=1000, transfer_increment=500 means:
--   - Must transfer at least 1000 points
--   - Can transfer 1000, 1500, 2000, etc.

ALTER TABLE conversion_rates
  ADD COLUMN IF NOT EXISTS minimum_transfer INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS transfer_increment INTEGER DEFAULT NULL;

-- Add check constraints to ensure positive values when set (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_minimum_transfer_positive'
  ) THEN
    ALTER TABLE conversion_rates
      ADD CONSTRAINT check_minimum_transfer_positive
        CHECK (minimum_transfer IS NULL OR minimum_transfer > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_transfer_increment_positive'
  ) THEN
    ALTER TABLE conversion_rates
      ADD CONSTRAINT check_transfer_increment_positive
        CHECK (transfer_increment IS NULL OR transfer_increment > 0);
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN conversion_rates.minimum_transfer IS 'Minimum number of points required to initiate a transfer';
COMMENT ON COLUMN conversion_rates.transfer_increment IS 'Points must be transferred in multiples of this value';
