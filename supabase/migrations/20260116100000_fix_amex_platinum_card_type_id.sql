-- Fix card_type_id from 'american-express-platinum' to 'american-express-platinum-canada'
-- NOTE: reward_rules.card_type_id was already removed (now uses card_catalog_id)

-- Delete the duplicate card_catalog entry if it exists (keep only -canada version)
DELETE FROM card_catalog
WHERE card_type_id = 'american-express-platinum'
  AND EXISTS (SELECT 1 FROM card_catalog WHERE card_type_id = 'american-express-platinum-canada');
