-- Migration: Create storage bucket for card images
-- NOTE: This migration must be run manually via Supabase Dashboard or CLI
-- because storage bucket operations require special permissions.
--
-- MANUAL SETUP INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Name: card-images
-- 4. Public bucket: YES (so images can be viewed without auth)
-- 5. File size limit: 5MB
-- 6. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
--
-- Then create the following policies in Storage > Policies:

-- Policy: Allow authenticated users to upload images
-- CREATE POLICY "Users can upload card images"
-- ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'card-images');

-- Policy: Allow anyone to view card images (public bucket)
-- CREATE POLICY "Anyone can view card images"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (bucket_id = 'card-images');

-- Policy: Allow authenticated users to update their own images
-- CREATE POLICY "Users can update card images"
-- ON storage.objects
-- FOR UPDATE
-- TO authenticated
-- USING (bucket_id = 'card-images');

-- Policy: Allow authenticated users to delete images
-- CREATE POLICY "Users can delete card images"
-- ON storage.objects
-- FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'card-images');

-- This file is kept for documentation purposes.
-- The actual bucket creation should be done through the Supabase Dashboard.
