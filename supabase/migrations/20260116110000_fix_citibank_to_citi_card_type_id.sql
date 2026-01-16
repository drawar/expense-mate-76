-- Fix card_type_id from 'citibank-...' to 'citi-...' after issuer name change
-- NOTE: reward_rules.card_type_id was already removed (now uses card_catalog_id)

-- Update card_catalog only (card_type_id still exists there for identification)
UPDATE card_catalog
SET card_type_id = REPLACE(card_type_id, 'citibank-', 'citi-'),
    issuer = 'Citi',
    updated_at = NOW()
WHERE card_type_id LIKE 'citibank-%';
