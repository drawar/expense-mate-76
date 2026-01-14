-- Add background color column for loyalty program logos
ALTER TABLE reward_currencies
  ADD COLUMN IF NOT EXISTS bg_color VARCHAR(7) DEFAULT NULL;

-- Set Amex blue background for Membership Rewards
UPDATE reward_currencies
SET bg_color = '#006FCF'
WHERE code ILIKE '%amex%' OR display_name ILIKE '%membership rewards%';

-- Set Flying Blue background
UPDATE reward_currencies
SET bg_color = '#0800b8'
WHERE code = 'flying_blue';

COMMENT ON COLUMN reward_currencies.bg_color IS 'Background color for logo display (hex format, e.g. #006FCF)';
