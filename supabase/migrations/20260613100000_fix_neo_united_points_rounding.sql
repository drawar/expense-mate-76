-- Fix Neo United card: points rounding should be nearest, not floor
-- Examples: $395 * 1.25 = 493.75 → 494 (nearest), not 493 (floor)
--           round($327.5) = 328 * 1.25 = 410

UPDATE reward_rules
SET points_rounding_strategy = 'nearest'
WHERE card_catalog_id = (
  SELECT id FROM card_catalog WHERE card_type_id = 'neo-financial-united-airlines-world-elite-mastercard'
);
