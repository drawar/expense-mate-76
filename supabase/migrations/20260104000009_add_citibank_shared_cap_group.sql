-- Add shared cap_group_id for Citibank Rewards cards
-- The 9,000 bonus points cap is shared between Fashion/Department Stores and Online Transactions rules

-- Define a unique cap group ID for Citibank 10x bonus cap
-- Using a consistent ID so both rules track against the same cap

-- Update Fashion & Department Stores rule
UPDATE reward_rules
SET cap_group_id = 'citibank-rewards-10x-cap'
WHERE name = '10x Points on Fashion & Department Stores'
  AND card_type_id LIKE 'citibank-rewards%';

-- Update Online Transactions rule
UPDATE reward_rules
SET cap_group_id = 'citibank-rewards-10x-cap'
WHERE name = '10x Points on Online Transactions'
  AND card_type_id LIKE 'citibank-rewards%';

-- Verify the update
DO $$
DECLARE
  rule_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rule_count
  FROM reward_rules
  WHERE cap_group_id = 'citibank-rewards-10x-cap';

  RAISE NOTICE 'Updated % rules with shared cap group citibank-rewards-10x-cap', rule_count;
END $$;
