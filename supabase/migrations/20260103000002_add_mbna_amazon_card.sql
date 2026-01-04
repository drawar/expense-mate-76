-- Migration: Add MBNA Amazon.ca Rewards World MasterCard to card catalog

-- Part 1: Add Amazon Rewards currency if not exists
INSERT INTO reward_currencies (code, display_name, issuer, is_transferrable)
VALUES ('amazon_rewards_ca', 'Amazon Rewards', 'MBNA', false)
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  issuer = EXCLUDED.issuer;

-- Part 2: Add MBNA Amazon.ca Rewards World MasterCard to card catalog
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, available_categories, max_categories_selectable, is_active, default_image_url
) VALUES (
  'mbna-amazon.ca-rewards-world-mastercard',
  'Amazon.ca Rewards World Mastercard',
  'MBNA',
  'mastercard',
  'CAD',
  'Amazon Rewards',
  (SELECT id FROM reward_currencies WHERE code = 'amazon_rewards_ca'),
  'CA',
  false, NULL, NULL, true,
  'https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/card-images/mbna-amazonca-rewards-world-mc.jpeg'
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id,
  default_image_url = EXCLUDED.default_image_url;
