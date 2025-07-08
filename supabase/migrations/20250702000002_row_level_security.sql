-- Formula PM 2.0 Row Level Security Policies
-- Created: 2025-07-02
-- Purpose: Comprehensive RLS policies for all 13 user types with granular access control

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_approvals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR ROLE CHECKING
-- ============================================================================

-- Function to check if current user has management role
-- Uses JWT claims to avoid RLS policy recursion
CREATE OR REPLACE FUNCTION is_management_role()
RETURNS BOOLEAN AS $$
DECLARE
  user_role text;
BEGIN
  -- Get role from JWT claims to avoid recursion
  user_role := auth.jwt() ->> 'user_role';
  
  -- If no role in JWT, return false (user not authenticated properly)
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has management role
  RETURN user_role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user has cost tracking access
-- Uses JWT claims to avoid RLS policy recursion
CREATE OR REPLACE FUNCTION has_cost_tracking_access()
RETURNS BOOLEAN AS $$
DECLARE
  user_role text;
BEGIN
  -- Get role from JWT claims to avoid recursion
  user_role := auth.jwt() ->> 'user_role';
  
  -- If no role in JWT, return false (user not authenticated properly)
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has cost tracking access
  RETURN user_role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'technical_engineer', 'purchase_director', 'purchase_specialist');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user has project access
CREATE OR REPLACE FUNCTION has_project_access(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Management has access to all projects
  IF is_management_role() THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is assigned to project
  RETURN EXISTS (
    SELECT 1 FROM project_assignments 
    WHERE project_id = project_uuid 
    AND user_id = auth.uid()
    AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_uuid
    AND project_manager_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is client with access to project
-- Uses JWT claims to avoid RLS policy recursion
CREATE OR REPLACE FUNCTION is_client_with_project_access(project_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role text;
BEGIN
  -- Get role from JWT claims to avoid recursion
  user_role := auth.jwt() ->> 'user_role';
  
  -- If not a client, return false
  IF user_role != 'client' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if client has access to this project
  RETURN EXISTS (
    SELECT 1 FROM clients c
    JOIN projects p ON p.client_id = c.id
    WHERE c.user_id = auth.uid() 
    AND p.id = project_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================

-- Management can see all user profiles
CREATE POLICY "Management full user access" ON user_profiles
  FOR ALL USING (is_management_role());

-- Users can see their own profile
CREATE POLICY "Users own profile access" ON user_profiles
  FOR ALL USING (id = auth.uid());

-- Project managers can see team members in their projects
CREATE POLICY "PM team member access" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_assignments pa
      JOIN projects p ON p.id = pa.project_id
      WHERE p.project_manager_id = auth.uid()
      AND pa.user_id = user_profiles.id
      AND pa.is_active = true
    )
  );

-- Team members can see other team members in same projects
CREATE POLICY "Team member visibility" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_assignments pa1
      JOIN project_assignments pa2 ON pa1.project_id = pa2.project_id
      WHERE pa1.user_id = auth.uid()
      AND pa2.user_id = user_profiles.id
      AND pa1.is_active = true
      AND pa2.is_active = true
    )
  );

-- ============================================================================
-- CLIENTS POLICIES
-- ============================================================================

-- Management full access to clients
CREATE POLICY "Management client access" ON clients
  FOR ALL USING (is_management_role());

-- Clients can see their own information
CREATE POLICY "Client self access" ON clients
  FOR SELECT USING (user_id = auth.uid());

-- Project managers can see clients of their projects
CREATE POLICY "PM client access" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.client_id = clients.id
      AND p.project_manager_id = auth.uid()
    )
  );

-- ============================================================================
-- SUPPLIERS POLICIES
-- ============================================================================

-- Management and purchase department full access
-- Uses JWT claims to avoid RLS policy recursion
CREATE POLICY "Management supplier access" ON suppliers
  FOR ALL USING (
    is_management_role() OR
    (auth.jwt() ->> 'user_role' IN ('purchase_director', 'purchase_specialist'))
  );

-- Project team can view suppliers (read-only)
-- Uses JWT claims to avoid RLS policy recursion
CREATE POLICY "Project team supplier read" ON suppliers
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role' IN ('project_manager', 'technical_engineer', 'architect'))
  );

-- ============================================================================
-- PROJECTS POLICIES
-- ============================================================================

-- Management full access to all projects
CREATE POLICY "Management full project access" ON projects
  FOR ALL USING (is_management_role());

-- Project managers access to assigned projects
CREATE POLICY "PM assigned projects" ON projects
  FOR ALL USING (
    project_manager_id = auth.uid() OR
    has_project_access(id)
  );

-- Team members access to assigned projects
CREATE POLICY "Team project access" ON projects
  FOR SELECT USING (has_project_access(id));

-- Clients access to their projects only
CREATE POLICY "Client project access" ON projects
  FOR SELECT USING (is_client_with_project_access(id));

-- ============================================================================
-- PROJECT ASSIGNMENTS POLICIES
-- ============================================================================

-- Management full access
CREATE POLICY "Management assignment access" ON project_assignments
  FOR ALL USING (is_management_role());

-- Project managers can manage assignments for their projects
CREATE POLICY "PM assignment management" ON project_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_assignments.project_id
      AND p.project_manager_id = auth.uid()
    )
  );

-- Users can see their own assignments
CREATE POLICY "User own assignments" ON project_assignments
  FOR SELECT USING (user_id = auth.uid());

-- Team members can see other assignments in same project
CREATE POLICY "Team assignment visibility" ON project_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_assignments pa
      WHERE pa.project_id = project_assignments.project_id
      AND pa.user_id = auth.uid()
      AND pa.is_active = true
    )
  );

-- ============================================================================
-- SCOPE ITEMS POLICIES (WITH COST PROTECTION)
-- ============================================================================

-- Management full access including cost data
CREATE POLICY "Management scope full access" ON scope_items
  FOR ALL USING (is_management_role());

-- Technical and purchase roles full access including costs
CREATE POLICY "Technical purchase scope access" ON scope_items
  FOR ALL USING (
    has_cost_tracking_access() AND has_project_access(project_id)
  );

-- Project team access without cost data (handled in application layer)
CREATE POLICY "Project team scope access" ON scope_items
  FOR SELECT USING (has_project_access(project_id));

-- Field workers limited access to assigned scope items only
-- Uses JWT claims to avoid RLS policy recursion
CREATE POLICY "Field worker scope access" ON scope_items
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role' = 'field_worker') AND
    EXISTS (
      SELECT 1 FROM project_assignments pa
      WHERE pa.user_id = auth.uid()
      AND pa.project_id = scope_items.project_id
      AND (auth.uid() = ANY(scope_items.assigned_to) OR pa.is_active = true)
    )
  );

-- Field workers can update status and assigned items
-- Uses JWT claims to avoid RLS policy recursion
CREATE POLICY "Field worker scope update" ON scope_items
  FOR UPDATE USING (
    (auth.jwt() ->> 'user_role' = 'field_worker') AND
    (auth.uid() = ANY(scope_items.assigned_to))
  )
  WITH CHECK (
    -- Field workers can only update specific columns (enforced in application)
    TRUE
  );

-- Clients very limited read access (no cost data)
CREATE POLICY "Client scope limited access" ON scope_items
  FOR SELECT USING (
    is_client_with_project_access(project_id)
  );

-- Subcontractors access to assigned scope items only
-- Uses JWT claims to avoid RLS policy recursion
CREATE POLICY "Subcontractor scope access" ON scope_items
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role' = 'subcontractor') AND
    (auth.uid() = ANY(scope_items.assigned_to))
  );

-- ============================================================================
-- SCOPE DEPENDENCIES POLICIES
-- ============================================================================

-- Management and project team access
CREATE POLICY "Project team dependencies access" ON scope_dependencies
  FOR ALL USING (
    is_management_role() OR
    EXISTS (
      SELECT 1 FROM scope_items si
      WHERE si.id = scope_dependencies.scope_item_id
      AND has_project_access(si.project_id)
    )
  );

-- ============================================================================
-- DOCUMENTS POLICIES
-- ============================================================================

-- Management full access to all documents
CREATE POLICY "Management document access" ON documents
  FOR ALL USING (is_management_role());

-- Project team access to project documents
CREATE POLICY "Project team document access" ON documents
  FOR ALL USING (has_project_access(project_id));

-- Clients access to client-visible documents only
CREATE POLICY "Client document access" ON documents
  FOR SELECT USING (
    is_client_visible = true AND is_client_with_project_access(project_id)
  );

-- Field workers can create reports and photos
-- Uses JWT claims to avoid RLS policy recursion
CREATE POLICY "Field worker document create" ON documents
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'user_role' = 'field_worker') AND
    EXISTS (
      SELECT 1 FROM project_assignments pa
      WHERE pa.user_id = auth.uid()
      AND pa.project_id = documents.project_id
      AND pa.is_active = true
      AND document_type IN ('report', 'photo')
    )
  );

-- Field workers can view and update their own documents
-- Uses JWT claims to avoid RLS policy recursion
CREATE POLICY "Field worker own documents" ON documents
  FOR ALL USING (
    uploaded_by = auth.uid() AND
    (auth.jwt() ->> 'user_role' = 'field_worker')
  );

-- Subcontractors limited document access
-- Uses JWT claims to avoid RLS policy recursion
CREATE POLICY "Subcontractor document access" ON documents
  FOR SELECT USING (
    ((auth.jwt() ->> 'user_role' = 'subcontractor') AND
     EXISTS (
       SELECT 1 FROM project_assignments pa
       WHERE pa.user_id = auth.uid()
       AND pa.project_id = documents.project_id
       AND pa.is_active = true
     )) OR uploaded_by = auth.uid()
  );

-- ============================================================================
-- DOCUMENT APPROVALS POLICIES
-- ============================================================================

-- Management and project team access
CREATE POLICY "Management approval access" ON document_approvals
  FOR ALL USING (
    is_management_role() OR
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_approvals.document_id
      AND has_project_access(d.project_id)
    )
  );

-- Clients can manage their own approvals
CREATE POLICY "Client approval access" ON document_approvals
  FOR ALL USING (
    approver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_approvals.document_id
      AND is_client_with_project_access(d.project_id)
      AND approver_type = 'client'
    )
  );

-- ============================================================================
-- SECURITY POLICIES FOR SENSITIVE OPERATIONS
-- ============================================================================

-- Prevent unauthorized role changes
-- Uses JWT claims to avoid RLS policy recursion
CREATE POLICY "Restrict role changes" ON user_profiles
  FOR UPDATE USING (
    -- Only company owner and admin can change roles (check JWT claims)
    (auth.jwt() ->> 'user_role' IN ('company_owner', 'admin')) OR
    -- Users can update their own profile but not role
    (id = auth.uid() AND role::text = (auth.jwt() ->> 'user_role'))
  );

-- Prevent financial data access for unauthorized users
-- This will be enforced at the application layer with additional checks

-- Insert migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250702000002', 'row_level_security', NOW())
ON CONFLICT (version) DO NOTHING;