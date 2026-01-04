-- Fix remaining cards that still don't have images

-- ============================================
-- STEP 1: Set default_image_url in card_catalog
-- ============================================

-- HSBC Revolution
UPDATE card_catalog
SET default_image_url = 'https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/card-images/hsbc-revolution-visa-platinum.png',
    updated_at = NOW()
WHERE card_type_id = 'hsbc-revolution';

-- Brim Financial Air France-KLM
UPDATE card_catalog
SET default_image_url = 'https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/card-images/brim-financial-air-france-klm-world-elite.png',
    updated_at = NOW()
WHERE card_type_id = 'brim-financial-air-france-klm-world-elite-mastercard';

-- ============================================
-- STEP 2: Link payment_methods - Amex Platinum (any currency)
-- ============================================

-- Amex Platinum - link to Canada variant regardless of currency
UPDATE payment_methods
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-platinum-canada')
WHERE type = 'credit_card'
  AND (LOWER(issuer) LIKE '%amex%' OR LOWER(issuer) LIKE '%american%express%')
  AND LOWER(name) LIKE '%platinum%'
  AND card_catalog_id IS NULL;

-- HSBC Revolution
UPDATE payment_methods
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'hsbc-revolution')
WHERE type = 'credit_card'
  AND LOWER(issuer) LIKE '%hsbc%'
  AND LOWER(name) LIKE '%revolution%';

-- Brim Financial Air France-KLM
UPDATE payment_methods
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'brim-financial-air-france-klm-world-elite-mastercard')
WHERE type = 'credit_card'
  AND LOWER(issuer) LIKE '%brim%';

-- ============================================
-- STEP 3: Verify results
-- ============================================
DO $$
DECLARE
  rec RECORD;
  missing_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Cards with missing images after fix:';
  FOR rec IN
    SELECT pm.name, pm.issuer, cc.default_image_url
    FROM payment_methods pm
    LEFT JOIN card_catalog cc ON pm.card_catalog_id = cc.id
    WHERE pm.type = 'credit_card'
      AND (pm.card_catalog_id IS NULL OR cc.default_image_url IS NULL)
  LOOP
    missing_count := missing_count + 1;
    RAISE NOTICE '  MISSING: % (%)', rec.name, rec.issuer;
  END LOOP;

  IF missing_count = 0 THEN
    RAISE NOTICE 'All credit cards have images!';
  END IF;
END $$;
