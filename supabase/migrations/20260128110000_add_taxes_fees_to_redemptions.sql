-- Add taxes_fees columns to points_redemptions
-- For tracking taxes and fees paid on award redemptions (e.g., fuel surcharges on flights)

ALTER TABLE points_redemptions
ADD COLUMN taxes_fees NUMERIC,
ADD COLUMN taxes_fees_currency TEXT DEFAULT 'USD';

COMMENT ON COLUMN points_redemptions.taxes_fees IS 'Taxes and fees paid on the redemption (e.g., fuel surcharges)';
COMMENT ON COLUMN points_redemptions.taxes_fees_currency IS 'Currency of the taxes and fees';
