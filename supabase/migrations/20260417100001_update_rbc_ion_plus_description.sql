-- Update RBC ION+ 3x rule description to list eligible MCCs

UPDATE reward_rules
SET description = 'Earn 3 Avion points per $1. Eligible MCCs: 5411 (Grocery), 5812 (Restaurants), 5813 (Bars/Nightclubs), 5814 (Fast Food), 5541 (Gas Stations), 5542 (Fuel Dispensers), 4121 (Taxis/Limos), 4111 (Local Transit/Ferries), 5552 (EV Charging), 5815 (Digital Media), 5816 (Digital Games), 5817 (Digital Apps), 5818 (Large Digital Merchants), 4899 (Streaming/Cable/Satellite)'
WHERE card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'rbc-ion+')
  AND priority = 2;
