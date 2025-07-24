-- Formula PM 2.0 Audit System and Activity Logging
-- Created: 2025-07-02
-- Purpose: Comprehensive audit trail for compliance, security, and activity tracking

-- ============================================================================
-- AUDIT ENUMS
-- ============================================================================

-- Audit action types
CREATE TYPE audit_action AS ENUM (
  'create',
  'update', 
  'delete',
  'view',
  'approve',
  'reject',
  'upload',
  'download',
  'login',
  'logout',
  'permission_change',
  'bulk_operation'
);

-- Audit entity types
CREATE TYPE audit_entity AS ENUM (
  'user',
  'project',
  'scope_item',
  'document',
  'supplier',
  'client',
  'assignment',
  'approval',
  'report',
  'system'
);

-- ============================================================================
-- AUDIT TRAIL TABLE
-- ============================================================================

-- Main audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  action audit_action NOT NULL,
  entity_type audit_entity NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity summary table for dashboard widgets
CREATE TABLE activity_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  project_id UUID REFERENCES projects(id),
  activity_date DATE NOT NULL,
  actions_count INTEGER DEFAULT 0,
  documents_uploaded INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  approvals_given INTEGER DEFAULT 0,
  hours_logged DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id, activity_date)
);

-- ============================================================================
-- NOTIFICATION SYSTEM
-- ============================================================================

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'task_assigned',
  'document_approval_required',
  'document_approved',
  'document_rejected',
  'project_update',
  'deadline_reminder',
  'scope_change',
  'mention',
  'system_alert'
);

-- Notification priority
CREATE TYPE notification_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type audit_entity,
  entity_id UUID,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TASK MANAGEMENT SYSTEM
-- ============================================================================

-- Task status types
CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress',
  'review',
  'completed',
  'cancelled',
  'blocked'
);

-- Task priority levels
CREATE TYPE task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  scope_item_id UUID REFERENCES scope_items(id),
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'medium',
  assigned_to UUID REFERENCES user_profiles(id),
  assigned_by UUID REFERENCES user_profiles(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  dependencies UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task comments
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  comment TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FIELD REPORTS
-- ============================================================================

-- Report types
CREATE TYPE report_type AS ENUM (
  'daily',
  'weekly',
  'incident',
  'quality',
  'safety',
  'progress',
  'inspection'
);

-- Field reports table
CREATE TABLE field_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  report_type report_type NOT NULL,
  report_date DATE NOT NULL,
  submitted_by UUID REFERENCES user_profiles(id),
  weather_conditions TEXT,
  workers_present INTEGER,
  work_performed TEXT NOT NULL,
  issues_encountered TEXT,
  materials_used JSONB DEFAULT '[]',
  equipment_used JSONB DEFAULT '[]',
  photos JSONB DEFAULT '[]',
  safety_incidents INTEGER DEFAULT 0,
  incident_details TEXT,
  next_steps TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM CONFIGURATION
-- ============================================================================

-- System settings table
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permission templates
CREATE TABLE permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL UNIQUE,
  permissions JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Audit log indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Activity summary indexes
CREATE INDEX idx_activity_summary_user ON activity_summary(user_id);
CREATE INDEX idx_activity_summary_project ON activity_summary(project_id);
CREATE INDEX idx_activity_summary_date ON activity_summary(activity_date);

-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Task indexes
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_scope_item ON tasks(scope_item_id);

-- Task comment indexes
CREATE INDEX idx_task_comments_task ON task_comments(task_id);
CREATE INDEX idx_task_comments_user ON task_comments(user_id);

-- Field report indexes
CREATE INDEX idx_field_reports_project ON field_reports(project_id);
CREATE INDEX idx_field_reports_date ON field_reports(report_date);
CREATE INDEX idx_field_reports_submitted_by ON field_reports(submitted_by);
CREATE INDEX idx_field_reports_type ON field_reports(report_type);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update activity summary trigger
CREATE OR REPLACE FUNCTION update_activity_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert activity summary
  INSERT INTO activity_summary (user_id, project_id, activity_date, actions_count)
  VALUES (NEW.user_id, 
          CASE 
            WHEN NEW.entity_type = 'project' THEN NEW.entity_id::UUID
            WHEN NEW.entity_type = 'scope_item' THEN (SELECT project_id FROM scope_items WHERE id = NEW.entity_id::UUID)
            WHEN NEW.entity_type = 'document' THEN (SELECT project_id FROM documents WHERE id = NEW.entity_id::UUID)
            ELSE NULL
          END,
          DATE(NEW.created_at),
          1)
  ON CONFLICT (user_id, project_id, activity_date)
  DO UPDATE SET 
    actions_count = activity_summary.actions_count + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_activity_summary
  AFTER INSERT ON audit_logs
  FOR EACH ROW EXECUTE PROCEDURE update_activity_summary();

-- Apply update triggers to new tables
CREATE TRIGGER update_activity_summary_updated_at 
  BEFORE UPDATE ON activity_summary 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at 
  BEFORE UPDATE ON task_comments 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_field_reports_updated_at 
  BEFORE UPDATE ON field_reports 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at 
  BEFORE UPDATE ON system_settings 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_permission_templates_updated_at 
  BEFORE UPDATE ON permission_templates 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_templates ENABLE ROW LEVEL SECURITY;

-- Audit logs policies
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Management can view all audit logs" ON audit_logs
  FOR SELECT USING (is_management_role());

-- Activity summary policies
CREATE POLICY "Users can view own activity" ON activity_summary
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Management can view all activity" ON activity_summary
  FOR SELECT USING (is_management_role());

CREATE POLICY "PM can view project activity" ON activity_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = activity_summary.project_id
      AND p.project_manager_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users manage own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Tasks policies
CREATE POLICY "Management task access" ON tasks
  FOR ALL USING (is_management_role());

CREATE POLICY "Project team task access" ON tasks
  FOR ALL USING (has_project_access(project_id));

CREATE POLICY "Assigned user task access" ON tasks
  FOR ALL USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

-- Task comments policies
CREATE POLICY "Task comment access follows task access" ON task_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_comments.task_id
      AND (
        is_management_role() OR
        has_project_access(t.project_id) OR
        t.assigned_to = auth.uid() OR
        t.assigned_by = auth.uid()
      )
    )
  );

-- Field reports policies
CREATE POLICY "Management field report access" ON field_reports
  FOR ALL USING (is_management_role());

CREATE POLICY "Project team field report access" ON field_reports
  FOR ALL USING (has_project_access(project_id));

CREATE POLICY "Field worker own reports" ON field_reports
  FOR ALL USING (submitted_by = auth.uid());

-- System settings policies
CREATE POLICY "Public settings read access" ON system_settings
  FOR SELECT USING (is_public = true);

CREATE POLICY "Admin settings access" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('management', 'admin')
    )
  );

-- Permission templates policies
CREATE POLICY "Admin permission template access" ON permission_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('management', 'admin')
    )
  );

-- ============================================================================
-- INITIAL PERMISSION TEMPLATES
-- ============================================================================

-- Insert default permission templates for the new 6-role system
INSERT INTO permission_templates (role, permissions, description) VALUES
('management', '{
  "projects": ["create", "read", "update", "delete", "archive"],
  "users": ["create", "read", "update", "delete", "manage_roles"],
  "finance": ["view_all", "approve_budgets", "manage_costs"],
  "reports": ["view_all", "create_executive", "export"],
  "system": ["configure", "manage_integrations", "view_audit"]
}', 'Full system access for management team'),

('purchase_manager', '{
  "projects": ["read", "update"],
  "suppliers": ["create", "read", "update", "approve", "evaluate"],
  "finance": ["view_assigned", "create_purchase_orders"],
  "reports": ["view_procurement", "create_purchase", "export"]
}', 'Purchase and procurement management'),

('technical_lead', '{
  "projects": ["read", "update", "technical_review"],
  "scope": ["create", "read", "update", "technical_approve"],
  "documents": ["create", "read", "update", "technical_approve"],
  "reports": ["view_technical", "create_technical", "export"]
}', 'Technical leadership and review'),

('project_manager', '{
  "projects": ["read", "update", "manage_team"],
  "scope": ["create", "read", "update", "manage"],
  "documents": ["create", "read", "update", "approve_internal"],
  "tasks": ["create", "assign", "manage"],
  "reports": ["create_project", "view_project", "export"]
}', 'Project management and coordination'),

('client', '{
  "projects": ["read"],
  "documents": ["read", "download"],
  "reports": ["view_project"],
  "communication": ["create", "read", "participate"]
}', 'Client portal access'),

('admin', '{
  "projects": ["create", "read", "update", "delete", "archive"],
  "users": ["create", "read", "update", "delete", "manage_roles"],
  "system": ["configure", "manage_integrations", "view_audit", "backup"],
  "reports": ["view_all", "create_all", "export"]
}', 'System administration access');

-- Insert migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250702000004', 'audit_system', NOW())
ON CONFLICT (version) DO NOTHING;