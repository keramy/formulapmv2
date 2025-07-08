-- Simple Subcontractor Access System
-- Migration: 20250704000001_simple_subcontractor_access.sql
-- 
-- This migration creates minimal database schema for subcontractor access
-- focusing only on site reports and PDF access functionality.

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Report status enum
CREATE TYPE report_status AS ENUM ('submitted', 'reviewed', 'approved');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Subcontractor users table
CREATE TABLE subcontractor_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID NOT NULL REFERENCES user_profiles(user_id),
  
  -- Basic Information
  company_name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100) NOT NULL,
  
  -- Access Control
  is_active BOOLEAN DEFAULT true,
  
  -- Authentication
  last_login TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  account_locked BOOLEAN DEFAULT false,
  
  -- Tracking
  created_by UUID NOT NULL REFERENCES user_profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subcontractor reports table
CREATE TABLE subcontractor_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID NOT NULL REFERENCES subcontractor_users(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  
  -- Report Content
  report_date DATE NOT NULL,
  description TEXT NOT NULL,
  photos TEXT[], -- Array of photo URLs
  
  -- Status
  status report_status NOT NULL DEFAULT 'submitted',
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subcontractor scope access table
CREATE TABLE subcontractor_scope_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID NOT NULL REFERENCES subcontractor_users(id),
  scope_item_id UUID NOT NULL REFERENCES scope_items(id),
  document_id UUID NOT NULL REFERENCES documents(id),
  
  -- Access Control
  can_download BOOLEAN DEFAULT true,
  
  -- Tracking
  granted_by UUID NOT NULL REFERENCES user_profiles(user_id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(subcontractor_id, document_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Performance indexes
CREATE INDEX idx_subcontractor_users_active ON subcontractor_users(is_active);
CREATE INDEX idx_subcontractor_users_email ON subcontractor_users(email);
CREATE INDEX idx_subcontractor_reports_project ON subcontractor_reports(project_id, report_date);
CREATE INDEX idx_subcontractor_reports_subcontractor ON subcontractor_reports(subcontractor_id);
CREATE INDEX idx_subcontractor_scope_access_subcontractor ON subcontractor_scope_access(subcontractor_id);
CREATE INDEX idx_subcontractor_scope_access_document ON subcontractor_scope_access(document_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE subcontractor_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_scope_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subcontractor_users
CREATE POLICY "Subcontractors can view own profile"
  ON subcontractor_users FOR SELECT
  USING (user_profile_id = auth.uid());

CREATE POLICY "Internal users can view subcontractor profiles"
  ON subcontractor_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'project_manager', 'technical_director')
    )
  );

CREATE POLICY "Admins can insert subcontractor profiles"
  ON subcontractor_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'project_manager', 'technical_director')
    )
  );

CREATE POLICY "Admins can update subcontractor profiles"
  ON subcontractor_users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'project_manager', 'technical_director')
    )
  );

-- RLS Policies for subcontractor_reports
CREATE POLICY "Subcontractors can view own reports"
  ON subcontractor_reports FOR SELECT
  USING (
    subcontractor_id IN (
      SELECT id FROM subcontractor_users 
      WHERE user_profile_id = auth.uid()
    )
  );

CREATE POLICY "Project managers can view project reports"
  ON subcontractor_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'project_manager', 'technical_director')
    )
  );

CREATE POLICY "Subcontractors can insert own reports"
  ON subcontractor_reports FOR INSERT
  WITH CHECK (
    subcontractor_id IN (
      SELECT id FROM subcontractor_users 
      WHERE user_profile_id = auth.uid()
    )
  );

-- RLS Policies for subcontractor_scope_access
CREATE POLICY "Subcontractors can view assigned documents"
  ON subcontractor_scope_access FOR SELECT
  USING (
    subcontractor_id IN (
      SELECT id FROM subcontractor_users 
      WHERE user_profile_id = auth.uid()
    )
  );

CREATE POLICY "Project managers can manage scope access"
  ON subcontractor_scope_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'project_manager', 'technical_director')
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_subcontractor_users_updated_at
  BEFORE UPDATE ON subcontractor_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcontractor_reports_updated_at
  BEFORE UPDATE ON subcontractor_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE subcontractor_users IS 'Minimal subcontractor user profiles for external access';
COMMENT ON TABLE subcontractor_reports IS 'Simple site reports submitted by subcontractors';
COMMENT ON TABLE subcontractor_scope_access IS 'Document access permissions for subcontractors';

COMMENT ON COLUMN subcontractor_users.company_name IS 'Subcontractor company name';
COMMENT ON COLUMN subcontractor_users.contact_person IS 'Primary contact person';
COMMENT ON COLUMN subcontractor_users.is_active IS 'Whether the subcontractor account is active';

COMMENT ON COLUMN subcontractor_reports.report_date IS 'Date of the site report';
COMMENT ON COLUMN subcontractor_reports.description IS 'Report description and notes';
COMMENT ON COLUMN subcontractor_reports.photos IS 'Array of photo URLs attached to the report';

COMMENT ON COLUMN subcontractor_scope_access.can_download IS 'Whether the subcontractor can download the document';
COMMENT ON COLUMN subcontractor_scope_access.last_accessed IS 'Last time the document was accessed';

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- This will be populated by the application, not in migration
-- Sample data is provided for reference only

/*
-- Example subcontractor user (requires existing user_profile)
INSERT INTO subcontractor_users (
  user_profile_id,
  company_name,
  contact_person,
  phone,
  email,
  created_by
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with actual user_profile_id
  'ABC Construction',
  'John Doe',
  '+1-555-0123',
  'john@abcconstruction.com',
  '00000000-0000-0000-0000-000000000000'  -- Replace with actual admin user_id
);
*/