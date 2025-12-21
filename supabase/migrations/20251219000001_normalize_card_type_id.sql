-- Normalize card_type_id format to use dashes instead of spaces
-- This ensures consistency between the CardTypeIdService output and database values
--
-- Before: "american express-cobalt" (space in issuer)
-- After:  "american-express-cobalt" (dashes only)

-- Update all card_type_id values to replace spaces with dashes
UPDATE reward_rules
SET card_type_id = REPLACE(card_type_id, ' ', '-')
WHERE card_type_id LIKE '% %';

-- Update the column comment to reflect the normalized format
COMMENT ON COLUMN reward_rules.card_type_id IS 'Card type identifier in format: {issuer}-{name} with all spaces replaced by dashes (e.g., "american-express-cobalt", "chase-sapphire-reserve")';
