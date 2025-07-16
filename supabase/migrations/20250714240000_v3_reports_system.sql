-- ============================================================================
-- V3 Report Creation System Migration
-- ============================================================================
-- Creates the complete V3 reports system with:
-- - reports: Main report records
-- - report_lines: Line items within reports  
-- - report_line_photos: Photos for each report line
-- - report_shares: Sharing/notification records
-- ============================================================================

-- Drop existing report-related tables if they exist (clean slate)
DROP TABLE IF EXISTS report_shares CASCADE;
DROP TABLE IF EXISTS report_line_photos CASCADE;
DROP TABLE IF EXISTS report_lines CASCADE;
DROP TABLE IF EXISTS reports CASCADE;

-- Drop existing report enums if they exist
DROP TYPE IF EXISTS report_type CASCADE;
DROP TYPE IF EXISTS report_status CASCADE;

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Report types for different kinds of reports
CREATE TYPE report_type AS ENUM (
  'daily',
  'weekly', 
  'monthly',
  'safety',
  'financial',
  'progress',
  'quality',
  'inspection',
  'custom'
);

-- Report status for workflow management
CREATE TYPE report_status AS ENUM (
  'draft',
  'pending_review',
  'published'
);

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- Reports table - Main report records
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type report_type NOT NULL DEFAULT 'custom',
  status report_status NOT NULL DEFAULT 'draft',
  generated_by UUID NOT NULL REFERENCES user_profiles(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ NULL,
  pdf_url TEXT NULL,
  summary TEXT NULL,
  report_period TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Report lines table - Line items within each report
CREATE TABLE report_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure line_number is unique within each report
  UNIQUE(report_id, line_number)
);

-- Report line photos table - Photos associated with each report line
CREATE TABLE report_line_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_line_id UUID NOT NULL REFERENCES report_lines(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Report shares table - Records who a report was shared with
CREATE TABLE report_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  shared_with_user_id UUID NULL REFERENCES user_profiles(id),
  shared_with_client_id UUID NULL, -- References client table when implemented
  shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure at least one recipient is specified
  CHECK (shared_with_user_id IS NOT NULL OR shared_with_client_id IS NOT NULL)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Reports indexes
CREATE INDEX idx_reports_project_id ON reports(project_id);
CREATE INDEX idx_reports_generated_by ON reports(generated_by);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- Report lines indexes
CREATE INDEX idx_report_lines_report_id ON report_lines(report_id);
CREATE INDEX idx_report_lines_line_number ON report_lines(report_id, line_number);

-- Report line photos indexes
CREATE INDEX idx_report_line_photos_line_id ON report_line_photos(report_line_id);

-- Report shares indexes
CREATE INDEX idx_report_shares_report_id ON report_shares(report_id);
CREATE INDEX idx_report_shares_user_id ON report_shares(shared_with_user_id);
CREATE INDEX idx_report_shares_client_id ON report_shares(shared_with_client_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_line_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- REPORTS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view reports for projects they have access to
CREATE POLICY "reports_select_policy" ON reports
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = reports.project_id 
    AND (
      p.project_manager_id = auth.uid() OR
      auth.uid() IN (
        SELECT up.id FROM user_profiles up 
        WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
      )
    )
  )
);

-- Policy: Project managers, architects, and technical engineers can create reports
CREATE POLICY "reports_insert_policy" ON reports
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role IN ('project_manager', 'architect', 'technical_engineer', 'field_worker')
  )
  AND EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = reports.project_id 
    AND p.project_manager_id = auth.uid()
  )
);

-- Policy: Report creators and project managers can update their reports
CREATE POLICY "reports_update_policy" ON reports
FOR UPDATE USING (
  generated_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = reports.project_id 
    AND p.project_manager_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
  )
);

-- Policy: Project managers and report creators can delete reports
CREATE POLICY "reports_delete_policy" ON reports
FOR DELETE USING (
  generated_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = reports.project_id 
    AND p.project_manager_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() 
    AND up.role IN ('company_owner', 'general_manager', 'technical_director', 'admin')
  )
);

-- ============================================================================
-- REPORT LINES TABLE POLICIES
-- ============================================================================

-- Policy: Users can view report lines if they can view the parent report
CREATE POLICY "report_lines_select_policy" ON report_lines
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM reports r
    JOIN projects p ON p.id = r.project_id 
    WHERE r.id = report_lines.report_id 
    AND (
      p.project_manager_id = auth.uid() OR
      r.generated_by = auth.uid() OR
      auth.uid() IN (
        SELECT up.id FROM user_profiles up 
        WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
      )
    )
  )
);

-- Policy: Users can create report lines if they can update the parent report
CREATE POLICY "report_lines_insert_policy" ON report_lines
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM reports r
    JOIN projects p ON p.id = r.project_id 
    WHERE r.id = report_lines.report_id 
    AND (
      r.generated_by = auth.uid() OR
      p.project_manager_id = auth.uid() OR
      auth.uid() IN (
        SELECT up.id FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role IN ('project_manager', 'architect', 'technical_engineer', 'field_worker')
      )
    )
  )
);

-- Policy: Users can update report lines if they can update the parent report
CREATE POLICY "report_lines_update_policy" ON report_lines
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM reports r
    JOIN projects p ON p.id = r.project_id 
    WHERE r.id = report_lines.report_id 
    AND (
      r.generated_by = auth.uid() OR
      p.project_manager_id = auth.uid() OR
      auth.uid() IN (
        SELECT up.id FROM user_profiles up 
        WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
      )
    )
  )
);

-- Policy: Users can delete report lines if they can update the parent report
CREATE POLICY "report_lines_delete_policy" ON report_lines
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM reports r
    JOIN projects p ON p.id = r.project_id 
    WHERE r.id = report_lines.report_id 
    AND (
      r.generated_by = auth.uid() OR
      p.project_manager_id = auth.uid() OR
      auth.uid() IN (
        SELECT up.id FROM user_profiles up 
        WHERE up.role IN ('company_owner', 'general_manager', 'technical_director', 'admin')
      )
    )
  )
);

-- ============================================================================
-- REPORT LINE PHOTOS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view photos if they can view the parent report line
CREATE POLICY "report_line_photos_select_policy" ON report_line_photos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM report_lines rl
    JOIN reports r ON r.id = rl.report_id
    JOIN projects p ON p.id = r.project_id 
    WHERE rl.id = report_line_photos.report_line_id 
    AND (
      p.project_manager_id = auth.uid() OR
      r.generated_by = auth.uid() OR
      auth.uid() IN (
        SELECT up.id FROM user_profiles up 
        WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
      )
    )
  )
);

-- Policy: Users can upload photos if they can update the parent report
CREATE POLICY "report_line_photos_insert_policy" ON report_line_photos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM report_lines rl
    JOIN reports r ON r.id = rl.report_id
    JOIN projects p ON p.id = r.project_id 
    WHERE rl.id = report_line_photos.report_line_id 
    AND (
      r.generated_by = auth.uid() OR
      p.project_manager_id = auth.uid() OR
      auth.uid() IN (
        SELECT up.id FROM user_profiles up 
        WHERE up.id = auth.uid() 
        AND up.role IN ('project_manager', 'architect', 'technical_engineer', 'field_worker')
      )
    )
  )
);

-- Policy: Users can update photos if they can update the parent report
CREATE POLICY "report_line_photos_update_policy" ON report_line_photos
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM report_lines rl
    JOIN reports r ON r.id = rl.report_id
    JOIN projects p ON p.id = r.project_id 
    WHERE rl.id = report_line_photos.report_line_id 
    AND (
      r.generated_by = auth.uid() OR
      p.project_manager_id = auth.uid() OR
      auth.uid() IN (
        SELECT up.id FROM user_profiles up 
        WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
      )
    )
  )
);

-- Policy: Users can delete photos if they can update the parent report
CREATE POLICY "report_line_photos_delete_policy" ON report_line_photos
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM report_lines rl
    JOIN reports r ON r.id = rl.report_id
    JOIN projects p ON p.id = r.project_id 
    WHERE rl.id = report_line_photos.report_line_id 
    AND (
      r.generated_by = auth.uid() OR
      p.project_manager_id = auth.uid() OR
      auth.uid() IN (
        SELECT up.id FROM user_profiles up 
        WHERE up.role IN ('company_owner', 'general_manager', 'technical_director', 'admin')
      )
    )
  )
);

-- ============================================================================
-- REPORT SHARES TABLE POLICIES
-- ============================================================================

-- Policy: Users can view shares for reports they have access to
CREATE POLICY "report_shares_select_policy" ON report_shares
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM reports r
    JOIN projects p ON p.id = r.project_id 
    WHERE r.id = report_shares.report_id 
    AND (
      p.project_manager_id = auth.uid() OR
      r.generated_by = auth.uid() OR
      report_shares.shared_with_user_id = auth.uid() OR
      auth.uid() IN (
        SELECT up.id FROM user_profiles up 
        WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
      )
    )
  )
);

-- Policy: Report creators and project managers can create shares
CREATE POLICY "report_shares_insert_policy" ON report_shares
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM reports r
    JOIN projects p ON p.id = r.project_id 
    WHERE r.id = report_shares.report_id 
    AND (
      r.generated_by = auth.uid() OR
      p.project_manager_id = auth.uid() OR
      auth.uid() IN (
        SELECT up.id FROM user_profiles up 
        WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'project_manager')
      )
    )
  )
);

-- Policy: Report creators and project managers can delete shares
CREATE POLICY "report_shares_delete_policy" ON report_shares
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM reports r
    JOIN projects p ON p.id = r.project_id 
    WHERE r.id = report_shares.report_id 
    AND (
      r.generated_by = auth.uid() OR
      p.project_manager_id = auth.uid() OR
      auth.uid() IN (
        SELECT up.id FROM user_profiles up 
        WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'project_manager', 'admin')
      )
    )
  )
);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at timestamps
CREATE TRIGGER update_reports_updated_at 
  BEFORE UPDATE ON reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_lines_updated_at 
  BEFORE UPDATE ON report_lines 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Create storage bucket for report photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-photos', 'report-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for generated PDFs if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-pdfs', 'report-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Policy: Users can view report photos if they have access to the project
CREATE POLICY "report_photos_select_policy" ON storage.objects
FOR SELECT USING (
  bucket_id = 'report-photos' AND
  EXISTS (
    SELECT 1 FROM report_line_photos rlp
    JOIN report_lines rl ON rl.id = rlp.report_line_id
    JOIN reports r ON r.id = rl.report_id
    JOIN projects p ON p.id = r.project_id 
    WHERE rlp.photo_url LIKE '%' || storage.objects.name || '%'
    AND (
      p.project_manager_id = auth.uid() OR
      r.generated_by = auth.uid() OR
      auth.uid() IN (
        SELECT up.id FROM user_profiles up 
        WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
      )
    )
  )
);

-- Policy: Users can upload report photos if they can create report lines
CREATE POLICY "report_photos_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'report-photos' AND
  auth.uid() IN (
    SELECT up.id FROM user_profiles up 
    WHERE up.role IN ('project_manager', 'architect', 'technical_engineer', 'field_worker')
  )
);

-- Policy: Users can view report PDFs if they have access to the project
CREATE POLICY "report_pdfs_select_policy" ON storage.objects
FOR SELECT USING (
  bucket_id = 'report-pdfs' AND
  EXISTS (
    SELECT 1 FROM reports r
    JOIN projects p ON p.id = r.project_id 
    WHERE r.pdf_url LIKE '%' || storage.objects.name || '%'
    AND (
      p.project_manager_id = auth.uid() OR
      r.generated_by = auth.uid() OR
      auth.uid() IN (
        SELECT up.id FROM user_profiles up 
        WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
      )
    )
  )
);

-- Policy: System can insert report PDFs (for PDF generation)
CREATE POLICY "report_pdfs_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'report-pdfs' AND
  auth.uid() IN (
    SELECT up.id FROM user_profiles up 
    WHERE up.role IN ('project_manager', 'architect', 'technical_engineer', 'field_worker')
  )
);

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample report types and data will be handled by the application
-- The migration creates the structure, sample data can be added via API

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'V3 Reports System migration completed successfully! 
Tables created: reports, report_lines, report_line_photos, report_shares
Storage buckets: report-photos, report-pdfs  
RLS policies: Applied for all tables and storage
Ready for API implementation!' as result;