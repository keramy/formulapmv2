-- Shop Drawings Mobile Integration System
-- Formula PM Wave 2C Implementation

-- Create status and role enums for shop drawings
CREATE TYPE drawing_status AS ENUM (
  'draft', 'submitted', 'under_review', 'approved', 'rejected', 'revision_required'
);

CREATE TYPE approval_role AS ENUM (
  'architect', 'project_manager', 'client'
);

CREATE TYPE approval_status AS ENUM (
  'pending', 'approved', 'rejected', 'revision_requested'
);

-- Main shop drawings table
CREATE TABLE shop_drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  drawing_number TEXT NOT NULL,
  drawing_title TEXT NOT NULL,
  drawing_category TEXT NOT NULL, -- 'structural', 'mechanical', 'electrical', 'plumbing', 'architectural'
  current_version TEXT NOT NULL DEFAULT '1.0',
  current_status drawing_status NOT NULL DEFAULT 'draft',
  pdf_file_path TEXT,
  pdf_file_size INTEGER,
  thumbnail_path TEXT, -- PDF thumbnail for mobile preview
  description TEXT,
  
  -- Assignment and scheduling
  created_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id), -- Field worker assignment
  submission_date TIMESTAMP WITH TIME ZONE,
  target_approval_date TIMESTAMP WITH TIME ZONE,
  actual_approval_date TIMESTAMP WITH TIME ZONE,
  
  -- Tracking fields
  total_pages INTEGER DEFAULT 1,
  file_format TEXT DEFAULT 'pdf',
  is_mobile_optimized BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT shop_drawings_project_number_unique UNIQUE (project_id, drawing_number),
  CONSTRAINT valid_drawing_category CHECK (drawing_category IN ('structural', 'mechanical', 'electrical', 'plumbing', 'architectural', 'general')),
  CONSTRAINT valid_file_size CHECK (pdf_file_size > 0)
);

-- Shop drawing versions for revision control
CREATE TABLE shop_drawing_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_drawing_id UUID NOT NULL REFERENCES shop_drawings(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  pdf_file_path TEXT NOT NULL,
  pdf_file_size INTEGER NOT NULL,
  thumbnail_path TEXT,
  revision_notes TEXT,
  is_current_version BOOLEAN DEFAULT false,
  
  -- Version metadata
  total_pages INTEGER DEFAULT 1,
  file_checksum TEXT, -- For integrity verification
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT shop_drawing_versions_unique UNIQUE (shop_drawing_id, version_number),
  CONSTRAINT valid_version_file_size CHECK (pdf_file_size > 0)
);

-- Shop drawing approvals workflow
CREATE TABLE shop_drawing_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_drawing_id UUID NOT NULL REFERENCES shop_drawings(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  approver_role approval_role NOT NULL,
  approver_user_id UUID NOT NULL REFERENCES auth.users(id),
  approval_status approval_status NOT NULL DEFAULT 'pending',
  approval_date TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  revision_requests TEXT,
  
  -- Digital signature data
  signature_data JSONB, -- Digital signature information
  signature_timestamp TIMESTAMP WITH TIME ZONE,
  signature_ip INET,
  
  -- Mobile context
  approved_from_mobile BOOLEAN DEFAULT false,
  device_info JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT shop_drawing_approvals_unique UNIQUE (shop_drawing_id, version_number, approver_role),
  CONSTRAINT approval_date_required CHECK (
    (approval_status = 'pending') OR 
    (approval_status != 'pending' AND approval_date IS NOT NULL)
  )
);

-- Progress photos linked to shop drawings
CREATE TABLE shop_drawing_progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_drawing_id UUID NOT NULL REFERENCES shop_drawings(id) ON DELETE CASCADE,
  photo_file_path TEXT NOT NULL,
  photo_file_size INTEGER NOT NULL,
  thumbnail_path TEXT,
  description TEXT,
  location_notes TEXT,
  
  -- Photo metadata
  taken_by UUID NOT NULL REFERENCES auth.users(id),
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  gps_coordinates POINT, -- Optional GPS location
  camera_info JSONB, -- Camera/device information
  
  -- Issue tracking
  is_issue_photo BOOLEAN DEFAULT false,
  issue_description TEXT,
  issue_severity TEXT, -- 'low', 'medium', 'high', 'critical'
  issue_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  
  -- Organization
  photo_sequence INTEGER DEFAULT 1, -- Order of photos for this drawing
  tags TEXT[], -- Searchable tags
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_photo_file_size CHECK (photo_file_size > 0),
  CONSTRAINT valid_issue_severity CHECK (
    issue_severity IS NULL OR 
    issue_severity IN ('low', 'medium', 'high', 'critical')
  ),
  CONSTRAINT issue_resolution_logic CHECK (
    (issue_resolved = false) OR 
    (issue_resolved = true AND resolved_at IS NOT NULL AND resolved_by IS NOT NULL)
  )
);

-- Shop drawing access logs for mobile tracking
CREATE TABLE shop_drawing_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_drawing_id UUID NOT NULL REFERENCES shop_drawings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  access_type TEXT NOT NULL, -- 'view', 'download', 'share'
  access_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Mobile context
  is_mobile_access BOOLEAN DEFAULT false,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  user_agent TEXT,
  ip_address INET,
  session_duration INTEGER, -- Duration in seconds
  
  -- Performance metrics
  load_time_ms INTEGER,
  bandwidth_used INTEGER, -- Bytes transferred
  
  CONSTRAINT valid_access_type CHECK (access_type IN ('view', 'download', 'share', 'print'))
);

-- Performance indexes
CREATE INDEX idx_shop_drawings_project_id ON shop_drawings(project_id);
CREATE INDEX idx_shop_drawings_project_status ON shop_drawings(project_id, current_status);
CREATE INDEX idx_shop_drawings_category ON shop_drawings(drawing_category);
CREATE INDEX idx_shop_drawings_assigned ON shop_drawings(assigned_to);
CREATE INDEX idx_shop_drawings_created_by ON shop_drawings(created_by);
CREATE INDEX idx_shop_drawings_submission_date ON shop_drawings(submission_date);
CREATE INDEX idx_shop_drawings_status_updated ON shop_drawings(current_status, updated_at);

CREATE INDEX idx_shop_drawing_versions_drawing ON shop_drawing_versions(shop_drawing_id);
CREATE INDEX idx_shop_drawing_versions_current ON shop_drawing_versions(shop_drawing_id, is_current_version);

CREATE INDEX idx_shop_drawing_approvals_drawing ON shop_drawing_approvals(shop_drawing_id);
CREATE INDEX idx_shop_drawing_approvals_user ON shop_drawing_approvals(approver_user_id);
CREATE INDEX idx_shop_drawing_approvals_status ON shop_drawing_approvals(approval_status);
CREATE INDEX idx_shop_drawing_approvals_role ON shop_drawing_approvals(approver_role, approval_status);

CREATE INDEX idx_progress_photos_drawing ON shop_drawing_progress_photos(shop_drawing_id);
CREATE INDEX idx_progress_photos_taken_by ON shop_drawing_progress_photos(taken_by);
CREATE INDEX idx_progress_photos_issues ON shop_drawing_progress_photos(is_issue_photo, issue_resolved);
CREATE INDEX idx_progress_photos_taken_at ON shop_drawing_progress_photos(taken_at);

CREATE INDEX idx_access_logs_drawing ON shop_drawing_access_logs(shop_drawing_id);
CREATE INDEX idx_access_logs_user ON shop_drawing_access_logs(user_id);
CREATE INDEX idx_access_logs_mobile ON shop_drawing_access_logs(is_mobile_access, access_timestamp);

-- Auto-update timestamps
CREATE TRIGGER update_shop_drawings_updated_at
  BEFORE UPDATE ON shop_drawings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update current version flag
CREATE OR REPLACE FUNCTION update_current_version_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark all other versions as not current
  UPDATE shop_drawing_versions 
  SET is_current_version = false 
  WHERE shop_drawing_id = NEW.shop_drawing_id 
  AND id != NEW.id;
  
  -- Mark the new version as current
  NEW.is_current_version = true;
  
  -- Update the main drawing record
  UPDATE shop_drawings 
  SET 
    current_version = NEW.version_number,
    pdf_file_path = NEW.pdf_file_path,
    pdf_file_size = NEW.pdf_file_size,
    thumbnail_path = NEW.thumbnail_path,
    total_pages = NEW.total_pages,
    updated_at = NOW()
  WHERE id = NEW.shop_drawing_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shop_drawing_version_update_trigger
  BEFORE INSERT ON shop_drawing_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_current_version_flag();

-- Trigger to update drawing status based on approvals
CREATE OR REPLACE FUNCTION update_drawing_status_from_approvals()
RETURNS TRIGGER AS $$
DECLARE
  required_approvals INTEGER;
  completed_approvals INTEGER;
  rejected_approvals INTEGER;
  pending_approvals INTEGER;
BEGIN
  -- Count required approvals for the current version
  SELECT COUNT(*) INTO required_approvals
  FROM shop_drawing_approvals
  WHERE shop_drawing_id = NEW.shop_drawing_id
  AND version_number = (
    SELECT current_version FROM shop_drawings WHERE id = NEW.shop_drawing_id
  );
  
  -- Count completed approvals
  SELECT COUNT(*) INTO completed_approvals
  FROM shop_drawing_approvals
  WHERE shop_drawing_id = NEW.shop_drawing_id
  AND version_number = (
    SELECT current_version FROM shop_drawings WHERE id = NEW.shop_drawing_id
  )
  AND approval_status = 'approved';
  
  -- Count rejections
  SELECT COUNT(*) INTO rejected_approvals
  FROM shop_drawing_approvals
  WHERE shop_drawing_id = NEW.shop_drawing_id
  AND version_number = (
    SELECT current_version FROM shop_drawings WHERE id = NEW.shop_drawing_id
  )
  AND approval_status = 'rejected';
  
  -- Count revision requests
  SELECT COUNT(*) INTO pending_approvals
  FROM shop_drawing_approvals
  WHERE shop_drawing_id = NEW.shop_drawing_id
  AND version_number = (
    SELECT current_version FROM shop_drawings WHERE id = NEW.shop_drawing_id
  )
  AND approval_status = 'revision_requested';
  
  -- Update drawing status based on approval states
  IF rejected_approvals > 0 THEN
    UPDATE shop_drawings 
    SET current_status = 'rejected', updated_at = NOW()
    WHERE id = NEW.shop_drawing_id;
  ELSIF pending_approvals > 0 THEN
    UPDATE shop_drawings 
    SET current_status = 'revision_required', updated_at = NOW()
    WHERE id = NEW.shop_drawing_id;
  ELSIF completed_approvals = required_approvals AND required_approvals > 0 THEN
    UPDATE shop_drawings 
    SET 
      current_status = 'approved', 
      actual_approval_date = NOW(),
      updated_at = NOW()
    WHERE id = NEW.shop_drawing_id;
  ELSIF completed_approvals > 0 THEN
    UPDATE shop_drawings 
    SET current_status = 'under_review', updated_at = NOW()
    WHERE id = NEW.shop_drawing_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER drawing_status_update_trigger
  AFTER INSERT OR UPDATE ON shop_drawing_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_drawing_status_from_approvals();

-- Notification trigger for shop drawing status changes
CREATE OR REPLACE FUNCTION notify_shop_drawing_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification when drawing status changes
  INSERT INTO notifications (user_id, type, title, message, metadata, created_at)
  SELECT 
    pa.user_id,
    'shop_drawing',
    'Shop Drawing Status Updated',
    format('Drawing "%s - %s" status changed to %s', 
           NEW.drawing_number, NEW.drawing_title, NEW.current_status),
    jsonb_build_object(
      'drawing_id', NEW.id,
      'drawing_number', NEW.drawing_number,
      'old_status', OLD.current_status,
      'new_status', NEW.current_status,
      'project_id', NEW.project_id
    ),
    NOW()
  FROM project_assignments pa
  WHERE pa.project_id = NEW.project_id;
  
  -- Special notification for assigned field worker
  IF NEW.assigned_to IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, metadata, created_at)
    VALUES (
      NEW.assigned_to,
      'shop_drawing_assignment',
      'Shop Drawing Assignment Updated',
      format('Drawing "%s - %s" assigned to you is now %s', 
             NEW.drawing_number, NEW.drawing_title, NEW.current_status),
      jsonb_build_object(
        'drawing_id', NEW.id,
        'drawing_number', NEW.drawing_number,
        'status', NEW.current_status,
        'project_id', NEW.project_id
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shop_drawing_status_change_trigger
  AFTER UPDATE ON shop_drawings
  FOR EACH ROW
  WHEN (OLD.current_status != NEW.current_status)
  EXECUTE FUNCTION notify_shop_drawing_status_change();

-- Row Level Security Policies

-- Shop drawings RLS
ALTER TABLE shop_drawings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_drawings_access" ON shop_drawings
  FOR ALL TO authenticated
  USING (
    -- Project team members can access
    EXISTS (
      SELECT 1 FROM project_assignments pa
      WHERE pa.project_id = shop_drawings.project_id
      AND pa.user_id = auth.uid()
    )
  );

-- Shop drawing versions RLS
ALTER TABLE shop_drawing_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_drawing_versions_access" ON shop_drawing_versions
  FOR ALL TO authenticated
  USING (
    -- Project team members can access
    EXISTS (
      SELECT 1 FROM project_assignments pa
      JOIN shop_drawings sd ON sd.project_id = pa.project_id
      WHERE sd.id = shop_drawing_versions.shop_drawing_id
      AND pa.user_id = auth.uid()
    )
  );

-- Shop drawing approvals RLS
ALTER TABLE shop_drawing_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_drawing_approvals_access" ON shop_drawing_approvals
  FOR ALL TO authenticated
  USING (
    -- Project team members can view
    EXISTS (
      SELECT 1 FROM project_assignments pa
      JOIN shop_drawings sd ON sd.project_id = pa.project_id
      WHERE sd.id = shop_drawing_approvals.shop_drawing_id
      AND pa.user_id = auth.uid()
    )
    OR
    -- Assigned approvers can access
    approver_user_id = auth.uid()
  );

-- Progress photos RLS
ALTER TABLE shop_drawing_progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progress_photos_access" ON shop_drawing_progress_photos
  FOR ALL TO authenticated
  USING (
    -- Project team members can access
    EXISTS (
      SELECT 1 FROM project_assignments pa
      JOIN shop_drawings sd ON sd.project_id = pa.project_id
      WHERE sd.id = shop_drawing_progress_photos.shop_drawing_id
      AND pa.user_id = auth.uid()
    )
  );

-- Access logs RLS
ALTER TABLE shop_drawing_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_logs_access" ON shop_drawing_access_logs
  FOR ALL TO authenticated
  USING (
    -- Users can view their own access logs
    user_id = auth.uid()
    OR
    -- Project managers can view all access logs for their projects
    EXISTS (
      SELECT 1 FROM project_assignments pa
      JOIN shop_drawings sd ON sd.project_id = pa.project_id
      WHERE sd.id = shop_drawing_access_logs.shop_drawing_id
      AND pa.user_id = auth.uid()
      AND pa.role IN ('project_manager', 'general_manager', 'company_owner')
    )
  );

-- Insert sample data for demonstration
INSERT INTO shop_drawings (
  project_id, drawing_number, drawing_title, drawing_category, 
  current_version, current_status, created_by, description
) 
SELECT 
  p.id, 
  'SD-001', 
  'Foundation Details - Section A',
  'structural',
  '1.0',
  'draft',
  (SELECT user_id FROM user_profiles WHERE role = 'architect' LIMIT 1),
  'Foundation structural details for building section A'
FROM projects p 
LIMIT 1;

INSERT INTO shop_drawings (
  project_id, drawing_number, drawing_title, drawing_category, 
  current_version, current_status, created_by, description
) 
SELECT 
  p.id, 
  'SD-002', 
  'HVAC Layout - Floor 1',
  'mechanical',
  '1.0',
  'submitted',
  (SELECT user_id FROM user_profiles WHERE role = 'architect' LIMIT 1),
  'HVAC system layout for first floor'
FROM projects p 
LIMIT 1;

-- Comments
COMMENT ON TABLE shop_drawings IS 'Main shop drawings table with mobile optimization';
COMMENT ON TABLE shop_drawing_versions IS 'Version control for shop drawings';
COMMENT ON TABLE shop_drawing_approvals IS 'Approval workflow for shop drawings';
COMMENT ON TABLE shop_drawing_progress_photos IS 'Progress photos linked to shop drawings';
COMMENT ON TABLE shop_drawing_access_logs IS 'Mobile access tracking for analytics';

COMMENT ON COLUMN shop_drawings.drawing_category IS 'Categories: structural, mechanical, electrical, plumbing, architectural, general';
COMMENT ON COLUMN shop_drawings.is_mobile_optimized IS 'Flag indicating if PDF is optimized for mobile viewing';
COMMENT ON COLUMN shop_drawing_approvals.signature_data IS 'JSONB containing digital signature information';
COMMENT ON COLUMN shop_drawing_progress_photos.issue_severity IS 'Issue severity: low, medium, high, critical';