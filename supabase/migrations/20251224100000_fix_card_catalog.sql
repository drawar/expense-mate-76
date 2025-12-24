-- Fix card_catalog to match actual cards in payment_methods and reward_rules

-- Remove legacy/unused cards
DELETE FROM card_catalog WHERE card_type_id IN (
  'td-aeroplan-visa-infinite',
  'american-express-platinum-canada',
  'american-express-platinum-credit',
  'american-express-platinum-singapore',
  'dbs-woman''s-world-mastercard',
  'ocbc-rewards-world-mastercard',
  'uob-lady''s-solitaire',
  'uob-preferred-visa-platinum',
  'uob-visa-signature',
  'hsbc-revolution'  -- Wrong ID, will add correct one
);

-- Add missing cards that exist in payment_methods and have reward_rules

-- 1. American Express Aeroplan Reserve (Canada)
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, is_active
) VALUES (
  'american-express-aeroplan-reserve',
  'Aeroplan Reserve',
  'American Express',
  'amex',
  'CAD',
  'Aeroplan Points',
  (SELECT id FROM reward_currencies WHERE code = 'aeroplan'),
  'CA',
  false, true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id;

-- 2. American Express Platinum (Canada) - correct card_type_id
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, is_active
) VALUES (
  'american-express-platinum',
  'Platinum',
  'American Express',
  'amex',
  'CAD',
  'Membership Rewards Points (CA)',
  (SELECT id FROM reward_currencies WHERE code = 'amex_mr_ca'),
  'CA',
  false, true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id;

-- 3. Citibank Rewards World MasterCard (Singapore)
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, is_active
) VALUES (
  'citibank-rewards-world-mastercard',
  'Rewards World MasterCard',
  'Citibank',
  'mastercard',
  'SGD',
  'Citi ThankYou Points',
  (SELECT id FROM reward_currencies WHERE code = 'citi_ty_sg'),
  'SG',
  false, true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id;

-- 4. HSBC Revolution Visa Platinum (Singapore) - correct name and ID
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, reward_currency_id, region,
  has_categories, is_active
) VALUES (
  'hsbc-revolution-visa-platinum',
  'Revolution Visa Platinum',
  'HSBC',
  'visa',
  'SGD',
  'HSBC Rewards Points',
  (SELECT id FROM reward_currencies WHERE code = 'hsbc_rewards_sg'),
  'SG',
  false, true
) ON CONFLICT (card_type_id) DO UPDATE SET
  name = EXCLUDED.name,
  issuer = EXCLUDED.issuer,
  points_currency = EXCLUDED.points_currency,
  reward_currency_id = EXCLUDED.reward_currency_id;

-- 5. Fix Brim card_type_id to match reward_rules (without "-mastercard" suffix)
-- First update the existing entry
UPDATE card_catalog
SET card_type_id = 'brim-financial-air-france-klm-world-elite'
WHERE card_type_id = 'brim-financial-air-france-klm-world-elite-mastercard';

-- Verify the changes
DO $$
DECLARE
  card_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO card_count FROM card_catalog;
  RAISE NOTICE 'Card catalog now has % entries', card_count;
END
$$;
