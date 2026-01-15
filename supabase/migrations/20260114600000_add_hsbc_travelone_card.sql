-- Add HSBC TravelOne World Mastercard to card catalog (Singapore)
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, available_categories, max_categories_selectable, is_active
) VALUES (
  'hsbc-travelone',
  'TravelOne World Mastercard',
  'HSBC',
  'mastercard',
  'SGD',
  'HSBC Rewards Points',
  (SELECT id FROM reward_currencies WHERE code = 'hsbc_rewards'),
  'SG',
  false, NULL, NULL, true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id;
