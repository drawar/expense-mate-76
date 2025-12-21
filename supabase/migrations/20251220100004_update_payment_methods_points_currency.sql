-- Update existing payment methods to use canonical pointsCurrency names

-- ThankYou Points → Citi ThankYou Points
UPDATE payment_methods
SET points_currency = 'Citi ThankYou Points'
WHERE points_currency = 'ThankYou Points';

-- Membership Rewards → Membership Rewards Points (CA)
UPDATE payment_methods
SET points_currency = 'Membership Rewards Points (CA)'
WHERE points_currency = 'Membership Rewards';

-- Membership Rewards Points → Membership Rewards Points (CA)
UPDATE payment_methods
SET points_currency = 'Membership Rewards Points (CA)'
WHERE points_currency = 'Membership Rewards Points';

-- Aeroplan → Aeroplan Points
UPDATE payment_methods
SET points_currency = 'Aeroplan Points'
WHERE points_currency = 'Aeroplan';
