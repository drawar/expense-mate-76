-- Update all American Express Platinum card images in card_catalog

-- Use the uploaded image for all Platinum variants
UPDATE card_catalog
SET default_image_url = 'https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/card-images/american-express-platinum.jpg',
    updated_at = NOW()
WHERE card_type_id IN (
  'american-express-platinum-canada',
  'american-express-platinum-credit',
  'american-express-platinum-singapore',
  'american-express-platinum'
);

-- Link Amex Platinum payment methods to catalog (try Canada first for CAD cards)
UPDATE payment_methods pm
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-platinum-canada')
WHERE pm.type = 'credit_card'
  AND LOWER(pm.issuer) LIKE '%american%express%'
  AND LOWER(pm.name) LIKE '%platinum%'
  AND pm.currency = 'CAD'
  AND pm.card_catalog_id IS NULL;

-- Link Amex Platinum payment methods (Singapore for SGD cards)
UPDATE payment_methods pm
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-platinum-singapore')
WHERE pm.type = 'credit_card'
  AND LOWER(pm.issuer) LIKE '%american%express%'
  AND LOWER(pm.name) LIKE '%platinum%'
  AND pm.currency = 'SGD'
  AND pm.card_catalog_id IS NULL;

-- Link any remaining Amex Platinum cards to generic platinum
UPDATE payment_methods pm
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-platinum-canada')
WHERE pm.type = 'credit_card'
  AND LOWER(pm.issuer) LIKE '%american%express%'
  AND LOWER(pm.name) LIKE '%platinum%'
  AND pm.card_catalog_id IS NULL;
