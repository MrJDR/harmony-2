-- Fix RLS policies for Reports bucket to allow authenticated users to upload
-- Run this if you prefer to allow direct uploads instead of using the Edge Function

-- Allow authenticated users to insert (upload) files
CREATE POLICY "Allow authenticated users to upload reports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Reports' AND
  (storage.foldername(name))[1] = 'reports'
);

-- Allow authenticated users to read files
CREATE POLICY "Allow authenticated users to read reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'Reports'
);

-- Allow public read access (since bucket is public)
CREATE POLICY "Allow public read access to reports"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'Reports'
);

-- Allow authenticated users to delete their own files (optional)
CREATE POLICY "Allow authenticated users to delete reports"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Reports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
