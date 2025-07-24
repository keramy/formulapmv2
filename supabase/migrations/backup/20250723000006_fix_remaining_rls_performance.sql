-- Fix Remaining RLS Performance Issues - Phase 2
-- Complete optimization of all remaining tables with inefficient RLS policies

-- Client Portal Tables
-- client_companies
DROP POLICY IF EXISTS "Users can view client companies" ON public.client_companies;
CREATE POLICY "Users can view client companies" ON public.client_companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_users cu 
      WHERE cu.user_profile_id = (SELECT auth.uid()) 
      AND cu.client_company_id = client_companies.id
    )
  );

-- client_users  
DROP POLICY IF EXISTS "Client users can view their own record" ON public.client_users;
CREATE POLICY "Client users can view their own record" ON public.client_users
  FOR SELECT USING (user_profile_id = (SELECT auth.uid()));

-- client_project_access
DROP POLICY IF EXISTS "Client users can view their project access" ON public.client_project_access;
CREATE POLICY "Client users can view their project access" ON public.client_project_access
  FOR SELECT USING (
    client_user_id IN (
      SELECT cu.id FROM client_users cu 
      WHERE cu.user_profile_id = (SELECT auth.uid())
    )
  );

-- Purchase & Vendor Tables
-- purchase_orders
DROP POLICY IF EXISTS "Users can view purchase orders for their projects" ON public.purchase_orders;
CREATE POLICY "Users can view purchase orders for their projects" ON public.purchase_orders
  FOR SELECT USING (
    created_by = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_assignments pa 
      JOIN purchase_requests pr ON pr.project_id = pa.project_id
      WHERE pa.user_id = (SELECT auth.uid()) 
      AND pr.id = purchase_orders.purchase_request_id
    )
  );

-- vendor_ratings
DROP POLICY IF EXISTS "Users can view vendor ratings" ON public.vendor_ratings;
CREATE POLICY "Users can view vendor ratings" ON public.vendor_ratings
  FOR SELECT USING (
    rater_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_assignments pa 
      WHERE pa.user_id = (SELECT auth.uid()) 
      AND pa.project_id = vendor_ratings.project_id
    )
  );

-- Document & Approval Tables
-- document_approvals
DROP POLICY IF EXISTS "Users can view document approvals" ON public.document_approvals;
CREATE POLICY "Users can view document approvals" ON public.document_approvals
  FOR SELECT USING (
    approver_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM documents d
      JOIN project_assignments pa ON pa.project_id = d.project_id
      WHERE pa.user_id = (SELECT auth.uid())
      AND d.id = document_approvals.document_id
    )
  );

-- approval_workflows
DROP POLICY IF EXISTS "Users can view approval workflows" ON public.approval_workflows;
CREATE POLICY "Users can view approval workflows" ON public.approval_workflows
  FOR SELECT USING (
    created_by = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_assignments pa 
      WHERE pa.user_id = (SELECT auth.uid()) 
      AND pa.project_id = approval_workflows.project_id
    )
  );

-- Field & Mobile Tables
-- field_reports
DROP POLICY IF EXISTS "Users can view field reports" ON public.field_reports;
CREATE POLICY "Users can view field reports" ON public.field_reports
  FOR SELECT USING (
    submitted_by = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_assignments pa 
      WHERE pa.user_id = (SELECT auth.uid()) 
      AND pa.project_id = field_reports.project_id
    )
  );

-- field_photos
DROP POLICY IF EXISTS "Users can view field photos" ON public.field_photos;
CREATE POLICY "Users can view field photos" ON public.field_photos
  FOR SELECT USING (
    uploaded_by = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM field_reports fr
      JOIN project_assignments pa ON pa.project_id = fr.project_id
      WHERE pa.user_id = (SELECT auth.uid())
      AND fr.id = field_photos.field_report_id
    )
  );

-- mobile_devices
DROP POLICY IF EXISTS "Users can view their mobile devices" ON public.mobile_devices;
CREATE POLICY "Users can view their mobile devices" ON public.mobile_devices
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- Communication Tables
-- messages
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (
    sender_id = (SELECT auth.uid()) OR 
    recipient_id = (SELECT auth.uid())
  );

-- project_announcements
DROP POLICY IF EXISTS "Users can view project announcements" ON public.project_announcements;
CREATE POLICY "Users can view project announcements" ON public.project_announcements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_assignments pa 
      WHERE pa.user_id = (SELECT auth.uid()) 
      AND pa.project_id = project_announcements.project_id
    )
  );

-- Budget & Financial Tables
-- project_budgets
DROP POLICY IF EXISTS "Users can view project budgets" ON public.project_budgets;
CREATE POLICY "Users can view project budgets" ON public.project_budgets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_assignments pa 
      WHERE pa.user_id = (SELECT auth.uid()) 
      AND pa.project_id = project_budgets.project_id
    )
  );

-- tender_submissions
DROP POLICY IF EXISTS "Users can view tender submissions" ON public.tender_submissions;
CREATE POLICY "Users can view tender submissions" ON public.tender_submissions
  FOR SELECT USING (
    submitted_by = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM tenders t
      JOIN project_assignments pa ON pa.project_id = t.project_id
      WHERE pa.user_id = (SELECT auth.uid())
      AND t.id = tender_submissions.tender_id
    )
  );

-- Shop Drawing Tables
-- shop_drawing_revisions
DROP POLICY IF EXISTS "Users can view shop drawing revisions" ON public.shop_drawing_revisions;
CREATE POLICY "Users can view shop drawing revisions" ON public.shop_drawing_revisions
  FOR SELECT USING (
    created_by = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM shop_drawings sd
      JOIN project_assignments pa ON pa.project_id = sd.project_id
      WHERE pa.user_id = (SELECT auth.uid())
      AND sd.id = shop_drawing_revisions.shop_drawing_id
    )
  );

-- Subcontractor Tables
-- subcontractor_users
DROP POLICY IF EXISTS "Subcontractor users can view their records" ON public.subcontractor_users;
CREATE POLICY "Subcontractor users can view their records" ON public.subcontractor_users
  FOR SELECT USING (user_profile_id = (SELECT auth.uid()));

-- subcontractor_reports
DROP POLICY IF EXISTS "Users can view subcontractor reports" ON public.subcontractor_reports;
CREATE POLICY "Users can view subcontractor reports" ON public.subcontractor_reports
  FOR SELECT USING (
    submitted_by = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_assignments pa 
      WHERE pa.user_id = (SELECT auth.uid()) 
      AND pa.project_id = subcontractor_reports.project_id
    )
  );

-- Additional Performance Indexes
CREATE INDEX IF NOT EXISTS idx_client_users_user_profile_id ON public.client_users (user_profile_id);
CREATE INDEX IF NOT EXISTS idx_client_users_client_company ON public.client_users (client_company_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents (project_id);
CREATE INDEX IF NOT EXISTS idx_field_reports_project_user ON public.field_reports (project_id, submitted_by);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_request_created ON public.purchase_orders (purchase_request_id, created_by);
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON public.messages (sender_id, recipient_id);

-- RLS performance fixes - Phase 2: Complete remaining table optimizations