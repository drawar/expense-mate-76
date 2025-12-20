-- Clean up and reset conversion rates with verified transfer partners only
-- Sources: MileLion (SG), Citi SG official site, Prince of Travel (CA)
-- Last updated: December 2024

-- First, delete ALL existing conversion rates to start fresh
DELETE FROM conversion_rates;

-- Citi ThankYou Points (Singapore)
-- Partners: KrisFlyer, Asia Miles, Avios, Flying Blue
-- NOT partners: Aeroplan, Velocity
INSERT INTO conversion_rates (reward_currency, miles_currency, conversion_rate)
VALUES
  ('Citi ThankYou Points', 'KrisFlyer', 0.4),
  ('Citi ThankYou Points', 'AsiaMiles', 0.4),
  ('Citi ThankYou Points', 'Avios', 0.4),
  ('Citi ThankYou Points', 'FlyingBlue', 0.4);

-- HSBC Rewards Points (Singapore)
INSERT INTO conversion_rates (reward_currency, miles_currency, conversion_rate)
VALUES
  ('HSBC Rewards Points', 'KrisFlyer', 0.3333),
  ('HSBC Rewards Points', 'AsiaMiles', 0.4),
  ('HSBC Rewards Points', 'Avios', 0.4),
  ('HSBC Rewards Points', 'FlyingBlue', 0.4),
  ('HSBC Rewards Points', 'Aeroplan', 0.2857);

-- DBS Points (Singapore)
INSERT INTO conversion_rates (reward_currency, miles_currency, conversion_rate)
VALUES
  ('DBS Points', 'KrisFlyer', 0.4),
  ('DBS Points', 'AsiaMiles', 0.4);

-- UOB PRVI Miles (Singapore)
INSERT INTO conversion_rates (reward_currency, miles_currency, conversion_rate)
VALUES
  ('UOB PRVI Miles', 'KrisFlyer', 1.0),
  ('UOB PRVI Miles', 'AsiaMiles', 1.0);

-- Membership Rewards Points (CA) - Canadian Amex
-- NO KrisFlyer, NO Velocity
INSERT INTO conversion_rates (reward_currency, miles_currency, conversion_rate)
VALUES
  ('Membership Rewards Points (CA)', 'Aeroplan', 1.0),
  ('Membership Rewards Points (CA)', 'Avios', 1.0),
  ('Membership Rewards Points (CA)', 'AsiaMiles', 0.75),
  ('Membership Rewards Points (CA)', 'FlyingBlue', 0.75);

-- RBC Avion Points (Canada)
INSERT INTO conversion_rates (reward_currency, miles_currency, conversion_rate)
VALUES
  ('RBC Avion Points', 'Avios', 1.0),
  ('RBC Avion Points', 'AsiaMiles', 1.0);

-- Marriott Bonvoy Points (Global)
INSERT INTO conversion_rates (reward_currency, miles_currency, conversion_rate)
VALUES
  ('Marriott Bonvoy Points', 'KrisFlyer', 0.3333),
  ('Marriott Bonvoy Points', 'AsiaMiles', 0.3333),
  ('Marriott Bonvoy Points', 'Avios', 0.3333),
  ('Marriott Bonvoy Points', 'FlyingBlue', 0.3333),
  ('Marriott Bonvoy Points', 'Aeroplan', 0.3333);
