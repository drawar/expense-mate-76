-- Migration: Unify miles_currencies and reward_currencies tables
--
-- This migration:
-- 1. Adds is_transferrable column to reward_currencies
-- 2. Removes duplicate entries
-- 3. Migrates miles_currencies data into reward_currencies
-- 4. Updates conversion_rates to use unified table
-- 5. Cleans up legacy references

-- ============================================================================
-- STEP 1: Add is_transferrable column to reward_currencies
-- ============================================================================
-- Transferrable = TRUE: Bank points that can transfer to airlines (Citi ThankYou, DBS Points, etc.)
-- Transferrable = FALSE: Airline miles that are endpoints (KrisFlyer, Aeroplan, etc.)

ALTER TABLE reward_currencies
  ADD COLUMN IF NOT EXISTS is_transferrable BOOLEAN NOT NULL DEFAULT TRUE;

-- ============================================================================
-- STEP 2: Remove duplicate entries BEFORE inserting miles currencies
-- ============================================================================

-- First, update any conversion_rates referencing the duplicates to use the canonical entries
-- citi_thankyou -> citibank_thankyou
UPDATE conversion_rates cr
SET reward_currency_id = (SELECT id FROM reward_currencies WHERE code = 'citibank_thankyou')
WHERE reward_currency_id = (SELECT id FROM reward_currencies WHERE code = 'citi_thankyou');

-- amex_mr_ca_2 -> amex_mr_ca
UPDATE conversion_rates cr
SET reward_currency_id = (SELECT id FROM reward_currencies WHERE code = 'amex_mr_ca')
WHERE reward_currency_id = (SELECT id FROM reward_currencies WHERE code = 'amex_mr_ca_2');

-- Update payment_methods referencing duplicates
UPDATE payment_methods
SET reward_currency_id = (SELECT id FROM reward_currencies WHERE code = 'citibank_thankyou')
WHERE reward_currency_id = (SELECT id FROM reward_currencies WHERE code = 'citi_thankyou');

UPDATE payment_methods
SET reward_currency_id = (SELECT id FROM reward_currencies WHERE code = 'amex_mr_ca')
WHERE reward_currency_id = (SELECT id FROM reward_currencies WHERE code = 'amex_mr_ca_2');

-- Also update by points_currency string for any that weren't migrated yet
UPDATE payment_methods
SET reward_currency_id = (SELECT id FROM reward_currencies WHERE code = 'citibank_thankyou')
WHERE points_currency = 'Citi ThankYou Points' AND reward_currency_id IS NULL;

-- Now safe to delete duplicates
DELETE FROM reward_currencies WHERE code = 'citi_thankyou';
DELETE FROM reward_currencies WHERE code = 'amex_mr_ca_2';

-- Handle aeroplan_points - it will be replaced by aeroplan from miles_currencies
-- First update any references
UPDATE conversion_rates cr
SET reward_currency_id = NULL
WHERE reward_currency_id = (SELECT id FROM reward_currencies WHERE code = 'aeroplan_points');

UPDATE payment_methods
SET reward_currency_id = NULL
WHERE reward_currency_id = (SELECT id FROM reward_currencies WHERE code = 'aeroplan_points');

DELETE FROM reward_currencies WHERE code = 'aeroplan_points';

-- ============================================================================
-- STEP 3: Insert miles currencies as non-transferrable reward currencies
-- ============================================================================

INSERT INTO reward_currencies (code, display_name, issuer, is_transferrable) VALUES
  ('krisflyer', 'KrisFlyer Miles', 'Singapore Airlines', FALSE),
  ('asia_miles', 'Asia Miles', 'Cathay Pacific', FALSE),
  ('avios', 'Avios', 'British Airways', FALSE),
  ('flying_blue', 'Flying Blue Points', 'Air France-KLM', FALSE),
  ('aeroplan', 'Aeroplan Points', 'Air Canada', FALSE)
ON CONFLICT (code) DO UPDATE SET
  is_transferrable = EXCLUDED.is_transferrable,
  issuer = EXCLUDED.issuer,
  display_name = EXCLUDED.display_name;

-- ============================================================================
-- STEP 4: Add destination_currency_id FK column to conversion_rates
-- ============================================================================
-- This will replace miles_currency_id to reference the unified reward_currencies table

ALTER TABLE conversion_rates
  ADD COLUMN IF NOT EXISTS destination_currency_id UUID REFERENCES reward_currencies(id);

-- ============================================================================
-- STEP 5: Populate destination_currency_id from miles_currency_id
-- ============================================================================

UPDATE conversion_rates cr
SET destination_currency_id = rc.id
FROM miles_currencies mc
JOIN reward_currencies rc ON rc.code = mc.code
WHERE cr.miles_currency_id = mc.id
  AND cr.destination_currency_id IS NULL;

-- ============================================================================
-- STEP 6: Create index for efficient queries on is_transferrable
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_reward_currencies_transferrable
  ON reward_currencies(is_transferrable);

-- Create index on destination_currency_id
CREATE INDEX IF NOT EXISTS idx_conversion_rates_destination_currency_id
  ON conversion_rates(destination_currency_id);

-- ============================================================================
-- STEP 7: Create unique constraint for the new FK pair
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversion_rates_source_dest
  ON conversion_rates(reward_currency_id, destination_currency_id)
  WHERE reward_currency_id IS NOT NULL AND destination_currency_id IS NOT NULL;
