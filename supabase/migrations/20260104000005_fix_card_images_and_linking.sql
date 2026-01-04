-- Fix card images and linking for cards that aren't showing images
-- This migration is more aggressive - it will re-link cards even if already linked

-- ============================================
-- STEP 1: Set default_image_url in card_catalog
-- ============================================

-- Neo Financial Cathay World Elite Mastercard
UPDATE card_catalog
SET default_image_url = 'https://www.finlywealth.com/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fcathay_world_elite_creditcard.png&w=3840&q=100',
    updated_at = NOW()
WHERE card_type_id = 'neo-financial-cathay-world-elite-mastercard';

-- American Express Platinum (all variants) - re-apply to be sure
UPDATE card_catalog
SET default_image_url = 'https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/card-images/american-express-platinum.jpg',
    updated_at = NOW()
WHERE card_type_id LIKE 'american-express-platinum%';

-- American Express Aeroplan Reserve
UPDATE card_catalog
SET default_image_url = 'https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/card-images/american-express-aeroplan-reserve.jpeg',
    updated_at = NOW()
WHERE card_type_id = 'american-express-aeroplan-reserve';

-- American Express Cobalt
UPDATE card_catalog
SET default_image_url = 'https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/card-images/american-express-cobalt.jpeg',
    updated_at = NOW()
WHERE card_type_id = 'american-express-cobalt';

-- ============================================
-- STEP 2: Link payment_methods to card_catalog
-- More aggressive matching - will overwrite existing links
-- ============================================

-- Neo Financial Cathay
UPDATE payment_methods
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'neo-financial-cathay-world-elite-mastercard')
WHERE type = 'credit_card'
  AND (
    LOWER(issuer) LIKE '%neo%'
    OR LOWER(name) LIKE '%cathay%'
  );

-- Amex Aeroplan Reserve
UPDATE payment_methods
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-aeroplan-reserve')
WHERE type = 'credit_card'
  AND (LOWER(issuer) LIKE '%amex%' OR LOWER(issuer) LIKE '%american%express%')
  AND LOWER(name) LIKE '%aeroplan%';

-- Amex Cobalt
UPDATE payment_methods
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-cobalt')
WHERE type = 'credit_card'
  AND (LOWER(issuer) LIKE '%amex%' OR LOWER(issuer) LIKE '%american%express%')
  AND LOWER(name) LIKE '%cobalt%';

-- Amex Platinum (CAD)
UPDATE payment_methods
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-platinum-canada')
WHERE type = 'credit_card'
  AND (LOWER(issuer) LIKE '%amex%' OR LOWER(issuer) LIKE '%american%express%')
  AND LOWER(name) LIKE '%platinum%'
  AND currency = 'CAD';

-- Amex Platinum (SGD)
UPDATE payment_methods
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-platinum-singapore')
WHERE type = 'credit_card'
  AND (LOWER(issuer) LIKE '%amex%' OR LOWER(issuer) LIKE '%american%express%')
  AND LOWER(name) LIKE '%platinum%'
  AND currency = 'SGD';

-- ============================================
-- STEP 3: Debug output
-- ============================================
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE 'Payment methods and their linked catalog images:';
  FOR rec IN
    SELECT pm.name, pm.issuer, pm.card_catalog_id, cc.card_type_id, cc.default_image_url
    FROM payment_methods pm
    LEFT JOIN card_catalog cc ON pm.card_catalog_id = cc.id
    WHERE pm.type = 'credit_card'
  LOOP
    RAISE NOTICE '  % (%) -> % | image: %', rec.name, rec.issuer, rec.card_type_id, SUBSTRING(rec.default_image_url FROM 1 FOR 50);
  END LOOP;
END $$;
