-- Migration: Fix card comparison for cards that earn airline miles directly
--
-- Cards like Brim AF/KLM (Flying Blue), Neo Cathay (Asia Miles), and Amex Aeroplan Reserve
-- earn airline miles directly, not transferable bank points.
--
-- This migration:
-- 1. Adds identity conversion rates for non-transferable currencies (rate = 1.0)
--    So Flying Blue → Flying Blue = 1.0, Asia Miles → Asia Miles = 1.0, etc.
-- 2. Updates payment methods to set reward_currency_id based on points_currency

-- STEP 1: Add identity conversion rates for non-transferable currencies
-- These allow cards earning airline miles to show up in the card comparison
-- when the user selects that same airline program as the target
-- Using a simple INSERT with NOT EXISTS to avoid constraint issues

INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT rc.id, rc.id, 1.0
FROM reward_currencies rc
WHERE rc.is_transferrable = FALSE
  AND NOT EXISTS (
    SELECT 1 FROM conversion_rates cr
    WHERE cr.reward_currency_id = rc.id
      AND cr.target_currency_id = rc.id
  );

-- STEP 2: Update payment methods to set reward_currency_id based on points_currency
-- This maps the string points_currency to the actual currency ID

-- Flying Blue Miles / Flying Blue Points
UPDATE payment_methods pm
SET reward_currency_id = rc.id
FROM reward_currencies rc
WHERE (pm.points_currency ILIKE '%Flying Blue%' OR pm.points_currency ILIKE '%FlyingBlue%')
  AND rc.code = 'flying_blue'
  AND pm.reward_currency_id IS NULL;

-- Asia Miles
UPDATE payment_methods pm
SET reward_currency_id = rc.id
FROM reward_currencies rc
WHERE (pm.points_currency ILIKE '%Asia Miles%' OR pm.points_currency ILIKE '%AsiaMiles%')
  AND rc.code = 'asia_miles'
  AND pm.reward_currency_id IS NULL;

-- Aeroplan Points
UPDATE payment_methods pm
SET reward_currency_id = rc.id
FROM reward_currencies rc
WHERE pm.points_currency ILIKE '%Aeroplan%'
  AND rc.code = 'aeroplan'
  AND pm.reward_currency_id IS NULL;

-- KrisFlyer Miles
UPDATE payment_methods pm
SET reward_currency_id = rc.id
FROM reward_currencies rc
WHERE (pm.points_currency ILIKE '%KrisFlyer%' OR pm.points_currency ILIKE '%Kris Flyer%')
  AND rc.code = 'krisflyer'
  AND pm.reward_currency_id IS NULL;

-- Avios
UPDATE payment_methods pm
SET reward_currency_id = rc.id
FROM reward_currencies rc
WHERE pm.points_currency ILIKE '%Avios%'
  AND rc.code = 'avios'
  AND pm.reward_currency_id IS NULL;

-- Membership Rewards (Canadian Amex)
UPDATE payment_methods pm
SET reward_currency_id = rc.id
FROM reward_currencies rc
WHERE (pm.points_currency ILIKE '%Membership Rewards%' OR pm.points_currency = 'Membership Rewards')
  AND rc.code = 'amex_mr_ca'
  AND pm.reward_currency_id IS NULL;

-- Citi ThankYou Points (SG)
UPDATE payment_methods pm
SET reward_currency_id = rc.id
FROM reward_currencies rc
WHERE pm.points_currency ILIKE '%ThankYou%'
  AND rc.code = 'citi_ty_sg'
  AND pm.reward_currency_id IS NULL;

-- DBS Points
UPDATE payment_methods pm
SET reward_currency_id = rc.id
FROM reward_currencies rc
WHERE pm.points_currency ILIKE '%DBS Points%'
  AND rc.code = 'dbs_points'
  AND pm.reward_currency_id IS NULL;

-- HSBC Rewards Points
UPDATE payment_methods pm
SET reward_currency_id = rc.id
FROM reward_currencies rc
WHERE pm.points_currency ILIKE '%HSBC%Rewards%'
  AND rc.code = 'hsbc_rewards_sg'
  AND pm.reward_currency_id IS NULL;

-- UOB UNI$
UPDATE payment_methods pm
SET reward_currency_id = rc.id
FROM reward_currencies rc
WHERE pm.points_currency ILIKE '%UNI$%'
  AND rc.code = 'uob_uni'
  AND pm.reward_currency_id IS NULL;

-- Marriott Bonvoy
UPDATE payment_methods pm
SET reward_currency_id = rc.id
FROM reward_currencies rc
WHERE (pm.points_currency ILIKE '%Marriott%' OR pm.points_currency ILIKE '%Bonvoy%')
  AND rc.code = 'marriott_bonvoy'
  AND pm.reward_currency_id IS NULL;

-- RBC Avion Points
UPDATE payment_methods pm
SET reward_currency_id = rc.id
FROM reward_currencies rc
WHERE pm.points_currency ILIKE '%Avion%'
  AND rc.code = 'rbc_avion'
  AND pm.reward_currency_id IS NULL;
