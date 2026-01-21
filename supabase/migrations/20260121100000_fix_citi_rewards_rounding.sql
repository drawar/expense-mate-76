-- Fix Citi Rewards card rules to use floor amount rounding
-- This ensures bonus points are calculated on whole dollars only,
-- resulting in bonus points that are multiples of the bonus multiplier (9)

UPDATE reward_rules
SET amount_rounding_strategy = 'floor'
WHERE card_type_id LIKE 'citibank-rewards%'
  AND (amount_rounding_strategy IS NULL OR amount_rounding_strategy != 'floor');

-- Also update any rules linked via card_catalog_id
UPDATE reward_rules
SET amount_rounding_strategy = 'floor'
WHERE card_catalog_id IN (
  SELECT id FROM card_catalog WHERE card_type_id LIKE 'citibank-rewards%'
)
AND (amount_rounding_strategy IS NULL OR amount_rounding_strategy != 'floor');

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % Citi Rewards rules to use floor amount rounding', updated_count;
END $$;
