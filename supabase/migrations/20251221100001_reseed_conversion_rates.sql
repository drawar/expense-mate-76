-- Migration: Re-seed conversion rates with identity rates for direct miles cards
-- This migration ensures conversion rates are populated after any seeding operations

-- ============================================================================
-- STEP 1: Identity conversion rates for non-transferrable currencies
-- ============================================================================
-- These allow cards that earn airline miles directly to show up in card comparison

INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT rc.id, rc.id, 1.0
FROM reward_currencies rc
WHERE rc.is_transferrable = FALSE
  AND NOT EXISTS (
    SELECT 1 FROM conversion_rates cr
    WHERE cr.reward_currency_id = rc.id
      AND cr.target_currency_id = rc.id
  );

-- ============================================================================
-- STEP 2: Citi ThankYou Points (Singapore) -> Airline Miles
-- ============================================================================
-- Source: https://www.citibank.com.sg/credit-cards/privileges-programs/credit-card-rewards-redemption/points-transfer.html
-- All: 25,000 points = 10,000 miles (0.4 ratio)

INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 0.4
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'citi_ty_sg'
  AND tgt.code IN ('krisflyer', 'asia_miles', 'avios', 'flying_blue')
  AND NOT EXISTS (
    SELECT 1 FROM conversion_rates cr
    WHERE cr.reward_currency_id = src.id AND cr.target_currency_id = tgt.id
  );

-- ============================================================================
-- STEP 3: HSBC Rewards Points (Singapore) -> Airline Miles
-- ============================================================================
-- KrisFlyer: 30,000:10,000 (0.3333), Others: 25,000:10,000 (0.4), Aeroplan: 35,000:10,000 (0.2857)

INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id,
  CASE
    WHEN tgt.code = 'krisflyer' THEN 0.3333
    WHEN tgt.code = 'aeroplan' THEN 0.2857
    ELSE 0.4
  END
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'hsbc_rewards_sg'
  AND tgt.code IN ('krisflyer', 'asia_miles', 'avios', 'flying_blue', 'aeroplan')
  AND NOT EXISTS (
    SELECT 1 FROM conversion_rates cr
    WHERE cr.reward_currency_id = src.id AND cr.target_currency_id = tgt.id
  );

-- ============================================================================
-- STEP 4: DBS Points (Singapore) -> Airline Miles
-- ============================================================================
-- Limited partners: KrisFlyer and Asia Miles only (0.4 ratio)

INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 0.4
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'dbs_points'
  AND tgt.code IN ('krisflyer', 'asia_miles')
  AND NOT EXISTS (
    SELECT 1 FROM conversion_rates cr
    WHERE cr.reward_currency_id = src.id AND cr.target_currency_id = tgt.id
  );

-- ============================================================================
-- STEP 5: UOB UNI$ (Singapore) -> Airline Miles
-- ============================================================================
-- Rate: 500 UNI$ = 2,000 miles (4x multiplier)

INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 4.0
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'uob_uni'
  AND tgt.code IN ('krisflyer', 'asia_miles')
  AND NOT EXISTS (
    SELECT 1 FROM conversion_rates cr
    WHERE cr.reward_currency_id = src.id AND cr.target_currency_id = tgt.id
  );

-- ============================================================================
-- STEP 6: UOB PRVI Miles (Singapore) -> Airline Miles
-- ============================================================================
-- 1:1 transfer to KrisFlyer and Asia Miles

INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 1.0
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'uob_prvi_miles'
  AND tgt.code IN ('krisflyer', 'asia_miles')
  AND NOT EXISTS (
    SELECT 1 FROM conversion_rates cr
    WHERE cr.reward_currency_id = src.id AND cr.target_currency_id = tgt.id
  );

-- ============================================================================
-- STEP 7: OCBC$ (Singapore) -> Airline Miles
-- ============================================================================
-- Rate: 1 OCBC$ = 2 miles

INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 2.0
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'ocbc_dollars'
  AND tgt.code IN ('krisflyer', 'asia_miles')
  AND NOT EXISTS (
    SELECT 1 FROM conversion_rates cr
    WHERE cr.reward_currency_id = src.id AND cr.target_currency_id = tgt.id
  );

-- ============================================================================
-- STEP 8: Membership Rewards Points (CA) -> Airline Miles
-- ============================================================================
-- Aeroplan & Avios: 1:1, Asia Miles & Flying Blue: 0.75

INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id,
  CASE
    WHEN tgt.code IN ('aeroplan', 'avios') THEN 1.0
    ELSE 0.75
  END
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'amex_mr_ca'
  AND tgt.code IN ('aeroplan', 'avios', 'asia_miles', 'flying_blue')
  AND NOT EXISTS (
    SELECT 1 FROM conversion_rates cr
    WHERE cr.reward_currency_id = src.id AND cr.target_currency_id = tgt.id
  );

-- ============================================================================
-- STEP 9: RBC Avion Points (Canada) -> Airline Miles
-- ============================================================================
-- Partners: Avios (1:1), Asia Miles (1:1)

INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 1.0
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'rbc_avion'
  AND tgt.code IN ('avios', 'asia_miles')
  AND NOT EXISTS (
    SELECT 1 FROM conversion_rates cr
    WHERE cr.reward_currency_id = src.id AND cr.target_currency_id = tgt.id
  );

-- ============================================================================
-- STEP 10: Marriott Bonvoy Points (Global) -> Airline Miles
-- ============================================================================
-- 3:1 ratio (0.3333) to most airlines

INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 0.3333
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'marriott_bonvoy'
  AND tgt.code IN ('krisflyer', 'asia_miles', 'avios', 'flying_blue', 'aeroplan')
  AND NOT EXISTS (
    SELECT 1 FROM conversion_rates cr
    WHERE cr.reward_currency_id = src.id AND cr.target_currency_id = tgt.id
  );
