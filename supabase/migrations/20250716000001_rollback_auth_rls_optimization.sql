-- Formula PM 2.0 Auth RLS Performance Optimization ROLLBACK
-- Created: 2025-07-16
-- Purpose: Rollback auth.uid() optimization if performance issues occur
-- Usage: Only run this if the optimization causes access control problems

-- This script restores the original auth.uid() patterns from the backup files
-- WARNING: This will revert performance optimizations

-- ============================================================================
-- ROLLBACK HELPER FUNCTIONS
-- ============================================================================

-- Restore original helper functions with direct auth.uid() calls
CREATE OR REPLACE FUNCTION has_purchase_department_access()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'purchase_director', 'purchase_specialist')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_create_purchase_requests()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'technical_engineer', 'architect')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_approve_purchase_requests()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'purchase_director')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_confirm_deliveries()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'technical_engineer', 'architect', 'field_worker')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore original has_project_access function
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

-- ============================================================================
-- ROLLBACK POLICIES - RESTORE ORIGINAL auth.uid() PATTERNS
-- ============================================================================

-- Drop optimized policies
DROP POLICY IF EXISTS "Management and purchase vendor access" ON vendors;
DROP POLICY IF EXISTS "Project team vendor read access" ON vendors;
DROP POLICY IF EXISTS "Vendor creator access" ON vendors;
DROP POLICY IF EXISTS "Management purchase request access" ON purchase_requests;
DROP POLICY IF EXISTS "Requester own purchase request access" ON purchase_requests;
DROP POLICY IF EXISTS "Field worker purchase request read" ON purchase_requests;
DROP POLICY IF EXISTS "Project team purchase request read" ON purchase_requests;
DROP POLICY IF EXISTS "Management purchase order access" ON purchase_orders;
DROP POLICY IF EXISTS "Purchase order creator access" ON purchase_orders;
DROP POLICY IF EXISTS "Project team purchase order read" ON purchase_orders;
DROP POLICY IF EXISTS "Management vendor rating access" ON vendor_ratings;
DROP POLICY IF EXISTS "Project manager vendor rating" ON vendor_ratings;
DROP POLICY IF EXISTS "Rater own vendor rating access" ON vendor_ratings;
DROP POLICY IF EXISTS "Team member vendor rating read" ON vendor_ratings;
DROP POLICY IF EXISTS "Approver workflow access" ON approval_workflows;
DROP POLICY IF EXISTS "Purchase request workflow visibility" ON approval_workflows;
DROP POLICY IF EXISTS "Field worker delivery confirmation" ON delivery_confirmations;
DROP POLICY IF EXISTS "Vendor deactivation restriction" ON vendors;
DROP POLICY IF EXISTS "Purchase request status protection" ON purchase_requests;
DROP POLICY IF EXISTS "Purchase order modification protection" ON purchase_orders;
DROP POLICY IF EXISTS "Purchase request deletion restriction" ON purchase_requests;
DROP POLICY IF EXISTS "Field worker scope access" ON scope_items;
DROP POLICY IF EXISTS "Field worker scope update" ON scope_items;
DROP POLICY IF EXISTS "Subcontractor scope access" ON scope_items;
DROP POLICY IF EXISTS "Users own profile access" ON user_profiles;
DROP POLICY IF EXISTS "PM team member access" ON user_profiles;
DROP POLICY IF EXISTS "Team member visibility" ON user_profiles;
DROP POLICY IF EXISTS "Client self access" ON clients;
DROP POLICY IF EXISTS "PM client access" ON clients;
DROP POLICY IF EXISTS "PM assigned projects" ON projects;
DROP POLICY IF EXISTS "User own assignments" ON project_assignments;
DROP POLICY IF EXISTS "Team assignment visibility" ON project_assignments;
DROP POLICY IF EXISTS "Field worker own documents" ON documents;
DROP POLICY IF EXISTS "Subcontractor document access" ON documents;
DROP POLICY IF EXISTS "Client approval access" ON document_approvals;
DROP POLICY IF EXISTS "Restrict role changes" ON user_profiles;

-- Restore original policies with direct auth.uid() calls
-- VENDORS TABLE POLICIES
CREATE POLICY "Management and purchase vendor access" ON vendors
  FOR ALL USING (
    is_management_role() OR has_purchase_department_access()
  );

CREATE POLICY "Project team vendor read access" ON vendors
  FOR SELECT USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('project_manager', 'technical_engineer', 'architect')
    )
  );

CREATE POLICY "Vendor creator access" ON vendors
  FOR ALL USING (created_by = auth.uid());

-- PURCHASE REQUESTS TABLE POLICIES
CREATE POLICY "Management purchase request access" ON purchase_requests
  FOR ALL USING (
    is_management_role() OR has_purchase_department_access()
  );

CREATE POLICY "Project team purchase request read" ON purchase_requests
  FOR SELECT USING (
    has_project_access(project_id) AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('project_manager', 'technical_engineer', 'architect')
    )
  );

CREATE POLICY "Requester own purchase request access" ON purchase_requests
  FOR ALL USING (
    requester_id = auth.uid() AND (
      status = 'draft' OR 
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('project_manager', 'technical_engineer', 'architect'))
    )
  );

CREATE POLICY "Field worker purchase request read" ON purchase_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN project_assignments pa ON pa.user_id = up.id
      WHERE up.id = auth.uid()
      AND up.role = 'field_worker'
      AND pa.project_id = purchase_requests.project_id
      AND pa.is_active = true
    )
  );

-- PURCHASE ORDERS TABLE POLICIES
CREATE POLICY "Management purchase order access" ON purchase_orders
  FOR ALL USING (
    is_management_role() OR has_purchase_department_access()
  );

CREATE POLICY "Purchase order creator access" ON purchase_orders
  FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Project team purchase order read" ON purchase_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM purchase_requests pr
      WHERE pr.id = purchase_orders.purchase_request_id
      AND has_project_access(pr.project_id)
      AND EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role IN ('project_manager', 'technical_engineer', 'architect')
      )
    )
  );

-- VENDOR RATINGS TABLE POLICIES
CREATE POLICY "Management vendor rating access" ON vendor_ratings
  FOR ALL USING (
    is_management_role() OR has_purchase_department_access()
  );

CREATE POLICY "Project manager vendor rating" ON vendor_ratings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN projects p ON p.project_manager_id = up.id
      WHERE up.id = auth.uid()
      AND up.role = 'project_manager'
      AND p.id = vendor_ratings.project_id
    )
  );

CREATE POLICY "Rater own vendor rating access" ON vendor_ratings
  FOR ALL USING (rater_id = auth.uid());

CREATE POLICY "Team member vendor rating read" ON vendor_ratings
  FOR SELECT USING (
    has_project_access(project_id) AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('project_manager', 'technical_engineer', 'architect')
    )
  );

-- APPROVAL WORKFLOWS TABLE POLICIES
CREATE POLICY "Approver workflow access" ON approval_workflows
  FOR ALL USING (
    approver_id = auth.uid() OR delegated_to = auth.uid()
  );

CREATE POLICY "Purchase request workflow visibility" ON approval_workflows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM purchase_requests pr
      WHERE pr.id = approval_workflows.purchase_request_id
      AND (
        pr.requester_id = auth.uid() OR
        has_project_access(pr.project_id)
      )
    )
  );

-- DELIVERY CONFIRMATIONS TABLE POLICIES
CREATE POLICY "Field worker delivery confirmation" ON delivery_confirmations
  FOR ALL USING (
    confirmed_by = auth.uid() OR EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN purchase_orders po ON po.id = delivery_confirmations.purchase_order_id
      JOIN purchase_requests pr ON pr.id = po.purchase_request_id
      JOIN project_assignments pa ON pa.project_id = pr.project_id
      WHERE up.id = auth.uid()
      AND up.role = 'field_worker'
      AND pa.user_id = auth.uid()
      AND pa.is_active = true
    )
  );

-- SECURITY POLICIES
CREATE POLICY "Vendor deactivation restriction" ON vendors
  FOR UPDATE USING (
    is_management_role() OR 
    (has_purchase_department_access() AND created_by = auth.uid())
  )
  WITH CHECK (
    is_active = (SELECT is_active FROM vendors WHERE id = vendors.id) OR
    is_management_role() OR
    has_purchase_department_access()
  );

CREATE POLICY "Purchase request status protection" ON purchase_requests
  FOR UPDATE USING (
    is_management_role() OR 
    has_purchase_department_access() OR
    (requester_id = auth.uid() AND status = 'draft')
  )
  WITH CHECK (
    (status = 'draft' AND requester_id = auth.uid()) OR
    (status = 'pending_approval' AND can_create_purchase_requests()) OR
    (status IN ('approved', 'rejected', 'cancelled') AND has_purchase_department_access())
  );

CREATE POLICY "Purchase order modification protection" ON purchase_orders
  FOR UPDATE USING (
    is_management_role() OR 
    has_purchase_department_access() OR
    created_by = auth.uid()
  )
  WITH CHECK (
    (status = 'draft' AND created_by = auth.uid()) OR
    has_purchase_department_access()
  );

CREATE POLICY "Purchase request deletion restriction" ON purchase_requests
  FOR DELETE USING (
    (is_management_role() OR requester_id = auth.uid()) AND 
    status = 'draft' AND 
    NOT EXISTS (
      SELECT 1 FROM purchase_orders po 
      WHERE po.purchase_request_id = purchase_requests.id
    )
  );

-- SCOPE ITEMS TABLE POLICIES
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

CREATE POLICY "Field worker scope update" ON scope_items
  FOR UPDATE USING (
    (auth.jwt() ->> 'user_role' = 'field_worker') AND
    (auth.uid() = ANY(scope_items.assigned_to))
  )
  WITH CHECK (
    TRUE
  );

CREATE POLICY "Subcontractor scope access" ON scope_items
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role' = 'subcontractor') AND
    (auth.uid() = ANY(scope_items.assigned_to))
  );

-- USER PROFILES TABLE POLICIES
CREATE POLICY "Users own profile access" ON user_profiles
  FOR ALL USING (id = auth.uid());

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

-- CLIENTS TABLE POLICIES
CREATE POLICY "Client self access" ON clients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "PM client access" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.client_id = clients.id
      AND p.project_manager_id = auth.uid()
    )
  );

-- PROJECTS TABLE POLICIES
CREATE POLICY "PM assigned projects" ON projects
  FOR ALL USING (
    project_manager_id = auth.uid() OR
    has_project_access(id)
  );

-- PROJECT ASSIGNMENTS TABLE POLICIES
CREATE POLICY "User own assignments" ON project_assignments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Team assignment visibility" ON project_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_assignments pa
      WHERE pa.project_id = project_assignments.project_id
      AND pa.user_id = auth.uid()
      AND pa.is_active = true
    )
  );

-- DOCUMENTS TABLE POLICIES
CREATE POLICY "Field worker own documents" ON documents
  FOR ALL USING (
    uploaded_by = auth.uid() AND
    (auth.jwt() ->> 'user_role' = 'field_worker')
  );

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

-- DOCUMENT APPROVALS TABLE POLICIES
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

CREATE POLICY "Restrict role changes" ON user_profiles
  FOR UPDATE USING (
    (auth.jwt() ->> 'user_role' IN ('company_owner', 'admin')) OR
    (id = auth.uid() AND role::text = (auth.jwt() ->> 'user_role'))
  );

-- Insert rollback migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250716000001', 'rollback_auth_rls_optimization', NOW())
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- ROLLBACK COMPLETION NOTICE
-- ============================================================================

-- Performance optimization has been rolled back
-- Original auth.uid() patterns restored
-- This will revert performance improvements but maintain compatibility