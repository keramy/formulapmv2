-- COMPLETE RLS OPTIMIZATION - COMPREHENSIVE APPROACH
-- This will systematically optimize ALL remaining policies with direct auth calls

-- ============================================================================
-- STEP 1: OPTIMIZE ALL REMAINING POLICIES WITH DIRECT AUTH CALLS
-- ============================================================================

DO $$
DECLARE
  policy_record RECORD;
  new_qual TEXT;
  cmd_type TEXT;
  policy_exists BOOLEAN;
BEGIN
  -- Loop through ALL policies that still have direct auth calls
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname, qual, cmd, permissive, roles
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND (qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%')
    AND qual NOT LIKE '%(SELECT auth.uid())%'
    AND qual NOT LIKE '%(SELECT auth.jwt())%'
    ORDER BY tablename, policyname
  LOOP
    BEGIN
      -- Create optimized version of the policy
      new_qual := policy_record.qual;
      
      -- Replace all instances of direct auth calls with SELECT versions
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
          'direct auth calls replaced with SELECT';
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
-- STEP 2: HANDLE SPECIFIC PROBLEMATIC POLICIES MANUALLY
-- ============================================================================

-- Some policies might need manual recreation due to complex syntax
-- Let's handle the most critical ones from your Performance Advisor warnings

-- SUPPLIERS table - these are specifically mentioned in Performance Advisor
DO $$
BEGIN
  -- Management supplier access
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'suppliers' AND policyname = 'Management supplier access') THEN
    DROP POLICY "Management supplier access" ON public.suppliers;
    CREATE POLICY "Management supplier access" ON public.suppliers
      FOR ALL USING (
        is_management_role() OR 
        (SELECT auth.jwt()) ->> 'user_role'::text = ANY (ARRAY['purchase_director'::text, 'purchase_specialist'::text])
      );
    RAISE NOTICE '✅ Manually fixed: suppliers - Management supplier access';
  END IF;

  -- Project team supplier read
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'suppliers' AND policyname = 'Project team supplier read') THEN
    DROP POLICY "Project team supplier read" ON public.suppliers;
    CREATE POLICY "Project team supplier read" ON public.suppliers
      FOR SELECT USING (
        (SELECT auth.jwt()) ->> 'user_role'::text = ANY (ARRAY['project_manager'::text, 'technical_engineer'::text, 'architect'::text])
      );
    RAISE NOTICE '✅ Manually fixed: suppliers - Project team supplier read';
  END IF;
END $$;

-- DOCUMENTS table - specifically mentioned in Performance Advisor
DO $$
BEGIN
  -- Field worker own documents
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'Field worker own documents') THEN
    DROP POLICY "Field worker own documents" ON public.documents;
    CREATE POLICY "Field worker own documents" ON public.documents
      FOR ALL USING (
        uploaded_by = (SELECT auth.uid()) AND 
        (SELECT auth.jwt()) ->> 'user_role'::text = 'field_worker'::text
      );
    RAISE NOTICE '✅ Manually fixed: documents - Field worker own documents';
  END IF;

  -- Subcontractor document access
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'documents' AND policyname = 'Subcontractor document access') THEN
    DROP POLICY "Subcontractor document access" ON public.documents;
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
    RAISE NOTICE '✅ Manually fixed: documents - Subcontractor document access';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: FINAL VERIFICATION
-- ============================================================================

-- Check the final results
SELECT 
  'RLS Performance Optimization FINAL RESULTS' as status,
  COUNT(*) as total_policies_in_key_tables,
  COUNT(CASE WHEN qual LIKE '%(SELECT auth.%' THEN 1 END) as optimized_policies,
  COUNT(CASE WHEN qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.%' THEN 1 END) as remaining_direct_calls,
  ROUND(
    (COUNT(CASE WHEN qual LIKE '%(SELECT auth.%' THEN 1 END) * 100.0) / 
    NULLIF(COUNT(*), 0), 
    1
  ) as optimization_percentage
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
  'activity_summary', 'audit_logs', 'notifications', 'tasks', 'task_comments',
  'field_reports', 'system_settings', 'permission_templates', 'invoices', 
  'invoice_items', 'payments', 'project_budgets', 'mobile_devices', 'tenders',
  'documents', 'document_approvals', 'suppliers'
);

-- Show detailed status of all policies in Performance Advisor tables
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%(SELECT auth.%' THEN '✅ OPTIMIZED'
    WHEN qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%' THEN '❌ DIRECT CALLS'
    ELSE '✅ CLEAN'
  END as optimization_status,
  CASE 
    WHEN qual LIKE '%auth.uid()%' THEN 'Contains auth.uid()'
    WHEN qual LIKE '%auth.jwt()%' THEN 'Contains auth.jwt()'
    WHEN qual LIKE '%(SELECT auth.%' THEN 'Properly optimized'
    ELSE 'No auth calls'
  END as details
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
  'activity_summary', 'audit_logs', 'notifications', 'tasks', 'task_comments',
  'field_reports', 'system_settings', 'permission_templates', 'invoices', 
  'invoice_items', 'payments', 'project_budgets', 'mobile_devices', 'tenders',
  'documents', 'document_approvals', 'suppliers'
)
ORDER BY 
  CASE WHEN qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.%' THEN 0 ELSE 1 END,
  tablename, 
  policyname;

-- Show any remaining policies that still need optimization
SELECT 
  tablename,
  policyname,
  'Still needs optimization' as issue,
  LEFT(qual, 100) || '...' as policy_excerpt
FROM pg_policies 
WHERE schemaname = 'public'
AND (qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%')
AND qual NOT LIKE '%(SELECT auth.%'
ORDER BY tablename, policyname;