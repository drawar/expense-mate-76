-- Migration: Update Amex Canada reward rules to use total_first calculation method
--
-- Background: Amex Canada calculates points differently than other issuers:
--   total_points = round(amount * total_multiplier)
--   base_points = round(amount * 1)
--   bonus_points = total_points - base_points
--
-- This is different from the "standard" method which calculates:
--   base_points = round(amount * base_multiplier)
--   bonus_points = round(amount * bonus_multiplier)
--   total_points = base_points + bonus_points
--
-- The difference matters due to rounding. For example, with $10.33 and 5x:
--   total_first: total = round(51.65) = 52, base = 10, bonus = 42
--   standard:    base = 10, bonus = round(41.32) = 41, total = 51

-- Update all Amex Canada rules that have bonus multipliers to use total_first
-- Card type ID format: american-express-{card-name}
UPDATE reward_rules
SET
  calculation_method = 'total_first',
  updated_at = NOW()
WHERE
  card_type_id LIKE 'american-express-%'
  AND bonus_multiplier > 0
  AND (calculation_method = 'standard' OR calculation_method IS NULL);
