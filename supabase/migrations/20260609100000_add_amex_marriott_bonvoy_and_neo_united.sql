-- Add American Express Marriott Bonvoy (Canada) and Neo United Airlines World Elite Mastercard (Canada)

-- 1. Add United MileagePlus reward currency (Marriott Bonvoy already exists)
INSERT INTO reward_currencies (code, display_name, issuer, is_transferrable)
VALUES ('united_mileageplus', 'MileagePlus Miles', 'United Airlines', false)
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  issuer = EXCLUDED.issuer,
  is_transferrable = EXCLUDED.is_transferrable;

-- 2. American Express Marriott Bonvoy Card (Canada)
INSERT INTO card_catalog (
  card_type_id,
  issuer,
  name,
  network,
  currency,
  region,
  points_currency,
  reward_currency_id,
  is_active
) VALUES (
  'american-express-marriott-bonvoy-ca',
  'American Express',
  'Marriott Bonvoy Card',
  'American Express',
  'CAD',
  'CA',
  'Marriott Bonvoy Points',
  (SELECT id FROM reward_currencies WHERE code = 'marriott_bonvoy' LIMIT 1),
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
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Amex Marriott Bonvoy CA: 5x on eligible Marriott Bonvoy hotel purchases
INSERT INTO reward_rules (
  card_catalog_id, name, description, enabled, priority,
  conditions, calculation_method,
  base_multiplier, bonus_multiplier,
  points_rounding_strategy, amount_rounding_strategy, block_size
)
SELECT
  (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-marriott-bonvoy-ca'),
  '5x on Marriott Bonvoy Properties',
  'Earn 5 Marriott Bonvoy points per $1 on eligible purchases at hotels participating in the Marriott Bonvoy program',
  true, 2,
  jsonb_build_array(
    jsonb_build_object(
      'type', 'mcc',
      'operation', 'include',
      'values', (
        SELECT jsonb_agg(mcc::text)
        FROM (
          -- Hotels (3501-3999)
          SELECT generate_series(3501, 3999) AS mcc
          UNION ALL
          SELECT 7011
        ) AS mccs
      )
    )
  ),
  'standard', 1, 4, 'floor', 'none', 1;

-- Amex Marriott Bonvoy CA: 2x on everything else
INSERT INTO reward_rules (
  card_catalog_id, name, description, enabled, priority,
  conditions, calculation_method,
  base_multiplier, bonus_multiplier,
  points_rounding_strategy, amount_rounding_strategy, block_size
) VALUES (
  (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-marriott-bonvoy-ca'),
  '2x on All Other Purchases',
  'Earn 2 Marriott Bonvoy points per $1 on all other purchases',
  true, 1,
  '[]'::jsonb,
  'standard', 1, 1, 'floor', 'none', 1
);

-- 3. Neo United Airlines World Elite Mastercard (Canada)
INSERT INTO card_catalog (
  card_type_id,
  issuer,
  name,
  network,
  currency,
  region,
  points_currency,
  reward_currency_id,
  is_active
) VALUES (
  'neo-financial-united-airlines-world-elite-mastercard',
  'Neo Financial',
  'United Airlines World Elite Mastercard',
  'mastercard',
  'CAD',
  'CA',
  'MileagePlus Miles',
  (SELECT id FROM reward_currencies WHERE code = 'united_mileageplus' LIMIT 1),
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
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Neo United CA: 1.25x on United & Star Alliance flights (excluding Aegean and Shenzhen)
-- Star Alliance MCCs confirmed in our MCC seed data:
--   3000 United, 3008 Lufthansa, 3009 Air Canada, 3013 ITA Airways (Alitalia),
--   3015 Swiss, 3016 SAS, 3017 South African Airways, 3020 Air India,
--   3025 Air New Zealand, 3036 AVIANCA, 3048 TAP Portugal, 3053 Austrian,
--   3084 Singapore Airlines, 3085 Thai Airways, 3089 EVA Airways,
--   3091 ANA, 3136 Turkish Airlines
-- Excluded per Neo footnote 3: Aegean Airlines, Shenzhen Airlines
-- Airlines without individual MCC (fall under 4511): Brussels Airlines, Copa, Croatia,
--   Ethiopian, LOT Polish, EgyptAir, Asiana — not included here per user request
INSERT INTO reward_rules (
  card_catalog_id, name, description, enabled, priority,
  conditions, calculation_method,
  base_multiplier, bonus_multiplier,
  points_rounding_strategy, amount_rounding_strategy, block_size
) VALUES (
  (SELECT id FROM card_catalog WHERE card_type_id = 'neo-financial-united-airlines-world-elite-mastercard'),
  '1.25x on United & Star Alliance Flights',
  'Earn 1.25 MileagePlus miles per $1 on United and Star Alliance airline flights. Aegean and Shenzhen Airlines are excluded.',
  true, 3,
  '[{"type":"mcc","operation":"include","values":["3000","3008","3009","3013","3015","3016","3017","3020","3025","3036","3048","3053","3084","3085","3089","3091","3136"]}]'::jsonb,
  'standard', 0.75, 0.5, 'floor', 'none', 1
);

-- Neo United CA: 1x on dining & grocery
INSERT INTO reward_rules (
  card_catalog_id, name, description, enabled, priority,
  conditions, calculation_method,
  base_multiplier, bonus_multiplier,
  points_rounding_strategy, amount_rounding_strategy, block_size
) VALUES (
  (SELECT id FROM card_catalog WHERE card_type_id = 'neo-financial-united-airlines-world-elite-mastercard'),
  '1x on Dining & Grocery',
  'Earn 1 MileagePlus mile per $1 on dining and grocery purchases',
  true, 2,
  '[{"type":"mcc","operation":"include","values":["5411","5422","5441","5451","5462","5812","5813","5814"]}]'::jsonb,
  'standard', 0.75, 0.25, 'floor', 'none', 1
);

-- Neo United CA: 0.75x on everything else
INSERT INTO reward_rules (
  card_catalog_id, name, description, enabled, priority,
  conditions, calculation_method,
  base_multiplier, bonus_multiplier,
  points_rounding_strategy, amount_rounding_strategy, block_size
) VALUES (
  (SELECT id FROM card_catalog WHERE card_type_id = 'neo-financial-united-airlines-world-elite-mastercard'),
  '0.75x on All Other Purchases',
  'Earn 0.75 MileagePlus miles per $1 on all other purchases',
  true, 1,
  '[]'::jsonb,
  'standard', 0.75, 0, 'floor', 'none', 1
);
