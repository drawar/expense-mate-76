-- Add DBS Woman's World Mastercard to card catalog
INSERT INTO card_catalog (
  card_type_id,
  name,
  issuer,
  network,
  currency,
  points_currency,
  reward_currency_id,
  default_image_url,
  region,
  has_categories,
  is_active
) VALUES (
  'dbs-womans-world-mastercard',
  'Woman''s World Mastercard',
  'DBS',
  'mastercard',
  'SGD',
  'DBS Points',
  'd64e9e8a-7ab2-4690-a32a-25adcf97e513',
  'https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/card-images/dbs-womans-world-mc.webp',
  'SG',
  false,
  true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  reward_currency_id = EXCLUDED.reward_currency_id,
  default_image_url = EXCLUDED.default_image_url;
