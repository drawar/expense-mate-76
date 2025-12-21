-- Fix RLS policy to allow anonymous read access and cleanup duplicates

-- Step 1: Add RLS policy for anonymous read access to reward_currencies
CREATE POLICY "Allow anon read access to reward_currencies"
  ON reward_currencies FOR SELECT
  TO anon
  USING (true);

-- Step 2: Delete duplicate reward currencies
-- Keep citibank_thankyou, delete citi_thankyou
DELETE FROM reward_currencies WHERE code = 'citi_thankyou';

-- Keep amex_mr_ca, delete amex_mr_ca_2
DELETE FROM reward_currencies WHERE code = 'amex_mr_ca_2';

-- Keep aeroplan (non-transferrable), delete aeroplan_points if it exists
DELETE FROM reward_currencies WHERE code = 'aeroplan_points';

-- Step 3: Verify no duplicates by display_name
-- This query shows any remaining duplicates for manual review
-- SELECT display_name, COUNT(*) as cnt FROM reward_currencies GROUP BY display_name HAVING COUNT(*) > 1;
