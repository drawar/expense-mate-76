-- Add card image for HSBC TravelOne World Mastercard
UPDATE card_catalog
SET default_image_url = 'https://milelion.com/wp-content/uploads/2023/05/hsbc-travelone-horizontal-transparent.png'
WHERE card_type_id = 'hsbc-travelone';
