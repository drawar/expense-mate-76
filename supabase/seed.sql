-- Seed conversion rates based on verified transfer partners
-- Sources: MileLion (SG), Citi SG official site, Prince of Travel (CA)
-- Last updated: December 2024

-- First, delete ALL existing conversion rates to start fresh
-- This ensures we don't have stale/incorrect transfer partners
DELETE FROM conversion_rates;

-- Citi ThankYou Points (Singapore)
-- Source: https://www.citibank.com.sg/credit-cards/privileges-programs/credit-card-rewards-redemption/points-transfer.html
-- Partners: KrisFlyer, Asia Miles, Avios, Flying Blue (NOT Aeroplan, NOT Velocity)
-- All: 25,000 points = 10,000 miles (0.4 ratio)
INSERT INTO conversion_rates (reward_currency, miles_currency, conversion_rate)
VALUES
  ('Citi ThankYou Points', 'KrisFlyer', 0.4),
  ('Citi ThankYou Points', 'AsiaMiles', 0.4),
  ('Citi ThankYou Points', 'Avios', 0.4),
  ('Citi ThankYou Points', 'FlyingBlue', 0.4);

-- HSBC Rewards Points (Singapore)
-- Source: https://milelion.com/2024/12/16/hsbc-devalues-points-transfers-to-singapore-airlines-krisflyer-by-20/
-- KrisFlyer devalued Jan 2025: 30,000:10,000 (0.3333)
-- Asia Miles, Avios, Flying Blue: 25,000:10,000 (0.4)
-- Aeroplan: 35,000:10,000 (0.2857)
INSERT INTO conversion_rates (reward_currency, miles_currency, conversion_rate)
VALUES
  ('HSBC Rewards Points', 'KrisFlyer', 0.3333),
  ('HSBC Rewards Points', 'AsiaMiles', 0.4),
  ('HSBC Rewards Points', 'Avios', 0.4),
  ('HSBC Rewards Points', 'FlyingBlue', 0.4),
  ('HSBC Rewards Points', 'Aeroplan', 0.2857);

-- DBS Points (Singapore)
-- Limited partners: KrisFlyer and Asia Miles only
-- 2.5:1 ratio (0.4)
INSERT INTO conversion_rates (reward_currency, miles_currency, conversion_rate)
VALUES
  ('DBS Points', 'KrisFlyer', 0.4),
  ('DBS Points', 'AsiaMiles', 0.4);

-- UOB PRVI Miles (Singapore)
-- 1:1 transfer to KrisFlyer and Asia Miles
INSERT INTO conversion_rates (reward_currency, miles_currency, conversion_rate)
VALUES
  ('UOB PRVI Miles', 'KrisFlyer', 1.0),
  ('UOB PRVI Miles', 'AsiaMiles', 1.0);

-- Membership Rewards Points (CA) - Canadian Amex
-- Source: https://princeoftravel.com/points-programs/american-express-membership-rewards/
-- Aeroplan & Avios: 1:1
-- Asia Miles & Flying Blue: 1:0.75
-- NO KrisFlyer, NO Velocity (not direct partners)
INSERT INTO conversion_rates (reward_currency, miles_currency, conversion_rate)
VALUES
  ('Membership Rewards Points (CA)', 'Aeroplan', 1.0),
  ('Membership Rewards Points (CA)', 'Avios', 1.0),
  ('Membership Rewards Points (CA)', 'AsiaMiles', 0.75),
  ('Membership Rewards Points (CA)', 'FlyingBlue', 0.75);

-- RBC Avion Points (Canada)
-- Partners: Avios (1:1), Asia Miles (1:1)
INSERT INTO conversion_rates (reward_currency, miles_currency, conversion_rate)
VALUES
  ('RBC Avion Points', 'Avios', 1.0),
  ('RBC Avion Points', 'AsiaMiles', 1.0);

-- Marriott Bonvoy Points (Global)
-- 3:1 ratio (0.3333) to most airlines
INSERT INTO conversion_rates (reward_currency, miles_currency, conversion_rate)
VALUES
  ('Marriott Bonvoy Points', 'KrisFlyer', 0.3333),
  ('Marriott Bonvoy Points', 'AsiaMiles', 0.3333),
  ('Marriott Bonvoy Points', 'Avios', 0.3333),
  ('Marriott Bonvoy Points', 'FlyingBlue', 0.3333),
  ('Marriott Bonvoy Points', 'Aeroplan', 0.3333);
