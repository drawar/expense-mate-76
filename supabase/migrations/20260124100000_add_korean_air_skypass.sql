-- Add Korean Air SKYPASS Miles to reward currencies
-- SKYPASS is a non-transferrable currency (airline miles)

INSERT INTO reward_currencies (code, display_name, issuer, is_transferrable, logo_url, bg_color)
VALUES (
  'skypass',
  'SKYPASS Miles',
  'Korean Air',
  FALSE,
  'https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/ke-skypass.png',
  '#00256C'
)
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  issuer = EXCLUDED.issuer,
  is_transferrable = EXCLUDED.is_transferrable,
  logo_url = EXCLUDED.logo_url,
  bg_color = EXCLUDED.bg_color;

-- Add identity conversion rate for direct-earning cards
INSERT INTO conversion_rates (reward_currency_id, target_currency_id, conversion_rate)
SELECT rc.id, rc.id, 1.0
FROM reward_currencies rc
WHERE rc.code = 'skypass'
ON CONFLICT (reward_currency_id, target_currency_id) DO NOTHING;
