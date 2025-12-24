-- Seed card_catalog with cards from CardRegistry.ts
-- These are the universal card definitions shared across all users

-- 1. DBS Woman's World MasterCard (Singapore)
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, available_categories, max_categories_selectable, is_active
) VALUES (
  'dbs-woman''s-world-mastercard',
  'Woman''s World MasterCard',
  'DBS',
  'mastercard',
  'SGD',
  'DBS Points',
  (SELECT id FROM reward_currencies WHERE code = 'dbs_points'),
  'SG',
  false, NULL, NULL, true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id;

-- 2. Citibank Rewards Visa Signature (Singapore)
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, available_categories, max_categories_selectable, is_active
) VALUES (
  'citibank-rewards-visa-signature',
  'Rewards Visa Signature',
  'Citibank',
  'visa',
  'SGD',
  'Citi ThankYou Points',
  (SELECT id FROM reward_currencies WHERE code = 'citi_ty_sg'),
  'SG',
  false, NULL, NULL, true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id;

-- 3. UOB Preferred Visa Platinum (Singapore)
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, available_categories, max_categories_selectable, is_active
) VALUES (
  'uob-preferred-visa-platinum',
  'Preferred Visa Platinum',
  'UOB',
  'visa',
  'SGD',
  'UNI$',
  (SELECT id FROM reward_currencies WHERE code = 'uob_uni'),
  'SG',
  false, NULL, NULL, true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id;

-- 4. UOB Lady's Solitaire (Singapore) - has selectable categories
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, available_categories, max_categories_selectable, is_active
) VALUES (
  'uob-lady''s-solitaire',
  'Lady''s Solitaire',
  'UOB',
  'visa',
  'SGD',
  'UNI$',
  (SELECT id FROM reward_currencies WHERE code = 'uob_uni'),
  'SG',
  true,
  ARRAY['Beauty & Wellness', 'Dining', 'Entertainment', 'Family', 'Fashion', 'Transport', 'Travel'],
  2,
  true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id,
  has_categories = EXCLUDED.has_categories,
  available_categories = EXCLUDED.available_categories,
  max_categories_selectable = EXCLUDED.max_categories_selectable;

-- 5. UOB Visa Signature (Singapore)
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, available_categories, max_categories_selectable, is_active
) VALUES (
  'uob-visa-signature',
  'Visa Signature',
  'UOB',
  'visa',
  'SGD',
  'UNI$',
  (SELECT id FROM reward_currencies WHERE code = 'uob_uni'),
  'SG',
  false, NULL, NULL, true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id;

-- 6. OCBC Rewards World Mastercard (Singapore)
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, available_categories, max_categories_selectable, is_active
) VALUES (
  'ocbc-rewards-world-mastercard',
  'Rewards World Mastercard',
  'OCBC',
  'mastercard',
  'SGD',
  'OCBC$',
  (SELECT id FROM reward_currencies WHERE code = 'ocbc_dollars'),
  'SG',
  false, NULL, NULL, true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id;

-- 7. American Express Platinum Credit (Canada)
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, available_categories, max_categories_selectable, is_active
) VALUES (
  'american-express-platinum-credit',
  'Platinum Credit',
  'American Express',
  'amex',
  'CAD',
  'Membership Rewards Points (CA)',
  (SELECT id FROM reward_currencies WHERE code = 'amex_mr_ca'),
  'CA',
  false, NULL, NULL, true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id;

-- 8. American Express Platinum Singapore
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, available_categories, max_categories_selectable, is_active
) VALUES (
  'american-express-platinum-singapore',
  'Platinum Singapore',
  'American Express',
  'amex',
  'SGD',
  'Membership Rewards Points (SG)',
  NULL, -- No reward_currency for SG Amex MR yet
  'SG',
  false, NULL, NULL, true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id;

-- 9. American Express Platinum Canada
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, available_categories, max_categories_selectable, is_active
) VALUES (
  'american-express-platinum-canada',
  'Platinum Canada',
  'American Express',
  'amex',
  'CAD',
  'Membership Rewards Points (CA)',
  (SELECT id FROM reward_currencies WHERE code = 'amex_mr_ca'),
  'CA',
  false, NULL, NULL, true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id;

-- 10. American Express Cobalt (Canada)
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, available_categories, max_categories_selectable, is_active
) VALUES (
  'american-express-cobalt',
  'Cobalt',
  'American Express',
  'amex',
  'CAD',
  'Membership Rewards Points (CA)',
  (SELECT id FROM reward_currencies WHERE code = 'amex_mr_ca'),
  'CA',
  false, NULL, NULL, true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id;

-- 11. TD Aeroplan Visa Infinite (Canada)
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, available_categories, max_categories_selectable, is_active
) VALUES (
  'td-aeroplan-visa-infinite',
  'Aeroplan Visa Infinite',
  'TD',
  'visa',
  'CAD',
  'Aeroplan Points',
  (SELECT id FROM reward_currencies WHERE code = 'aeroplan'),
  'CA',
  false, NULL, NULL, true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id;

-- Additional commonly used cards (not in CardRegistry but useful)

-- 12. HSBC Revolution (Singapore)
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, available_categories, max_categories_selectable, is_active
) VALUES (
  'hsbc-revolution',
  'Revolution',
  'HSBC',
  'visa',
  'SGD',
  'HSBC Rewards Points',
  (SELECT id FROM reward_currencies WHERE code = 'hsbc_rewards_sg'),
  'SG',
  false, NULL, NULL, true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id;

-- 13. Brim Air France-KLM World Elite Mastercard (Canada)
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, available_categories, max_categories_selectable, is_active
) VALUES (
  'brim-financial-air-france-klm-world-elite-mastercard',
  'Air France-KLM World Elite Mastercard',
  'Brim Financial',
  'mastercard',
  'CAD',
  'Flying Blue Points',
  (SELECT id FROM reward_currencies WHERE code = 'flying_blue'),
  'CA',
  false, NULL, NULL, true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id;

-- 14. Neo Financial Cathay World Elite Mastercard (Canada)
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, available_categories, max_categories_selectable, is_active
) VALUES (
  'neo-financial-cathay-world-elite-mastercard',
  'Cathay World Elite Mastercard',
  'Neo Financial',
  'mastercard',
  'CAD',
  'Asia Miles',
  (SELECT id FROM reward_currencies WHERE code = 'asia_miles'),
  'CA',
  false, NULL, NULL, true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  network = EXCLUDED.network,
  currency = EXCLUDED.currency,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id;
