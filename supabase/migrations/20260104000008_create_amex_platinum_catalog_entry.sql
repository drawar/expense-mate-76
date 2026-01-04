-- Create Amex Platinum Canada catalog entry and link payment method

-- First, check what Amex Platinum entries exist
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE 'Existing Amex Platinum catalog entries:';
  FOR rec IN
    SELECT card_type_id, name, default_image_url
    FROM card_catalog
    WHERE card_type_id LIKE '%platinum%'
  LOOP
    RAISE NOTICE '  % - % | image: %', rec.card_type_id, rec.name, rec.default_image_url;
  END LOOP;
END $$;

-- Insert Amex Platinum Canada if it doesn't exist
INSERT INTO card_catalog (
  card_type_id, name, issuer, network, currency, points_currency, region,
  has_categories, is_active, default_image_url
) VALUES (
  'american-express-platinum-canada',
  'Platinum',
  'American Express',
  'amex',
  'CAD',
  'Membership Rewards Points (CA)',
  'CA',
  false, true,
  'https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/card-images/american-express-platinum.jpg'
) ON CONFLICT (card_type_id) DO UPDATE SET
  default_image_url = EXCLUDED.default_image_url,
  updated_at = NOW();

-- Now link the payment method
UPDATE payment_methods
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'american-express-platinum-canada')
WHERE name = 'Platinum' AND issuer = 'American Express';

-- Verify
DO $$
DECLARE
  rec RECORD;
BEGIN
  SELECT pm.name, pm.issuer, pm.card_catalog_id, cc.default_image_url
  INTO rec
  FROM payment_methods pm
  LEFT JOIN card_catalog cc ON pm.card_catalog_id = cc.id
  WHERE pm.name = 'Platinum' AND pm.issuer = 'American Express';

  RAISE NOTICE 'Amex Platinum: catalog_id=%, image=%', rec.card_catalog_id, rec.default_image_url;
END $$;
