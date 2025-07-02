-- Formula PM 2.0 Shop Drawings and Mobile Features
-- Created: 2025-07-02
-- Purpose: Dedicated shop drawing management and mobile-optimized features

-- ============================================================================
-- SHOP DRAWING ENUMS
-- ============================================================================

-- Shop drawing status
CREATE TYPE shop_drawing_status AS ENUM (
  'draft',
  'internal_review',
  'internal_approved',
  'submitted_to_client',
  'client_review',
  'approved',
  'approved_with_comments',
  'rejected',
  'revision_required',
  'superseded'
);

-- Drawing discipline types
CREATE TYPE drawing_discipline AS ENUM (
  'architectural',
  'structural',
  'mechanical',
  'electrical',
  'plumbing',
  'millwork',
  'landscape',
  'interior_design',
  'other'
);

-- Comment/markup types
CREATE TYPE comment_type AS ENUM (
  'general',
  'dimension',
  'material',
  'specification',
  'code_compliance',
  'coordination',
  'revision_required',
  'clarification'
);

-- Mobile sync status
CREATE TYPE sync_status AS ENUM (
  'pending',
  'syncing',
  'synced',
  'conflict',
  'failed'
);

-- ============================================================================
-- SHOP DRAWING TABLES
-- ============================================================================

-- Shop drawings table
CREATE TABLE shop_drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  scope_item_id UUID REFERENCES scope_items(id),
  drawing_number TEXT NOT NULL,
  title TEXT NOT NULL,
  discipline drawing_discipline NOT NULL,
  description TEXT,
  revision TEXT DEFAULT 'A',
  status shop_drawing_status DEFAULT 'draft',
  scale TEXT,
  size TEXT, -- A1, A2, A3, etc.
  original_file_path TEXT,
  current_file_path TEXT,
  file_size INTEGER,
  thumbnail_path TEXT,
  created_by UUID REFERENCES user_profiles(id),
  assigned_architect UUID REFERENCES user_profiles(id),
  internal_approved_by UUID REFERENCES user_profiles(id),
  internal_approved_at TIMESTAMPTZ,
  submitted_to_client_at TIMESTAMPTZ,
  client_approved_by UUID REFERENCES user_profiles(id),
  client_approved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, drawing_number, revision)
);

-- Shop drawing revisions history
CREATE TABLE shop_drawing_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_drawing_id UUID REFERENCES shop_drawings(id) ON DELETE CASCADE,
  revision TEXT NOT NULL,
  reason TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  changes_summary TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shop drawing comments/markups
CREATE TABLE shop_drawing_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_drawing_id UUID REFERENCES shop_drawings(id) ON DELETE CASCADE,
  comment_type comment_type NOT NULL,
  comment TEXT NOT NULL,
  x_coordinate DECIMAL(6,2), -- For positioned comments
  y_coordinate DECIMAL(6,2), -- For positioned comments
  page_number INTEGER DEFAULT 1,
  markup_data JSONB, -- For storing drawing markup data
  attachments JSONB DEFAULT '[]',
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES user_profiles(id),
  resolved_at TIMESTAMPTZ,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shop drawing approval workflow
CREATE TABLE shop_drawing_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_drawing_id UUID REFERENCES shop_drawings(id) ON DELETE CASCADE,
  approval_level TEXT NOT NULL, -- 'architect', 'technical_director', 'project_manager', 'client'
  approver_id UUID REFERENCES user_profiles(id),
  status TEXT NOT NULL, -- 'pending', 'approved', 'rejected', 'approved_with_comments'
  comments TEXT,
  conditions TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drawing sets/packages
CREATE TABLE drawing_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  set_name TEXT NOT NULL,
  description TEXT,
  purpose TEXT, -- 'client_submission', 'internal_review', 'construction', 'as_built'
  drawing_ids UUID[] DEFAULT '{}',
  is_locked BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MOBILE OPTIMIZATION TABLES
-- ============================================================================

-- Mobile device registration
CREATE TABLE mobile_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  device_id TEXT UNIQUE NOT NULL,
  device_type TEXT NOT NULL, -- 'ios', 'android'
  device_model TEXT,
  app_version TEXT,
  push_token TEXT,
  last_sync_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offline queue for mobile actions
CREATE TABLE mobile_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT REFERENCES mobile_devices(device_id),
  user_id UUID REFERENCES user_profiles(id),
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'upload'
  entity_type TEXT NOT NULL, -- 'report', 'photo', 'task_update', etc.
  entity_id UUID,
  payload JSONB NOT NULL,
  sync_status sync_status DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

-- Mobile-optimized photo uploads
CREATE TABLE field_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  scope_item_id UUID REFERENCES scope_items(id),
  field_report_id UUID REFERENCES field_reports(id),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_accuracy DECIMAL(6,2),
  device_id TEXT REFERENCES mobile_devices(device_id),
  tags TEXT[] DEFAULT '{}',
  is_annotated BOOLEAN DEFAULT false,
  annotation_data JSONB,
  uploaded_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quick mobile forms/checklists
CREATE TABLE mobile_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type TEXT NOT NULL, -- 'safety_checklist', 'quality_inspection', 'daily_report'
  template_name TEXT NOT NULL,
  fields JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mobile form submissions
CREATE TABLE mobile_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES mobile_forms(id),
  project_id UUID REFERENCES projects(id),
  scope_item_id UUID REFERENCES scope_items(id),
  submitted_by UUID REFERENCES user_profiles(id),
  device_id TEXT REFERENCES mobile_devices(device_id),
  form_data JSONB NOT NULL,
  attachments JSONB DEFAULT '[]',
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  offline_created_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COMMUNICATION FEATURES
-- ============================================================================

-- Project announcements/bulletins
CREATE TABLE project_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority notification_priority DEFAULT 'medium',
  target_roles user_role[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Direct messages between users
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  sender_id UUID REFERENCES user_profiles(id),
  recipient_id UUID REFERENCES user_profiles(id),
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  parent_message_id UUID REFERENCES messages(id),
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DASHBOARD WIDGETS DATA
-- ============================================================================

-- Widget configurations per user role
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  widget_name TEXT NOT NULL,
  widget_type TEXT NOT NULL, -- 'chart', 'list', 'metric', 'calendar'
  position INTEGER NOT NULL,
  size TEXT DEFAULT 'medium', -- 'small', 'medium', 'large', 'full'
  config JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, widget_name)
);

-- User dashboard customizations
CREATE TABLE user_dashboard_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  widget_id UUID REFERENCES dashboard_widgets(id),
  is_visible BOOLEAN DEFAULT true,
  position_override INTEGER,
  size_override TEXT,
  config_override JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, widget_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Shop drawing indexes
CREATE INDEX idx_shop_drawings_project ON shop_drawings(project_id);
CREATE INDEX idx_shop_drawings_scope ON shop_drawings(scope_item_id);
CREATE INDEX idx_shop_drawings_status ON shop_drawings(status);
CREATE INDEX idx_shop_drawings_discipline ON shop_drawings(discipline);
CREATE INDEX idx_shop_drawings_architect ON shop_drawings(assigned_architect);
CREATE INDEX idx_shop_drawings_number ON shop_drawings(drawing_number);

-- Shop drawing comments indexes
CREATE INDEX idx_drawing_comments_drawing ON shop_drawing_comments(shop_drawing_id);
CREATE INDEX idx_drawing_comments_creator ON shop_drawing_comments(created_by);
CREATE INDEX idx_drawing_comments_unresolved ON shop_drawing_comments(shop_drawing_id, is_resolved) WHERE is_resolved = false;

-- Mobile indexes
CREATE INDEX idx_mobile_devices_user ON mobile_devices(user_id);
CREATE INDEX idx_mobile_sync_queue_device ON mobile_sync_queue(device_id);
CREATE INDEX idx_mobile_sync_queue_status ON mobile_sync_queue(sync_status);
CREATE INDEX idx_field_photos_project ON field_photos(project_id);
CREATE INDEX idx_field_photos_report ON field_photos(field_report_id);

-- Communication indexes
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX idx_announcements_project ON project_announcements(project_id);
CREATE INDEX idx_announcements_active ON project_announcements(project_id, is_pinned) WHERE expires_at IS NULL OR expires_at > NOW();

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-generate drawing numbers
CREATE OR REPLACE FUNCTION generate_drawing_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.drawing_number IS NULL THEN
    NEW.drawing_number := 
      CASE NEW.discipline
        WHEN 'architectural' THEN 'A-'
        WHEN 'structural' THEN 'S-'
        WHEN 'mechanical' THEN 'M-'
        WHEN 'electrical' THEN 'E-'
        WHEN 'plumbing' THEN 'P-'
        WHEN 'millwork' THEN 'MW-'
        ELSE 'D-'
      END || 
      LPAD((SELECT COUNT(*) + 1 FROM shop_drawings 
            WHERE project_id = NEW.project_id 
            AND discipline = NEW.discipline)::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_drawing_number
  BEFORE INSERT ON shop_drawings
  FOR EACH ROW EXECUTE PROCEDURE generate_drawing_number();

-- Create notification on drawing comment
CREATE OR REPLACE FUNCTION notify_drawing_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the architect assigned to the drawing
  INSERT INTO notifications (user_id, type, priority, title, message, entity_type, entity_id)
  SELECT 
    sd.assigned_architect,
    'mention'::notification_type,
    'medium'::notification_priority,
    'New comment on shop drawing',
    'New ' || NEW.comment_type || ' comment on drawing ' || sd.drawing_number,
    'document'::audit_entity,
    NEW.shop_drawing_id
  FROM shop_drawings sd
  WHERE sd.id = NEW.shop_drawing_id
  AND sd.assigned_architect IS NOT NULL
  AND sd.assigned_architect != NEW.created_by;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_drawing_comment
  AFTER INSERT ON shop_drawing_comments
  FOR EACH ROW EXECUTE PROCEDURE notify_drawing_comment();

-- Apply update triggers
CREATE TRIGGER update_shop_drawings_updated_at 
  BEFORE UPDATE ON shop_drawings 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_shop_drawing_comments_updated_at 
  BEFORE UPDATE ON shop_drawing_comments 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_drawing_sets_updated_at 
  BEFORE UPDATE ON drawing_sets 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_mobile_devices_updated_at 
  BEFORE UPDATE ON mobile_devices 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_mobile_forms_updated_at 
  BEFORE UPDATE ON mobile_forms 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_project_announcements_updated_at 
  BEFORE UPDATE ON project_announcements 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_dashboard_settings_updated_at 
  BEFORE UPDATE ON user_dashboard_settings 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE shop_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_drawing_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_drawing_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_drawing_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboard_settings ENABLE ROW LEVEL SECURITY;

-- Shop drawings policies
CREATE POLICY "Project team shop drawing access" ON shop_drawings
  FOR ALL USING (
    is_management_role() OR has_project_access(project_id)
  );

CREATE POLICY "Architect shop drawing management" ON shop_drawings
  FOR ALL USING (
    assigned_architect = auth.uid() OR
    created_by = auth.uid()
  );

CREATE POLICY "Client shop drawing view" ON shop_drawings
  FOR SELECT USING (
    status IN ('submitted_to_client', 'client_review', 'approved', 'approved_with_comments') AND
    is_client_with_project_access(project_id)
  );

-- Shop drawing revisions follow drawing access
CREATE POLICY "Drawing revision access follows drawing" ON shop_drawing_revisions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shop_drawings sd
      WHERE sd.id = shop_drawing_revisions.shop_drawing_id
      AND (
        is_management_role() OR 
        has_project_access(sd.project_id) OR
        sd.assigned_architect = auth.uid()
      )
    )
  );

-- Shop drawing comments policies
CREATE POLICY "Drawing comment access" ON shop_drawing_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shop_drawings sd
      WHERE sd.id = shop_drawing_comments.shop_drawing_id
      AND (
        is_management_role() OR 
        has_project_access(sd.project_id) OR
        (sd.status IN ('submitted_to_client', 'client_review') AND is_client_with_project_access(sd.project_id))
      )
    )
  );

-- Mobile device policies
CREATE POLICY "Users manage own devices" ON mobile_devices
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admin manage all devices" ON mobile_devices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Mobile sync queue policies
CREATE POLICY "Users manage own sync queue" ON mobile_sync_queue
  FOR ALL USING (user_id = auth.uid());

-- Field photos policies
CREATE POLICY "Field photo project access" ON field_photos
  FOR ALL USING (
    is_management_role() OR 
    has_project_access(project_id) OR
    uploaded_by = auth.uid()
  );

-- Messages policies
CREATE POLICY "Users access own messages" ON messages
  FOR ALL USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

-- Announcements policies
CREATE POLICY "Announcement project access" ON project_announcements
  FOR SELECT USING (
    is_management_role() OR 
    has_project_access(project_id) OR
    is_client_with_project_access(project_id)
  );

CREATE POLICY "Management create announcements" ON project_announcements
  FOR INSERT WITH CHECK (
    is_management_role() OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_announcements.project_id
      AND p.project_manager_id = auth.uid()
    )
  );

-- Dashboard policies
CREATE POLICY "Public widget configurations" ON dashboard_widgets
  FOR SELECT USING (is_default = true);

CREATE POLICY "User dashboard settings" ON user_dashboard_settings
  FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- DEFAULT DASHBOARD WIDGETS
-- ============================================================================

-- Insert default dashboard widgets for each role
INSERT INTO dashboard_widgets (role, widget_name, widget_type, position, size, config) VALUES
-- Company Owner widgets
('company_owner', 'company_overview', 'metric', 1, 'large', '{"metrics": ["total_projects", "total_revenue", "active_users", "completion_rate"]}'),
('company_owner', 'financial_summary', 'chart', 2, 'large', '{"chart_type": "mixed", "data_source": "financial_summary"}'),
('company_owner', 'project_portfolio', 'list', 3, 'medium', '{"show_fields": ["name", "status", "budget", "progress"]}'),

-- Project Manager widgets
('project_manager', 'my_projects', 'list', 1, 'large', '{"filter": "assigned", "show_fields": ["name", "status", "deadline", "progress"]}'),
('project_manager', 'pending_approvals', 'list', 2, 'medium', '{"entity_types": ["document", "shop_drawing"], "status": "pending"}'),
('project_manager', 'team_tasks', 'calendar', 3, 'medium', '{"view": "week", "show_overdue": true}'),
('project_manager', 'project_timeline', 'chart', 4, 'large', '{"chart_type": "gantt", "show_dependencies": true}'),

-- Field Worker widgets
('field_worker', 'daily_tasks', 'list', 1, 'large', '{"filter": "today", "show_location": true}'),
('field_worker', 'quick_report', 'form', 2, 'medium', '{"form_type": "daily_report", "allow_photos": true}'),
('field_worker', 'photo_upload', 'form', 3, 'small', '{"quick_action": true, "auto_geotag": true}'),

-- Client widgets
('client', 'project_progress', 'metric', 1, 'large', '{"show_milestones": true, "show_budget": false}'),
('client', 'pending_approvals', 'list', 2, 'medium', '{"entity_types": ["shop_drawing"], "highlight_overdue": true}'),
('client', 'document_library', 'list', 3, 'medium', '{"filter": "client_visible", "group_by": "type"}');

-- Insert migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250702000006', 'shop_drawings_mobile', NOW())
ON CONFLICT (version) DO NOTHING;