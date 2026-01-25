-- Seed conversion rates based on verified transfer partners
-- Sources: MileLion (SG), Citi SG official site, Prince of Travel (CA)
-- Last updated: December 2024
--
-- Uses the unified ID-based schema with reward_currencies and conversion_rates
-- linked by reward_currency_id and target_currency_id

-- First, delete ALL existing conversion rates to start fresh
-- This ensures we don't have stale/incorrect transfer partners
DELETE FROM conversion_rates;

-- ============================================================================
-- Seed reward_currencies (unified currency table)
-- ============================================================================

-- Transferrable currencies (bank points that can transfer to airlines)
INSERT INTO reward_currencies (code, display_name, issuer, is_transferrable) VALUES
  ('citi_ty_sg', 'Citi ThankYou Points (SG)', 'Citibank', TRUE),
  ('hsbc_rewards_sg', 'HSBC Rewards Points (SG)', 'HSBC', TRUE),
  ('dbs_points', 'DBS Points', 'DBS', TRUE),
  ('uob_uni', 'UNI$', 'UOB', TRUE),
  ('uob_prvi_miles', 'UOB PRVI Miles', 'UOB', TRUE),
  ('ocbc_dollars', 'OCBC$', 'OCBC', TRUE),
  ('amex_mr_ca', 'Membership Rewards Points (CA)', 'American Express', TRUE),
  ('rbc_avion', 'RBC Avion Points', 'RBC', TRUE),
  ('marriott_bonvoy', 'Marriott Bonvoy Points', 'Marriott', TRUE),
  ('td_points', 'TD Points', 'TD', TRUE),
  ('scotiabank_scene', 'Scene+ Points', 'Scotiabank', TRUE)
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  issuer = EXCLUDED.issuer,
  is_transferrable = EXCLUDED.is_transferrable;

-- Non-transferrable currencies (airline miles - endpoints)
INSERT INTO reward_currencies (code, display_name, issuer, is_transferrable) VALUES
  ('krisflyer', 'KrisFlyer Miles', 'Singapore Airlines', FALSE),
  ('asia_miles', 'Asia Miles', 'Cathay Pacific', FALSE),
  ('avios', 'Avios', 'British Airways', FALSE),
  ('flying_blue', 'Flying Blue Points', 'Air France-KLM', FALSE),
  ('aeroplan', 'Aeroplan Points', 'Air Canada', FALSE),
  ('skypass', 'SKYPASS Miles', 'Korean Air', FALSE)
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  issuer = EXCLUDED.issuer,
  is_transferrable = EXCLUDED.is_transferrable;

-- ============================================================================
-- Identity conversion rates for non-transferrable currencies
-- ============================================================================
-- These allow cards that earn airline miles directly (like Brim AF/KLM, Neo Cathay)
-- to appear in the card comparison when the same airline program is selected

INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT rc.id, rc.id, 1.0
FROM reward_currencies rc
WHERE rc.is_transferrable = FALSE
ON CONFLICT (reward_currency_id, target_currency_id) DO NOTHING;

-- ============================================================================
-- Seed conversion_rates using ID-based foreign keys
-- ============================================================================

-- Helper function to insert conversion rates by code
-- We'll insert rates using subqueries to get the IDs

-- Citi ThankYou Points (Singapore)
-- Source: https://www.citibank.com.sg/credit-cards/privileges-programs/credit-card-rewards-redemption/points-transfer.html
-- Partners: KrisFlyer, Asia Miles, Avios, Flying Blue
-- All: 25,000 points = 10,000 miles (0.4 ratio)
INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 0.4
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'citi_ty_sg'
  AND tgt.code IN ('krisflyer', 'asia_miles', 'avios', 'flying_blue')
ON CONFLICT (reward_currency_id, target_currency_id) DO UPDATE SET conversion_rate = EXCLUDED.conversion_rate;

-- HSBC Rewards Points (Singapore)
-- Source: https://milelion.com/2024/12/16/hsbc-devalues-points-transfers-to-singapore-airlines-krisflyer-by-20/
-- KrisFlyer devalued Jan 2025: 30,000:10,000 (0.3333)
INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 0.3333
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'hsbc_rewards_sg' AND tgt.code = 'krisflyer'
ON CONFLICT (reward_currency_id, target_currency_id) DO UPDATE SET conversion_rate = EXCLUDED.conversion_rate;

-- Asia Miles, Avios, Flying Blue: 25,000:10,000 (0.4)
INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 0.4
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'hsbc_rewards_sg'
  AND tgt.code IN ('asia_miles', 'avios', 'flying_blue')
ON CONFLICT (reward_currency_id, target_currency_id) DO UPDATE SET conversion_rate = EXCLUDED.conversion_rate;

-- Aeroplan: 35,000:10,000 (0.2857)
INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 0.2857
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'hsbc_rewards_sg' AND tgt.code = 'aeroplan'
ON CONFLICT (reward_currency_id, target_currency_id) DO UPDATE SET conversion_rate = EXCLUDED.conversion_rate;

-- DBS Points (Singapore)
-- Limited partners: KrisFlyer and Asia Miles only
-- 2.5:1 ratio (0.4)
INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 0.4
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'dbs_points'
  AND tgt.code IN ('krisflyer', 'asia_miles')
ON CONFLICT (reward_currency_id, target_currency_id) DO UPDATE SET conversion_rate = EXCLUDED.conversion_rate;

-- UOB UNI$ (Singapore)
-- Rate: 500 UNI$ = 2,000 miles (4x multiplier)
INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 4.0
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'uob_uni'
  AND tgt.code IN ('krisflyer', 'asia_miles')
ON CONFLICT (reward_currency_id, target_currency_id) DO UPDATE SET conversion_rate = EXCLUDED.conversion_rate;

-- UOB PRVI Miles (Singapore)
-- 1:1 transfer to KrisFlyer and Asia Miles
INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 1.0
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'uob_prvi_miles'
  AND tgt.code IN ('krisflyer', 'asia_miles')
ON CONFLICT (reward_currency_id, target_currency_id) DO UPDATE SET conversion_rate = EXCLUDED.conversion_rate;

-- OCBC$ (Singapore)
-- Rate: 1 OCBC$ = 2 miles
INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 2.0
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'ocbc_dollars'
  AND tgt.code IN ('krisflyer', 'asia_miles')
ON CONFLICT (reward_currency_id, target_currency_id) DO UPDATE SET conversion_rate = EXCLUDED.conversion_rate;

-- Membership Rewards Points (CA) - Canadian Amex
-- Source: https://princeoftravel.com/points-programs/american-express-membership-rewards/
-- Aeroplan & Avios: 1:1
INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 1.0
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'amex_mr_ca'
  AND tgt.code IN ('aeroplan', 'avios')
ON CONFLICT (reward_currency_id, target_currency_id) DO UPDATE SET conversion_rate = EXCLUDED.conversion_rate;

-- Asia Miles & Flying Blue: 1:0.75
INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 0.75
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'amex_mr_ca'
  AND tgt.code IN ('asia_miles', 'flying_blue')
ON CONFLICT (reward_currency_id, target_currency_id) DO UPDATE SET conversion_rate = EXCLUDED.conversion_rate;

-- RBC Avion Points (Canada)
-- Partners: Avios (1:1), Asia Miles (1:1)
INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 1.0
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'rbc_avion'
  AND tgt.code IN ('avios', 'asia_miles')
ON CONFLICT (reward_currency_id, target_currency_id) DO UPDATE SET conversion_rate = EXCLUDED.conversion_rate;

-- Marriott Bonvoy Points (Global)
-- 3:1 ratio (0.3333) to most airlines
INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 0.3333
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'marriott_bonvoy'
  AND tgt.code IN ('krisflyer', 'asia_miles', 'avios', 'flying_blue', 'aeroplan')
ON CONFLICT (reward_currency_id, target_currency_id) DO UPDATE SET conversion_rate = EXCLUDED.conversion_rate;
