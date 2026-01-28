
-- Fix RLS Policies for Documents

-- Ensure RLS is enabled
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_targets ENABLE ROW LEVEL SECURITY;

-- 1. Refine functions
CREATE OR REPLACE FUNCTION is_fleapo_email()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (lower(auth.jwt() ->> 'email') LIKE '%@fleapo.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Employees can view accessible documents" ON documents;
DROP POLICY IF EXISTS "Employees can view their targets" ON document_targets;
DROP POLICY IF EXISTS "Admin can manage documents" ON documents;

-- 3. Recreate Admin Policy (using role)
CREATE POLICY "Admin can manage documents"
  ON documents
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  );

-- 4. Recreate Employee Documents Policy
-- Explicitly check visibility OR target match
CREATE POLICY "Employees can view accessible documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    is_fleapo_email() AND (
      visibility = 'all'
      OR
      id IN (
        SELECT document_id 
        FROM document_targets 
        WHERE lower(target_email) = lower(auth.jwt() ->> 'email')
      )
    )
  );

-- 5. Recreate Document Targets Policy
-- This is crucial: Users need to be able to SELECT their own rows in document_targets
-- for the IN clause above to work (unless we wrap it in a security definer function, 
-- but standard RLS on targets is cleaner)
CREATE POLICY "Employees can view their targets"
  ON document_targets
  FOR SELECT
  TO authenticated
  USING (
    is_fleapo_email() AND lower(target_email) = lower(auth.jwt() ->> 'email')
  );
