-- Remove incorrectly added aliases
-- The canonical names are:
-- - "Citi ThankYou Points" (not "ThankYou Points")
-- - "Membership Rewards Points (CA)" (not "Membership Rewards" or "Membership Rewards Points")
-- - "Aeroplan Points" (not "Aeroplan")

DELETE FROM conversion_rates WHERE reward_currency = 'Membership Rewards';
DELETE FROM conversion_rates WHERE reward_currency = 'Membership Rewards Points';
DELETE FROM conversion_rates WHERE reward_currency = 'ThankYou Points';
DELETE FROM conversion_rates WHERE reward_currency = 'Aeroplan';
DELETE FROM conversion_rates WHERE reward_currency = 'Asia Miles';
