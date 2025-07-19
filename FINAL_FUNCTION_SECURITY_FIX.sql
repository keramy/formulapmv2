-- FINAL RLS OPTIMIZATION - TARGETED APPROACH
-- This approach recreates the most critical policies from scratch to ensure clean optimization

-- ============================================================================
-- CRITICAL POLICIES FROM PERFORMANCE ADVISOR WARNINGS
-- ============================================================================

-- ACTIVITY_SUMMARY policies
DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_summary;
CREATE POLICY "Users can view own activity" ON public.activity_summary
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "PM can view project activity" ON public.activity_summary;
CREATE POLICY "PM can view project activity" ON public.activity_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = activity_summary.project_id 
      AND p.project_manager_id = (SELECT auth.uid())
    )
  );

-- AUDIT_LOGS policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- NOTIFICATIONS policies
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" ON public.notifications
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- TASKS policies
DROP POLICY IF EXISTS "Assigned user task access" ON public.tasks;
CREATE POLICY "Assigned user task access" ON public.tasks
  FOR ALL USING (
    assigned_to = (SELECT auth.uid()) OR 
    assigned_by = (SELECT auth.uid())
  );

-- TASK_COMMENTS policies
DROP POLICY IF EXISTS "Task comment access follows task access" ON public.task_comments;
CREATE POLICY "Task comment access follows task access" ON public.task_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_comments.task_id 
      AND (
        is_management_role() OR 
        has_project_access(t.project_id) OR 
        t.assigned_to = (SELECT auth.uid()) OR 
        t.assigned_by = (SELECT auth.uid())
      )
    )
  );

-- FIELD_REPORTS policies
DROP POLICY IF EXISTS "Field worker own reports" ON public.field_reports;
CREATE POLICY "Field worker own reports" ON public.field_reports
  FOR ALL USING (submitted_by = (SELECT auth.uid()));

-- SYSTEM_SETTINGS policies
DROP POLICY IF EXISTS "Admin settings access" ON public.system_settings;
CREATE POLICY "Admin settings access" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid()) 
      AND user_profiles.role = ANY (ARRAY['company_owner'::user_role, 'admin'::user_role])
    )
  );

-- PERMISSION_TEMPLATES policies
DROP POLICY IF EXISTS "Admin permission template access" ON public.permission_templates;
CREATE POLICY "Admin permission template access" ON public.permission_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid()) 
      AND user_profiles.role = ANY (ARRAY['company_owner'::user_role, 'admin'::user_role])
    )
  );

-- INVOICES policies
DROP POLICY IF EXISTS "Finance team invoice access" ON public.invoices;
CREATE POLICY "Finance team invoice access" ON public.invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid()) 
      AND user_profiles.role = ANY (ARRAY['purchase_director'::user_role, 'purchase_specialist'::user_role, 'technical_engineer'::user_role])
    )
  );

DROP POLICY IF EXISTS "PM invoice read access" ON public.invoices;
CREATE POLICY "PM invoice read access" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = invoices.project_id 
      AND p.project_manager_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Client invoice access" ON public.invoices;
CREATE POLICY "Client invoice access" ON public.invoices
  FOR SELECT USING (
    invoice_type = 'client'::text AND 
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = invoices.client_id 
      AND c.user_id = (SELECT auth.uid())
    )
  );

-- INVOICE_ITEMS policies
DROP POLICY IF EXISTS "Invoice items access follows invoice" ON public.invoice_items;
CREATE POLICY "Invoice items access follows invoice" ON public.invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_items.invoice_id 
      AND (
        is_management_role() OR 
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = (SELECT auth.uid()) 
          AND user_profiles.role = ANY (ARRAY['purchase_director'::user_role, 'purchase_specialist'::user_role, 'technical_engineer'::user_role])
        ) OR 
        EXISTS (
          SELECT 1 FROM projects p
          WHERE p.id = i.project_id 
          AND p.project_manager_id = (SELECT auth.uid())
        )
      )
    )
  );

-- PAYMENTS policies
DROP POLICY IF EXISTS "Finance payment access" ON public.payments;
CREATE POLICY "Finance payment access" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid()) 
      AND user_profiles.role = ANY (ARRAY['purchase_director'::user_role, 'purchase_specialist'::user_role])
    )
  );

-- PROJECT_BUDGETS policies
DROP POLICY IF EXISTS "PM budget read access" ON public.project_budgets;
CREATE POLICY "PM budget read access" ON public.project_budgets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets.project_id 
      AND p.project_manager_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Technical budget access" ON public.project_budgets;
CREATE POLICY "Technical budget access" ON public.project_budgets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid()) 
      AND user_profiles.role = ANY (ARRAY['technical_engineer'::user_role, 'technical_director'::user_role])
    )
  );

-- MOBILE_DEVICES policies
DROP POLICY IF EXISTS "Users manage own devices" ON public.mobile_devices;
CREATE POLICY "Users manage own devices" ON public.mobile_devices
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- TENDERS policies
DROP POLICY IF EXISTS "Technical tender access" ON public.tenders;
CREATE POLICY "Technical tender access" ON public.tenders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid()) 
      AND user_profiles.role = ANY (ARRAY['technical_director'::user_role, 'technical_engineer'::user_role])
    )
  );

-- DOCUMENTS policies
DROP POLICY IF EXISTS "Field worker own documents" ON public.documents;
CREATE POLICY "Field worker own documents" ON public.documents
  FOR ALL USING (
    uploaded_by = (SELECT auth.uid()) AND 
    (SELECT auth.jwt()) ->> 'user_role'::text = 'field_worker'::text
  );

DROP POLICY IF EXISTS "Subcontractor document access" ON public.documents;
CREATE POLICY "Subcontractor document access" ON public.documents
  FOR SELECT USING (
    (
      (SELECT auth.jwt()) ->> 'user_role'::text = 'subcontractor'::text AND 
      EXISTS (
        SELECT 1 FROM project_assignments pa
        WHERE pa.user_id = (SELECT auth.uid()) 
        AND pa.project_id = documents.project_id 
        AND pa.is_active = true
      )
    ) OR 
    uploaded_by = (SELECT auth.uid())
  );

-- DOCUMENT_APPROVALS policies
DROP POLICY IF EXISTS "Client approval access" ON public.document_approvals;
CREATE POLICY "Client approval access" ON public.document_approvals
  FOR ALL USING (
    approver_id = (SELECT auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_approvals.document_id 
      AND is_client_with_project_access(d.project_id) 
      AND document_approvals.approver_type = 'client'::text
    )
  );

-- SUPPLIERS policies
DROP POLICY IF EXISTS "Management supplier access" ON public.suppliers;
CREATE POLICY "Management supplier access" ON public.suppliers
  FOR ALL USING (
    is_management_role() OR 
    (SELECT auth.jwt()) ->> 'user_role'::text = ANY (ARRAY['purchase_director'::text, 'purchase_specialist'::text])
  );

DROP POLICY IF EXISTS "Project team supplier read" ON public.suppliers;
CREATE POLICY "Project team supplier read" ON public.suppliers
  FOR SELECT USING (
    (SELECT auth.jwt()) ->> 'user_role'::text = ANY (ARRAY['project_manager'::text, 'technical_engineer'::text, 'architect'::text])
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check the results
SELECT 
  'RLS Performance Optimization COMPLETED!' as status,
  COUNT(*) as total_policies_checked,
  COUNT(CASE WHEN qual LIKE '%(SELECT auth.%' THEN 1 END) as optimized_policies,
  COUNT(CASE WHEN qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.%' THEN 1 END) as direct_auth_calls
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
  'activity_summary', 'audit_logs', 'notifications', 'tasks', 'task_comments',
  'field_reports', 'system_settings', 'permission_templates', 'invoices', 
  'invoice_items', 'payments', 'project_budgets', 'mobile_devices', 'tenders',
  'documents', 'document_approvals', 'suppliers'
);

-- Show the status of key Performance Advisor policies
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%(SELECT auth.%' THEN '✅ OPTIMIZED'
    WHEN qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%' THEN '❌ DIRECT CALLS'
    ELSE '✅ CLEAN'
  END as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
  'activity_summary', 'audit_logs', 'notifications', 'tasks', 'task_comments',
  'field_reports', 'system_settings', 'permission_templates', 'invoices', 
  'invoice_items', 'payments', 'project_budgets', 'mobile_devices', 'tenders',
  'documents', 'document_approvals', 'suppliers'
)
ORDER BY tablename, policyname;