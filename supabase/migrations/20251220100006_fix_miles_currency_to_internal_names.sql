-- Fix miles_currency to use internal names (no spaces, no "Points"/"Miles" suffix)
-- Code MilesCurrency type uses: Aeroplan, AsiaMiles, Avios, FlyingBlue, KrisFlyer

UPDATE conversion_rates SET miles_currency = 'Aeroplan' WHERE miles_currency = 'Aeroplan Points';
UPDATE conversion_rates SET miles_currency = 'AsiaMiles' WHERE miles_currency = 'Asia Miles';
UPDATE conversion_rates SET miles_currency = 'Avios' WHERE miles_currency = 'Avios';
UPDATE conversion_rates SET miles_currency = 'FlyingBlue' WHERE miles_currency = 'Flying Blue Points';
UPDATE conversion_rates SET miles_currency = 'FlyingBlue' WHERE miles_currency = 'Flying Blue';
UPDATE conversion_rates SET miles_currency = 'KrisFlyer' WHERE miles_currency = 'KrisFlyer Miles';
UPDATE conversion_rates SET miles_currency = 'KrisFlyer' WHERE miles_currency = 'Kris Flyer';
