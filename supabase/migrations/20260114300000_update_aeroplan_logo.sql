-- Update Aeroplan logo to use JPG version with proper background
UPDATE reward_currencies
SET logo_url = 'https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/ac-aeroplan.jpg'
WHERE code = 'aeroplan';
