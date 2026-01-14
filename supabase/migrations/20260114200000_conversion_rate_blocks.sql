-- Migration: Replace conversion_rate decimal with source_block/target_block ratio
--
-- New model:
-- - source_block: Number of points required to transfer (e.g., 25000)
-- - target_block: Number of miles received (e.g., 10000)
-- - Rate is implicitly target_block / source_block
-- - source_block serves as minimum transfer AND default increment
-- - transfer_increment: Optional override for special cases (e.g., HSBC where increment is 2 miles)
--
-- Example: DBS Points -> KrisFlyer
--   source_block = 25000, target_block = 10000
--   Means: Transfer 25,000 DBS Points = 10,000 KrisFlyer Miles
--   Minimum: 25,000 points, Increment: 25,000 points

-- Step 1: Add new columns
ALTER TABLE conversion_rates
  ADD COLUMN IF NOT EXISTS source_block INTEGER,
  ADD COLUMN IF NOT EXISTS target_block INTEGER;

-- Step 2: Migrate existing data
-- Convert decimal rate to blocks (use 10000 as base, adjust target by rate)
-- For rate 0.4: source_block=10000, target_block=4000
-- For rate 1.0: source_block=10000, target_block=10000
-- For rate 2.0: source_block=10000, target_block=20000
UPDATE conversion_rates
SET
  source_block = 10000,
  target_block = ROUND(conversion_rate * 10000)::INTEGER
WHERE source_block IS NULL AND conversion_rate IS NOT NULL;

-- Step 3: Add constraints
ALTER TABLE conversion_rates
  DROP CONSTRAINT IF EXISTS check_source_block_positive,
  DROP CONSTRAINT IF EXISTS check_target_block_positive;

ALTER TABLE conversion_rates
  ADD CONSTRAINT check_source_block_positive
    CHECK (source_block IS NULL OR source_block > 0),
  ADD CONSTRAINT check_target_block_positive
    CHECK (target_block IS NULL OR target_block > 0);

-- Step 4: Drop old columns (minimum_transfer is now implicit in source_block)
ALTER TABLE conversion_rates
  DROP COLUMN IF EXISTS minimum_transfer;

-- Keep conversion_rate for now as computed/cached value
-- Can be dropped in future migration once all code is updated

-- Add comments
COMMENT ON COLUMN conversion_rates.source_block IS 'Number of source points per transfer block (also serves as minimum transfer)';
COMMENT ON COLUMN conversion_rates.target_block IS 'Number of target miles/points received per transfer block';
COMMENT ON COLUMN conversion_rates.transfer_increment IS 'Optional: Override increment for special programs (e.g., HSBC allows increments of 2 miles after first block)';
