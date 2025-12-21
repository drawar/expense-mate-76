-- Cleanup migration: Drop miles_currencies table and legacy columns
-- Run this AFTER 20251221000000_unify_currency_tables.sql has been verified
--
-- This migration:
-- 1. Drops legacy string columns from conversion_rates
-- 2. Renames destination_currency_id to target_currency_id for clarity
-- 3. Drops the miles_currencies table
-- 4. Drops the legacy miles_currency_id column

-- ============================================================================
-- STEP 1: Drop legacy string columns from conversion_rates
-- ============================================================================
-- These were the original string-based columns before normalization

ALTER TABLE conversion_rates
  DROP COLUMN IF EXISTS reward_currency,
  DROP COLUMN IF EXISTS miles_currency;

-- ============================================================================
-- STEP 2: Drop the legacy miles_currency_id column
-- ============================================================================
-- This referenced the old miles_currencies table

-- First drop the index
DROP INDEX IF EXISTS idx_conversion_rates_miles_currency_id;

-- Then drop the constraint and column
ALTER TABLE conversion_rates
  DROP CONSTRAINT IF EXISTS conversion_rates_miles_currency_id_fkey,
  DROP COLUMN IF EXISTS miles_currency_id;

-- ============================================================================
-- STEP 3: Rename destination_currency_id to target_currency_id (optional)
-- ============================================================================
-- This makes the column name clearer

ALTER TABLE conversion_rates
  RENAME COLUMN destination_currency_id TO target_currency_id;

-- Update the index name to match
DROP INDEX IF EXISTS idx_conversion_rates_destination_currency_id;
CREATE INDEX IF NOT EXISTS idx_conversion_rates_target_currency_id
  ON conversion_rates(target_currency_id);

-- Update the unique index name
DROP INDEX IF EXISTS idx_conversion_rates_source_dest;
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversion_rates_source_target
  ON conversion_rates(reward_currency_id, target_currency_id)
  WHERE reward_currency_id IS NOT NULL AND target_currency_id IS NOT NULL;

-- ============================================================================
-- STEP 4: Drop the miles_currencies table
-- ============================================================================
-- All data has been migrated to reward_currencies with is_transferrable = FALSE

DROP TABLE IF EXISTS miles_currencies;

-- ============================================================================
-- STEP 5: Clean up legacy unique constraint
-- ============================================================================
-- Remove the old unique constraint on string columns

DROP INDEX IF EXISTS idx_conversion_rates_currency_ids;
