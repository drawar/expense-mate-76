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
