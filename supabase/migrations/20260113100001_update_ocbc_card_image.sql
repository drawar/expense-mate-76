-- Update OCBC Rewards World Mastercard image
UPDATE card_catalog
SET default_image_url = 'https://mhgprod.blob.core.windows.net/singsaver/strapi-uploads/bltf26783f85532678d_ae451c594c.png'
WHERE card_type_id = 'ocbc-rewards-world-mastercard';
