-- Fix card_type_id from 'american-express-platinum' to 'american-express-platinum-canada'

-- Update points_balances that might have the old card_type_id
UPDATE points_balances
SET card_type_id = 'american-express-platinum-canada'
WHERE card_type_id = 'american-express-platinum';

-- Update reward_rules that might have the old card_type_id
UPDATE reward_rules
SET card_type_id = 'american-express-platinum-canada'
WHERE card_type_id = 'american-express-platinum';

-- Delete the duplicate card_catalog entry if it exists (keep only -canada version)
DELETE FROM card_catalog
WHERE card_type_id = 'american-express-platinum'
  AND EXISTS (SELECT 1 FROM card_catalog WHERE card_type_id = 'american-express-platinum-canada');
