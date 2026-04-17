-- Fix Amex Gold CA network value from 'American Express' to 'amex' for consistency
UPDATE card_catalog
SET network = 'amex'
WHERE card_type_id = 'american-express-gold-ca'
  AND network = 'American Express';
