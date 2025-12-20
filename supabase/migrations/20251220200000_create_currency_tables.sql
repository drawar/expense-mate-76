-- Create normalized currency tables with proper IDs
-- This replaces string-based currency matching with foreign key relationships

-- ============================================================================
-- STEP 1: Create reward_currencies table
-- ============================================================================
CREATE TABLE IF NOT EXISTS reward_currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  issuer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert predefined reward currencies
INSERT INTO reward_currencies (code, display_name, issuer) VALUES
  ('citi_thankyou', 'Citi ThankYou Points', 'Citi'),
  ('citibank_thankyou', 'Citi ThankYou Points', 'Citibank'),
  ('hsbc_rewards', 'HSBC Rewards Points', 'HSBC'),
  ('dbs_points', 'DBS Points', 'DBS'),
  ('uob_uni', 'UNI$', 'UOB'),
  ('uob_prvi_miles', 'UOB PRVI Miles', 'UOB'),
  ('ocbc_dollars', 'OCBC$', 'OCBC'),
  ('amex_mr_ca', 'Membership Rewards Points (CA)', 'Amex'),
  ('amex_mr_ca_2', 'Membership Rewards Points (CA)', 'American Express'),
  ('aeroplan_points', 'Aeroplan Points', NULL),
  ('rbc_avion', 'RBC Avion Points', 'RBC'),
  ('marriott_bonvoy', 'Marriott Bonvoy Points', 'Marriott'),
  ('td_points', 'TD Points', 'TD'),
  ('scotiabank_scene', 'Scene+ Points', 'Scotiabank')
ON CONFLICT (code) DO NOTHING;

-- Enable RLS
ALTER TABLE reward_currencies ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read reward currencies
CREATE POLICY "Allow authenticated read access to reward_currencies"
  ON reward_currencies FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- STEP 2: Create miles_currencies table
-- ============================================================================
CREATE TABLE IF NOT EXISTS miles_currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert predefined miles currencies
INSERT INTO miles_currencies (code, display_name) VALUES
  ('krisflyer', 'KrisFlyer Miles'),
  ('asia_miles', 'Asia Miles'),
  ('avios', 'Avios'),
  ('flying_blue', 'Flying Blue Points'),
  ('aeroplan', 'Aeroplan Points')
ON CONFLICT (code) DO NOTHING;

-- Enable RLS
ALTER TABLE miles_currencies ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read miles currencies
CREATE POLICY "Allow authenticated read access to miles_currencies"
  ON miles_currencies FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- STEP 3: Add FK columns to conversion_rates (nullable initially)
-- ============================================================================
ALTER TABLE conversion_rates
  ADD COLUMN IF NOT EXISTS reward_currency_id UUID REFERENCES reward_currencies(id),
  ADD COLUMN IF NOT EXISTS miles_currency_id UUID REFERENCES miles_currencies(id);

-- ============================================================================
-- STEP 4: Migrate conversion_rates data
-- ============================================================================

-- Match reward_currency to reward_currencies by display_name
UPDATE conversion_rates cr
SET reward_currency_id = rc.id
FROM reward_currencies rc
WHERE cr.reward_currency = rc.display_name
  AND cr.reward_currency_id IS NULL;

-- Match miles_currency to miles_currencies by code (case-insensitive)
UPDATE conversion_rates cr
SET miles_currency_id = mc.id
FROM miles_currencies mc
WHERE LOWER(cr.miles_currency) = mc.code
  AND cr.miles_currency_id IS NULL;

-- Also try matching miles_currency by display_name for any remaining
UPDATE conversion_rates cr
SET miles_currency_id = mc.id
FROM miles_currencies mc
WHERE cr.miles_currency = mc.display_name
  AND cr.miles_currency_id IS NULL;

-- Handle specific mappings for old naming conventions
UPDATE conversion_rates cr
SET miles_currency_id = mc.id
FROM miles_currencies mc
WHERE mc.code = 'krisflyer'
  AND cr.miles_currency IN ('KrisFlyer', 'KrisFlyer Miles', 'Kris Flyer')
  AND cr.miles_currency_id IS NULL;

UPDATE conversion_rates cr
SET miles_currency_id = mc.id
FROM miles_currencies mc
WHERE mc.code = 'asia_miles'
  AND cr.miles_currency IN ('AsiaMiles', 'Asia Miles')
  AND cr.miles_currency_id IS NULL;

UPDATE conversion_rates cr
SET miles_currency_id = mc.id
FROM miles_currencies mc
WHERE mc.code = 'flying_blue'
  AND cr.miles_currency IN ('FlyingBlue', 'Flying Blue', 'Flying Blue Points')
  AND cr.miles_currency_id IS NULL;

UPDATE conversion_rates cr
SET miles_currency_id = mc.id
FROM miles_currencies mc
WHERE mc.code = 'aeroplan'
  AND cr.miles_currency IN ('Aeroplan', 'Aeroplan Points')
  AND cr.miles_currency_id IS NULL;

UPDATE conversion_rates cr
SET miles_currency_id = mc.id
FROM miles_currencies mc
WHERE mc.code = 'avios'
  AND cr.miles_currency IN ('Avios')
  AND cr.miles_currency_id IS NULL;

-- ============================================================================
-- STEP 5: Add FK column to payment_methods
-- ============================================================================
ALTER TABLE payment_methods
  ADD COLUMN IF NOT EXISTS reward_currency_id UUID REFERENCES reward_currencies(id);

-- ============================================================================
-- STEP 6: Migrate payment_methods by issuer matching
-- ============================================================================

-- First, try to match by existing points_currency if set
UPDATE payment_methods pm
SET reward_currency_id = rc.id
FROM reward_currencies rc
WHERE pm.points_currency = rc.display_name
  AND pm.reward_currency_id IS NULL;

-- Then match by issuer (case-insensitive)
UPDATE payment_methods pm
SET reward_currency_id = rc.id
FROM reward_currencies rc
WHERE LOWER(pm.issuer) = LOWER(rc.issuer)
  AND pm.reward_currency_id IS NULL
  AND rc.issuer IS NOT NULL;

-- ============================================================================
-- STEP 7: Create new unique constraint for conversion_rates
-- ============================================================================

-- Create unique constraint on the new FK columns
-- (Will only take effect after we drop the old constraint and columns)
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversion_rates_currency_ids
  ON conversion_rates(reward_currency_id, miles_currency_id)
  WHERE reward_currency_id IS NOT NULL AND miles_currency_id IS NOT NULL;

-- ============================================================================
-- STEP 8: Create indexes for efficient lookups
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_conversion_rates_reward_currency_id
  ON conversion_rates(reward_currency_id);

CREATE INDEX IF NOT EXISTS idx_conversion_rates_miles_currency_id
  ON conversion_rates(miles_currency_id);

CREATE INDEX IF NOT EXISTS idx_payment_methods_reward_currency_id
  ON payment_methods(reward_currency_id);

CREATE INDEX IF NOT EXISTS idx_reward_currencies_issuer
  ON reward_currencies(issuer);
