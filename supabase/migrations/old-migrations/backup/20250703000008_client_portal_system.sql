-- Formula PM 2.0 Client Portal System Migration
-- Created: 2025-07-03
-- Purpose: Complete Client Portal System implementation with external client access
-- Security: RLS-first design for external client data isolation

-- ============================================================================
-- CLIENT PORTAL SYSTEM ENUMS
-- ============================================================================

-- Client access levels within the portal system
CREATE TYPE client_access_level AS ENUM ('view_only', 'reviewer', 'approver', 'project_owner');

-- Client company types for business classification
CREATE TYPE client_company_type AS ENUM ('individual', 'corporation', 'partnership', 'government', 'non_profit');

-- Project-specific access levels for clients
CREATE TYPE client_project_access_level AS ENUM ('viewer', 'reviewer', 'approver', 'stakeholder');

-- Permission types for granular access control
CREATE TYPE client_permission_type AS ENUM ('document_access', 'project_access', 'communication', 'reporting', 'financial');

-- Document access types for clients
CREATE TYPE client_document_access_type AS ENUM ('view', 'download', 'comment', 'approve');

-- Client approval decisions for documents
CREATE TYPE client_approval_decision AS ENUM ('approved', 'approved_with_conditions', 'rejected', 'requires_revision');

-- Comment types for document feedback
CREATE TYPE client_comment_type AS ENUM ('general', 'revision_request', 'question', 'approval_condition', 'concern');

-- Comment status tracking
CREATE TYPE client_comment_status AS ENUM ('open', 'addressed', 'resolved', 'closed');

-- Priority levels for client communications
CREATE TYPE client_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Notification types for client portal
CREATE TYPE client_notification_type AS ENUM (
  'document_submitted', 'approval_required', 'approval_received', 'project_milestone',
  'schedule_change', 'budget_update', 'quality_issue', 'delivery_notification',
  'message_received', 'system_announcement'
);

-- Delivery methods for notifications
CREATE TYPE client_delivery_method AS ENUM ('in_app', 'email', 'sms', 'push');

-- Activity types for audit logging
CREATE TYPE client_activity_type AS ENUM (
  'login', 'logout', 'document_view', 'document_download', 'document_approve',
  'comment_add', 'message_send', 'project_access', 'profile_update'
);

-- Communication thread types
CREATE TYPE client_thread_type AS ENUM ('general', 'technical', 'commercial', 'quality', 'schedule', 'support');

-- Thread status for communication management
CREATE TYPE client_thread_status AS ENUM ('open', 'pending_response', 'resolved', 'closed');

-- Message types for communication
CREATE TYPE client_message_type AS ENUM ('text', 'file', 'image', 'system');

-- ============================================================================
-- CLIENT COMPANIES TABLE
-- ============================================================================

CREATE TABLE client_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(200) NOT NULL,
  company_type client_company_type NOT NULL,
  contact_person VARCHAR(100),
  primary_email VARCHAR(100),
  primary_phone VARCHAR(20),
  address TEXT,
  billing_address TEXT,
  tax_id VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  
  -- Portal Branding and Customization
  logo_url TEXT,
  brand_colors JSONB,
  custom_domain VARCHAR(100),
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_email_format CHECK (primary_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR primary_email IS NULL),
  CONSTRAINT unique_custom_domain UNIQUE(custom_domain)
);

-- ============================================================================
-- CLIENT USERS TABLE (External Authentication)
-- ============================================================================

CREATE TABLE client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id),
  
  -- Client Information
  client_company_id UUID NOT NULL REFERENCES client_companies(id),
  access_level client_access_level NOT NULL DEFAULT 'view_only',
  portal_access_enabled BOOLEAN DEFAULT true,
  
  -- Security & Authentication
  last_login TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  account_locked BOOLEAN DEFAULT false,
  password_reset_required BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  
  -- Preferences
  notification_preferences JSONB DEFAULT '{}',
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  theme VARCHAR(20) DEFAULT 'light',
  
  -- Tracking
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_login_attempts CHECK (login_attempts >= 0),
  CONSTRAINT valid_language CHECK (language ~ '^[a-z]{2}$'),
  CONSTRAINT unique_user_profile_client UNIQUE(user_profile_id, client_company_id)
);

-- ============================================================================
-- CLIENT PROJECT ACCESS TABLE
-- ============================================================================

CREATE TABLE client_project_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  access_level client_project_access_level NOT NULL DEFAULT 'viewer',
  
  -- Access Control Permissions
  can_view_financials BOOLEAN DEFAULT false,
  can_approve_documents BOOLEAN DEFAULT false,
  can_view_schedules BOOLEAN DEFAULT true,
  can_access_reports BOOLEAN DEFAULT true,
  
  -- Access Restrictions
  restricted_areas TEXT[], -- Array of restricted project areas
  access_start_date DATE,
  access_end_date DATE,
  
  -- Tracking
  granted_by UUID NOT NULL REFERENCES user_profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(client_user_id, project_id),
  CONSTRAINT valid_access_dates CHECK (
    (access_start_date IS NULL AND access_end_date IS NULL) OR
    (access_start_date IS NOT NULL AND access_end_date IS NOT NULL AND access_end_date >= access_start_date)
  )
);

-- ============================================================================
-- CLIENT PERMISSIONS TABLE
-- ============================================================================

CREATE TABLE client_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  permission_type client_permission_type NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  project_specific BOOLEAN DEFAULT true,
  
  -- Permission Details
  allowed_actions TEXT[] NOT NULL,
  conditions JSONB DEFAULT '{}',
  
  -- Validity
  granted_by UUID NOT NULL REFERENCES user_profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- Constraints
  CONSTRAINT non_empty_actions CHECK (array_length(allowed_actions, 1) > 0)
);

-- ============================================================================
-- CLIENT DOCUMENT ACCESS TABLE
-- ============================================================================

CREATE TABLE client_document_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  access_type client_document_access_type NOT NULL DEFAULT 'view',
  
  -- Access Control
  can_download BOOLEAN DEFAULT true,
  can_comment BOOLEAN DEFAULT true,
  can_approve BOOLEAN DEFAULT false,
  watermarked BOOLEAN DEFAULT false,
  
  -- Tracking
  first_accessed TIMESTAMP WITH TIME ZONE,
  last_accessed TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  granted_by UUID NOT NULL REFERENCES user_profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(client_user_id, document_id),
  CONSTRAINT non_negative_counts CHECK (view_count >= 0 AND download_count >= 0)
);

-- ============================================================================
-- CLIENT DOCUMENT APPROVALS TABLE
-- ============================================================================

CREATE TABLE client_document_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  approval_decision client_approval_decision NOT NULL,
  
  -- Approval Details
  approval_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approval_comments TEXT,
  approval_conditions TEXT[],
  digital_signature JSONB,
  
  -- Document Version Tracking
  document_version INTEGER NOT NULL,
  revision_letter VARCHAR(5),
  
  -- Status
  is_final BOOLEAN DEFAULT true,
  superseded_by UUID REFERENCES client_document_approvals(id),
  
  -- Security Tracking
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(100),
  
  -- Constraints
  CONSTRAINT positive_version CHECK (document_version > 0),
  CONSTRAINT no_self_supersede CHECK (superseded_by != id OR superseded_by IS NULL)
);

-- ============================================================================
-- CLIENT DOCUMENT COMMENTS TABLE
-- ============================================================================

CREATE TABLE client_document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Comment Content
  comment_text TEXT NOT NULL,
  comment_type client_comment_type NOT NULL DEFAULT 'general',
  priority client_priority DEFAULT 'medium',
  
  -- Document Positioning (for markups)
  page_number INTEGER,
  x_coordinate DECIMAL(10,3),
  y_coordinate DECIMAL(10,3),
  markup_data JSONB,
  
  -- Status and Threading
  status client_comment_status DEFAULT 'open',
  parent_comment_id UUID REFERENCES client_document_comments(id),
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES user_profiles(id),
  
  -- Constraints
  CONSTRAINT non_empty_comment CHECK (length(trim(comment_text)) > 0),
  CONSTRAINT positive_page CHECK (page_number > 0 OR page_number IS NULL),
  CONSTRAINT valid_coordinates CHECK (
    (x_coordinate IS NULL AND y_coordinate IS NULL) OR
    (x_coordinate IS NOT NULL AND y_coordinate IS NOT NULL AND x_coordinate >= 0 AND y_coordinate >= 0)
  ),
  CONSTRAINT no_self_parent CHECK (parent_comment_id != id OR parent_comment_id IS NULL)
);

-- ============================================================================
-- CLIENT NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE client_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Notification Content
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  notification_type client_notification_type NOT NULL,
  priority client_priority DEFAULT 'medium',
  
  -- Delivery
  delivery_method client_delivery_method[] DEFAULT ARRAY['in_app']::client_delivery_method[],
  email_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT non_empty_title CHECK (length(trim(title)) > 0),
  CONSTRAINT non_empty_message CHECK (length(trim(message)) > 0),
  CONSTRAINT valid_delivery_array CHECK (array_length(delivery_method, 1) > 0)
);

-- ============================================================================
-- CLIENT ACTIVITY LOG TABLE
-- ============================================================================

CREATE TABLE client_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Activity Details
  activity_type client_activity_type NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  action_taken VARCHAR(100) NOT NULL,
  
  -- Context
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Session Information
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(100),
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT non_empty_action CHECK (length(trim(action_taken)) > 0)
);

-- ============================================================================
-- CLIENT COMMUNICATION THREADS TABLE
-- ============================================================================

CREATE TABLE client_communication_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  
  -- Thread Details
  subject VARCHAR(300) NOT NULL,
  thread_type client_thread_type DEFAULT 'general',
  priority client_priority DEFAULT 'medium',
  status client_thread_status DEFAULT 'open',
  
  -- Participants
  internal_participants UUID[] DEFAULT '{}',
  client_participants UUID[] DEFAULT '{}',
  
  -- Settings
  auto_close_after_days INTEGER,
  requires_response BOOLEAN DEFAULT false,
  response_deadline TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES user_profiles(id),
  
  -- Constraints
  CONSTRAINT non_empty_subject CHECK (length(trim(subject)) > 0),
  CONSTRAINT positive_auto_close CHECK (auto_close_after_days > 0 OR auto_close_after_days IS NULL),
  CONSTRAINT valid_response_deadline CHECK (
    (requires_response = false) OR 
    (requires_response = true AND response_deadline > created_at)
  )
);

-- ============================================================================
-- CLIENT MESSAGES TABLE
-- ============================================================================

CREATE TABLE client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES client_communication_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES user_profiles(id),
  
  -- Message Content
  message_body TEXT NOT NULL,
  message_type client_message_type DEFAULT 'text',
  
  -- Attachments
  attachments JSONB DEFAULT '[]',
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT non_empty_message CHECK (length(trim(message_body)) > 0)
);

-- ============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ============================================================================

-- Client companies indexes
CREATE INDEX idx_client_companies_active ON client_companies(is_active);
CREATE INDEX idx_client_companies_type ON client_companies(company_type);
CREATE INDEX idx_client_companies_name ON client_companies(company_name);

-- Client users indexes
CREATE INDEX idx_client_users_company ON client_users(client_company_id);
CREATE INDEX idx_client_users_access_level ON client_users(access_level);
CREATE INDEX idx_client_users_last_activity ON client_users(last_activity);
CREATE INDEX idx_client_users_portal_enabled ON client_users(portal_access_enabled);
CREATE INDEX idx_client_users_created_by ON client_users(created_by);

-- Client project access indexes
CREATE INDEX idx_client_project_access_client ON client_project_access(client_user_id);
CREATE INDEX idx_client_project_access_project ON client_project_access(project_id);
CREATE INDEX idx_client_project_access_level ON client_project_access(access_level);
CREATE INDEX idx_client_project_access_granted_by ON client_project_access(granted_by);
CREATE INDEX idx_client_project_access_dates ON client_project_access(access_start_date, access_end_date);

-- Client permissions indexes
CREATE INDEX idx_client_permissions_user ON client_permissions(client_user_id);
CREATE INDEX idx_client_permissions_type ON client_permissions(permission_type);
CREATE INDEX idx_client_permissions_resource ON client_permissions(resource_type, resource_id);
CREATE INDEX idx_client_permissions_active ON client_permissions(is_active);
CREATE INDEX idx_client_permissions_expires ON client_permissions(expires_at);

-- Client document access indexes
CREATE INDEX idx_client_document_access_client ON client_document_access(client_user_id);
CREATE INDEX idx_client_document_access_document ON client_document_access(document_id);
CREATE INDEX idx_client_document_access_type ON client_document_access(access_type);
CREATE INDEX idx_client_document_access_granted_by ON client_document_access(granted_by);

-- Client document approvals indexes
CREATE INDEX idx_client_document_approvals_client ON client_document_approvals(client_user_id);
CREATE INDEX idx_client_document_approvals_document ON client_document_approvals(document_id);
CREATE INDEX idx_client_document_approvals_decision ON client_document_approvals(approval_decision);
CREATE INDEX idx_client_document_approvals_date ON client_document_approvals(approval_date);
CREATE INDEX idx_client_document_approvals_version ON client_document_approvals(document_id, document_version);

-- Client document comments indexes
CREATE INDEX idx_client_document_comments_client ON client_document_comments(client_user_id);
CREATE INDEX idx_client_document_comments_document ON client_document_comments(document_id);
CREATE INDEX idx_client_document_comments_status ON client_document_comments(status);
CREATE INDEX idx_client_document_comments_type ON client_document_comments(comment_type);
CREATE INDEX idx_client_document_comments_parent ON client_document_comments(parent_comment_id);
CREATE INDEX idx_client_document_comments_created_at ON client_document_comments(created_at);

-- Client notifications indexes
CREATE INDEX idx_client_notifications_client ON client_notifications(client_user_id);
CREATE INDEX idx_client_notifications_project ON client_notifications(project_id);
CREATE INDEX idx_client_notifications_unread ON client_notifications(client_user_id, is_read);
CREATE INDEX idx_client_notifications_type ON client_notifications(notification_type);
CREATE INDEX idx_client_notifications_priority ON client_notifications(priority);
CREATE INDEX idx_client_notifications_scheduled ON client_notifications(scheduled_for);

-- Client activity log indexes
CREATE INDEX idx_client_activity_log_client ON client_activity_log(client_user_id);
CREATE INDEX idx_client_activity_log_project ON client_activity_log(project_id);
CREATE INDEX idx_client_activity_log_type ON client_activity_log(activity_type);
CREATE INDEX idx_client_activity_log_resource ON client_activity_log(resource_type, resource_id);
CREATE INDEX idx_client_activity_log_created_at ON client_activity_log(created_at);
CREATE INDEX idx_client_activity_log_client_time ON client_activity_log(client_user_id, created_at);

-- Client communication threads indexes
CREATE INDEX idx_client_communication_threads_project ON client_communication_threads(project_id);
CREATE INDEX idx_client_communication_threads_client ON client_communication_threads(client_user_id);
CREATE INDEX idx_client_communication_threads_status ON client_communication_threads(status);
CREATE INDEX idx_client_communication_threads_type ON client_communication_threads(thread_type);
CREATE INDEX idx_client_communication_threads_priority ON client_communication_threads(priority);
CREATE INDEX idx_client_communication_threads_last_message ON client_communication_threads(last_message_at);

-- Client messages indexes
CREATE INDEX idx_client_messages_thread ON client_messages(thread_id);
CREATE INDEX idx_client_messages_sender ON client_messages(sender_id);
CREATE INDEX idx_client_messages_type ON client_messages(message_type);
CREATE INDEX idx_client_messages_created_at ON client_messages(created_at);
CREATE INDEX idx_client_messages_thread_time ON client_messages(thread_id, created_at);
CREATE INDEX idx_client_messages_read ON client_messages(is_read);

-- ============================================================================
-- AUTO-UPDATE TRIGGERS
-- ============================================================================

-- Apply auto-update triggers to new tables
CREATE TRIGGER update_client_companies_updated_at 
  BEFORE UPDATE ON client_companies 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_client_users_updated_at 
  BEFORE UPDATE ON client_users 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_client_document_comments_updated_at 
  BEFORE UPDATE ON client_document_comments 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_client_communication_threads_updated_at 
  BEFORE UPDATE ON client_communication_threads 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_client_messages_updated_at 
  BEFORE UPDATE ON client_messages 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- CLIENT PORTAL FUNCTIONS AND AUTOMATION
-- ============================================================================

-- Function to track client document access
CREATE OR REPLACE FUNCTION track_client_document_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Update access tracking on document access
  UPDATE client_document_access 
  SET 
    view_count = view_count + 1,
    last_accessed = NOW(),
    first_accessed = COALESCE(first_accessed, NOW())
  WHERE client_user_id = NEW.client_user_id 
    AND document_id = NEW.document_id;
  
  -- Log the activity
  INSERT INTO client_activity_log (
    client_user_id, project_id, activity_type, resource_type, 
    resource_id, action_taken, description, ip_address, user_agent, session_id
  ) VALUES (
    NEW.client_user_id, 
    (SELECT project_id FROM documents WHERE id = NEW.document_id),
    'document_view', 'document', NEW.document_id, 
    'Document viewed', 'Client viewed document', 
    NEW.ip_address, NEW.user_agent, NEW.session_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update thread last_message_at timestamp
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE client_communication_threads 
  SET 
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.thread_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-close threads after specified days
CREATE OR REPLACE FUNCTION auto_close_inactive_threads()
RETURNS void AS $$
BEGIN
  UPDATE client_communication_threads 
  SET 
    status = 'closed',
    closed_at = NOW(),
    updated_at = NOW()
  WHERE status = 'open' 
    AND auto_close_after_days IS NOT NULL
    AND last_message_at < NOW() - INTERVAL '1 day' * auto_close_after_days;
END;
$$ LANGUAGE plpgsql;

-- Function to validate client access permissions
CREATE OR REPLACE FUNCTION validate_client_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if client has valid access to the project
  IF NOT EXISTS (
    SELECT 1 FROM client_project_access cpa
    JOIN client_users cu ON cu.id = cpa.client_user_id
    WHERE cpa.client_user_id = NEW.client_user_id
      AND cpa.project_id = (SELECT project_id FROM documents WHERE id = NEW.document_id)
      AND cu.portal_access_enabled = true
      AND (cpa.access_start_date IS NULL OR cpa.access_start_date <= CURRENT_DATE)
      AND (cpa.access_end_date IS NULL OR cpa.access_end_date >= CURRENT_DATE)
  ) THEN
    RAISE EXCEPTION 'Client does not have valid access to this project';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create client notification
CREATE OR REPLACE FUNCTION create_client_notification(
  p_client_user_id UUID,
  p_project_id UUID,
  p_title VARCHAR(200),
  p_message TEXT,
  p_notification_type client_notification_type,
  p_priority client_priority DEFAULT 'medium',
  p_delivery_methods client_delivery_method[] DEFAULT ARRAY['in_app']::client_delivery_method[]
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO client_notifications (
    client_user_id, project_id, title, message, notification_type, 
    priority, delivery_method
  ) VALUES (
    p_client_user_id, p_project_id, p_title, p_message, p_notification_type,
    p_priority, p_delivery_methods
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log client activity
CREATE OR REPLACE FUNCTION log_client_activity(
  p_client_user_id UUID,
  p_project_id UUID,
  p_activity_type client_activity_type,
  p_resource_type VARCHAR(50),
  p_resource_id UUID,
  p_action_taken VARCHAR(100),
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO client_activity_log (
    client_user_id, project_id, activity_type, resource_type, resource_id,
    action_taken, description, metadata, ip_address, user_agent, session_id
  ) VALUES (
    p_client_user_id, p_project_id, p_activity_type, p_resource_type, p_resource_id,
    p_action_taken, p_description, p_metadata, p_ip_address, p_user_agent, p_session_id
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER IMPLEMENTATIONS
-- ============================================================================

-- Update thread timestamp when new message is added
CREATE TRIGGER update_thread_last_message_trigger
  AFTER INSERT ON client_messages
  FOR EACH ROW EXECUTE PROCEDURE update_thread_last_message();

-- Validate client access on document access grants
CREATE TRIGGER validate_client_document_access_trigger
  BEFORE INSERT ON client_document_access
  FOR EACH ROW EXECUTE PROCEDURE validate_client_access();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all client portal tables
ALTER TABLE client_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_project_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_document_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_document_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_communication_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CLIENT COMPANIES RLS POLICIES
-- ============================================================================

-- Clients can only see their own company
CREATE POLICY client_companies_client_access ON client_companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT client_company_id 
      FROM client_users 
      WHERE user_profile_id = auth.uid()
    )
  );

-- Internal users can see all active companies
CREATE POLICY client_companies_internal_access ON client_companies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
        AND role NOT IN ('client')
    )
  );

-- ============================================================================
-- CLIENT USERS RLS POLICIES
-- ============================================================================

-- Clients can only see their own user record
CREATE POLICY client_users_own_access ON client_users
  FOR SELECT
  TO authenticated
  USING (user_profile_id = auth.uid());

-- Internal users can see all client users
CREATE POLICY client_users_internal_access ON client_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
        AND role NOT IN ('client')
    )
  );

-- ============================================================================
-- CLIENT PROJECT ACCESS RLS POLICIES
-- ============================================================================

-- Clients can only see their own project access records
CREATE POLICY client_project_access_own_access ON client_project_access
  FOR SELECT
  TO authenticated
  USING (
    client_user_id IN (
      SELECT id FROM client_users 
      WHERE user_profile_id = auth.uid()
    )
  );

-- Internal users can manage all project access
CREATE POLICY client_project_access_internal_manage ON client_project_access
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
        AND role NOT IN ('client')
    )
  );

-- ============================================================================
-- CLIENT PERMISSIONS RLS POLICIES
-- ============================================================================

-- Clients can only see their own permissions
CREATE POLICY client_permissions_own_access ON client_permissions
  FOR SELECT
  TO authenticated
  USING (
    client_user_id IN (
      SELECT id FROM client_users 
      WHERE user_profile_id = auth.uid()
    )
  );

-- Internal users can manage all permissions
CREATE POLICY client_permissions_internal_manage ON client_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
        AND role NOT IN ('client')
    )
  );

-- ============================================================================
-- CLIENT DOCUMENT ACCESS RLS POLICIES
-- ============================================================================

-- Clients can only see their own document access records
CREATE POLICY client_document_access_own_access ON client_document_access
  FOR SELECT
  TO authenticated
  USING (
    client_user_id IN (
      SELECT id FROM client_users 
      WHERE user_profile_id = auth.uid()
    )
  );

-- Internal users can manage all document access
CREATE POLICY client_document_access_internal_manage ON client_document_access
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
        AND role NOT IN ('client')
    )
  );

-- ============================================================================
-- CLIENT DOCUMENT APPROVALS RLS POLICIES
-- ============================================================================

-- Clients can only see and create their own approvals
CREATE POLICY client_document_approvals_own_access ON client_document_approvals
  FOR SELECT
  TO authenticated
  USING (
    client_user_id IN (
      SELECT id FROM client_users 
      WHERE user_profile_id = auth.uid()
    )
  );

CREATE POLICY client_document_approvals_own_create ON client_document_approvals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_user_id IN (
      SELECT id FROM client_users 
      WHERE user_profile_id = auth.uid()
    )
  );

-- Internal users can see all approvals
CREATE POLICY client_document_approvals_internal_view ON client_document_approvals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
        AND role NOT IN ('client')
    )
  );

-- ============================================================================
-- CLIENT DOCUMENT COMMENTS RLS POLICIES
-- ============================================================================

-- Clients can see and create comments on documents they have access to
CREATE POLICY client_document_comments_own_access ON client_document_comments
  FOR SELECT
  TO authenticated
  USING (
    client_user_id IN (
      SELECT id FROM client_users 
      WHERE user_profile_id = auth.uid()
    )
    OR
    document_id IN (
      SELECT cda.document_id 
      FROM client_document_access cda
      JOIN client_users cu ON cu.id = cda.client_user_id
      WHERE cu.user_profile_id = auth.uid()
    )
  );

CREATE POLICY client_document_comments_own_create ON client_document_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_user_id IN (
      SELECT id FROM client_users 
      WHERE user_profile_id = auth.uid()
    )
  );

-- Internal users can see all comments
CREATE POLICY client_document_comments_internal_view ON client_document_comments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
        AND role NOT IN ('client')
    )
  );

-- ============================================================================
-- CLIENT NOTIFICATIONS RLS POLICIES
-- ============================================================================

-- Clients can only see their own notifications
CREATE POLICY client_notifications_own_access ON client_notifications
  FOR SELECT
  TO authenticated
  USING (
    client_user_id IN (
      SELECT id FROM client_users 
      WHERE user_profile_id = auth.uid()
    )
  );

-- Clients can update their own notification status
CREATE POLICY client_notifications_own_update ON client_notifications
  FOR UPDATE
  TO authenticated
  USING (
    client_user_id IN (
      SELECT id FROM client_users 
      WHERE user_profile_id = auth.uid()
    )
  );

-- Internal users can create and manage all notifications
CREATE POLICY client_notifications_internal_manage ON client_notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
        AND role NOT IN ('client')
    )
  );

-- ============================================================================
-- CLIENT ACTIVITY LOG RLS POLICIES
-- ============================================================================

-- Clients can only see their own activity
CREATE POLICY client_activity_log_own_access ON client_activity_log
  FOR SELECT
  TO authenticated
  USING (
    client_user_id IN (
      SELECT id FROM client_users 
      WHERE user_profile_id = auth.uid()
    )
  );

-- System can create activity logs
CREATE POLICY client_activity_log_system_create ON client_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Internal users can see all activity
CREATE POLICY client_activity_log_internal_view ON client_activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
        AND role NOT IN ('client')
    )
  );

-- ============================================================================
-- CLIENT COMMUNICATION THREADS RLS POLICIES
-- ============================================================================

-- Clients can see threads they participate in
CREATE POLICY client_communication_threads_participant_access ON client_communication_threads
  FOR SELECT
  TO authenticated
  USING (
    client_user_id IN (
      SELECT id FROM client_users 
      WHERE user_profile_id = auth.uid()
    )
    OR
    auth.uid() = ANY(client_participants)
  );

-- Clients can create threads
CREATE POLICY client_communication_threads_client_create ON client_communication_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_user_id IN (
      SELECT id FROM client_users 
      WHERE user_profile_id = auth.uid()
    )
  );

-- Internal users can manage all threads
CREATE POLICY client_communication_threads_internal_manage ON client_communication_threads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
        AND role NOT IN ('client')
    )
  );

-- ============================================================================
-- CLIENT MESSAGES RLS POLICIES
-- ============================================================================

-- Users can see messages in threads they participate in
CREATE POLICY client_messages_participant_access ON client_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_communication_threads cct
      WHERE cct.id = thread_id
        AND (
          cct.client_user_id IN (
            SELECT id FROM client_users 
            WHERE user_profile_id = auth.uid()
          )
          OR auth.uid() = ANY(cct.client_participants)
          OR auth.uid() = ANY(cct.internal_participants)
        )
    )
  );

-- Users can create messages in threads they participate in
CREATE POLICY client_messages_participant_create ON client_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM client_communication_threads cct
      WHERE cct.id = thread_id
        AND (
          cct.client_user_id IN (
            SELECT id FROM client_users 
            WHERE user_profile_id = auth.uid()
          )
          OR auth.uid() = ANY(cct.client_participants)
          OR auth.uid() = ANY(cct.internal_participants)
        )
    )
  );

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

-- Table comments
COMMENT ON TABLE client_companies IS 'Client companies with branding and configuration for portal access';
COMMENT ON TABLE client_users IS 'External client users with separate authentication and security controls';
COMMENT ON TABLE client_project_access IS 'Project-specific access control for client users';
COMMENT ON TABLE client_permissions IS 'Granular permissions system for client portal features';
COMMENT ON TABLE client_document_access IS 'Document-specific access control with tracking capabilities';
COMMENT ON TABLE client_document_approvals IS 'Client approval decisions with digital signatures and audit trail';
COMMENT ON TABLE client_document_comments IS 'Client comments and markups on documents with positioning data';
COMMENT ON TABLE client_notifications IS 'Multi-channel notification system for client communications';
COMMENT ON TABLE client_activity_log IS 'Comprehensive audit trail for all client portal activities';
COMMENT ON TABLE client_communication_threads IS 'Communication threads between clients and internal teams';
COMMENT ON TABLE client_messages IS 'Individual messages within communication threads';

-- Critical column comments
COMMENT ON COLUMN client_users.user_profile_id IS 'References auth.users for external client authentication';
COMMENT ON COLUMN client_users.portal_access_enabled IS 'Master switch for client portal access';
COMMENT ON COLUMN client_users.two_factor_enabled IS 'Enhanced security for external client access';
COMMENT ON COLUMN client_project_access.restricted_areas IS 'Array of project areas client cannot access';
COMMENT ON COLUMN client_document_access.watermarked IS 'Whether documents should be watermarked for this client';
COMMENT ON COLUMN client_document_approvals.digital_signature IS 'JSON data for digital signature verification';
COMMENT ON COLUMN client_document_comments.markup_data IS 'JSON data for document markup and annotations';
COMMENT ON COLUMN client_notifications.delivery_method IS 'Array of delivery methods (in_app, email, sms, push)';
COMMENT ON COLUMN client_activity_log.metadata IS 'Additional context data for activity logging';
COMMENT ON COLUMN client_communication_threads.internal_participants IS 'Array of internal user IDs participating in thread';
COMMENT ON COLUMN client_communication_threads.client_participants IS 'Array of client user IDs participating in thread';

-- Migration completion marker
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250703000008', 'client_portal_system', NOW())
ON CONFLICT (version) DO NOTHING;