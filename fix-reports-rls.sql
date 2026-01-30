-- Fix RLS policies for Reports bucket
-- This will drop existing policies and recreate them

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete reports" ON storage.objects;

-- Create policy to allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload reports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Reports' AND
  (storage.foldername(name))[1] = 'reports'
);

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to reports"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'Reports'
);
