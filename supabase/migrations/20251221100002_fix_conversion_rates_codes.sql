-- Migration: Fix conversion rates with correct currency codes
-- The previous migration used incorrect codes. This migration uses the actual codes from the database.

-- ============================================================================
-- STEP 1: Identity conversion rates for non-transferrable currencies
-- ============================================================================

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
-- STEP 2: Citi ThankYou Points -> Airline Miles (code: citibank_thankyou)
-- ============================================================================

INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 0.4
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'citibank_thankyou'
  AND tgt.code IN ('krisflyer', 'asia_miles', 'avios', 'flying_blue')
  AND NOT EXISTS (
    SELECT 1 FROM conversion_rates cr
    WHERE cr.reward_currency_id = src.id AND cr.target_currency_id = tgt.id
  );

-- ============================================================================
-- STEP 3: HSBC Rewards Points -> Airline Miles (code: hsbc_rewards)
-- ============================================================================

INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id,
  CASE
    WHEN tgt.code = 'krisflyer' THEN 0.3333
    WHEN tgt.code = 'aeroplan' THEN 0.2857
    ELSE 0.4
  END
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'hsbc_rewards'
  AND tgt.code IN ('krisflyer', 'asia_miles', 'avios', 'flying_blue', 'aeroplan')
  AND NOT EXISTS (
    SELECT 1 FROM conversion_rates cr
    WHERE cr.reward_currency_id = src.id AND cr.target_currency_id = tgt.id
  );

-- ============================================================================
-- STEP 4: DBS Points -> Airline Miles (code: dbs_points)
-- ============================================================================

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
-- STEP 5: UOB UNI$ -> Airline Miles (code: uob_uni)
-- ============================================================================

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
-- STEP 6: UOB PRVI Miles -> Airline Miles (code: uob_prvi_miles)
-- ============================================================================

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
-- STEP 7: OCBC$ -> Airline Miles (code: ocbc_dollars)
-- ============================================================================

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
-- STEP 8: Membership Rewards Points (CA) -> Airline Miles (code: amex_mr_ca)
-- ============================================================================

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
-- STEP 9: RBC Avion Points -> Airline Miles (code: rbc_avion)
-- ============================================================================

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
-- STEP 10: Marriott Bonvoy Points -> Airline Miles (code: marriott_bonvoy)
-- ============================================================================

INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT src.id, tgt.id, 0.3333
FROM reward_currencies src, reward_currencies tgt
WHERE src.code = 'marriott_bonvoy'
  AND tgt.code IN ('krisflyer', 'asia_miles', 'avios', 'flying_blue', 'aeroplan')
  AND NOT EXISTS (
    SELECT 1 FROM conversion_rates cr
    WHERE cr.reward_currency_id = src.id AND cr.target_currency_id = tgt.id
  );
