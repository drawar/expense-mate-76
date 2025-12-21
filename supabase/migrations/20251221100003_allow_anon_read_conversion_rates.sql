-- Migration: Allow anon users to read conversion rates
-- This is needed for the card comparison feature to work without authentication

-- Drop existing policy if exists, then create new one
DROP POLICY IF EXISTS "Conversion rates are viewable by anon users" ON conversion_rates;
CREATE POLICY "Conversion rates are viewable by anon users"
  ON conversion_rates
  FOR SELECT
  TO anon
  USING (true);

-- Also allow anon to read reward_currencies
DROP POLICY IF EXISTS "Reward currencies are viewable by anon users" ON reward_currencies;
CREATE POLICY "Reward currencies are viewable by anon users"
  ON reward_currencies
  FOR SELECT
  TO anon
  USING (true);
