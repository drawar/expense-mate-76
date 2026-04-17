-- Add RBC ION+ Visa to card catalog

INSERT INTO card_catalog (
  card_type_id,
  issuer,
  name,
  network,
  currency,
  region,
  points_currency,
  reward_currency_id,
  default_image_url,
  is_active
) VALUES (
  'rbc-ion+',
  'RBC',
  'ION+',
  'visa',
  'CAD',
  'CA',
  'Avion Rewards Points',
  'e4dc838a-5c0c-420a-893c-329938b0cf1f',
  'https://www.rbcroyalbank.com/credit-cards/canada/rewards/images/rbc-ion-plus-visa.webp',
  true
)
ON CONFLICT (card_type_id) DO UPDATE SET
  issuer = EXCLUDED.issuer,
  name = EXCLUDED.name,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  region = EXCLUDED.region,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id,
  default_image_url = EXCLUDED.default_image_url,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 3x on Grocery, Dining, Food Delivery, Rides, Gas, EV Charging, Streaming & Digital
INSERT INTO reward_rules (
  card_catalog_id,
  name,
  description,
  enabled,
  priority,
  conditions,
  calculation_method,
  base_multiplier,
  bonus_multiplier,
  points_rounding_strategy,
  amount_rounding_strategy,
  block_size
) VALUES (
  (SELECT id FROM card_catalog WHERE card_type_id = 'rbc-ion+'),
  '3x Avion Points on Grocery, Dining, Gas, Transit, Streaming & Digital',
  'Earn 3 Avion points per $1. Eligible MCCs: 5411 (Grocery), 5812 (Restaurants), 5813 (Bars/Nightclubs), 5814 (Fast Food), 5541 (Gas Stations), 5542 (Fuel Dispensers), 4121 (Taxis/Limos), 4111 (Local Transit/Ferries), 5552 (EV Charging), 5815 (Digital Media), 5816 (Digital Games), 5817 (Digital Apps), 5818 (Large Digital Merchants), 4899 (Streaming/Cable/Satellite)',
  true,
  2,
  '[{"type":"mcc","operation":"include","values":["5411","5812","5813","5814","5541","5542","4121","4111","5552","5815","5816","5817","5818","4899"]}]'::jsonb,
  'standard',
  1,
  2,
  'floor',
  'none',
  1
);

-- 1x on Everything Else
INSERT INTO reward_rules (
  card_catalog_id,
  name,
  description,
  enabled,
  priority,
  conditions,
  calculation_method,
  base_multiplier,
  bonus_multiplier,
  points_rounding_strategy,
  amount_rounding_strategy,
  block_size
) VALUES (
  (SELECT id FROM card_catalog WHERE card_type_id = 'rbc-ion+'),
  '1x Avion Points on All Other Purchases',
  'Earn 1 Avion point per $1 on all other purchases',
  true,
  1,
  '[]'::jsonb,
  'standard',
  1,
  0,
  'floor',
  'none',
  1
);
