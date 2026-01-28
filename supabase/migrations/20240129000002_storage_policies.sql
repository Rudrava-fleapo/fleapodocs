
-- Update storage policies to use role-based access control instead of hardcoded email

-- Admin can upload files
DROP POLICY IF EXISTS "Admin can upload documents" ON storage.objects;
CREATE POLICY "Admin can upload documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  );

-- Admin can delete files
DROP POLICY IF EXISTS "Admin can delete documents" ON storage.objects;
CREATE POLICY "Admin can delete documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  );
