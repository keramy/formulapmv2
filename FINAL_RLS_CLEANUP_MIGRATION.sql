-- FINAL RLS CLEANUP MIGRATION - DEFINITIVE SOLUTION
-- This will completely fix the nested SELECT issue by recreating policies from scratch

-- ============================================================================
-- STEP 1: DROP ALL POLICIES WITH NESTED SELECT STATEMENTS
-- ============================================================================

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Drop all policies that have nested SELECT statements
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND (
      qual LIKE '%( SELECT ( SELECT auth.uid()%' OR
      qual LIKE '%( SELECT ( SELECT auth.jwt()%' OR
      qual LIKE '%( SELECT auth.uid() AS uid)%' OR
      qual LIKE '%( SELECT auth.jwt() AS jwt)%'
    )
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
        policy_record.policyname, 
        policy_record.schemaname, 
        policy_record.tablename
      );
      RAISE NOTICE '🗑️ Dropped problematic policy: %.%', 
        policy_record.tablename, 
        policy_record.policyname;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Could not drop: %.% - %', 
        policy_record.tablename, 
        policy_record.policyname,
        SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: RECREATE CRITICAL PERFORMANCE ADVISOR POLICIES
-- ============================================================================

-- ACTIVITY_SUMMARY policies (Performance Advisor critical)
CREATE POLICY "Users can view own activity" ON public.activity_summary
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "PM can view project activity" ON public.activity_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = activity_summary.project_id 
      AND p.project_manager_id = (SELECT auth.uid())
    )
  );

-- AUDIT_LOGS policies (Performance Advisor critical)
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- NOTIFICATIONS policies (Performance Advisor critical)
CREATE POLICY "Users manage own notifications" ON public.notifications
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- TASKS policies (Performance Advisor critical)
CREATE POLICY "Assigned user task access" ON public.tasks
  FOR ALL USING (
    assigned_to = (SELECT auth.uid()) OR 
    assigned_by = (SELECT auth.uid())
  );

-- TASK_COMMENTS policies (Performance Advisor critical)
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

-- FIELD_REPORTS policies (Performance Advisor critical)
CREATE POLICY "Field worker own reports" ON public.field_reports
  FOR ALL USING (submitted_by = (SELECT auth.uid()));

-- SYSTEM_SETTINGS policies (Performance Advisor critical)
CREATE POLICY "Admin settings access" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid()) 
      AND user_profiles.role = ANY (ARRAY['company_owner'::user_role, 'admin'::user_role])
    )
  );

-- PERMISSION_TEMPLATES policies (Performance Advisor critical)
CREATE POLICY "Admin permission template access" ON public.permission_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid()) 
      AND user_profiles.role = ANY (ARRAY['company_owner'::user_role, 'admin'::user_role])
    )
  );

-- INVOICES policies (Performance Advisor critical)
CREATE POLICY "Finance team invoice access" ON public.invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid()) 
      AND user_profiles.role = ANY (ARRAY['purchase_director'::user_role, 'purchase_specialist'::user_role, 'technical_engineer'::user_role])
    )
  );

CREATE POLICY "PM invoice read access" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = invoices.project_id 
      AND p.project_manager_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Client invoice access" ON public.invoices
  FOR SELECT USING (
    invoice_type = 'client'::text AND 
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = invoices.client_id 
      AND c.user_id = (SELECT auth.uid())
    )
  );

-- INVOICE_ITEMS policies (Performance Advisor critical)
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

-- PAYMENTS policies (Performance Advisor critical)
CREATE POLICY "Finance payment access" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid()) 
      AND user_profiles.role = ANY (ARRAY['purchase_director'::user_role, 'purchase_specialist'::user_role])
    )
  );

-- PROJECT_BUDGETS policies (Performance Advisor critical)
CREATE POLICY "PM budget read access" ON public.project_budgets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets.project_id 
      AND p.project_manager_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Technical budget access" ON public.project_budgets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid()) 
      AND user_profiles.role = ANY (ARRAY['technical_engineer'::user_role, 'technical_director'::user_role])
    )
  );

-- MOBILE_DEVICES policies (Performance Advisor critical)
CREATE POLICY "Users manage own devices" ON public.mobile_devices
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- TENDERS policies (Performance Advisor critical)
CREATE POLICY "Technical tender access" ON public.tenders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid()) 
      AND user_profiles.role = ANY (ARRAY['technical_director'::user_role, 'technical_engineer'::user_role])
    )
  );

-- SUPPLIERS policies (Performance Advisor critical)
CREATE POLICY "Management supplier access" ON public.suppliers
  FOR ALL USING (
    is_management_role() OR 
    (SELECT auth.jwt()) ->> 'user_role'::text = ANY (ARRAY['purchase_director'::text, 'purchase_specialist'::text])
  );

CREATE POLICY "Project team supplier read" ON public.suppliers
  FOR SELECT USING (
    (SELECT auth.jwt()) ->> 'user_role'::text = ANY (ARRAY['project_manager'::text, 'technical_engineer'::text, 'architect'::text])
  );

-- DOCUMENTS policies (Performance Advisor critical)
CREATE POLICY "Field worker own documents" ON public.documents
  FOR ALL USING (
    uploaded_by = (SELECT auth.uid()) AND 
    (SELECT auth.jwt()) ->> 'user_role'::text = 'field_worker'::text
  );

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

-- DOCUMENT_APPROVALS policies (Performance Advisor critical)
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

-- ============================================================================
-- STEP 3: RECREATE OTHER CRITICAL POLICIES
-- ============================================================================

-- Common user-owned policies
CREATE POLICY "Users can view activity logs they have access to" ON public.activity_logs
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users manage own sync queue" ON public.mobile_sync_queue
  FOR ALL USING (user_id = (SELECT auth.uid()));

CREATE POLICY "User dashboard settings" ON public.user_dashboard_settings
  FOR ALL USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users access own messages" ON public.messages
  FOR ALL USING (
    sender_id = (SELECT auth.uid()) OR 
    recipient_id = (SELECT auth.uid())
  );

-- ============================================================================
-- STEP 4: VERIFICATION AND RESULTS
-- ============================================================================

-- Final verification
SELECT 
  'RLS PERFORMANCE OPTIMIZATION - FINAL RESULTS' as status,
  COUNT(*) as total_policies_checked,
  COUNT(CASE WHEN qual LIKE '%(SELECT auth.%' AND qual NOT LIKE '%( SELECT ( SELECT auth.%' THEN 1 END) as properly_optimized,
  COUNT(CASE WHEN qual LIKE '%( SELECT ( SELECT auth.%' THEN 1 END) as still_nested,
  COUNT(CASE WHEN qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.%' THEN 1 END) as direct_calls
FROM pg_policies 
WHERE schemaname = 'public';

-- Show Performance Advisor critical tables status
SELECT 
  tablename,
  COUNT(*) as total_policies,
  COUNT(CASE WHEN qual LIKE '%(SELECT auth.%' AND qual NOT LIKE '%( SELECT ( SELECT auth.%' THEN 1 END) as optimized,
  COUNT(CASE WHEN qual LIKE '%( SELECT ( SELECT auth.%' THEN 1 END) as nested,
  COUNT(CASE WHEN qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.%' THEN 1 END) as direct
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
  'activity_summary', 'audit_logs', 'notifications', 'tasks', 'task_comments',
  'field_reports', 'system_settings', 'permission_templates', 'invoices', 
  'invoice_items', 'payments', 'project_budgets', 'mobile_devices', 'tenders',
  'documents', 'document_approvals', 'suppliers'
)
GROUP BY tablename
ORDER BY tablename;

-- Show any remaining problematic policies
SELECT 
  tablename,
  policyname,
  'Still has nested SELECT' as issue
FROM pg_policies 
WHERE schemaname = 'public'
AND qual LIKE '%( SELECT ( SELECT auth.%'
ORDER BY tablename, policyname;