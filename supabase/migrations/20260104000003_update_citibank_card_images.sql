-- Update Citibank card images in card_catalog

-- Citibank Rewards Visa Signature
UPDATE card_catalog
SET default_image_url = 'https://www.asiamiles.com/content/dam/am-content/brand-v2/finance-pillar/product-small-image/Citibank/MY/MY-Rewards-Visa-20Signature2-480x305.png',
    updated_at = NOW()
WHERE card_type_id = 'citibank-rewards-visa-signature';

-- Citibank Rewards World MasterCard
UPDATE card_catalog
SET default_image_url = 'https://mhgprod.blob.core.windows.net/singsaver/strapi-uploads/bltea3680481263edcb_492d0be83f.png',
    updated_at = NOW()
WHERE card_type_id = 'citibank-rewards-world-mastercard';

-- Link Citibank Rewards Visa Signature payment methods
UPDATE payment_methods pm
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'citibank-rewards-visa-signature')
WHERE pm.type = 'credit_card'
  AND LOWER(pm.issuer) LIKE '%citi%'
  AND LOWER(pm.name) LIKE '%rewards%'
  AND LOWER(pm.name) LIKE '%visa%';

-- Link Citibank Rewards World MasterCard payment methods
UPDATE payment_methods pm
SET card_catalog_id = (SELECT id FROM card_catalog WHERE card_type_id = 'citibank-rewards-world-mastercard')
WHERE pm.type = 'credit_card'
  AND LOWER(pm.issuer) LIKE '%citi%'
  AND LOWER(pm.name) LIKE '%rewards%'
  AND (LOWER(pm.name) LIKE '%mastercard%' OR LOWER(pm.name) LIKE '%world%');
