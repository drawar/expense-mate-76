-- Add card image for DBS Woman's World Mastercard
UPDATE card_catalog
SET default_image_url = 'https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/card-images/dbs-womans-world-mc.webp'
WHERE card_type_id = 'dbs-woman''s-world-mastercard';
