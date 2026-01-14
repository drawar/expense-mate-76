-- Add OCBC Rewards Card (Singapore) to card catalog
-- This is the same card as OCBC Rewards World Mastercard

INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, available_categories, max_categories_selectable, is_active,
  default_image_url
) VALUES (
  'ocbc-rewards-world-mastercard',
  'Rewards World Mastercard',
  'OCBC',
  'mastercard',
  'SGD',
  'OCBC$',
  (SELECT id FROM reward_currencies WHERE code = 'ocbc_dollars'),
  'SG',
  false, NULL, NULL, true,
  'https://mhgprod.blob.core.windows.net/singsaver/strapi-uploads/bltf26783f85532678d_ae451c594c.png'
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id,
  default_image_url = EXCLUDED.default_image_url,
  is_active = true;
