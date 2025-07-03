-- Formula PM 2.0 Purchase Department Workflow RLS Policies
-- Created: 2025-07-03
-- Purpose: Row Level Security for Purchase Department Workflow system

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON PURCHASE TABLES
-- ============================================================================

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_confirmations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR PURCHASE DEPARTMENT
-- ============================================================================

-- Function to check if user has purchase department access
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

-- Function to check if user can create purchase requests
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

-- Function to check if user can approve purchase requests
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

-- Function to check if user can confirm deliveries
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

-- ============================================================================
-- VENDORS TABLE POLICIES
-- ============================================================================

-- Management and purchase department full access
CREATE POLICY "Management and purchase vendor access" ON vendors
  FOR ALL USING (
    is_management_role() OR has_purchase_department_access()
  );

-- Project team can view active vendors (read-only)
CREATE POLICY "Project team vendor read access" ON vendors
  FOR SELECT USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('project_manager', 'technical_engineer', 'architect')
    )
  );

-- Vendor creators can view their own vendors
CREATE POLICY "Vendor creator access" ON vendors
  FOR ALL USING (created_by = auth.uid());

-- ============================================================================
-- PURCHASE REQUESTS TABLE POLICIES
-- ============================================================================

-- Management and purchase department full access
CREATE POLICY "Management purchase request access" ON purchase_requests
  FOR ALL USING (
    is_management_role() OR has_purchase_department_access()
  );

-- Users can create purchase requests if they have project access
CREATE POLICY "Project team purchase request create" ON purchase_requests
  FOR INSERT WITH CHECK (
    can_create_purchase_requests() AND has_project_access(project_id)
  );

-- Users can view purchase requests for their projects
CREATE POLICY "Project team purchase request read" ON purchase_requests
  FOR SELECT USING (
    has_project_access(project_id) AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('project_manager', 'technical_engineer', 'architect')
    )
  );

-- Requesters can view and update their own requests (draft status only)
CREATE POLICY "Requester own purchase request access" ON purchase_requests
  FOR ALL USING (
    requester_id = auth.uid() AND (
      status = 'draft' OR 
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('project_manager', 'technical_engineer', 'architect'))
    )
  );

-- Field workers can view requests for assigned projects
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

-- ============================================================================
-- PURCHASE ORDERS TABLE POLICIES
-- ============================================================================

-- Management and purchase department full access
CREATE POLICY "Management purchase order access" ON purchase_orders
  FOR ALL USING (
    is_management_role() OR has_purchase_department_access()
  );

-- Project team can view purchase orders for their projects
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

-- Purchase order creators can view their own orders
CREATE POLICY "Purchase order creator access" ON purchase_orders
  FOR ALL USING (created_by = auth.uid());

-- ============================================================================
-- VENDOR RATINGS TABLE POLICIES
-- ============================================================================

-- Management and purchase department full access
CREATE POLICY "Management vendor rating access" ON vendor_ratings
  FOR ALL USING (
    is_management_role() OR has_purchase_department_access()
  );

-- Project managers can rate vendors for their projects
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

-- Raters can view their own ratings
CREATE POLICY "Rater own vendor rating access" ON vendor_ratings
  FOR ALL USING (rater_id = auth.uid());

-- Team members can view ratings for their project vendors
CREATE POLICY "Team member vendor rating read" ON vendor_ratings
  FOR SELECT USING (
    has_project_access(project_id) AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('project_manager', 'technical_engineer', 'architect')
    )
  );

-- ============================================================================
-- APPROVAL WORKFLOWS TABLE POLICIES
-- ============================================================================

-- Management and purchase department full access
CREATE POLICY "Management approval workflow access" ON approval_workflows
  FOR ALL USING (
    is_management_role() OR has_purchase_department_access()
  );

-- Approvers can view and update their own approval tasks
CREATE POLICY "Approver workflow access" ON approval_workflows
  FOR ALL USING (
    approver_id = auth.uid() OR delegated_to = auth.uid()
  );

-- Users can view approval workflows for requests they can access
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

-- System can create approval workflows for valid requests
CREATE POLICY "System approval workflow creation" ON approval_workflows
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchase_requests pr
      WHERE pr.id = approval_workflows.purchase_request_id
      AND pr.status = 'pending_approval'
    )
  );

-- ============================================================================
-- DELIVERY CONFIRMATIONS TABLE POLICIES
-- ============================================================================

-- Management and purchase department full access
CREATE POLICY "Management delivery confirmation access" ON delivery_confirmations
  FOR ALL USING (
    is_management_role() OR has_purchase_department_access()
  );

-- Users who can confirm deliveries can create confirmations
CREATE POLICY "Delivery confirmation creation" ON delivery_confirmations
  FOR INSERT WITH CHECK (
    can_confirm_deliveries() AND EXISTS (
      SELECT 1 FROM purchase_orders po
      JOIN purchase_requests pr ON pr.id = po.purchase_request_id
      WHERE po.id = delivery_confirmations.purchase_order_id
      AND has_project_access(pr.project_id)
    )
  );

-- Field workers can confirm deliveries for their projects
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

-- Project team can view delivery confirmations for their projects
CREATE POLICY "Project team delivery confirmation read" ON delivery_confirmations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      JOIN purchase_requests pr ON pr.id = po.purchase_request_id
      WHERE po.id = delivery_confirmations.purchase_order_id
      AND has_project_access(pr.project_id)
    )
  );

-- ============================================================================
-- ADDITIONAL SECURITY POLICIES
-- ============================================================================

-- Prevent unauthorized vendor deactivation
CREATE POLICY "Vendor deactivation restriction" ON vendors
  FOR UPDATE USING (
    is_management_role() OR 
    (has_purchase_department_access() AND created_by = auth.uid())
  )
  WITH CHECK (
    -- Only allow deactivation by management or purchase department
    is_active = (SELECT is_active FROM vendors WHERE id = vendors.id) OR
    is_management_role() OR
    has_purchase_department_access()
  );

-- Prevent unauthorized purchase request status changes
CREATE POLICY "Purchase request status protection" ON purchase_requests
  FOR UPDATE USING (
    -- Only allow status changes by authorized users
    is_management_role() OR 
    has_purchase_department_access() OR
    (requester_id = auth.uid() AND status = 'draft')
  )
  WITH CHECK (
    -- Status transitions must be valid
    (status = 'draft' AND requester_id = auth.uid()) OR
    (status = 'pending_approval' AND can_create_purchase_requests()) OR
    (status IN ('approved', 'rejected', 'cancelled') AND has_purchase_department_access())
  );

-- Prevent unauthorized purchase order modifications
CREATE POLICY "Purchase order modification protection" ON purchase_orders
  FOR UPDATE USING (
    is_management_role() OR 
    has_purchase_department_access() OR
    created_by = auth.uid()
  )
  WITH CHECK (
    -- Only purchase department can modify sent orders
    (status = 'draft' AND created_by = auth.uid()) OR
    has_purchase_department_access()
  );

-- ============================================================================
-- AUDIT POLICIES
-- ============================================================================

-- All purchase department activities are logged
-- This is handled by the existing audit system

-- Sensitive operations require management approval
CREATE POLICY "Vendor deletion restriction" ON vendors
  FOR DELETE USING (
    is_management_role() AND NOT EXISTS (
      SELECT 1 FROM purchase_orders 
      WHERE vendor_id = vendors.id
    )
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

-- Insert migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250703000008', 'purchase_department_rls', NOW())
ON CONFLICT (version) DO NOTHING;