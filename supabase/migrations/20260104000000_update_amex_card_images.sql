-- Update default_image_url for American Express cards

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

-- American Express Platinum Canada
UPDATE card_catalog
SET default_image_url = 'https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/card-images/american-express-platinum.jpg',
    updated_at = NOW()
WHERE card_type_id = 'american-express-platinum-canada';
