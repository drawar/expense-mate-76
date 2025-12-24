-- Add card catalog reference and nickname to payment_methods
-- This enables linking user payment methods to universal card definitions

-- Add card_catalog_id as nullable foreign key
-- When set, the payment method inherits properties from the catalog entry
ALTER TABLE payment_methods
  ADD COLUMN IF NOT EXISTS card_catalog_id UUID REFERENCES card_catalog(id) ON DELETE SET NULL;

-- Add nickname for user's custom name for the card
-- Example: "My Travel Card" for an Amex Platinum
ALTER TABLE payment_methods
  ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Create index for efficient joins
CREATE INDEX IF NOT EXISTS idx_payment_methods_card_catalog_id
  ON payment_methods(card_catalog_id)
  WHERE card_catalog_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN payment_methods.card_catalog_id IS 'Reference to card_catalog for inherited properties. NULL for custom cards not in catalog.';
COMMENT ON COLUMN payment_methods.nickname IS 'User custom display name. If NULL, uses catalog name or payment_methods.name.';

-- Note: Existing columns (name, issuer, currency, etc.) remain as:
-- 1. Fallback values for custom cards (no catalog link)
-- 2. User overrides when catalog is linked (for properties that can be overridden)
