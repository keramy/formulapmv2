-- Document Approval Workflow System
-- Formula PM Wave 2C Implementation

-- Create approval status and action enums
CREATE TYPE approval_status AS ENUM (
  'pending', 'in_review', 'approved', 'rejected', 
  'cancelled', 'expired', 'delegated'
);

CREATE TYPE approval_action AS ENUM (
  'approve', 'reject', 'delegate', 'comment', 
  'request_changes', 'escalate'
);

-- Documents table (if not exists)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'drawing', 'specification', 'report', 'contract', 'other'
  document_name TEXT NOT NULL,
  document_number TEXT,
  version TEXT DEFAULT '1.0',
  file_path TEXT,
  file_size INTEGER,
  file_type TEXT,
  description TEXT,
  tags TEXT[],
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT documents_project_document_number_key UNIQUE (project_id, document_number)
);

-- Main approval workflow table
CREATE TABLE documents_approval_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  workflow_type TEXT NOT NULL DEFAULT 'sequential', -- 'sequential', 'parallel', 'conditional'
  current_status approval_status NOT NULL DEFAULT 'pending',
  approval_sequence INTEGER[], -- Order of approvers for sequential workflows
  required_approvers UUID[], -- User IDs who must approve
  completed_approvers UUID[], -- User IDs who have approved
  rejected_by UUID REFERENCES auth.users(id), -- User who rejected
  rejection_reason TEXT,
  delegation_chain JSONB DEFAULT '[]'::jsonb, -- Track delegation history
  estimated_completion_date TIMESTAMP WITH TIME ZONE,
  actual_completion_date TIMESTAMP WITH TIME ZONE,
  priority_level INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high, 4=urgent
  
  -- Audit fields
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_workflow_type CHECK (workflow_type IN ('sequential', 'parallel', 'conditional')),
  CONSTRAINT valid_priority_level CHECK (priority_level BETWEEN 1 AND 4)
);

-- Approval actions audit trail
CREATE TABLE approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES documents_approval_workflow(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type approval_action NOT NULL,
  comments TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata_jsonb JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  
  -- Audit context
  delegated_by UUID REFERENCES auth.users(id), -- If this action was delegated
  original_approver UUID REFERENCES auth.users(id), -- Original assignee if delegated
  
  -- Constraints
  CONSTRAINT approval_actions_workflow_user_action_unique 
    UNIQUE (workflow_id, user_id, action_type, timestamp)
);

-- Approval workflow templates for reuse
CREATE TABLE approval_workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  workflow_type TEXT NOT NULL DEFAULT 'sequential',
  default_approvers UUID[],
  approval_sequence INTEGER[],
  estimated_duration_hours INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Audit fields
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT approval_templates_name_unique UNIQUE (template_name),
  CONSTRAINT valid_template_workflow_type CHECK (workflow_type IN ('sequential', 'parallel', 'conditional'))
);

-- Performance indexes
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_documents_created_at ON documents(created_at);

CREATE INDEX idx_approval_workflow_document ON documents_approval_workflow(document_id);
CREATE INDEX idx_approval_workflow_status ON documents_approval_workflow(current_status);
CREATE INDEX idx_approval_workflow_approvers ON documents_approval_workflow USING GIN(required_approvers);
CREATE INDEX idx_approval_workflow_created_by ON documents_approval_workflow(created_by);
CREATE INDEX idx_approval_workflow_priority ON documents_approval_workflow(priority_level);
CREATE INDEX idx_approval_workflow_created_at ON documents_approval_workflow(created_at);

CREATE INDEX idx_approval_actions_workflow ON approval_actions(workflow_id);
CREATE INDEX idx_approval_actions_user ON approval_actions(user_id);
CREATE INDEX idx_approval_actions_timestamp ON approval_actions(timestamp);
CREATE INDEX idx_approval_actions_action_type ON approval_actions(action_type);

CREATE INDEX idx_approval_templates_document_type ON approval_workflow_templates(document_type);
CREATE INDEX idx_approval_templates_active ON approval_workflow_templates(is_active);

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_workflow_updated_at
  BEFORE UPDATE ON documents_approval_workflow
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_templates_updated_at
  BEFORE UPDATE ON approval_workflow_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Notification trigger for workflow status changes
CREATE OR REPLACE FUNCTION notify_approval_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification when workflow status changes
  INSERT INTO notifications (user_id, type, title, message, metadata, created_at)
  SELECT 
    unnest(NEW.required_approvers),
    'approval_workflow',
    'Document Approval Status Changed',
    format('Document "%s" approval status changed from %s to %s', 
           (SELECT document_name FROM documents WHERE id = NEW.document_id),
           OLD.current_status, NEW.current_status),
    jsonb_build_object(
      'workflow_id', NEW.id,
      'document_id', NEW.document_id,
      'old_status', OLD.current_status,
      'new_status', NEW.current_status,
      'priority', NEW.priority_level
    ),
    NOW()
  WHERE unnest(NEW.required_approvers) NOT IN (
    SELECT unnest(NEW.completed_approvers) -- Don't notify users who already approved
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER approval_status_change_trigger
  AFTER UPDATE ON documents_approval_workflow
  FOR EACH ROW
  WHEN (OLD.current_status != NEW.current_status)
  EXECUTE FUNCTION notify_approval_status_change();

-- Function to auto-update workflow status based on approvals
CREATE OR REPLACE FUNCTION update_workflow_status()
RETURNS TRIGGER AS $$
DECLARE
  workflow_record RECORD;
  total_required INTEGER;
  total_completed INTEGER;
BEGIN
  -- Get workflow details
  SELECT * INTO workflow_record 
  FROM documents_approval_workflow 
  WHERE id = NEW.workflow_id;
  
  -- Count required vs completed approvals
  total_required := array_length(workflow_record.required_approvers, 1);
  total_completed := array_length(workflow_record.completed_approvers, 1);
  
  -- Update status based on approval progress
  IF NEW.action_type = 'approve' THEN
    -- Add user to completed approvers if not already there
    UPDATE documents_approval_workflow 
    SET 
      completed_approvers = array_append(
        completed_approvers, 
        NEW.user_id
      ),
      current_status = CASE 
        WHEN array_length(array_append(completed_approvers, NEW.user_id), 1) >= total_required 
        THEN 'approved'::approval_status
        ELSE 'in_review'::approval_status
      END,
      actual_completion_date = CASE 
        WHEN array_length(array_append(completed_approvers, NEW.user_id), 1) >= total_required 
        THEN NOW()
        ELSE actual_completion_date
      END
    WHERE id = NEW.workflow_id
    AND NOT (NEW.user_id = ANY(completed_approvers));
    
  ELSIF NEW.action_type = 'reject' THEN
    -- Mark workflow as rejected
    UPDATE documents_approval_workflow 
    SET 
      current_status = 'rejected'::approval_status,
      rejected_by = NEW.user_id,
      rejection_reason = NEW.comments,
      actual_completion_date = NOW()
    WHERE id = NEW.workflow_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflow_status_update_trigger
  AFTER INSERT ON approval_actions
  FOR EACH ROW
  WHEN (NEW.action_type IN ('approve', 'reject'))
  EXECUTE FUNCTION update_workflow_status();

-- Row Level Security Policies

-- Documents RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_access" ON documents
  FOR ALL TO authenticated
  USING (
    -- Project team members can access documents
    EXISTS (
      SELECT 1 FROM project_assignments pa
      WHERE pa.project_id = documents.project_id
      AND pa.user_id = auth.uid()
    )
  );

-- Approval workflows RLS
ALTER TABLE documents_approval_workflow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_access" ON documents_approval_workflow
  FOR ALL TO authenticated
  USING (
    -- Project team members can view workflows
    EXISTS (
      SELECT 1 FROM project_assignments pa
      JOIN documents d ON d.project_id = pa.project_id
      WHERE d.id = document_id
      AND pa.user_id = auth.uid()
    )
    OR
    -- Approvers can view workflows they're assigned to
    auth.uid() = ANY(required_approvers)
    OR
    -- Workflow creator can view
    created_by = auth.uid()
  );

-- Approval actions RLS
ALTER TABLE approval_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approval_actions_access" ON approval_actions
  FOR ALL TO authenticated
  USING (
    -- Users can view actions on workflows they have access to
    EXISTS (
      SELECT 1 FROM documents_approval_workflow daw
      WHERE daw.id = workflow_id
      AND (
        auth.uid() = ANY(daw.required_approvers)
        OR daw.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_assignments pa
          JOIN documents d ON d.project_id = pa.project_id
          WHERE d.id = daw.document_id
          AND pa.user_id = auth.uid()
        )
      )
    )
  );

-- Approval templates RLS
ALTER TABLE approval_workflow_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approval_templates_access" ON approval_workflow_templates
  FOR ALL TO authenticated
  USING (
    -- Users with document management permissions can access templates
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role IN ('company_owner', 'general_manager', 'technical_director', 'project_manager', 'admin')
    )
  );

-- Insert default workflow templates
INSERT INTO approval_workflow_templates (template_name, document_type, workflow_type, description, created_by, estimated_duration_hours) VALUES
('Standard Drawing Approval', 'drawing', 'sequential', 'Standard sequential approval for construction drawings', (SELECT id FROM auth.users LIMIT 1), 72),
('Contract Document Review', 'contract', 'parallel', 'Parallel review for contract documents', (SELECT id FROM auth.users LIMIT 1), 168),
('Specification Approval', 'specification', 'sequential', 'Technical specification approval workflow', (SELECT id FROM auth.users LIMIT 1), 48),
('Report Review', 'report', 'sequential', 'Standard report review and approval', (SELECT id FROM auth.users LIMIT 1), 24);

-- Comments
COMMENT ON TABLE documents IS 'Document storage and metadata';
COMMENT ON TABLE documents_approval_workflow IS 'Document approval workflow management';
COMMENT ON TABLE approval_actions IS 'Audit trail for all approval actions';
COMMENT ON TABLE approval_workflow_templates IS 'Reusable workflow templates';

COMMENT ON COLUMN documents_approval_workflow.workflow_type IS 'Type of workflow: sequential, parallel, or conditional';
COMMENT ON COLUMN documents_approval_workflow.approval_sequence IS 'Order of approvers for sequential workflows';
COMMENT ON COLUMN documents_approval_workflow.required_approvers IS 'Array of user IDs who must approve';
COMMENT ON COLUMN documents_approval_workflow.completed_approvers IS 'Array of user IDs who have approved';
COMMENT ON COLUMN documents_approval_workflow.delegation_chain IS 'JSONB tracking delegation history';
COMMENT ON COLUMN documents_approval_workflow.priority_level IS '1=low, 2=medium, 3=high, 4=urgent';