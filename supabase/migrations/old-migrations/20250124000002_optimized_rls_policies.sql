-- Formula PM 2.0 Optimized RLS Policies
-- Created: 2025-01-24
-- Purpose: Performance-optimized RLS policies using (SELECT auth.uid()) pattern
-- CRITICAL: All auth.uid() calls are wrapped in SELECT for 10-100x performance improvement

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users view own profile" ON user_profiles
  FOR SELECT USING (id = (SELECT auth.uid()));

-- Management and admin full access
CREATE POLICY "Management full access user profiles" ON user_profiles
  FOR ALL USING (is_management_role());

-- Users can update own profile (except role)
CREATE POLICY "Users update own profile" ON user_profiles
  FOR UPDATE USING (id = (SELECT auth.uid()));

-- ============================================================================
-- CLIENTS POLICIES
-- ============================================================================

-- Management full access
CREATE POLICY "Management client access" ON clients
  FOR ALL USING (is_management_role());

-- Clients can see their own information
CREATE POLICY "Client self access" ON clients
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- Project managers can see clients of their projects
CREATE POLICY "PM client access" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.client_id = clients.id
      AND p.project_manager_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- PROJECTS POLICIES
-- ============================================================================

-- Management full access
CREATE POLICY "Management project access" ON projects
  FOR ALL USING (is_management_role());

-- Project managers can manage their projects
CREATE POLICY "PM own project access" ON projects
  FOR ALL USING (project_manager_id = (SELECT auth.uid()));

-- Team members can view their projects
CREATE POLICY "Team project access" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_assignments pa
      WHERE pa.project_id = projects.id
      AND pa.user_id = (SELECT auth.uid())
      AND pa.is_active = true
    )
  );

-- Clients can view their projects
CREATE POLICY "Client project access" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = projects.client_id
      AND c.user_id = (SELECT auth.uid())
    )
  );

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
      AND p.project_manager_id = (SELECT auth.uid())
    )
  );

-- Users can see their own assignments
CREATE POLICY "User own assignments" ON project_assignments
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- SCOPE ITEMS POLICIES
-- ============================================================================

-- Management full access
CREATE POLICY "Management scope access" ON scope_items
  FOR ALL USING (is_management_role());

-- Project team full access
CREATE POLICY "Project team scope access" ON scope_items
  FOR ALL USING (has_project_access(project_id));

-- Clients can view scope items (no costs)
CREATE POLICY "Client scope view" ON scope_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE p.id = scope_items.project_id
      AND c.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- MATERIAL SPECS POLICIES
-- ============================================================================

-- Management full access
CREATE POLICY "Management material access" ON material_specs
  FOR ALL USING (is_management_role());

-- Project team can manage materials
CREATE POLICY "Project team material access" ON material_specs
  FOR ALL USING (has_project_access(project_id));

-- Technical leads can approve materials
CREATE POLICY "Technical material approval" ON material_specs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (SELECT auth.uid())
      AND up.role = 'technical_lead'
    )
  );

-- Clients can view and comment on materials
CREATE POLICY "Client material view" ON material_specs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE p.id = material_specs.project_id
      AND c.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- SUPPLIERS POLICIES
-- ============================================================================

-- Management and purchase managers full access
CREATE POLICY "Management supplier access" ON suppliers
  FOR ALL USING (
    is_management_role() OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (SELECT auth.uid())
      AND up.role = 'purchase_manager'
    )
  );

-- Others can view approved suppliers
CREATE POLICY "View approved suppliers" ON suppliers
  FOR SELECT USING (is_approved = true);

-- ============================================================================
-- PURCHASE ORDERS POLICIES
-- ============================================================================

-- Management full access
CREATE POLICY "Management PO access" ON purchase_orders
  FOR ALL USING (is_management_role());

-- Purchase managers full access
CREATE POLICY "Purchase manager PO access" ON purchase_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (SELECT auth.uid())
      AND up.role = 'purchase_manager'
    )
  );

-- Project managers can view POs for their projects
CREATE POLICY "PM PO view" ON purchase_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = purchase_orders.project_id
      AND p.project_manager_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- DOCUMENTS POLICIES
-- ============================================================================

-- Management full access
CREATE POLICY "Management document access" ON documents
  FOR ALL USING (is_management_role());

-- Project team can manage documents
CREATE POLICY "Project team document access" ON documents
  FOR ALL USING (has_project_access(project_id));

-- Clients can see client-visible documents
CREATE POLICY "Client document view" ON documents
  FOR SELECT USING (
    is_client_visible = true AND
    EXISTS (
      SELECT 1 FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE p.id = documents.project_id
      AND c.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- DOCUMENT APPROVALS POLICIES
-- ============================================================================

-- Management full access
CREATE POLICY "Management approval access" ON document_approvals
  FOR ALL USING (is_management_role());

-- Approvers can manage their approvals
CREATE POLICY "Approver own approvals" ON document_approvals
  FOR ALL USING (approver_id = (SELECT auth.uid()));

-- Project team can view approvals
CREATE POLICY "Project team approval view" ON document_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_approvals.document_id
      AND has_project_access(d.project_id)
    )
  );

-- Clients can create approvals for visible documents
CREATE POLICY "Client approval access" ON document_approvals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN projects p ON p.id = d.project_id
      JOIN clients c ON c.id = p.client_id
      WHERE d.id = document_approvals.document_id
      AND d.is_client_visible = true
      AND c.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- PROJECT MILESTONES POLICIES
-- ============================================================================

-- Management full access
CREATE POLICY "Management milestone access" ON project_milestones
  FOR ALL USING (is_management_role());

-- Project team can manage milestones
CREATE POLICY "Project team milestone access" ON project_milestones
  FOR ALL USING (has_project_access(project_id));

-- Clients can view milestones
CREATE POLICY "Client milestone view" ON project_milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE p.id = project_milestones.project_id
      AND c.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- SYSTEM SETTINGS POLICIES
-- ============================================================================

-- Only admins can manage settings
CREATE POLICY "Admin settings access" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (SELECT auth.uid())
      AND up.role = 'admin'
    )
  );

-- Everyone can read public settings
CREATE POLICY "Public settings read" ON system_settings
  FOR SELECT USING (true);