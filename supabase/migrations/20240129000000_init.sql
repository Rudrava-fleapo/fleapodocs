-- Fleapo Documents Database Schema
-- Run this in your Supabase SQL Editor

-- ===========================================
-- 1. CREATE TABLES
-- ===========================================

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('all', 'targeted')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document targets (for targeted visibility)
CREATE TABLE IF NOT EXISTS document_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  target_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, target_email)
);

-- Acknowledgments table
CREATE TABLE IF NOT EXISTS acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, user_id)
);

-- ===========================================
-- 2. CREATE INDEXES
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_documents_visibility ON documents(visibility);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_targets_document_id ON document_targets(document_id);
CREATE INDEX IF NOT EXISTS idx_document_targets_email ON document_targets(target_email);
CREATE INDEX IF NOT EXISTS idx_acknowledgments_document_id ON acknowledgments(document_id);
CREATE INDEX IF NOT EXISTS idx_acknowledgments_user_id ON acknowledgments(user_id);

-- ===========================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE acknowledgments ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 4. CREATE RLS POLICIES
-- ===========================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT auth.jwt() ->> 'email' = 'hr@fleapo.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if email is from allowed domain
CREATE OR REPLACE FUNCTION is_fleapo_email()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT auth.jwt() ->> 'email' LIKE '%@fleapo.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Documents policies

-- Admin can do everything with documents
DROP POLICY IF EXISTS "Admin can manage documents" ON documents;
CREATE POLICY "Admin can manage documents"
  ON documents
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Employees can view documents they have access to
DROP POLICY IF EXISTS "Employees can view accessible documents" ON documents;
CREATE POLICY "Employees can view accessible documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    is_fleapo_email() AND (
      visibility = 'all'
      OR
      EXISTS (
        SELECT 1 FROM document_targets
        WHERE document_targets.document_id = documents.id
        AND document_targets.target_email = auth.jwt() ->> 'email'
      )
    )
  );

-- Document targets policies

-- Admin can manage document targets
DROP POLICY IF EXISTS "Admin can manage document targets" ON document_targets;
CREATE POLICY "Admin can manage document targets"
  ON document_targets
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Employees can view their targets
DROP POLICY IF EXISTS "Employees can view their targets" ON document_targets;
CREATE POLICY "Employees can view their targets"
  ON document_targets
  FOR SELECT
  TO authenticated
  USING (
    is_fleapo_email() AND target_email = auth.jwt() ->> 'email'
  );

-- Acknowledgments policies

-- Admin can view all acknowledgments
DROP POLICY IF EXISTS "Admin can view all acknowledgments" ON acknowledgments;
CREATE POLICY "Admin can view all acknowledgments"
  ON acknowledgments
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Employees can create their own acknowledgments
DROP POLICY IF EXISTS "Employees can create acknowledgments" ON acknowledgments;
CREATE POLICY "Employees can create acknowledgments"
  ON acknowledgments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_fleapo_email() AND
    user_id = auth.uid() AND
    user_email = auth.jwt() ->> 'email'
  );

-- Employees can view their own acknowledgments
DROP POLICY IF EXISTS "Employees can view own acknowledgments" ON acknowledgments;
CREATE POLICY "Employees can view own acknowledgments"
  ON acknowledgments
  FOR SELECT
  TO authenticated
  USING (
    is_fleapo_email() AND user_id = auth.uid()
  );

-- ===========================================
-- 5. CREATE STORAGE BUCKET
-- ===========================================

-- Create the documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies

-- Admin can upload files
DROP POLICY IF EXISTS "Admin can upload documents" ON storage.objects;
CREATE POLICY "Admin can upload documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (SELECT auth.jwt() ->> 'email' = 'hr@fleapo.com')
  );

-- Admin can delete files
DROP POLICY IF EXISTS "Admin can delete documents" ON storage.objects;
CREATE POLICY "Admin can delete documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (SELECT auth.jwt() ->> 'email' = 'hr@fleapo.com')
  );

-- Anyone authenticated from fleapo.com can view documents
DROP POLICY IF EXISTS "Fleapo employees can view documents" ON storage.objects;
CREATE POLICY "Fleapo employees can view documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (SELECT auth.jwt() ->> 'email' LIKE '%@fleapo.com')
  );
