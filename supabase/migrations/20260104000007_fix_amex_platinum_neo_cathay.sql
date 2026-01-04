-- Direct fix for Amex Platinum and Neo Cathay card images

-- First, check what card_catalog entries exist for these cards
DO $$
DECLARE
  platinum_id UUID;
  neo_id UUID;
BEGIN
  SELECT id INTO platinum_id FROM card_catalog WHERE card_type_id = 'american-express-platinum-canada';
  SELECT id INTO neo_id FROM card_catalog WHERE card_type_id = 'neo-financial-cathay-world-elite-mastercard';

  RAISE NOTICE 'Catalog IDs - Platinum: %, Neo: %', platinum_id, neo_id;
END $$;

-- Set the image URL for Amex Platinum Canada
UPDATE card_catalog
SET default_image_url = 'https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/card-images/american-express-platinum.jpg',
    updated_at = NOW()
WHERE card_type_id = 'american-express-platinum-canada';

-- Direct update: Find the Amex Platinum payment method and link it
UPDATE payment_methods
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-platinum-canada')
WHERE name = 'Platinum' AND issuer = 'American Express';

-- Verify Neo Cathay has correct image
UPDATE card_catalog
SET default_image_url = 'https://www.finlywealth.com/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fcathay_world_elite_creditcard.png&w=3840&q=100',
    updated_at = NOW()
WHERE card_type_id = 'neo-financial-cathay-world-elite-mastercard';

-- Show final state
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE 'Final state of Amex Platinum and Neo Cathay:';
  FOR rec IN
    SELECT pm.name, pm.issuer, pm.card_catalog_id, cc.card_type_id, cc.default_image_url
    FROM payment_methods pm
    LEFT JOIN card_catalog cc ON pm.card_catalog_id = cc.id
    WHERE (pm.name = 'Platinum' AND pm.issuer = 'American Express')
       OR (pm.issuer LIKE '%Neo%')
  LOOP
    RAISE NOTICE '  % (%) -> catalog_id: % | type: % | image: %',
      rec.name, rec.issuer, rec.card_catalog_id, rec.card_type_id, rec.default_image_url;
  END LOOP;
END $$;
