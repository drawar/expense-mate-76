-- Link existing payment_methods to card_catalog entries
-- Matches by generating card_type_id from issuer + name
-- This is a best-effort migration - unmatched cards remain as custom cards

-- Update payment methods where we can match to catalog by card_type_id
-- The card_type_id format is: {issuer}-{name} (lowercase, spaces replaced with hyphens)
UPDATE payment_methods pm
SET card_catalog_id = cc.id
FROM card_catalog cc
WHERE pm.card_catalog_id IS NULL  -- Only update if not already linked
  AND pm.issuer IS NOT NULL
  AND pm.name IS NOT NULL
  AND pm.type = 'credit_card'  -- Only link credit cards
  AND cc.card_type_id = LOWER(REPLACE(pm.issuer, ' ', '-')) || '-' || LOWER(REPLACE(pm.name, ' ', '-'));

-- For cards that got linked, copy the current name to nickname if it differs from catalog
-- This preserves any custom naming the user had
UPDATE payment_methods pm
SET nickname = pm.name
FROM card_catalog cc
WHERE pm.card_catalog_id = cc.id
  AND pm.nickname IS NULL
  AND pm.name IS NOT NULL
  AND pm.name != cc.name  -- Only if user had a custom name different from catalog
  AND pm.name != (cc.issuer || ' ' || cc.name);  -- And not just "Issuer Name" format

-- Log migration results (these will show in migration output)
DO $$
DECLARE
  linked_count INTEGER;
  unlinked_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO linked_count
  FROM payment_methods
  WHERE card_catalog_id IS NOT NULL AND type = 'credit_card';

  SELECT COUNT(*) INTO unlinked_count
  FROM payment_methods
  WHERE card_catalog_id IS NULL AND type = 'credit_card';

  RAISE NOTICE 'Card catalog linking complete:';
  RAISE NOTICE '  - Linked to catalog: % credit cards', linked_count;
  RAISE NOTICE '  - Remaining as custom: % credit cards', unlinked_count;
END $$;
