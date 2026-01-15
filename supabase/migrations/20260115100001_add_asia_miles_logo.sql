-- Add logo for Asia Miles (Cathay Pacific)
UPDATE reward_currencies
SET logo_url = 'https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/cx-asiamiles.png'
WHERE code = 'asia_miles';
