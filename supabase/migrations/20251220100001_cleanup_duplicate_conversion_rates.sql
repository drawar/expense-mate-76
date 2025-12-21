-- Remove incorrectly added duplicate conversion rates
-- The correct names are:
-- - "Citi ThankYou Points" (not "ThankYou Points")
-- - "Membership Rewards Points (CA)" (not "Membership Rewards Points")

DELETE FROM conversion_rates WHERE reward_currency = 'ThankYou Points';
DELETE FROM conversion_rates WHERE reward_currency = 'Membership Rewards Points';
