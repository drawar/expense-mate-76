-- Fix duplicate Brim card_type_id in reward_rules
UPDATE reward_rules
SET card_type_id = 'brim-financial-air-france-klm-world-elite'
WHERE card_type_id = 'brim-financial-air-france-klm-world-elite-mastercard';
