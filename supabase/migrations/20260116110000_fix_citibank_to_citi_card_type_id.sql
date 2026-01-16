-- Fix card_type_id from 'citibank-...' to 'citi-...' after issuer name change

-- Update points_balances
UPDATE points_balances
SET card_type_id = REPLACE(card_type_id, 'citibank-', 'citi-')
WHERE card_type_id LIKE 'citibank-%';

-- Update card_catalog
UPDATE card_catalog
SET card_type_id = REPLACE(card_type_id, 'citibank-', 'citi-'),
    issuer = 'Citi',
    updated_at = NOW()
WHERE card_type_id LIKE 'citibank-%';

-- Update reward_rules
UPDATE reward_rules
SET card_type_id = REPLACE(card_type_id, 'citibank-', 'citi-'),
    updated_at = NOW()
WHERE card_type_id LIKE 'citibank-%';
