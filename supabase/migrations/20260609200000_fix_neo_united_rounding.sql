-- Fix Neo United card calculation: round amount to nearest integer, multiply, then floor
-- Calculation: floor(round(amount) * multiplier)
-- Use total_first so base+bonus multiplier is applied as one step before flooring

UPDATE reward_rules
SET
  calculation_method = 'total_first',
  amount_rounding_strategy = 'nearest'
WHERE card_catalog_id = (
  SELECT id FROM card_catalog WHERE card_type_id = 'neo-financial-united-airlines-world-elite-mastercard'
);
