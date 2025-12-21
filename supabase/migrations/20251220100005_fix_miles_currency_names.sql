-- Fix miles_currency names to match MilesCurrency type in code
-- Code uses: KrisFlyer, AsiaMiles, Avios, FlyingBlue, Aeroplan, Velocity (no spaces)

UPDATE conversion_rates SET miles_currency = 'AsiaMiles' WHERE miles_currency = 'Asia Miles';
UPDATE conversion_rates SET miles_currency = 'FlyingBlue' WHERE miles_currency = 'Flying Blue';
UPDATE conversion_rates SET miles_currency = 'KrisFlyer' WHERE miles_currency = 'Kris Flyer';
