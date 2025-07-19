-- CORRECTED RLS PERFORMANCE OPTIMIZATION MIGRATION
-- Based on actual database schema and existing policies
-- Optimizes auth function calls without changing policy logic

-- ============================================================================
-- STEP 1: CREATE HELPER FUNCTIONS FOR BETTER PERFORMANCE
-- ============================================================================

-- Create stable helper functions for better performance
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text AS $$
BEGIN
  RETURN (SELECT auth.jwt() ->> 'user_role');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_id() TO authenticated;

-- ============================================================================
-- STEP 2: OPTIMIZE CRITICAL POLICIES IDENTIFIED IN PERFORMANCE ADVISOR
-- ============================================================================

-- ACTIVITY_SUMMARY table optimizations
DROP POLICY IF EXISTS "PM can view project activity" ON public.activity_summary;
CREATE POLICY "PM can view project activity" ON public.activity_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = activity_summary.project_id 
      AND p.project_manager_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_summary;
CREATE POLICY "Users can view own activity" ON public.activity_summary
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- AUDIT_LOGS table optimizations
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- NOTIFICATIONS table optimizations
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" ON public.notifications
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- TASKS table optimizations
DROP POLICY IF EXISTS "Assigned user task access" ON public.tasks;
CREATE POLICY "Assigned user task access" ON public.tasks
  FOR ALL USING (
    (assigned_to = (SELECT auth.uid())) OR 
    (assigned_by = (SELECT auth.uid()))
  );

-- TASK_COMMENTS table optimizations
DROP POLICY IF EXISTS "Task comment access follows task access" ON public.task_comments;
CREATE POLICY "Task comment access follows task access" ON public.task_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_comments.task_id 
      AND (
        is_management_role() OR 
        has_project_access(t.project_id) OR 
        (t.assigned_to = (SELECT auth.uid())) OR 
        (t.assigned_by = (SELECT auth.uid()))
      )
    )
  );

-- FIELD_REPORTS table optimizations
DROP POLICY IF EXISTS "Field worker own reports" ON public.field_reports;
CREATE POLICY "Field worker own reports" ON public.field_reports
  FOR ALL USING (submitted_by = (SELECT auth.uid()));

-- SYSTEM_SETTINGS table optimizations
DROP POLICY IF EXISTS "Admin settings access" ON public.system_settings;
CREATE POLICY "Admin settings access" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid()) 
      AND user_profiles.role = ANY (ARRAY['company_owner'::user_role, 'admin'::user_role])
    )
  );

-- PERMISSION_TEMPLATES table optimizations
DROP POLICY IF EXISTS "Admin permission template access" ON public.permission_templates;
CREATE POLICY "Admin permission template access" ON public.permission_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid()) 
      AND user_profiles.role = ANY (ARRAY['company_owner'::user_role, 'admin'::user_role])
    )
  );

-- INVOICES table optimizations
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
    (invoice_type = 'client'::text) AND 
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = invoices.client_id 
      AND c.user_id = (SELECT auth.uid())
    )
  );

-- INVOICE_ITEMS table optimizations
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

-- PAYMENTS table optimizations
DROP POLICY IF EXISTS "Finance payment access" ON public.payments;
CREATE POLICY "Finance payment access" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid()) 
      AND user_profiles.role = ANY (ARRAY['purchase_director'::user_role, 'purchase_specialist'::user_role])
    )
  );

-- PROJECT_BUDGETS table optimizations
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

-- MOBILE_DEVICES table optimizations
DROP POLICY IF EXISTS "Users manage own devices" ON public.mobile_devices;
CREATE POLICY "Users manage own devices" ON public.mobile_devices
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- TENDERS table optimizations
DROP POLICY IF EXISTS "Technical tender access" ON public.tenders;
CREATE POLICY "Technical tender access" ON public.tenders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid()) 
      AND user_profiles.role = ANY (ARRAY['technical_director'::user_role, 'technical_engineer'::user_role])
    )
  );

-- DOCUMENTS table optimizations
DROP POLICY IF EXISTS "Field worker own documents" ON public.documents;
CREATE POLICY "Field worker own documents" ON public.documents
  FOR ALL USING (
    (uploaded_by = (SELECT auth.uid())) AND 
    ((SELECT auth.jwt()) ->> 'user_role'::text = 'field_worker'::text)
  );

DROP POLICY IF EXISTS "Subcontractor document access" ON public.documents;
CREATE POLICY "Subcontractor document access" ON public.documents
  FOR SELECT USING (
    (
      ((SELECT auth.jwt()) ->> 'user_role'::text = 'subcontractor'::text) AND 
      EXISTS (
        SELECT 1 FROM project_assignments pa
        WHERE pa.user_id = (SELECT auth.uid()) 
        AND pa.project_id = documents.project_id 
        AND pa.is_active = true
      )
    ) OR 
    (uploaded_by = (SELECT auth.uid()))
  );

-- DOCUMENT_APPROVALS table optimizations
DROP POLICY IF EXISTS "Client approval access" ON public.document_approvals;
CREATE POLICY "Client approval access" ON public.document_approvals
  FOR ALL USING (
    (approver_id = (SELECT auth.uid())) OR 
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_approvals.document_id 
      AND is_client_with_project_access(d.project_id) 
      AND document_approvals.approver_type = 'client'::text
    )
  );

-- ============================================================================
-- STEP 3: OPTIMIZE REMAINING POLICIES WITH DIRECT AUTH CALLS
-- ============================================================================

-- Generic optimization for remaining policies
DO $$
DECLARE
  policy_record RECORD;
  new_qual TEXT;
  cmd_type TEXT;
BEGIN
  -- Loop through policies that still have direct auth calls
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname, qual, cmd, permissive, roles
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND (qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%')
    AND qual NOT LIKE '%(SELECT auth.%'
  LOOP
    BEGIN
      -- Replace direct auth calls with SELECT versions
      new_qual := policy_record.qual;
      new_qual := REPLACE(new_qual, 'auth.uid()', '(SELECT auth.uid())');
      new_qual := REPLACE(new_qual, 'auth.jwt()', '(SELECT auth.jwt())');
      
      -- Determine command type
      cmd_type := CASE 
        WHEN policy_record.cmd = 'ALL' THEN 'ALL'
        WHEN policy_record.cmd = 'SELECT' THEN 'SELECT'
        WHEN policy_record.cmd = 'INSERT' THEN 'INSERT'
        WHEN policy_record.cmd = 'UPDATE' THEN 'UPDATE'
        WHEN policy_record.cmd = 'DELETE' THEN 'DELETE'
        ELSE 'ALL'
      END;
      
      -- Only proceed if we actually made changes
      IF new_qual != policy_record.qual THEN
        -- Drop the old policy
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
          policy_record.policyname, 
          policy_record.schemaname, 
          policy_record.tablename
        );
        
        -- Create the optimized policy
        EXECUTE format('CREATE POLICY %I ON %I.%I FOR %s USING (%s)', 
          policy_record.policyname,
          policy_record.schemaname,
          policy_record.tablename,
          cmd_type,
          new_qual
        );
        
        RAISE NOTICE '✅ Optimized: %.% - %', 
          policy_record.tablename, 
          policy_record.policyname,
          'auth function calls optimized';
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Could not optimize: %.% - % (Error: %)', 
        policy_record.tablename, 
        policy_record.policyname,
        policy_record.policyname,
        SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 4: VERIFICATION AND RESULTS
-- ============================================================================

-- Check the optimization results
SELECT 
  'RLS Performance Optimization completed!' as status,
  COUNT(*) as total_policies,
  COUNT(CASE WHEN qual LIKE '%(SELECT auth.%' THEN 1 END) as optimized_policies,
  COUNT(CASE WHEN qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%' THEN 1 END) as unoptimized_policies
FROM pg_policies 
WHERE schemaname = 'public';

-- Show any remaining unoptimized policies
SELECT 
  tablename,
  policyname,
  'Still needs optimization' as status,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
AND (qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%')
AND qual NOT LIKE '%(SELECT auth.%'
ORDER BY tablename, policyname;