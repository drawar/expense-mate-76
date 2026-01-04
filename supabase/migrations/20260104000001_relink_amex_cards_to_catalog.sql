-- Re-link American Express cards to card_catalog entries
-- This ensures payment_methods.card_catalog_id is set so the default_image_url can be retrieved

-- Link Amex Aeroplan Reserve cards
UPDATE payment_methods pm
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-aeroplan-reserve')
WHERE pm.card_catalog_id IS NULL
  AND pm.type = 'credit_card'
  AND LOWER(pm.issuer) LIKE '%american%express%'
  AND LOWER(pm.name) LIKE '%aeroplan%reserve%';

-- Link Amex Cobalt cards
UPDATE payment_methods pm
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-cobalt')
WHERE pm.card_catalog_id IS NULL
  AND pm.type = 'credit_card'
  AND LOWER(pm.issuer) LIKE '%american%express%'
  AND LOWER(pm.name) LIKE '%cobalt%';

-- Link Amex Platinum Canada cards
UPDATE payment_methods pm
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-platinum-canada')
WHERE pm.card_catalog_id IS NULL
  AND pm.type = 'credit_card'
  AND LOWER(pm.issuer) LIKE '%american%express%'
  AND LOWER(pm.name) LIKE '%platinum%'
  AND (pm.currency = 'CAD' OR LOWER(pm.name) LIKE '%canada%');

-- Also re-link cards that might already have card_catalog_id but to wrong catalog entry
-- Update cards that have 'Aeroplan Reserve' in name to point to correct catalog
UPDATE payment_methods pm
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-aeroplan-reserve')
WHERE pm.type = 'credit_card'
  AND LOWER(pm.issuer) LIKE '%american%express%'
  AND LOWER(pm.name) LIKE '%aeroplan%reserve%'
  AND (pm.card_catalog_id IS NULL OR pm.card_catalog_id != (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-aeroplan-reserve'));

-- Update cards that have 'Cobalt' in name to point to correct catalog
UPDATE payment_methods pm
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-cobalt')
WHERE pm.type = 'credit_card'
  AND LOWER(pm.issuer) LIKE '%american%express%'
  AND LOWER(pm.name) LIKE '%cobalt%'
  AND (pm.card_catalog_id IS NULL OR pm.card_catalog_id != (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-cobalt'));
