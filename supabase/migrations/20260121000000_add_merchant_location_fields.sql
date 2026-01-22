-- Add display_location and google_maps_url columns to merchants table
-- display_location: Short location name for UI display (e.g., "Metrotown", "Latin Quarter, Paris")
-- google_maps_url: Full Google Maps URL for directions/navigation

ALTER TABLE public.merchants
ADD COLUMN IF NOT EXISTS display_location TEXT,
ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

-- Copy existing address to display_location as initial value
-- (will be cleaned up by migration script)
UPDATE public.merchants
SET display_location = address
WHERE address IS NOT NULL AND address != '';

COMMENT ON COLUMN public.merchants.display_location IS 'Short location name for UI display (e.g., Metrotown, Latin Quarter)';
COMMENT ON COLUMN public.merchants.google_maps_url IS 'Google Maps URL for the merchant location';
