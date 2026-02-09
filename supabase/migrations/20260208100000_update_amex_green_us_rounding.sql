-- Update Amex Green (US) reward rules to round amount first before multiplying
-- This matches the actual Amex calculation: round to nearest integer, then multiply

UPDATE reward_rules rr
SET
  amount_rounding_strategy = 'nearest',
  updated_at = NOW()
FROM card_catalog cc
WHERE rr.card_catalog_id = cc.id
  AND cc.card_type_id = 'american-express-green';
