-- Add American Express Gold Rewards Card (Canada) to card catalog

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
  'american-express-gold-ca',
  'American Express',
  'Gold Rewards Card',
  'American Express',
  'CAD',
  'CA',
  'Membership Rewards Points (CA)',
  (SELECT id FROM reward_currencies WHERE display_name = 'Membership Rewards Points (CA)' LIMIT 1),
  true
)
ON CONFLICT (card_type_id) DO UPDATE SET
  issuer = EXCLUDED.issuer,
  name = EXCLUDED.name,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  region = EXCLUDED.region,
  points_currency = 'Membership Rewards Points (CA)',
  reward_currency_id = (SELECT id FROM reward_currencies WHERE display_name = 'Membership Rewards Points (CA)' LIMIT 1),
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Add reward rules for Amex Gold CA
-- 2x on Gas, Groceries, Drugstores (CAD only)
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
  (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-gold-ca'),
  '2x Points on Gas, Groceries & Drugstores',
  'Earn 2 points per $1 CAD at stand-alone gas stations, grocery stores, and drugstores in Canada',
  true,
  3,
  '[{"type":"mcc","operation":"include","values":["5541","5542","5411","5422","5441","5451","5462","5912"]},{"type":"currency","operation":"equals","values":["CAD"]}]'::jsonb,
  'standard',
  1,
  1,
  'nearest',
  'none',
  1
);

-- 2x on Travel (any currency)
-- Airlines: 3000-3299, 4511
-- Hotels: 3501-3999, 7011
-- Car Rentals: 3351-3500, 7512
-- Cruises: 4411
-- Rail: 4011, 4112
-- Travel Agencies: 4722, 4723
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
)
SELECT
  (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-gold-ca'),
  '2x Points on Travel',
  'Earn 2 points per $1 on flights, hotels, car rentals, cruises, and more',
  true,
  2,
  jsonb_build_array(
    jsonb_build_object(
      'type', 'mcc',
      'operation', 'include',
      'values', (
        SELECT jsonb_agg(mcc::text)
        FROM (
          -- Airlines (3000-3299)
          SELECT generate_series(3000, 3299) AS mcc
          UNION ALL
          -- Airlines misc
          SELECT 4511
          UNION ALL
          -- Car Rentals (3351-3500)
          SELECT generate_series(3351, 3500)
          UNION ALL
          -- Hotels (3501-3999)
          SELECT generate_series(3501, 3999)
          UNION ALL
          -- Hotels misc
          SELECT 7011
          UNION ALL
          -- Car Rentals misc
          SELECT 7512
          UNION ALL
          -- Cruises
          SELECT 4411
          UNION ALL
          -- Rail
          SELECT 4011
          UNION ALL
          SELECT 4112
          UNION ALL
          -- Travel Agencies
          SELECT 4722
          UNION ALL
          SELECT 4723
        ) AS mccs
      )
    )
  ),
  'standard',
  1,
  1,
  'nearest',
  'none',
  1;

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
  (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-gold-ca'),
  '1x Points on All Other Purchases',
  'Earn 1 point per $1 on all other purchases',
  true,
  1,
  '[]'::jsonb,
  'standard',
  1,
  0,
  'nearest',
  'none',
  1
);
