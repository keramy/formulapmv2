-- =====================================================
-- Simplify Report System for Construction Photo Reports
-- Remove complex financial features, focus on PM photo documentation
-- =====================================================

-- Drop the complex tables we don't need
DROP TABLE IF EXISTS report_summary_lines;
DROP TABLE IF EXISTS report_summaries;

-- Simplify report_lines to core construction reporting needs
-- Drop generated column first, then its dependencies
ALTER TABLE report_lines 
  DROP COLUMN IF EXISTS total_amount,
  DROP COLUMN IF EXISTS unit,
  DROP COLUMN IF EXISTS quantity,
  DROP COLUMN IF EXISTS unit_price,
  DROP COLUMN IF EXISTS approved_by,
  DROP COLUMN IF EXISTS approved_at;

-- Rename to be clearer for construction reports
ALTER TABLE report_lines RENAME TO construction_report_lines;
ALTER TABLE report_line_photos RENAME TO construction_report_photos;

-- Update report_line_photos to reference the renamed table
ALTER TABLE construction_report_photos 
  DROP CONSTRAINT report_line_photos_report_line_id_fkey,
  ADD CONSTRAINT construction_report_photos_report_line_id_fkey 
    FOREIGN KEY (report_line_id) REFERENCES construction_report_lines(id) ON DELETE CASCADE;

-- Create simplified reports table (main report container)
CREATE TABLE IF NOT EXISTS construction_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  visibility VARCHAR(50) NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal', 'client')),
  pdf_path TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Drop old RLS policies first (they reference columns we need to drop)
DROP POLICY IF EXISTS "report_lines_unified_access" ON construction_report_lines;
DROP POLICY IF EXISTS "report_line_photos_unified_access" ON construction_report_photos;

-- Update construction_report_lines to reference the new reports table
ALTER TABLE construction_report_lines 
  DROP COLUMN IF EXISTS project_id,
  DROP COLUMN IF EXISTS scope_item_id,
  ADD COLUMN report_id UUID REFERENCES construction_reports(id) ON DELETE CASCADE;

-- Add annotations support to photos
ALTER TABLE construction_report_photos 
  ADD COLUMN IF NOT EXISTS annotations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

-- Update indexes to match new structure
DROP INDEX IF EXISTS idx_report_lines_project_id;
DROP INDEX IF EXISTS idx_report_lines_scope_item_id;
DROP INDEX IF EXISTS idx_report_lines_project_status;
DROP INDEX IF EXISTS idx_report_lines_project_line_number;

-- New optimized indexes for construction reports
CREATE INDEX IF NOT EXISTS idx_construction_reports_project_id ON construction_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_construction_reports_created_by ON construction_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_construction_reports_status ON construction_reports(status);
CREATE INDEX IF NOT EXISTS idx_construction_reports_visibility ON construction_reports(visibility);

CREATE INDEX IF NOT EXISTS idx_construction_report_lines_report_id ON construction_report_lines(report_id);
CREATE INDEX IF NOT EXISTS idx_construction_report_lines_line_number ON construction_report_lines(report_id, line_number);

CREATE INDEX IF NOT EXISTS idx_construction_report_photos_report_line_id ON construction_report_photos(report_line_id);
CREATE INDEX IF NOT EXISTS idx_construction_report_photos_uploaded_by ON construction_report_photos(uploaded_by);

-- =====================================================
-- Update RLS Policies for Simplified Structure
-- =====================================================

-- Enable RLS on new table
ALTER TABLE construction_reports ENABLE ROW LEVEL SECURITY;

-- Construction Reports RLS Policy (Single Unified Policy)
CREATE POLICY "construction_reports_unified_access" ON construction_reports
FOR ALL USING (
  project_id IN (
    SELECT p.id FROM projects p
    LEFT JOIN project_assignments pa ON p.id = pa.project_id AND pa.is_active = true
    WHERE p.project_manager_id = (SELECT auth.uid())
       OR p.client_id = (SELECT auth.uid())
       OR (pa.user_id = (SELECT auth.uid()) AND pa.is_active = true)
       OR EXISTS (
         SELECT 1 FROM user_profiles up 
         WHERE up.id = (SELECT auth.uid()) 
         AND up.role IN ('admin', 'management')
       )
  )
);

-- Create new RLS policies for updated table structure

CREATE POLICY "construction_report_lines_unified_access" ON construction_report_lines
FOR ALL USING (
  report_id IN (
    SELECT cr.id FROM construction_reports cr
    JOIN projects p ON cr.project_id = p.id
    LEFT JOIN project_assignments pa ON p.id = pa.project_id AND pa.is_active = true
    WHERE p.project_manager_id = (SELECT auth.uid())
       OR p.client_id = (SELECT auth.uid())
       OR (pa.user_id = (SELECT auth.uid()) AND pa.is_active = true)
       OR EXISTS (
         SELECT 1 FROM user_profiles up 
         WHERE up.id = (SELECT auth.uid()) 
         AND up.role IN ('admin', 'management')
       )
  )
);

CREATE POLICY "construction_report_photos_unified_access" ON construction_report_photos
FOR ALL USING (
  report_line_id IN (
    SELECT crl.id FROM construction_report_lines crl
    JOIN construction_reports cr ON crl.report_id = cr.id
    JOIN projects p ON cr.project_id = p.id
    LEFT JOIN project_assignments pa ON p.id = pa.project_id AND pa.is_active = true
    WHERE p.project_manager_id = (SELECT auth.uid())
       OR p.client_id = (SELECT auth.uid())
       OR (pa.user_id = (SELECT auth.uid()) AND pa.is_active = true)
       OR EXISTS (
         SELECT 1 FROM user_profiles up 
         WHERE up.id = (SELECT auth.uid()) 
         AND up.role IN ('admin', 'management')
       )
  )
);

-- =====================================================
-- Update Triggers for New Structure
-- =====================================================

-- Construction Reports updated_at trigger
CREATE OR REPLACE FUNCTION update_construction_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

CREATE TRIGGER update_construction_reports_updated_at_trigger
  BEFORE UPDATE ON construction_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_construction_reports_updated_at();

-- Update existing trigger names
DROP TRIGGER IF EXISTS update_report_lines_updated_at_trigger ON construction_report_lines;
DROP FUNCTION IF EXISTS update_report_lines_updated_at();

CREATE OR REPLACE FUNCTION update_construction_report_lines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

CREATE TRIGGER update_construction_report_lines_updated_at_trigger
  BEFORE UPDATE ON construction_report_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_construction_report_lines_updated_at();

-- =====================================================
-- Verification and Summary
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'CONSTRUCTION PHOTO REPORT SYSTEM - SIMPLIFIED';
  RAISE NOTICE '===============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'SIMPLIFIED TABLES:';
  RAISE NOTICE '  - construction_reports (main report container)';
  RAISE NOTICE '  - construction_report_lines (sequential report sections)';
  RAISE NOTICE '  - construction_report_photos (photos with annotations)';
  RAISE NOTICE '';
  RAISE NOTICE 'REMOVED COMPLEXITY:';
  RAISE NOTICE '  - Removed financial fields (unit, quantity, unit_price)';
  RAISE NOTICE '  - Removed report_summaries and report_summary_lines';
  RAISE NOTICE '  - Simplified to draft/published status only';
  RAISE NOTICE '';
  RAISE NOTICE 'NEW FEATURES:';
  RAISE NOTICE '  - Photo annotations support (JSONB)';
  RAISE NOTICE '  - Team collaboration (multiple users per report)';
  RAISE NOTICE '  - Client/internal visibility control';
  RAISE NOTICE '  - PDF generation path storage';
  RAISE NOTICE '';
  RAISE NOTICE 'CONSTRUCTION REPORT SYSTEM: READY FOR PM WORKFLOW';
END $$;